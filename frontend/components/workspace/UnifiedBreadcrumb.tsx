"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { HomeIcon, FolderIcon, CheckSquareIcon, PlusIcon } from "lucide-react";

export function UnifiedBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [taskName, setTaskName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const projectId = params?.id as string;
  const taskId = params?.taskId as string;

  const showBreadcrumbs = pathname !== "/dashboard";

  useEffect(() => {
    if (projectId && !projectName) {
      const fetchProjectDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const data = await response.json();
            setProjectName(data.name);
          }
        } catch (error) {
          console.error("Failed to fetch project details:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProjectDetails();
    }
  }, [projectId, projectName]);

  useEffect(() => {
    if (taskId && !taskName) {
      const fetchTaskDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/projects/${projectId}/tasks/${taskId}`
          );
          if (response.ok) {
            const data = await response.json();
            setTaskName(data.title);
          }
        } catch (error) {
          console.error("Failed to fetch task details:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTaskDetails();
    }
  }, [taskId, taskName, projectId]);

  if (!showBreadcrumbs) {
    return null;
  }

  return (
    <Breadcrumb className="pb-2 pt-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center">
              <HomeIcon className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only md:inline-block">
                Dashboard
              </span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.includes("projects") && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segments.length > 1 && segments[1] !== "projects" ? (
                <BreadcrumbLink asChild>
                  <Link href="/projects" className="flex items-center">
                    <FolderIcon className="h-4 w-4 mr-1" />
                    Projects
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center">
                  <FolderIcon className="h-4 w-4 mr-1" />
                  Projects
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {segments.includes("create") && segments.includes("projects") && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                Create Project
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {projectId && !segments.includes("create") && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {taskId ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={`/projects/${projectId}`}
                    className="flex items-center"
                  >
                    {isLoading ? (
                      <span className="h-4 w-20 bg-muted rounded animate-pulse"></span>
                    ) : (
                      projectName || "Project Details"
                    )}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center">
                  {isLoading ? (
                    <span className="h-4 w-20 bg-muted rounded animate-pulse"></span>
                  ) : (
                    projectName || "Project Details"
                  )}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {taskId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center">
                <CheckSquareIcon className="h-4 w-4 mr-1" />
                {isLoading ? (
                  <span className="h-4 w-20 bg-muted rounded animate-pulse"></span>
                ) : (
                  taskName || "Task Details"
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* more section-specific breadcrumbs will be added here */}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
