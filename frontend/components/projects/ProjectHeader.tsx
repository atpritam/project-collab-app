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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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

  // Edit form state
  const [formData, setFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "IN_PROGRESS",
    dueDate: project.dueDate ? project.dueDate.substring(0, 10) : "",
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

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
      console.log(
        `Sending invitation to: ${inviteEmail} with role: ${inviteRole}`
      );

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {project.name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            {getStatusBadge(project.status)}
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formattedDueDate}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0">
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
      </div>

      {project.description && (
        <div className="mt-4 max-w-3xl">
          <p className="text-foreground/80">{project.description}</p>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="AT_RISK">At Risk</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateProject}
              disabled={isUpdating}
              className="bg-violet-700 hover:bg-violet-800 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            setShowRoleOptions(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
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
                  <span className="font-medium">Editor:</span> Can edit tasks
                  and project details
                </p>
                <p>
                  <span className="font-medium">Member:</span> Can view and
                  comment on tasks
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setShowRoleOptions(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
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
