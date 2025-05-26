import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProjectCard from "@/components/projects/ProjectCard";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "IN_PROGRESS" | "AT_RISK" | "COMPLETED";
  dueDate: string | null;
  memberCount: number;
  completionPercentage: number;
  members: {
    user: {
      Id: string;
      name: string | null;
      image: string | null;
      email: string;
    };
  }[];
}

interface ProjectsSectionProps {
  projects: Project[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Button
          asChild
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-violet-700 dark:hover:text-violet-400"
          size="sm"
        >
          <Link href="/projects" className="flex items-center">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium text-foreground mb-2">
              You don't have any projects yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first project to get started with collaboration
            </p>
            <Button
              asChild
              className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
            >
              <Link href="/projects/create">Create New Project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              status={project.status}
              dueDate={project.dueDate}
              memberCount={project.memberCount}
              completionPercentage={project.completionPercentage}
              members={project.members}
            />
          ))}
        </div>
      )}
    </div>
  );
}
