"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [taskBeingDragged, setTaskBeingDragged] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<string | null>(null);

  const columnRefs = {
    TODO: useRef<HTMLDivElement>(null),
    IN_PROGRESS: useRef<HTMLDivElement>(null),
    DONE: useRef<HTMLDivElement>(null),
  };

  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  const handleTaskCreated = async () => {
    try {
      const response = await fetch(`/api/tasks/project/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch updated tasks");
      }

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      // Update tasks list with new status
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      onTasksUpdated(updatedTasks);

      if (newStatus === "DONE" && oldStatus !== "DONE") {
        toast.success("Task completed! 🎉", {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
      } else {
        toast.success("Task updated", {
          icon: <Clock className="h-4 w-4 text-blue-500" />,
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Drag and drop functionality
  const handleDragStart = (taskId: string, status: string) => {
    if (!isAdmin && !isEditor) return; // Only admin/editor can drag tasks
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

    // Find the task
    const task = tasks.find((t) => t.id === taskBeingDragged);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;

    // Update status
    await handleStatusChange(taskBeingDragged, newStatus, oldStatus);
    setTaskBeingDragged(null);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;

    const dueDate = new Date(dateString);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.getTime() === today.getTime()) {
      return "Today";
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return format(dueDate, "MMM d, yyyy");
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <Badge
            variant="destructive"
            className="text-xs font-medium flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm"
          >
            <AlertTriangle className="h-3 w-3" />
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-sm px-2 py-1">
            Medium
          </Badge>
        );
      case "LOW":
        return (
          <Badge className="text-xs font-medium bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm px-2 py-1">
            Low
          </Badge>
        );
      default:
        return null;
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-50 dark:bg-green-950";
      case "IN_PROGRESS":
        return "bg-blue-50 dark:bg-blue-950";
      case "TODO":
        return "bg-gray-50 dark:bg-gray-900";
      default:
        return "";
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

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "DONE") return false;
    return new Date(dateString) < new Date();
  };

  const TaskCard = ({ task }: { task: any }) => {
    return (
      <div
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-300",
          "border-l-4",
          task.status === "TODO"
            ? "border-l-gray-400"
            : task.status === "IN_PROGRESS"
            ? "border-l-blue-500"
            : "border-l-green-500",
          "hover:translate-y-[-2px]"
        )}
        draggable={isAdmin || isEditor ? true : false}
        onDragStart={() => handleDragStart(task.id, task.status)}
      >
        <Link href={`/tasks/${task.id}`}>
          <div className="flex items-start gap-2">
            <div className="mt-1">{getStatusIcon(task.status)}</div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description.length > 100
                    ? `${task.description.substring(0, 100)}...`
                    : task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center mt-4 gap-2">
                {task.assignee && (
                  <div className="flex items-center relative group">
                    <Avatar className="h-6 w-6 mr-1 ring-2 ring-white dark:ring-gray-800">
                      <AvatarImage
                        src={task.assignee.image || ""}
                        alt={task.assignee.name || ""}
                      />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-violet-600 text-white">
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {task.assignee.name}
                    </div>
                  </div>
                )}

                {getPriorityBadge(task.priority)}

                {task.dueDate && (
                  <div
                    className={cn(
                      "text-xs flex items-center rounded-full px-2 py-1",
                      isOverdue(task.dueDate, task.status)
                        ? "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300"
                        : "text-muted-foreground bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {isOverdue(task.dueDate, task.status) ? "Overdue: " : ""}
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODO Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Card
            className={cn(
              "overflow-hidden border-gray-200 dark:border-gray-700 transition-colors duration-300",
              getColumnBackground("TODO")
            )}
          >
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                    <Circle className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span>To Do</span>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white dark:bg-gray-800"
                >
                  {todoTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="pt-4 h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar"
              ref={columnRefs.TODO}
              onDragOver={(e) => handleDragOver(e, "TODO")}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e, "TODO")}
            >
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <PlusCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p>No tasks to do</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* IN PROGRESS Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            className={cn(
              "overflow-hidden border-gray-200 dark:border-gray-700 transition-colors duration-300",
              getColumnBackground("IN_PROGRESS")
            )}
          >
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-blue-900/30">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span>In Progress</span>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white dark:bg-gray-800"
                >
                  {inProgressTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="pt-4 h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar"
              ref={columnRefs.IN_PROGRESS}
              onDragOver={(e) => handleDragOver(e, "IN_PROGRESS")}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e, "IN_PROGRESS")}
            >
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-blue-200 dark:border-blue-800/30 rounded-xl"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-300 dark:text-blue-500" />
                    </div>
                    <p>No tasks in progress</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* DONE Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card
            className={cn(
              "overflow-hidden border-gray-200 dark:border-gray-700 transition-colors duration-300",
              getColumnBackground("DONE")
            )}
          >
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-900/30">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <span>Done</span>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white dark:bg-gray-800"
                >
                  {doneTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="pt-4 h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar"
              ref={columnRefs.DONE}
              onDragOver={(e) => handleDragOver(e, "DONE")}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e, "DONE")}
            >
              {doneTasks.length > 0 ? (
                doneTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-green-200 dark:border-green-800/30 rounded-xl"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-300 dark:text-green-500" />
                    </div>
                    <p>No completed tasks</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
