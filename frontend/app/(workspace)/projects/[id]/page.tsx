"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverview from "@/components/projects/ProjectOverview";
import ProjectTasks from "@/components/projects/ProjectTasks";
import ProjectHeader from "@/components/projects/ProjectHeader";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetchProjectData();
    }
  }, [status, id]);

  const fetchProjectData = async () => {
    setIsLoading(true);
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

      // Fetch project tasks
      const tasksRes = await fetch(`/api/tasks/project/${id}`);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTasksUpdated = (updatedTasks: any[]) => {
    setTasks(updatedTasks);
  };

  if (status === "loading" || isLoading) {
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
          <ProjectHeader
            project={project}
            isAdmin={isAdmin}
            isEditor={isEditor}
            onProjectUpdated={fetchProjectData}
          />

          <Tabs defaultValue="overview" className="mt-8">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProjectOverview
                project={project}
                tasks={tasks}
                isAdmin={isAdmin}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <ProjectTasks
                id={id}
                project={project}
                tasks={tasks}
                isAdmin={isAdmin}
                isEditor={isEditor}
                onTasksUpdated={handleTasksUpdated}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">
                  Files Feature Coming Soon
                </h3>
                <p className="text-muted-foreground mt-2">
                  This feature is currently under development.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">
                  Chat Feature Coming Soon
                </h3>
                <p className="text-muted-foreground mt-2">
                  This feature is currently under development.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
