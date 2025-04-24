"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, FolderKanban } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    dueDate: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    projectId: string;
    project: {
      id: string;
      name: string;
    };
    assignee: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
    creator: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  currentUserId?: string;
}

export default function TaskCard({ task, currentUserId }: TaskCardProps) {
  const router = useRouter();

  const handleTaskClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/projects/${task.projectId}`);
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
    if (!dateString) return "No due date";

    const dueDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (dueDate.getTime() === today.getTime()) {
      return "Today";
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    return format(dueDate, "MMM d, yyyy");
  };

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "DONE") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <Badge
            variant="outline"
            className="text-xs border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
          >
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge
            variant="outline"
            className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          >
            Medium
          </Badge>
        );
      case "LOW":
        return (
          <Badge
            variant="outline"
            className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Done
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </Badge>
        );
      case "TODO":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            To Do
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
      onClick={handleTaskClick}
    >
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-start justify-between pb-2">
          <button
            onClick={handleProjectClick}
            className="text-md text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center bg-transparent border-0 p-0 cursor-pointer"
          >
            <FolderKanban className="h-4 w-4 mr-1" />
            {task.project.name}
          </button>
          <div className="flex items-center space-x-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>
        <div className="flex flex-col min-h-0 pb-4">
          <h3 className="font-medium text-foreground text-lg line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div
            className={`flex items-center text-xs mt-auto pt-4 ${
              isOverdue(task.dueDate, task.status)
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>
              {isOverdue(task.dueDate, task.status) ? "Overdue: " : ""}
              {formatDueDate(task.dueDate)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full border-t pt-4 mt-auto">
          {task.assignee ? (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">
                Assigned to:
              </span>
              <Avatar className="h-6 w-6 mr-1">
                <AvatarImage
                  src={task.assignee.image || ""}
                  alt={task.assignee.name || ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.assignee.name}</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Unassigned</div>
          )}

          {task.creator && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">
                Created by:
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={task.creator.image || ""}
                        alt={task.creator.name || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                        {getInitials(task.creator.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {task.creator.name}
                      {task.creator.id === currentUserId && " (You)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
