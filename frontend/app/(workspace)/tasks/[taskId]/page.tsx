"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Loader2,
  Calendar,
  AlertTriangle,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Circle,
  FileText,
  Ban,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusBadge, getPriorityBadge } from "@/lib/badge-utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import TaskAttachments from "@/components/tasks/TaskAttachments";
import TaskCompletion from "@/components/tasks/TaskCompletion";
import { getInitials } from "@/lib/utils";

export default function TaskDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [permissionLevel, setPermissionLevel] = useState<
    "none" | "view" | "edit" | "admin"
  >("none");
  const [taskFiles, setTaskFiles] = useState<any[]>([]);
  const [taskDeliverables, setTaskDeliverables] = useState<any[]>([]);
  const [isAssignee, setIsAssignee] = useState(false);

  const taskId = params?.taskId as string;

  const [editedTask, setEditedTask] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (status === "authenticated" && taskId) {
      fetchProjectAndTaskDetails();
    }
  }, [status, taskId]);

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO",
      });

      const userId = session?.user?.id;
      setIsAssignee(task.assigneeId === userId);

      if (task.taskFiles && task.taskFiles.length > 0) {
        const attachments = task.taskFiles.filter(
          (file: any) => !file.isTaskDeliverable
        );
        const deliverables = task.taskFiles.filter(
          (file: any) => file.isTaskDeliverable
        );

        setTaskFiles(attachments);
        setTaskDeliverables(deliverables);
      }
    }
  }, [task, session?.user?.id]);

  const fetchProjectAndTaskDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const taskResponse = await fetch(`/api/tasks/${taskId}`);

      if (!taskResponse.ok) {
        const data = await taskResponse.json();
        throw new Error(data.message || "Failed to fetch task details");
      }

      const taskData = await taskResponse.json();
      setTask(taskData);

      if (taskData.taskFiles && taskData.taskFiles.length > 0) {
        const attachments = taskData.taskFiles.filter(
          (file: any) => !file.isTaskDeliverable
        );
        const deliverables = taskData.taskFiles.filter(
          (file: any) => file.isTaskDeliverable
        );

        setTaskFiles(attachments);
        setTaskDeliverables(deliverables);
      } else {
        setTaskFiles([]);
        setTaskDeliverables([]);
      }

      const projectResponse = await fetch(
        `/api/projects/${taskData.project?.id}`
      );

      if (!projectResponse.ok) {
        const data = await projectResponse.json();
        throw new Error(data.message || "Failed to fetch project details");
      }
      const projectData = await projectResponse.json();
      setProject(projectData);

      if (projectData.members) {
        setAvailableMembers(projectData.members.map((m: any) => m.user));
      }

      // user permissions
      const userId = session?.user?.id;

      // check if the user is the assignee
      const userIsAssignee = taskData.assigneeId === userId;
      setIsAssignee(userIsAssignee);

      const isAdmin =
        projectData.creatorId === userId ||
        projectData.members.some(
          (m: any) => m.userId === userId && m.role === "ADMIN"
        );

      // Editor can edit all tasks
      const isEditor = projectData.members.some(
        (m: any) => m.userId === userId && m.role === "EDITOR"
      );

      // Task creator can edit their own tasks
      const isTaskCreator = taskData.creatorId === userId;

      // Task assignee can update status but not other fields
      const isAssignee = taskData.assigneeId === userId;

      // Member of the project can view tasks
      const isMember = projectData.members.some(
        (m: any) => m.userId === userId
      );

      if (isAdmin || isEditor || isTaskCreator) {
        setPermissionLevel("admin");
      } else if (isAssignee) {
        setPermissionLevel("edit");
      } else if (isMember) {
        setPermissionLevel("view");
      } else {
        setPermissionLevel("none");
        setError("You don't have permission to view this task.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      toast.error("Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editedTask.title.trim()) {
      errors.title = "Task title is required";
    } else if (editedTask.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (editedTask.title.trim().length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (editedTask.description && editedTask.description.length > 2000) {
      errors.description = "Description must be less than 2000 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (permissionLevel === "none" || permissionLevel === "view") {
      toast.error("You don't have permission to update this task");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/update/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update task status");
      }

      setTask((prev: any) => ({ ...prev, status: newStatus }));

      if (isEditing) {
        setEditedTask((prev: any) => ({ ...prev, status: newStatus }));
      }

      toast.success("Task status updated");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update task status"
      );
    }
  };

  const handleEditField = (field: string, value: string) => {
    setEditedTask((prev: any) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tasks/update/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          assigneeId: editedTask.assigneeId || null,
          dueDate: editedTask.dueDate || null,
          priority: editedTask.priority,
          status: editedTask.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update task");
      }

      const updatedTask = await response.json();

      setTask(updatedTask);

      // Exit edit mode
      setIsEditing(false);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO",
      });
    }

    setValidationErrors({});

    // Exit edit mode
    setIsEditing(false);
  };

  const handleAssigneeChange = (value: string) => {
    if (value === "unassigned") {
      setEditedTask((prev: any) => ({ ...prev, assigneeId: null }));
    } else {
      setEditedTask((prev: any) => ({ ...prev, assigneeId: value }));
    }
  };

  const handleDeleteTask = async () => {
    if (permissionLevel !== "admin") {
      toast.error("You don't have permission to delete this task");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/delete/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete task");
      }

      toast.success("Task deleted successfully");
      router.push(`/projects/${project?.id}`);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCompletionNoteUpdate = async (note: string) => {
    setTask((prev: any) => ({
      ...prev,
      completionNote: note,
    }));

    fetchProjectAndTaskDetails();
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return "No due date";

    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "TODO":
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push(`/auth/signin?callbackUrl=/task/${taskId}`);
    return null;
  }

  if (error || !project || !task || permissionLevel === "none") {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {!project
                ? "Project Not Found"
                : !task
                ? "Task Not Found"
                : "Permission Denied"}
            </CardTitle>
            <CardDescription>
              {!project
                ? "The project you're trying to access doesn't exist or you don't have permission to view it."
                : !task
                ? "The task you're trying to access doesn't exist or has been deleted."
                : "You don't have permission to view this task."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-start">
              <Ban className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Access Restricted</p>
                <p className="text-sm mt-1">
                  {error ||
                    "You need to be a member of this project to view tasks."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button asChild>
                <Link href={`/projects/${project?.id}`}>Return to Project</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex gap-4">
          {task.status === "DONE" && (
            <div className="pt-1.5">{getStatusIcon(task.status)}</div>
          )}
          <div>
            {isEditing ? (
              <div className="w-full max-w-md">
                <Input
                  value={editedTask.title}
                  onChange={(e) => handleEditField("title", e.target.value)}
                  className={cn(
                    "text-xl font-bold border-violet-400 focus-visible:ring-violet-400",
                    validationErrors.title && "border-red-500"
                  )}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.title}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="text-2xl font-bold">{task.title}</h1>
            )}
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Link
                href={`/projects/${project?.id}`}
                className="hover:text-violet-800  dark:hover:text-violet-300  hover:underline"
              >
                {project.name}
              </Link>
              <span>•</span>
              <span>Created by {task.creator.name}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0">
          {permissionLevel === "admin" && !isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this task and remove it from the project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTask}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center border-red-200 text-red-600"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                variant="default"
                size="sm"
                className="flex items-center bg-violet-600 hover:bg-violet-700 dark:bg-violet-800 dark:hover:bg-violet-900 text-white"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedTask.description}
                    onChange={(e) =>
                      handleEditField("description", e.target.value)
                    }
                    placeholder="Add a description..."
                    rows={5}
                    className={cn(
                      "resize-y min-h-[120px]",
                      validationErrors.description && "border-red-500"
                    )}
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-sm">
                      {validationErrors.description}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <p className="text-xs text-muted-foreground">
                      {editedTask.description?.length || 0}/2000
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {task.description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{task.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description provided
                    </p>
                  )}
                </>
              )}
              {taskFiles.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Attachments</h3>
                    <TaskAttachments files={taskFiles} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {task.status === "DONE" &&
            (task.completionNote ||
              taskDeliverables.length > 0 ||
              isAssignee) && (
              <Card>
                <CardContent>
                  <TaskCompletion
                    taskId={taskId}
                    isAssignee={isAssignee}
                    existingNote={task.completionNote}
                    onNoteUpdated={handleCompletionNoteUpdate}
                    deliverables={taskDeliverables}
                  />
                </CardContent>
              </Card>
            )}

          {(permissionLevel === "admin" || permissionLevel === "edit") && (
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>
                  Update the current status of this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant={task.status === "TODO" ? "default" : "outline"}
                    className={
                      task.status === "TODO"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : ""
                    }
                    onClick={() => handleUpdateStatus("TODO")}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    To Do
                  </Button>
                  <Button
                    variant={
                      task.status === "IN_PROGRESS" ? "default" : "outline"
                    }
                    className={
                      task.status === "IN_PROGRESS"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                  <Button
                    variant={task.status === "DONE" ? "default" : "outline"}
                    className={
                      task.status === "DONE"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                    onClick={() => handleUpdateStatus("DONE")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <div className="mt-1">{getStatusBadge(task.status)}</div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Priority
                  </h3>
                  {isEditing ? (
                    <Select
                      value={editedTask.priority}
                      onValueChange={(value) =>
                        handleEditField("priority", value)
                      }
                    >
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            <span>Low</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                            <span>Medium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                            <span>High</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {getPriorityBadge(task.priority)}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </h3>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedTask.dueDate}
                      onChange={(e) =>
                        handleEditField("dueDate", e.target.value)
                      }
                      className="h-9 mt-1"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  ) : (
                    <p className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDueDate(task.dueDate)}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Assignee
                  </h3>
                  {isEditing ? (
                    <Select
                      value={editedTask.assigneeId || "unassigned"}
                      onValueChange={handleAssigneeChange}
                    >
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue placeholder="Assign to team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {availableMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center">
                              <Avatar className="h-5 w-5 mr-2">
                                {member.image ? (
                                  <AvatarImage
                                    src={member.image}
                                    alt={member.name}
                                  />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      {task.assignee ? (
                        <div className="flex items-center mt-1">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage
                              src={task.assignee.image || ""}
                              alt={task.assignee.name}
                            />
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                              {getInitials(task.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.name}</span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground mt-1 italic">
                          Unassigned
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Creator
                  </h3>
                  <div className="flex items-center mt-1">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage
                        src={task.creator.image || ""}
                        alt={task.creator.name}
                      />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                        {getInitials(task.creator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.creator.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
