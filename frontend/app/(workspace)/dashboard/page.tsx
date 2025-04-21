"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import ProjectsSection from "@/components/dashboard/ProjectsSection";
import TasksSection from "@/components/dashboard/TasksSection";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
  });

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, tasksRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/projects"),
        fetch("/api/dashboard/tasks"),
        fetch("/api/dashboard/activity"),
      ]);

      // Projects response
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
        setStats((prev) => ({
          ...prev,
          totalProjects: projectsData.length,
        }));
      } else {
        toast.error("Failed to load projects");
      }

      // Tasks response
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);

        // Calculate task stats
        const completed = tasksData.filter(
          (t: any) => t.status === "DONE"
        ).length;
        const pending = tasksData.filter(
          (t: any) => t.status !== "DONE"
        ).length;
        const upcoming = tasksData.filter((t: any) => {
          if (!t.dueDate || t.status === "DONE") return false;
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const threeDaysLater = new Date();
          threeDaysLater.setDate(today.getDate() + 3);
          return dueDate >= today && dueDate <= threeDaysLater;
        }).length;

        setStats((prev) => ({
          ...prev,
          completedTasks: completed,
          pendingTasks: pending,
          upcomingDeadlines: upcoming,
        }));
      } else {
        toast.error("Failed to load tasks");
      }

      // Activity response
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

  if (isLoading || status === "loading") {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      <WelcomeBanner userName={firstName} />
      {!isMobile && <DashboardStats stats={stats} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ProjectsSection projects={projects} />
          <TasksSection tasks={tasks} />
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
