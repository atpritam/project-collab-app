import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import TaskCard from "@/components/tasks/TaskCard";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface TasksSectionProps {
  tasks: Task[];
  currentUserId?: string;
}

export default function TasksSection({
  tasks,
  currentUserId,
}: TasksSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        <Button
          asChild
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-violet-700 dark:hover:text-violet-400"
          size="sm"
        >
          <Link href="/tasks" className="flex items-center">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium text-foreground mb-2">
              You don't have any tasks yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Tasks will appear here once you are assigned to them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
