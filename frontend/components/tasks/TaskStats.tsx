"use client";

import React from "react";
import { PlusCircle, Circle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TaskStatsGridProps {
  activeTab: "assigned" | "created";
  getTaskCount: (tab: "assigned" | "created", status?: string) => number;
  className?: string;
}

const TaskStats: React.FC<TaskStatsGridProps> = ({
  activeTab,
  getTaskCount,
  className = "",
}) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {activeTab === "assigned" ? "Assigned Tasks" : "Created Tasks"}
            </p>
            <p className="text-2xl font-bold">{getTaskCount(activeTab)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <PlusCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">To Do</p>
            <p className="text-2xl font-bold">
              {getTaskCount(activeTab, "TODO")}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Circle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              In Progress
            </p>
            <p className="text-2xl font-bold">
              {getTaskCount(activeTab, "IN_PROGRESS")}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Completed
            </p>
            <p className="text-2xl font-bold">
              {getTaskCount(activeTab, "DONE")}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskStats;
