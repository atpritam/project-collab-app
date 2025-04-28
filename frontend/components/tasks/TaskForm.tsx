"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Users,
  FolderKanban,
  Save,
  Paperclip,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import TaskFileUpload from "@/components/tasks/TaskFileUpload";

interface Project {
  id: string;
  name: string;
  members: {
    userId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
}

interface Task {
  id?: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  dueDate?: string;
  priority: string;
  status?: string;
}

interface TaskFormProps {
  mode: "create" | "edit";
  taskId?: string;
  initialTask?: Task;
  initialProjectId?: string;
  projects: Project[];
  isLoading: boolean;
  onCancel?: () => void;
  onSuccess?: (taskId: string, projectId: string) => void;
}

export default function TaskForm({
  mode = "create",
  taskId,
  initialTask,
  initialProjectId,
  projects,
  isLoading,
  onCancel,
  onSuccess,
}: TaskFormProps) {
  const router = useRouter();

  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: initialTask?.title || "",
    description: initialTask?.description || "",
    projectId: initialTask?.projectId || initialProjectId || "",
    assigneeId: initialTask?.assigneeId || "",
    dueDate: initialTask?.dueDate ? initialTask.dueDate.substring(0, 10) : "",
    priority: initialTask?.priority || "MEDIUM",
    status: initialTask?.status || "TODO",
  });

  // Update available members when project changes
  useEffect(() => {
    if (formData.projectId) {
      const selectedProject = projects.find((p) => p.id === formData.projectId);
      if (selectedProject) {
        setAvailableMembers(selectedProject.members.map((m) => m.user));
        if (mode === "create" || !initialTask?.assigneeId) {
          setFormData((prev) => ({ ...prev, assigneeId: "" }));
        }
      }
    } else {
      setAvailableMembers([]);
    }
  }, [formData.projectId, projects, mode, initialTask]);

  // Form initialization
  useEffect(() => {
    if (mode === "edit" && initialTask) {
      setFormData({
        title: initialTask.title || "",
        description: initialTask.description || "",
        projectId: initialTask.projectId || "",
        assigneeId: initialTask.assigneeId || "",
        dueDate: initialTask.dueDate
          ? initialTask.dueDate.substring(0, 10)
          : "",
        priority: initialTask.priority || "MEDIUM",
        status: initialTask.status || "TODO",
      });
    } else if (initialProjectId && projects.length > 0) {
      const projectExists = projects.some((p) => p.id === initialProjectId);
      if (projectExists) {
        setFormData((prev) => ({ ...prev, projectId: initialProjectId }));
      }
    }
  }, [projects, initialProjectId, mode, initialTask]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation (3-100 characters)
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Project validation
    if (!formData.projectId) {
      newErrors.projectId = "Project selection is required";
    }

    // Description validation (0-2000 characters)
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }

    setErrors(newErrors);
    setFormError(Object.values(newErrors)[0] || "");
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let response;
      let successMessage;

      const fileData = attachedFiles.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
      }));

      if (mode === "create") {
        // Creating a new task
        response = await fetch(`/api/tasks/create/${formData.projectId}`, {
          method: `POST`,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            assigneeId: formData.assigneeId || null,
            dueDate: formData.dueDate || null,
            priority: formData.priority,
            status: formData.status,
            files: fileData,
          }),
        });
        successMessage = "Task created successfully";
      } else {
        // Editing an existing task
        response = await fetch(`/api/tasks/update/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            assigneeId: formData.assigneeId || null,
            dueDate: formData.dueDate || null,
            priority: formData.priority,
            status: formData.status,
          }),
        });
        successMessage = "Task updated successfully";
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${mode} task`);
      }

      const task = await response.json();
      toast.success(successMessage);

      // Call the success callback or redirect
      if (onSuccess) {
        onSuccess(task.id, formData.projectId);
      } else {
        router.push(`/task/${task.id}`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing task:`, error);
      setFormError(
        error instanceof Error ? error.message : `Failed to ${mode} task`
      );
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} task`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "HIGH":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardContent>
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 text-sm mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className={cn(
                  "text-base font-medium",
                  errors.title && "text-destructive"
                )}
              >
                Task Title*
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear, specific task title"
                className={cn("h-11", errors.title && "border-destructive")}
                required
              />
              {errors.title ? (
                <p className="text-sm text-destructive">{errors.title}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A concise title helps team members understand the task at a
                  glance
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className={cn(
                  "text-base font-medium",
                  errors.description && "text-destructive"
                )}
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide details, context, and any specific requirements for this task"
                rows={5}
                className={cn(
                  "resize-y min-h-[120px]",
                  errors.description && "border-destructive"
                )}
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-sm text-destructive">
                    {errors.description}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Provide any additional context or requirements
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formData.description.length}/2000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mode === "create" && (
                <div className="space-y-2">
                  <>
                    <Label
                      htmlFor="project"
                      className={cn(
                        "text-base font-medium flex items-center",
                        errors.projectId && "text-destructive"
                      )}
                    >
                      <FolderKanban className="h-4 w-4 mr-2 text-violet-600" />
                      Project*
                    </Label>

                    <Select
                      value={formData.projectId}
                      onValueChange={(value) =>
                        handleSelectChange("projectId", value)
                      }
                      required
                    >
                      <SelectTrigger
                        id="project"
                        className={cn(
                          "h-11",
                          errors.projectId && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.length > 0
                          ? projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))
                          : null}
                      </SelectContent>
                    </Select>
                  </>

                  {errors.projectId && (
                    <p className="text-sm text-destructive">
                      {errors.projectId}
                    </p>
                  )}

                  {projects.length === 0 && mode === "create" && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          You need to be a member of at least one project to
                          create tasks.{" "}
                          <Link
                            href="/projects/create"
                            className="font-medium underline underline-offset-2"
                          >
                            Create a project
                          </Link>
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="assignee"
                  className="text-base font-medium flex items-center"
                >
                  <Users className="h-4 w-4 mr-2 text-violet-600" />
                  Assignee
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select
                          value={formData.assigneeId}
                          onValueChange={(value) =>
                            handleSelectChange("assigneeId", value)
                          }
                          disabled={
                            !formData.projectId || availableMembers.length === 0
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Assign to team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center">
                                  <Avatar className="h-6 w-6 mr-2">
                                    {member.image ? (
                                      <AvatarImage
                                        src={member.image}
                                        alt={member.name}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <AvatarFallback>
                                        {member.name
                                          ? member.name.charAt(0).toUpperCase()
                                          : "U"}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>{member.name || "Unnamed User"}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    {!formData.projectId && (
                      <TooltipContent>
                        <p>
                          Select a project first to see available team members
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {formData.projectId && availableMembers.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No team members available in this project
                  </p>
                )}
              </div>
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-base font-medium flex items-center"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-violet-600" />
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                  >
                    <SelectTrigger id="status" className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                          <span>To Do</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DONE">
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Done</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="dueDate"
                  className="text-base font-medium flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2 text-violet-600" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="h-11"
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  When should this task be completed by?
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-base font-medium flex items-center"
                >
                  <Flag className="h-4 w-4 mr-2 text-violet-600" />
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleSelectChange("priority", value)
                  }
                >
                  <SelectTrigger id="priority" className="h-11">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full bg-green-500 mr-2`}
                        ></span>
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full bg-amber-500 mr-2`}
                        ></span>
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full bg-rose-500 mr-2`}
                        ></span>
                        <span>High</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="attachments"
                className="text-base font-medium flex items-center"
              >
                <Paperclip className="h-4 w-4 mr-2 text-violet-600" />
                Attachments
              </Label>
              <TaskFileUpload
                files={attachedFiles}
                setFiles={setAttachedFiles}
                maxFiles={2}
              />
            </div>

            <div className="pt-2">
              <Separator className="mb-4" />
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel || (() => router.back())}
                  className="order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.projectId}
                  className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white order-1 sm:order-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create"
                        ? "Creating Task..."
                        : "Saving Changes..."}
                    </>
                  ) : (
                    <>
                      {mode === "create" ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Create Task
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="text-lg pb-3">Task Preview</div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                  Title
                </h3>
                <p className="font-medium">
                  {formData.title || "Your task title will appear here"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                  Project
                </h3>
                <p>
                  {formData.projectId
                    ? projects.find((p) => p.id === formData.projectId)?.name
                    : "No project selected"}
                </p>
              </div>

              {formData.assigneeId && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                    Assigned to
                  </h3>
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      {availableMembers.find(
                        (m) => m.id === formData.assigneeId
                      )?.image ? (
                        <AvatarImage
                          src={
                            availableMembers.find(
                              (m) => m.id === formData.assigneeId
                            )?.image || "/placeholder.svg"
                          }
                          alt={
                            availableMembers.find(
                              (m) => m.id === formData.assigneeId
                            )?.name || "User"
                          }
                        />
                      ) : (
                        <AvatarFallback>
                          {availableMembers.find(
                            (m) => m.id === formData.assigneeId
                          )?.name
                            ? availableMembers
                                .find((m) => m.id === formData.assigneeId)
                                ?.name.charAt(0)
                                .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>
                      {availableMembers.find(
                        (m) => m.id === formData.assigneeId
                      )?.name || "Unnamed User"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {formData.priority && (
                  <Badge
                    variant="secondary"
                    className={`${getPriorityColor(formData.priority)}`}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    {formData.priority.charAt(0) +
                      formData.priority.slice(1).toLowerCase()}{" "}
                    Priority
                  </Badge>
                )}

                {formData.dueDate && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Due {new Date(formData.dueDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-lg pb-3">Quick Tips</div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use clear, action-oriented task titles</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Include all relevant details in the description</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Set realistic due dates to keep your team on track</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Assign tasks to specific team members for accountability
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
