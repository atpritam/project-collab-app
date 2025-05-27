"use client";

import { useState } from "react";
import { CheckIcon, Loader2, Trash2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditProjectDialogProps {
  project: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: () => void;
  onDeleteClick: () => void;
}

export default function EditProjectDialog({
  project,
  isOpen,
  onOpenChange,
  onProjectUpdated,
  onDeleteClick,
}: EditProjectDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  const [formData, setFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "IN_PROGRESS",
    dueDate: project.dueDate ? project.dueDate.substring(0, 10) : "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateProject = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      toast.success("Project updated successfully");
      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "AT_RISK":
        return "At Risk";
      case "COMPLETED":
        return "Completed";
      default:
        return "Select a status";
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
    setShowStatusOptions(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md sm:max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStatusOptions(!showStatusOptions)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-sm"
                  id="status"
                >
                  <span>{getStatusDisplay(formData.status)}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>

                {showStatusOptions && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
                    <div className="py-1">
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleStatusChange("IN_PROGRESS")}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {formData.status === "IN_PROGRESS" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        In Progress
                      </button>
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleStatusChange("AT_RISK")}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {formData.status === "AT_RISK" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        At Risk
                      </button>
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleStatusChange("COMPLETED")}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {formData.status === "COMPLETED" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        Completed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-0 mt-2">
          <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
            <Button
              onClick={() => {
                onDeleteClick();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto dark:bg-red-600/70 dark:hover:bg-red-600/80 text-white bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={updateProject}
                disabled={isUpdating}
                className="w-full sm:w-auto bg-violet-700 hover:bg-violet-800 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
