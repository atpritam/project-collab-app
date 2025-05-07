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
import PendingInvitationsSection from "@/components/dashboard/PendingInvitationsSection";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [displayTasks, setDisplayTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
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
      checkPendingInvitations();
    }
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, allTasksRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/projects?limit=4"),
        fetch("/api/tasks/all"),
        fetch("/api/dashboard/activity"),
      ]);

      // Projects response
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects);
        setStats((prev) => ({
          ...prev,
          totalProjects: projectsData.total,
        }));
      } else {
        toast.error("Failed to load projects");
      }

      if (allTasksRes.ok) {
        const allTasksData = await allTasksRes.json();
        setAllTasks(allTasksData);

        const currentUserId = session?.user?.id;
        const assignedTasks = allTasksData.filter(
          (task: any) => task.assignee && task.assignee.id === currentUserId
        );

        const completed = assignedTasks.filter(
          (t: any) => t.status === "DONE"
        ).length;
        const pending = assignedTasks.filter(
          (t: any) => t.status !== "DONE"
        ).length;

        const upcoming = allTasksData.filter((t: any) => {
          if (!t.dueDate || t.status === "DONE") return false;
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const sevenDaysLater = new Date();
          sevenDaysLater.setDate(today.getDate() + 7);
          return dueDate >= today && dueDate <= sevenDaysLater;
        }).length;

        setStats((prev) => ({
          ...prev,
          completedTasks: completed,
          pendingTasks: pending,
          upcomingDeadlines: upcoming,
        }));
        const sortedAssignedTasks = [...assignedTasks].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;

          const dateComparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

          if (dateComparison === 0) {
            if (!a.updatedAt && !b.updatedAt) return 0;
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          }

          return dateComparison;
        });

        setDisplayTasks(sortedAssignedTasks.slice(0, 4));
      } else {
        toast.error("Failed to load tasks data");
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

  const checkPendingInvitations = async () => {
    try {
      const response = await fetch("/api/invitations/pending");
      if (response.ok) {
        const data = await response.json();
        setShowInvitations(data.length > 0);
      }
    } catch (error) {
      console.error("Error checking pending invitations:", error);
    }
  };

  const handleInvitationAction = () => {
    checkPendingInvitations();
    fetchDashboardData();
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
      <WelcomeBanner
        userName={firstName}
        tasksDue={stats.upcomingDeadlines}
        projectsDue={stats.totalProjects}
      />
      {showInvitations && (
        <PendingInvitationsSection
          onInvitationAction={handleInvitationAction}
        />
      )}

      {!isMobile && <DashboardStats stats={stats} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ProjectsSection projects={projects} />
          <TasksSection
            tasks={displayTasks}
            currentUserId={session?.user?.id}
          />
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
