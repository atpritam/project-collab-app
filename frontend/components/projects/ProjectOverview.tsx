"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Users, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface ProjectOverviewProps {
  project: any;
  tasks: any[];
  isAdmin: boolean;
}

export default function ProjectOverview({
  project,
  tasks,
  isAdmin,
}: ProjectOverviewProps) {
  // task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;
  const todoTasks = tasks.filter((task) => task.status === "TODO").length;

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMMM d, yyyy");
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

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.members && project.members.length > 0 ? (
              <div className="space-y-4">
                {project.members.map((member: any) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage
                          src={member.user?.image || ""}
                          alt={member.user?.name || ""}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                          {getInitials(member.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.role === "ADMIN"
                            ? "Admin"
                            : member.role === "EDITOR"
                            ? "Editor"
                            : "Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No team members added yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details Card */}
        <Card>
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
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={project.creator?.image || ""}
                      alt={project.creator?.name || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                      {getInitials(project.creator?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.creator?.name || "Unknown"}</span>
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
    </div>
  );
}
