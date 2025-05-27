"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import FileExplorer from "./FileExplorer";

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  taskId?: string | null;
  isTaskDeliverable?: boolean;
  createdAt: string;
}

interface TaskFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  isTaskDeliverable: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  files: TaskFile[];
}

interface ProjectFilesProps {
  projectId: string;
  isAdmin: boolean;
  isEditor: boolean;
}

export default function ProjectFiles({
  projectId,
  isAdmin,
  isEditor,
}: ProjectFilesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<FileItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchFilesData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // project files
        const filesResponse = await fetch(`/api/projects/${projectId}/files`);

        if (!filesResponse.ok) {
          throw new Error("Failed to fetch project files");
        }

        const filesData = await filesResponse.json();
        setProjectFiles(filesData.projectFiles || []);

        // tasks for this project
        const tasksResponse = await fetch(`/api/tasks/project/${projectId}`);

        if (!tasksResponse.ok) {
          throw new Error("Failed to fetch project tasks");
        }

        const tasksData = await tasksResponse.json();

        // files for each task
        const tasksWithFiles = await Promise.all(
          tasksData.map(async (task: any) => {
            try {
              const taskFilesResponse = await fetch(
                `/api/tasks/${task.id}/files`
              );

              if (taskFilesResponse.ok) {
                const taskFilesData = await taskFilesResponse.json();
                return {
                  ...task,
                  files: taskFilesData.files || [],
                };
              }

              return {
                ...task,
                files: [],
              };
            } catch (err) {
              console.error(`Error fetching files for task ${task.id}:`, err);
              return {
                ...task,
                files: [],
              };
            }
          })
        );

        setTasks(tasksWithFiles);
      } catch (err) {
        console.error("Error fetching files data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        toast.error("Failed to load project files");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilesData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load files</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FileExplorer
      projectId={projectId}
      projectFiles={projectFiles}
      tasks={tasks}
      hasPermissions={isAdmin || isEditor}
    />
  );
}
