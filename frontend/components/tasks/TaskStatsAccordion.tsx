"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskStats from "./TaskStats";

interface TaskStatsAccordionProps {
  activeTab: "assigned" | "created";
  getTaskCount: (tab: "assigned" | "created", status?: string) => number;
}

const TaskStatsAccordion: React.FC<TaskStatsAccordionProps> = ({
  activeTab,
  getTaskCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 md:hidden">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between mb-2"
      >
        <span>Task Statistics</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {isOpen && (
        <TaskStats
          activeTab={activeTab}
          getTaskCount={getTaskCount}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        />
      )}
    </div>
  );
};

export default TaskStatsAccordion;
