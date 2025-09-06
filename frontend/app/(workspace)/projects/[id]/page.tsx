"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverview from "@/components/projects/ProjectOverview";
import ProjectTasks from "@/components/projects/ProjectTasks";
import ProjectHeader from "@/components/projects/ProjectHeader";
import ProjectFiles from "@/components/projects/ProjectFiles";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetchProjectData();
      fetchTasksData();
    }
  }, [status, id]);

  const fetchProjectData = async () => {
    setIsProjectLoading(true);
    try {
      const projectRes = await fetch(`/api/projects/${id}`);

      if (!projectRes.ok) {
        throw new Error("Failed to fetch project");
      }

      const projectData = await projectRes.json();
      setProject(projectData);

      // user role and admin check
      const userId = session?.user?.id;
      const isCreator = projectData.creatorId === userId;

      if (isCreator) {
        setUserRole("ADMIN");
        setIsAdmin(true);
      } else {
        const userMember = projectData.members.find(
          (m: any) => m.userId === userId
        );
        if (userMember) {
          setUserRole(userMember.role);
          setIsEditor(userMember.role === "EDITOR");
          setIsAdmin(userMember.role === "ADMIN");
        }
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setIsProjectLoading(false);
    }
  };

  const fetchTasksData = async () => {
    setIsTasksLoading(true);
    try {
      const tasksRes = await fetch(`/api/tasks/project/${id}`);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error fetching tasks data:", error);
      toast.error("Failed to load tasks data");
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleTasksUpdated = (updatedTasks: any[]) => {
    setTasks(updatedTasks);
  };

  // Session loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </div>
    );
  }

  // Project loading state or not found
  if (isProjectLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center flex-col p-8">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <p className="text-muted-foreground">
            The project you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <ProjectHeader
                project={project}
                isAdmin={isAdmin}
                isEditor={isEditor}
                onProjectUpdated={fetchProjectData}
              />
            </div>
          </div>

          <Tabs
            defaultValue="overview"
            className="mt-6"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProjectOverview
                project={project}
                tasks={tasks}
                isAdmin={isAdmin}
                onProjectUpdated={fetchProjectData}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              {isTasksLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-700 mr-2" />
                  <span>Loading tasks...</span>
                </div>
              ) : (
                <ProjectTasks
                  id={id}
                  project={project}
                  tasks={tasks}
                  isAdmin={isAdmin}
                  isEditor={isEditor}
                  onTasksUpdated={handleTasksUpdated}
                />
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <ProjectFiles
                projectId={id}
                isAdmin={isAdmin}
                isEditor={isEditor}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
