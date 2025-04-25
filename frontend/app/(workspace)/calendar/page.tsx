"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import DeadlinesList from "@/components/calendar/DeadlinesList";
import { toast } from "sonner";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "calendar" | "gantt" | "deadlines"
  >("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [deadlinesData, setDeadlinesData] = useState<any[]>([]);

  // Fetch calendar data when the selected date changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchCalendarData();
    }
  }, [session?.user?.id, selectedDate]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");

      // Fetch calendar events
      const response = await fetch(
        `/api/calendar/events?startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const data = await response.json();
      setCalendarData(data);

      // Fetch deadlines
      const deadlinesResponse = await fetch(`/api/calendar/deadlines`);
      if (deadlinesResponse.ok) {
        const deadlinesData = await deadlinesResponse.json();
        setDeadlinesData(deadlinesData);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedDate((prevDate) => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prevDate) => addMonths(prevDate, 1));
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  const onDeadlineTimeFrameChange = (newTimeFrame: string) => {
    // fetch deadlines based on the new time frame
    fetch(`/api/calendar/deadlines?days=${newTimeFrame}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch deadlines");
        }
        return response.json();
      })
      .then((data) => {
        setDeadlinesData(data);
      })
      .catch((error) => {
        console.error("Error fetching deadlines:", error);
        toast.error("Failed to load deadlines");
      });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your deadlines and project timelines
          </p>
        </div>

        {selectedView === "calendar" && (
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-muted rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousMonth}
                className="text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-medium">
                {format(selectedDate, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="text-muted-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
          </div>
        )}
      </div>

      <Tabs
        defaultValue="calendar"
        value={selectedView}
        onValueChange={(value) => setSelectedView(value as any)}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          {calendarData ? (
            <CalendarView
              events={calendarData.calendar || []}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No calendar data available
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Gantt chart feature is under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="mt-4">
          <DeadlinesList
            deadlines={deadlinesData}
            onTimeFrameChange={onDeadlineTimeFrameChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
