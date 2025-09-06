"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { getPriorityBadge } from "@/lib/badge-utils";

interface ProjectTasksProps {
  id: string;
  project: any;
  tasks: any[];
  isAdmin: boolean;
  isEditor?: boolean;
  onTasksUpdated: (tasks: any[]) => void;
}

export default function ProjectTasks({
  id,
  project,
  tasks,
  isAdmin,
  isEditor,
  onTasksUpdated,
}: ProjectTasksProps) {
  const isMobile = useIsMobile();
  const [taskBeingDragged, setTaskBeingDragged] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<string | null>(null);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);

  const columnRefs = {
    TODO: useRef<HTMLDivElement>(null),
    IN_PROGRESS: useRef<HTMLDivElement>(null),
    DONE: useRef<HTMLDivElement>(null),
  };

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  const columns = [
    {
      title: "To Do",
      status: "TODO",
      ref: columnRefs.TODO,
      tasks: todoTasks,
      icon: <Circle className="h-4 w-4 text-gray-600 dark:text-gray-300" />,
      emptyIcon: <PlusCircle className="h-5 w-5 text-gray-400" />,
      bgColor: "bg-gray-50 dark:bg-gray-900/50",
      borderColor: "border-gray-200 dark:border-gray-700",
    },
    {
      title: "In Progress",
      status: "IN_PROGRESS",
      ref: columnRefs.IN_PROGRESS,
      tasks: inProgressTasks,
      icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />,
      emptyIcon: <Clock className="h-5 w-5 text-blue-400" />,
      bgColor: "bg-blue-50/30 dark:bg-blue-900/10",
      borderColor: "border-blue-200 dark:border-blue-800/30",
    },
    {
      title: "Done",
      status: "DONE",
      ref: columnRefs.DONE,
      tasks: doneTasks,
      icon: (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
      ),
      emptyIcon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
      bgColor: "bg-green-50/30 dark:bg-green-900/10",
      borderColor: "border-green-200 dark:border-green-800/30",
    },
  ];

  const handleTaskCreated = async () => {
    try {
      const response = await fetch(`/api/tasks/project/${id}`);
      if (!response.ok) throw new Error("Failed to fetch updated tasks");

      const updatedTasks = await response.json();
      onTasksUpdated(updatedTasks);
      toast.success("Task created successfully!", {
        icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
      });
    } catch (error) {
      console.error("Error fetching updated tasks:", error);
      toast.error("Failed to refresh tasks");
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: string,
    oldStatus?: string
  ) => {
    try {
      const response = await fetch(`/api/tasks/update/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update task status");

      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      onTasksUpdated(updatedTasks);

      toast.success(
        newStatus === "DONE" && oldStatus !== "DONE"
          ? "Task completed! 🎉"
          : "Task updated",
        {
          icon:
            newStatus === "DONE" && oldStatus !== "DONE" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Clock className="h-4 w-4 text-blue-500" />
            ),
        }
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleDragStart = (taskId: string) => {
    if (!isAdmin && !isEditor) return;
    setTaskBeingDragged(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setHoverColumn(columnId);
  };

  const handleDragLeave = () => {
    setHoverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setHoverColumn(null);
    if (!taskBeingDragged || (!isAdmin && !isEditor)) return;

    const task = tasks.find((t) => t.id === taskBeingDragged);
    if (!task || task.status === newStatus) return;

    await handleStatusChange(taskBeingDragged, newStatus, task.status);
    setTaskBeingDragged(null);
  };

  const getInitials = (name: string | null) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "";

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.getTime() === today.getTime()) return "Today";
    if (dueDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    return format(dueDate, "MMM d, yyyy");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "TODO":
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getColumnBackground = (columnId: string) => {
    if (hoverColumn === columnId) {
      switch (columnId) {
        case "TODO":
          return "bg-gray-100 dark:bg-gray-800";
        case "IN_PROGRESS":
          return "bg-blue-50 dark:bg-blue-900/20";
        case "DONE":
          return "bg-green-50 dark:bg-green-900/20";
      }
    }
    return "bg-card";
  };

  // Mobile navigation handlers
  const handlePrevColumn = () => {
    setMobileColumnIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextColumn = () => {
    setMobileColumnIndex((prev) =>
      prev < columns.length - 1 ? prev + 1 : prev
    );
  };

  const renderTasks = (taskList: any[], status: string) =>
    taskList.map((task) => (
      <motion.div
        key={task.id}
        className={cn(
          "rounded-xl p-3 shadow-sm border border-muted bg-background space-y-2",
          columns.find((col) => col.status === status)?.bgColor,
          !isMobile && (isAdmin || isEditor) ? "cursor-move" : ""
        )}
        draggable={!isMobile && (isAdmin || isEditor)}
        onDragStart={() => handleDragStart(task.id)}
      >
        <div className="flex justify-between">
          <Link key={task.id} href={`/tasks/${task.id}`} className="block">
            <h4 className="font-semibold text-sm truncate">{task.title}</h4>
          </Link>
          {getStatusIcon(task.status)}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.image || undefined} />
              <AvatarFallback>{getInitials(task.assignee.name)}</AvatarFallback>
            </Avatar>
          )}
          {formatDueDate(task.dueDate) && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDueDate(task.dueDate)}
            </div>
          )}
          {getPriorityBadge(task.priority)}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {task.description}
        </p>
      </motion.div>
    ));

  // Mobile swipe card view
  if (isMobile) {
    const currentColumn = columns[mobileColumnIndex];

    return (
      <div className="px-1 space-y-3">
        <div className="flex justify-center items-center gap-1.5 mb-2">
          {columns.map((column, i) => (
            <div
              key={column.status}
              className={cn(
                "h-2 rounded-full transition-all",
                mobileColumnIndex === i
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted cursor-pointer"
              )}
              onClick={() => setMobileColumnIndex(i)}
            />
          ))}
        </div>

        {/* Column Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            disabled={mobileColumnIndex === 0}
            onClick={handlePrevColumn}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center",
                currentColumn.status === "TODO"
                  ? "bg-gray-200 dark:bg-gray-700"
                  : currentColumn.status === "IN_PROGRESS"
                  ? "bg-blue-100 dark:bg-blue-900/50"
                  : "bg-green-100 dark:bg-green-900/50"
              )}
            >
              {currentColumn.icon}
            </div>
            <h3 className="text-base font-medium">
              {currentColumn.title}
              <Badge className="ml-2" variant="outline">
                {currentColumn.tasks.length}
              </Badge>
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            disabled={mobileColumnIndex === columns.length - 1}
            onClick={handleNextColumn}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Task Content */}
        <Card
          className={cn(
            "overflow-hidden border rounded-xl transition-all",
            currentColumn.borderColor,
            currentColumn.bgColor
          )}
        >
          <CardContent className="p-3 space-y-2">
            {currentColumn.tasks.length > 0 ? (
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                {renderTasks(currentColumn.tasks, currentColumn.status)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                    currentColumn.status === "TODO"
                      ? "bg-gray-100 dark:bg-gray-800"
                      : currentColumn.status === "IN_PROGRESS"
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-green-50 dark:bg-green-900/20"
                  )}
                >
                  {currentColumn.emptyIcon}
                </div>
                <p className="text-sm text-muted-foreground">
                  No {currentColumn.title.toLowerCase()} tasks
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swipe Indicator */}
        <div className="text-center text-xs text-muted-foreground mt-1">
          Swipe or tap dots to change views
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="px-2 sm:px-4 md:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {columns.map(({ title, status, ref, tasks, icon }) => (
          <Card
            key={status}
            ref={ref}
            className={cn(
              "transition-all",
              getColumnBackground(status),
              "rounded-xl border shadow-sm flex flex-col max-h-[60vh] md:max-h-[calc(100vh-280px)] overflow-y-auto"
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <CardHeader className="sticky top-0 z-10 bg-card dark:bg-background">
              <CardTitle className="text-base flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted">
                    {icon}
                  </div>
                  {title}
                </div>
                <Badge variant="outline">{tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderTasks(tasks, status)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
