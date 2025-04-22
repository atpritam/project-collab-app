"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  PlusCircle,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all projects when authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects();
    }
  }, [session?.user?.id]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  // Helper functions for project cards
  const truncateDescription = (desc: string | null, maxLength = 100) => {
    if (!desc) return "No description provided";
    return desc.length > maxLength
      ? `${desc.substring(0, maxLength)}...`
      : desc;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </Badge>
        );
      case "AT_RISK":
        return <Badge variant={"destructive"}>At Risk</Badge>;
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  // get initials for avatars
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your projects
          </p>
        </div>

        <Button
          asChild
          className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
        >
          <Link href="/projects/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              You don't have any projects yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first project to start collaborating with your team
            </p>
            <Button
              asChild
              className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
            >
              <Link href="/projects/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block group"
            >
              <Card className="h-full transition-all hover:shadow-md hover:bg-muted/30 dark:hover:bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="">{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {truncateDescription(project.description)}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {project.memberCount} member
                      {project.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(project.dueDate)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {project.members &&
                        project.members.slice(0, 3).map((member: any) => (
                          <Avatar
                            key={member.userId}
                            className="h-8 w-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={member.user?.image || ""}
                              alt={member.user?.name || ""}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-800 text-white">
                              {getInitials(member.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      {project.members && project.members.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="gap-1">
                      <span>View</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1 mt-4 w-full">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{project.completionPercentage}%</span>
                    </div>
                    <Progress
                      value={project.completionPercentage}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
