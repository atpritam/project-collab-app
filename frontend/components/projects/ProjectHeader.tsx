"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Edit,
  UserPlus,
  PlusCircle,
  Loader2,
  CheckIcon,
  Search,
  AlertCircle,
  ChevronDown,
  Check,
  MessageSquare,
  Menu,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface ProjectHeaderProps {
  project: any;
  isAdmin: boolean;
  isEditor?: boolean;
  onProjectUpdated: () => void;
}

export default function ProjectHeader({
  project,
  isAdmin,
  isEditor,
  onProjectUpdated,
}: ProjectHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const router = useRouter();

  // Edit form state
  const [formData, setFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "IN_PROGRESS",
    dueDate: project.dueDate ? project.dueDate.substring(0, 10) : "",
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const [status, setStatus] = useState(project.status || "IN_PROGRESS");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
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
      setIsEditDialogOpen(false);
      onProjectUpdated();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError("");

    if (!inviteEmail) {
      setInviteError("Email address is required");
      setIsInviting(false);
      return;
    }

    if (!inviteRole) {
      setInviteError("Role is required");
      setIsInviting(false);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.message || "Failed to send invitation");
        setIsInviting(false);
        return;
      }

      toast.success("Invitation sent successfully");
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      onProjectUpdated();
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError("An unexpected error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteProject = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (confirmText !== project.name) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete project");
      }

      setDeleteDialogOpen(false);
      setConfirmText("");
      toast.success("Project deleted successfully");

      setTimeout(() => {
        router.push("/projects");
      }, 500);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDueDate = project.dueDate
    ? format(new Date(project.dueDate), "MMM d, yyyy")
    : "No due date";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </Badge>
        );
      case "AT_RISK":
        return <Badge variant={"destructive"}>At Risk</Badge>;
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "EDITOR":
        return "Editor";
      case "MEMBER":
        return "Member";
      default:
        return "Select a role";
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

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="max-w-full">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {getStatusBadge(project.status)}
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              {formattedDueDate}
            </span>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            asChild
          >
            <Link href={`/messages?projectId=${project.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Team
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {
                  setInviteEmail("");
                  setInviteRole("MEMBER");
                  setInviteError("");
                  setIsInviteDialogOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </>
          )}
          {(isAdmin || isEditor) && (
            <Button
              asChild
              className="bg-violet-700 hover:bg-violet-800 text-white flex items-center"
              size="sm"
            >
              <Link href={`/tasks/create?projectId=${project.id}`}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Task
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center"
            asChild
          >
            <Link href={`/messages?projectId=${project.id}`}>
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="sm:inline">Team</span>
            </Link>
          </Button>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Menu className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setInviteEmail("");
                    setInviteRole("MEMBER");
                    setInviteError("");
                    setIsInviteDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    setConfirmText("");
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(isAdmin || isEditor) && (
            <Button
              asChild
              className="flex-1 bg-violet-700 hover:bg-violet-800 text-white flex items-center justify-center"
              size="sm"
            >
              <Link href={`/tasks/create?projectId=${project.id}`}>
                <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="sm:inline">Task</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {project.description && (
        <div className="mt-4 max-w-full">
          <p className="text-sm sm:text-base text-foreground/80 break-words">
            {project.description}
          </p>
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                <Label htmlFor="role">Status</Label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusOptions(!showStatusOptions)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-sm"
                    id="role"
                  >
                    <span>{getStatusDisplay(status)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>

                  {showStatusOptions && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
                      <div className="py-1">
                        <button
                          type="button"
                          className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setStatus("IN_PROGRESS");
                            setShowStatusOptions(false);
                            formData.status = "IN_PROGRESS";
                          }}
                        >
                          <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                            {status === "IN_PROGRESS" && (
                              <Check className="h-4 w-4" />
                            )}
                          </span>
                          In Progress
                        </button>
                        <button
                          type="button"
                          className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setStatus("AT_RISK");
                            setShowStatusOptions(false);
                            formData.status = "AT_RISK";
                          }}
                        >
                          <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                            {status === "AT_RISK" && (
                              <Check className="h-4 w-4" />
                            )}
                          </span>
                          At Risk
                        </button>
                        <button
                          type="button"
                          className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setStatus("COMPLETED");
                            setShowStatusOptions(false);
                            formData.status = "COMPLETED";
                          }}
                        >
                          <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                            {status === "COMPLETED" && (
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
                  setConfirmText("");
                  setDeleteDialogOpen(true);
                  setIsEditDialogOpen(false);
                }}
                className="w-full sm:w-auto dark:bg-red-600/70 dark:hover:bg-red-600/80 text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
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

      {/* Delete Project Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialogOpen(open);
            setIsEditDialogOpen(false);
            if (!open) setConfirmText("");
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Project
            </DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                This action <span className="font-bold">cannot be undone</span>.
                This will permanently delete the project, all its tasks, files,
                and remove all team members.
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-amber-800 dark:text-amber-300 text-sm flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  To confirm, please type{" "}
                  <span className="font-bold">{project.name}</span> below
                </span>
              </div>

              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${project.name}" to confirm`}
                className={
                  confirmText === project.name ? "border-green-500" : ""
                }
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmText("");
              }}
              disabled={isDeleting}
              className="mt-3 sm:mt-0"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => handleDeleteProject(e)}
              disabled={isDeleting || confirmText !== project.name}
              className={`bg-red-600 hover:bg-red-700 text-white ${
                confirmText !== project.name
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            setShowRoleOptions(false);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-xs sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Invite team members to collaborate on this project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 py-4">
            {inviteError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the email address of the user you want to invite
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleOptions(!showRoleOptions)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-sm"
                  id="role"
                >
                  <span>{getRoleDisplay(inviteRole)}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>

                {showRoleOptions && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
                    <div className="py-1">
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setInviteRole("ADMIN");
                          setShowRoleOptions(false);
                        }}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {inviteRole === "ADMIN" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        Admin
                      </button>
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setInviteRole("EDITOR");
                          setShowRoleOptions(false);
                        }}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {inviteRole === "EDITOR" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        Editor
                      </button>
                      <button
                        type="button"
                        className="relative w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setInviteRole("MEMBER");
                          setShowRoleOptions(false);
                        }}
                      >
                        <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                          {inviteRole === "MEMBER" && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        Member
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Admin:</span> Full control over
                  the project
                </p>
                <p>
                  <span className="font-medium">Editor:</span> Create and manage
                  tasks
                </p>
                <p>
                  <span className="font-medium">Member:</span> View project and
                  participate in tasks assigned to them.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setShowRoleOptions(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="w-full sm:w-auto bg-violet-700 hover:bg-violet-800 text-white"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
