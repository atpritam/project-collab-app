"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProjectsSection from "@/components/dashboard/ProjectsSection";
import TasksSection from "@/components/dashboard/TasksSection";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  // Redirect unauthenticated users to sign-in page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const projectsRes = await fetch("/api/dashboard/projects");
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      } else {
        toast.error("Failed to load projects");
      }

      // Fetch tasks
      const tasksRes = await fetch("/api/dashboard/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      } else {
        toast.error("Failed to load tasks");
      }

      // Fetch activity
      const activityRes = await fetch("/api/dashboard/activity");
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData);
      } else {
        toast.error("Failed to load activity feed");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <DashboardHeader userName={session?.user?.name || ""} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <ProjectsSection projects={projects} />
              <TasksSection tasks={tasks} />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
