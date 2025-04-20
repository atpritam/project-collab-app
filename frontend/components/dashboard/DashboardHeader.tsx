// frontend/components/dashboard/DashboardHeader.tsx
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          {today}
        </p>
      </div>
      <Button
        asChild
        className="mt-4 md:mt-0 bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
      >
        <Link href="/projects/create">
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Link>
      </Button>
    </div>
  );
}
