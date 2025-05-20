"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import DeadlinesList from "@/components/calendar/DeadlinesList";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

function CalendarPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const defaultTab =
    searchParams?.get("tab") === "deadlines" ? "deadlines" : "calendar";
  const [selectedView, setSelectedView] = useState<"calendar" | "deadlines">(
    defaultTab
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [deadlinesData, setDeadlinesData] = useState<any[]>([]);

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

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

  if (status === "loading") {
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

  if (isLoading && isInitialRender) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div
        className={
          isMobile ? "flex flex-col gap-3" : "flex justify-between items-center"
        }
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className={isMobile ? "h-5 w-5" : "h-7 w-7"} />
            Calendar
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground mt-1">
              Manage your deadlines and project timelines
            </p>
          )}
        </div>

        {selectedView === "calendar" && (
          <div
            className={
              isMobile
                ? "self-start flex items-center gap-2"
                : "flex items-center gap-4"
            }
          >
            <div className="flex items-center bg-muted rounded-md">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={handlePreviousMonth}
                className="text-muted-foreground"
                disabled={isLoading}
              >
                <ChevronLeft className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
              <span className={isMobile ? "px-1 text-sm" : "px-2 font-medium"}>
                {format(selectedDate, isMobile ? "MMM yyyy" : "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={handleNextMonth}
                className="text-muted-foreground"
                disabled={isLoading}
              >
                <ChevronRight className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </div>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setSelectedDate(new Date())}
              disabled={isLoading}
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
        <TabsList className={isMobile ? "w-full mb-3" : "mb-4"}>
          <TabsTrigger
            value="calendar"
            className={isMobile ? "flex-1" : ""}
            disabled={isLoading}
          >
            Calendar View
          </TabsTrigger>
          <TabsTrigger
            value="deadlines"
            className={isMobile ? "flex-1" : ""}
            disabled={isLoading}
          >
            Deadlines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          {isLoading ? (
            <Skeleton className="w-full h-[500px] rounded-lg" />
          ) : calendarData ? (
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

        <TabsContent value="deadlines" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-12 rounded-lg" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <DeadlinesList
              deadlines={deadlinesData}
              onTimeFrameChange={onDeadlineTimeFrameChange}
            />
          )}
        </TabsContent>
      </Tabs>

      {isLoading && !isInitialRender && (
        <div className="fixed bottom-4 right-4 bg-background shadow-lg rounded-full p-2 z-50 border">
          <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </main>
    </div>
  );
}

// Suspense boundary
export default function CalendarPageSuspense() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CalendarPage />
    </Suspense>
  );
}
