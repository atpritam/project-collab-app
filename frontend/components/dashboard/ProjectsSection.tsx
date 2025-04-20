// frontend/components/dashboard/ProjectsSection.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Users, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "IN_PROGRESS" | "AT_RISK" | "COMPLETED";
  dueDate: string | null;
  memberCount: number;
  completionPercentage: number;
}

interface ProjectsSectionProps {
  projects: Project[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const truncateDescription = (
    desc: string | null,
    maxLength: number = 100
  ) => {
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

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Projects Overview</h2>
        <Button
          asChild
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-violet-700"
          size="sm"
        >
          <Link href="/projects" className="flex items-center">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium text-foreground mb-2">
            You don't have any projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to get started with collaboration
          </p>
          <Button
            asChild
            className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
          >
            <Link href="/projects/new">Create New Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <CardDescription>
                    {truncateDescription(project.description)}
                  </CardDescription>
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
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{project.completionPercentage}%</span>
                    </div>
                    <Progress
                      value={project.completionPercentage}
                      className="h-1.5"
                    />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
