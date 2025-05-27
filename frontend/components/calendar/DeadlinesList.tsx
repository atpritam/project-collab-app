"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileBox,
  FolderKanban,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format, isToday, isTomorrow, addDays, isAfter } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getPriorityBadge } from "@/lib/badge-utils";

interface DeadlinesListProps {
  deadlines: any[];
  onTimeFrameChange?: (timeframe: string) => void;
}

export default function DeadlinesList({
  deadlines = [],
  onTimeFrameChange,
}: DeadlinesListProps) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [timeframe, setTimeframe] = useState("7");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const filteredDeadlines = deadlines
    .filter((deadline) => {
      if (filter !== "all") {
        return deadline.type === filter;
      }
      return true;
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  const groupedDeadlines = filteredDeadlines.reduce((groups: any, deadline) => {
    const dueDate = deadline.dueDate;
    if (!dueDate) return groups;

    const date = new Date(dueDate);
    const dateStr = format(date, "yyyy-MM-dd");

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(deadline);
    return groups;
  }, {});

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  // Check if a deadline is overdue
  const isOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getDeadlineIcon = (deadline: any) => {
    const type = deadline.type;

    if (type === "project") {
      return (
        <FolderKanban className="h-4 w-4 text-violet-600 dark:text-violet-400" />
      );
    }

    if (type === "task") {
      const priority = deadline.priority;
      if (priority === "HIGH") {
        return (
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      }
      return <FileBox className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }

    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const toggleSection = (dateStr: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  return (
    <Card>
      <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-2"}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle>Upcoming Deadlines</CardTitle>
          <div className={isMobile ? "flex flex-col gap-2" : "flex gap-2"}>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className={isMobile ? "w-full" : "w-[120px]"}>
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={timeframe}
              onValueChange={(value) => {
                setTimeframe(value);
                if (onTimeFrameChange) {
                  onTimeFrameChange(value);
                }
              }}
            >
              <SelectTrigger className={isMobile ? "w-full" : "w-[120px]"}>
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "pt-2 px-3 pb-3" : "pt-4"}>
        {filteredDeadlines.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No deadlines</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "You don't have any upcoming deadlines within the selected timeframe."
                : filter === "project"
                ? "No project deadlines within the selected timeframe."
                : "No task deadlines within the selected timeframe."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedDeadlines).map((dateStr) =>
              isMobile ? (
                <Collapsible
                  key={dateStr}
                  open={openSections[dateStr]}
                  onOpenChange={() => toggleSection(dateStr)}
                  className="border rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <h3
                        className={cn("text-sm font-medium", {
                          "text-red-600 dark:text-red-400": isOverdue(dateStr),
                        })}
                      >
                        {formatDueDate(dateStr)}
                        {isOverdue(dateStr) && " (Overdue)"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">
                        {groupedDeadlines[dateStr].length}
                      </Badge>
                      {openSections[dateStr] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="divide-y">
                      {groupedDeadlines[dateStr].map((deadline: any) => (
                        <div
                          key={deadline.id}
                          className="p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getDeadlineIcon(deadline)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">
                                {deadline.title}
                              </h4>
                              {deadline.type === "task" && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Project:{" "}
                                  <Link
                                    className="text-violet-600 dark:text-violet-400 hover:underline"
                                    href={`/projects/${deadline.project.id}`}
                                  >
                                    {deadline.project.name}
                                  </Link>
                                </div>
                              )}
                              {deadline.type === "task" &&
                                deadline.assignee && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={deadline.assignee.image}
                                        alt={deadline.assignee.name}
                                      />
                                      <AvatarFallback className="text-[10px]">
                                        {getInitials(deadline.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      {deadline.assignee.name}
                                    </span>
                                  </div>
                                )}

                              <div className="flex justify-between items-center mt-2">
                                {deadline.type === "task" &&
                                  getPriorityBadge(deadline.priority)}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-violet-700 dark:text-violet-400 ml-auto"
                                  asChild
                                >
                                  <Link
                                    href={
                                      deadline.type === "project"
                                        ? `/projects/${deadline.project.id}`
                                        : `/tasks/${deadline.id.replace(
                                            "task-",
                                            ""
                                          )}`
                                    }
                                  >
                                    Go to{" "}
                                    {deadline.type === "project"
                                      ? "Project"
                                      : "Task"}
                                    <ArrowUpRight className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <h3
                      className={`text-sm font-medium ${
                        isOverdue(dateStr)
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {formatDueDate(dateStr)}
                      {isOverdue(dateStr) && " (Overdue)"}
                    </h3>
                  </div>

                  <div className="pl-6 space-y-3">
                    {groupedDeadlines[dateStr].map((deadline: any) => (
                      <div
                        key={deadline.id}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getDeadlineIcon(deadline)}
                            </div>
                            <div>
                              <h4 className="font-medium">{deadline.title}</h4>
                              {deadline.type === "task" && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Project:{" "}
                                  <Link
                                    className="text-sm mt-1 text-violet-600 dark:text-violet-400 hover:underline"
                                    href={`/projects/${deadline.project.id}`}
                                  >
                                    {deadline.project.name}
                                  </Link>
                                </div>
                              )}
                              {deadline.type === "task" &&
                                deadline.assignee && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={deadline.assignee.image}
                                        alt={deadline.assignee.name}
                                      />
                                      <AvatarFallback className="text-[10px]">
                                        {getInitials(deadline.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      {deadline.assignee.name}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {deadline.type === "task" &&
                              getPriorityBadge(deadline.priority)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-violet-700 dark:text-violet-400"
                              asChild
                            >
                              <Link
                                href={
                                  deadline.type === "project"
                                    ? `/projects/${deadline.project.id}`
                                    : `/tasks/${deadline.id.replace(
                                        "task-",
                                        ""
                                      )}`
                                }
                              >
                                Go to{" "}
                                {deadline.type === "project"
                                  ? "Project"
                                  : "Task"}
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {deadline.description && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {deadline.description.length > 100
                              ? `${deadline.description.substring(0, 100)}...`
                              : deadline.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
