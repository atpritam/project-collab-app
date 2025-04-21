import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  project: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface TasksSectionProps {
  tasks: Task[];
}

export default function TasksSection({ tasks }: TasksSectionProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";

    const dueDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "DONE") return false;
    return new Date(dateString) < new Date();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const truncateDescription = (desc: string | null, maxLength = 60) => {
    if (!desc) return null;
    return desc.length > maxLength
      ? `${desc.substring(0, maxLength)}...`
      : desc;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        <Button
          asChild
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-violet-700"
          size="sm"
        >
          <Link href="/tasks" className="flex items-center">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium text-foreground mb-2">
              You don't have any tasks yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Tasks will appear here once you create or are assigned to them
            </p>
            <Button
              asChild
              className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
            >
              <Link href="/tasks/create">Create New Task</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-sm transition-shadow cursor-pointer"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start">
                  <div className="mt-1 mr-3">{getStatusIcon(task.status)}</div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div>
                        <CardTitle className="text-base">
                          <Link
                            href={`/projects/${task.project.id}/tasks/${task.id}`}
                            className="font-medium text-foreground hover:text-violet-700 transition-colors"
                          >
                            {task.title}
                          </Link>
                        </CardTitle>
                        <div className="text-xs mt-1 text-muted-foreground">
                          <Link
                            href={`/projects/${task.project.id}`}
                            className="hover:text-violet-700 transition-colors"
                          >
                            {task.project.name}
                          </Link>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {truncateDescription(task.description)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-end mt-2">
                  {task.assignee && (
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage
                        src={task.assignee.image || ""}
                        alt={task.assignee.name || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex items-center text-xs ${
                      isOverdue(task.dueDate, task.status)
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {isOverdue(task.dueDate, task.status) ? "Overdue: " : ""}
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
