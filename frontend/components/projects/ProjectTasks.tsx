"use client";

import { useState } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ProjectTasksProps {
  project: string;
  projectId: string;
  tasks: any[];
  isAdmin: boolean;
  isEditor?: boolean;
  onTasksUpdated: (tasks: any[]) => void;
}

export default function ProjectTasks({
  project,
  projectId,
  tasks,
  isAdmin,
  isEditor,
}: ProjectTasksProps) {
  const [selectedView, setSelectedView] = useState<"list" | "kanban">("kanban");

  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

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
            className="text-xs flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600">
            Medium
          </Badge>
        );
      case "LOW":
        return (
          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">Low</Badge>
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

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "DONE") return false;
    return new Date(dateString) < new Date();
  };

  const TaskCard = ({ task }: { task: any }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card border rounded-lg p-4 mb-3 shadow-sm hover:shadow transition-all"
      >
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
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarImage
                      src={task.assignee.image || ""}
                      alt={task.assignee.name || ""}
                    />
                    <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {getPriorityBadge(task.priority)}

              {task.dueDate && (
                <div
                  className={`text-xs flex items-center ${
                    isOverdue(task.dueDate, task.status)
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
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
      </motion.div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            variant={selectedView === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("kanban")}
            className={
              selectedView === "kanban" ? "bg-violet-700 text-white" : ""
            }
          >
            Kanban View
          </Button>
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("list")}
            className={
              selectedView === "list" ? "bg-violet-700 text-white" : ""
            }
          >
            List View
          </Button>
        </div>

        {(isAdmin || isEditor) && (
          <Button
            size="sm"
            className="bg-violet-700 hover:bg-violet-800 text-white flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {selectedView === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TODO Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Circle className="h-4 w-4 mr-2 text-gray-400" />
                To Do
                <span className="ml-2 text-sm text-muted-foreground">
                  ({todoTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks to do
                </div>
              )}
            </CardContent>
          </Card>

          {/* IN PROGRESS Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                In Progress
                <span className="ml-2 text-sm text-muted-foreground">
                  ({inProgressTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks in progress
                </div>
              )}
            </CardContent>
          </Card>

          {/* DONE Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Done
                <span className="ml-2 text-sm text-muted-foreground">
                  ({doneTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {doneTasks.length > 0 ? (
                doneTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No completed tasks
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks created yet</p>
                {isAdmin && (
                  <Button
                    className="mt-4 bg-violet-700 hover:bg-violet-800 text-white"
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
