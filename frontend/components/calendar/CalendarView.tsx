"use client";

import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  format,
  isToday,
  isSameMonth,
  isWeekend,
  isSameDay,
  parseISO,
  startOfWeek,
  addDays,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardList,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarViewProps {
  events: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function CalendarView({
  events = [],
  selectedDate,
  onDateChange,
}: CalendarViewProps) {
  const isMobile = useIsMobile();
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  // calendar days for the selected month with overflow for week start/end
  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart);

    const daysNeeded = 42; // 6 weeks
    const days = [];

    for (let i = 0; i < daysNeeded; i++) {
      days.push(addDays(startDate, i));
    }

    setCalendarDays(days);
  }, [selectedDate]);

  // Group events by date
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      if (!event.start) return false;
      const eventDate =
        typeof event.start === "string"
          ? parseISO(event.start)
          : new Date(event.start);
      return isSameDay(day, eventDate);
    });
  };

  const handleEventClick = (event: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleDayClick = (day: Date) => {
    if (isMobile) {
      setSelectedDay(day);
      const dayEvents = getEventsForDay(day);
      if (dayEvents.length > 0) {
        setIsDayDialogOpen(true);
      }
    }
    onDateChange(day);
  };

  const getDayClass = (day: Date) => {
    return cn(
      isMobile
        ? "h-10 p-0.5 relative flex flex-col items-center justify-center"
        : "h-12 sm:h-20 md:h-28 border border-border p-1 flex flex-col",
      {
        "bg-violet-50 dark:bg-violet-950/20": isToday(day),
        "text-muted-foreground": !isSameMonth(day, selectedDate),
        "bg-muted/50": isWeekend(day) && isSameMonth(day, selectedDate),
        "cursor-pointer hover:bg-muted/70": true,
      }
    );
  };

  const getEventColor = (event: any) => {
    const type = event.type || "";

    if (type === "project-start")
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    if (type === "project-due")
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (type === "task-due") {
      if (event.color === "#22c55e")
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    }

    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  };

  const getEventIcon = (event: any) => {
    const type = event.type || "";

    if (type === "project-start") return <BookOpen className="h-3 w-3" />;
    if (type === "project-due") return <AlertTriangle className="h-3 w-3" />;
    if (type === "task-due") {
      if (event.color === "#22c55e")
        return <CheckCircle2 className="h-3 w-3" />;
      return <Clock className="h-3 w-3" />;
    }

    return <ClipboardList className="h-3 w-3" />;
  };

  const weekDays = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardContent className={isMobile ? "p-0 sm:p-1" : "p-0 sm:p-1"}>
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "py-2 text-center font-medium text-muted-foreground",
                isMobile ? "text-xs" : "text-sm"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={getDayClass(day)}
              onClick={() => handleDayClick(day)}
            >
              {isMobile ? (
                <>
                  <span
                    className={cn("text-xs font-medium", {
                      "text-foreground": isSameMonth(day, selectedDate),
                      "text-violet-600 dark:text-violet-400 font-bold":
                        isToday(day),
                    })}
                  >
                    {format(day, "d")}
                  </span>
                  {getEventsForDay(day).length > 0 && (
                    <div className="absolute bottom-0 w-full flex justify-center">
                      <div className="h-1.5 w-1.5 bg-violet-500 rounded-full mb-0.5"></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span
                      className={cn("text-xs font-medium", {
                        "text-foreground": isSameMonth(day, selectedDate),
                        "text-violet-600 dark:text-violet-400 font-bold":
                          isToday(day),
                      })}
                    >
                      {format(day, "d")}
                    </span>
                    {isToday(day) && (
                      <Badge className="bg-violet-500 hover:bg-violet-600 h-4 px-1">
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 overflow-y-auto space-y-1 max-h-20">
                    {getEventsForDay(day).map((event, eventIndex) => (
                      <TooltipProvider key={eventIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`rounded px-1 py-0.5 text-xs truncate flex items-center gap-1 ${getEventColor(
                                event
                              )}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              {getEventIcon(event)}
                              {event.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs">
                              {format(new Date(event.start), "MMM d, yyyy")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Event details dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedEvent.start), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedEvent.type === "project-start"
                      ? "Project Start Date"
                      : selectedEvent.type === "project-due"
                      ? "Project Due Date"
                      : "Task Due Date"}
                  </span>
                </div>

                {selectedEvent.projectId && (
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Project</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.title.includes("(")
                        ? selectedEvent.title.split("(")[0].trim()
                        : selectedEvent.title}
                    </p>
                  </div>
                )}

                {selectedEvent.taskId && (
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Task</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.title.replace("Task Due: ", "")}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedEvent.projectId && (
                  <Button asChild>
                    <Link href={`/projects/${selectedEvent.projectId}`}>
                      Go to Project <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {selectedEvent.taskId && (
                  <Button asChild>
                    <Link href={`/tasks/${selectedEvent.taskId}`}>
                      Go to Task <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {format(selectedDay, "MMMM d, yyyy")}
                  {isToday(selectedDay) && (
                    <Badge className="bg-violet-500 hover:bg-violet-600 ml-2">
                      Today
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <h3 className="text-sm font-medium mb-2">Events</h3>
                <div className="space-y-2">
                  {getEventsForDay(selectedDay).length > 0 ? (
                    getEventsForDay(selectedDay).map((event, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded flex items-start gap-2 ${getEventColor(
                          event
                        )}`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="mt-0.5">{getEventIcon(event)}</div>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              asChild
                            >
                              <Link
                                href={
                                  event.type === "project-start" ||
                                  event.type === "project-due"
                                    ? `/projects/${event.projectId}`
                                    : `/tasks/${event.taskId}`
                                }
                              >
                                View{" "}
                                {event.type.includes("project")
                                  ? "Project"
                                  : "Task"}
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-muted rounded-md">
                      <Info className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No events for this day
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
