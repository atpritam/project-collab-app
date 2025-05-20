"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clipboard } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";

interface Project {
  id: string;
  name: string;
  members: {
    userId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
}

function TaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams?.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's projects when authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/tasks/create");
      return;
    }

    if (session?.user?.id) {
      fetchProjects();
    }
  }, [session?.user?.id, status, router]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCreationSuccess = (taskId: string, projectId: string) => {
    setIsLoading(true);
    router.push(`/tasks/${taskId}`);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col min-h-[80vh]">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Task
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a task to organize and track your team's work
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="px-3 py-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
            >
              <Clipboard className="h-3.5 w-3.5 mr-1.5" />
              New Task
            </Badge>
          </div>
        </div>
      </div>

      <TaskForm
        mode="create"
        initialProjectId={projectIdParam || undefined}
        projects={projects}
        isLoading={isLoading}
        onCancel={() => router.back()}
        onSuccess={handleTaskCreationSuccess}
      />
    </div>
  );
}

function LoadingTaskCreate() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </main>
    </div>
  );
}

// Suspense boundary
export default function TaskCreate() {
  return (
    <Suspense fallback={<LoadingTaskCreate />}>
      <TaskPage />
    </Suspense>
  );
}
