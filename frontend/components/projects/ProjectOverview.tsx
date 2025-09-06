"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, CalendarDays, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProjectMembers from "./ProjectMembers";
import { getProfileUrl } from "@/lib/profileUtils";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface ProjectOverviewProps {
  project: any;
  tasks: any[];
  isAdmin: boolean;
  onProjectUpdated?: () => void;
}

export default function ProjectOverview({
  project,
  tasks,
  isAdmin,
  onProjectUpdated,
}: ProjectOverviewProps) {
  const { data: session } = useSession();
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusPrompt, setShowStatusPrompt] = useState(false);

  // task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;
  const todoTasks = tasks.filter((task) => task.status === "TODO").length;

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Check if project is complete but status isn't set to COMPLETED
  useEffect(() => {
    if (
      completionPercentage === 100 &&
      totalTasks > 0 &&
      project.status !== "COMPLETED" &&
      isAdmin
    ) {
      setShowStatusPrompt(true);
    } else {
      setShowStatusPrompt(false);
    }
  }, [completionPercentage, totalTasks, project.status, isAdmin]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const handleMembersUpdated = () => {
    if (onProjectUpdated) {
      onProjectUpdated();
    }
  };

  const handleMarkProjectCompleted = async () => {
    if (!isAdmin) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project status");
      }

      toast.success("Project marked as completed!");

      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      toast.error("Failed to update project status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
      setIsCompletionDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showStatusPrompt && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4 flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    All tasks are completed!
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Would you like to mark this project as completed?
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white dark:bg-background cursor-pointer"
                      onClick={() => setShowStatusPrompt(false)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      onClick={() => setIsCompletionDialogOpen(true)}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm font-medium">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-800/30 flex items-center justify-center mr-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{completedTasks} tasks</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center mr-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-xl font-bold">{inProgressTasks} tasks</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center mr-3">
                  <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To Do</p>
                  <p className="text-xl font-bold">{todoTasks} tasks</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 flex-col md:flex-row">
        <ProjectMembers
          projectId={project.id}
          project={project}
          onMembersUpdated={handleMembersUpdated}
        />

        {/* Project Details */}
        <Card className="flex md:w-sm w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <div className="flex items-center mt-1">
                  <Link
                    href={getProfileUrl(
                      project.creator?.email,
                      session?.user?.email
                    )}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={project.creator?.image || ""}
                        alt={project.creator?.name || ""}
                        className="object-cover cursor-pointer"
                      />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                        {getInitials(project.creator?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <span className="cursor-pointer">
                    {project.creator?.name || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created On</p>
                <p className="font-medium">{formatDate(project.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(project.dueDate)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Project as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              All tasks in this project are complete. Changing the project
              status to "Completed" will notify all team members that the
              project has been finalized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkProjectCompleted}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Updating..." : "Mark as Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
