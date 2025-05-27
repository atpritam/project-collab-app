"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, MoreVertical, UserCog, UserMinus } from "lucide-react";
import Link from "next/link";
import { getProfileUrl } from "@/lib/profileUtils";
import { getInitials } from "@/lib/utils";
import { getRoleBadge } from "@/lib/badge-utils";

interface ProjectMembersProps {
  projectId: string;
  project: any;
  onMembersUpdated: () => void;
}

export default function ProjectMembers({
  projectId,
  project,
  onMembersUpdated,
}: ProjectMembersProps) {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (project && session?.user?.id) {
      const isUserCreator = project.creatorId === session.user.id;
      setIsCreator(isUserCreator);

      if (isUserCreator) {
        setUserRole("ADMIN");
        setIsAdmin(true);
      } else {
        const userMember = project.members.find(
          (m: any) => m.userId === session.user.id
        );
        if (userMember) {
          setUserRole(userMember.role);
          setIsAdmin(userMember.role === "ADMIN");
        }
      }

      setMembers(project.members);
    }
  }, [project, session?.user?.id]);

  const canChangeRole = (memberRole: string) => {
    // Creator (Admin) can change role for everybody
    if (isCreator) return true;

    // Other admins can change roles of editors and members
    if (isAdmin && memberRole !== "ADMIN") return true;

    // Editors and members cannot change roles
    return false;
  };

  const handleRoleChange = (memberId: string, role: string, userId: string) => {
    const member = members.find((m) => m.userId === userId);
    if (!member) return;

    setMemberToUpdate({ id: memberId, userId, role, currentRole: member.role });
    setNewRole(role);
    setConfirmOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!memberToUpdate) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-member-id": memberToUpdate.id,
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update member role");
      }

      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.userId === memberToUpdate.userId
            ? { ...member, role: newRole }
            : member
        )
      );

      toast.success(`Member role updated successfully`);
      onMembersUpdated();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update member role"
      );
    } finally {
      setIsUpdatingRole(false);
      setConfirmOpen(false);
      setMemberToUpdate(null);
    }
  };

  const handleRemoveMember = (memberId: string, userId: string) => {
    setMemberToRemove({ id: memberId, userId });
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-member-id": memberToRemove.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove member");
      }

      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.userId !== memberToRemove.userId)
      );

      toast.success("Member removed successfully");
      onMembersUpdated();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    } finally {
      setIsRemoving(false);
      setRemoveConfirmOpen(false);
      setMemberToRemove(null);
    }
  };

  return (
    <Card className="w-full flex flex-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex">
            <UserCog className="h-5 w-5 mr-2" />
            Team Members
          </span>
          <span className="text-sm text-muted-foreground">
            {members.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex md:items-center md:justify-between border-b border-border/40 last:border-0 pb-3 last:pb-0 flex-col md:flex-row"
              >
                <div className="flex items-center">
                  <Link
                    href={getProfileUrl(
                      member.user?.email,
                      session?.user?.email
                    )}
                    className="cursor-pointer hover:opacity-80 transition-opacity mr-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={member.user?.image || ""}
                        alt={member.user?.name || "Unknown user"}
                      />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                        {getInitials(member.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <p className="font-medium">
                      {member.user?.name || "Unknown user"}
                      {project.creatorId === member.userId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Creator)
                        </span>
                      )}
                      {member.userId === session?.user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto md:ml-0 mt-2 md:mt-0">
                  {getRoleBadge(member.role)}

                  {session?.user?.id !== member.userId &&
                    canChangeRole(member.role) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={member.role === "ADMIN"}
                            className={
                              member.role === "ADMIN"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                "ADMIN",
                                member.userId
                              )
                            }
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={member.role === "EDITOR"}
                            className={
                              member.role === "EDITOR"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                "EDITOR",
                                member.userId
                              )
                            }
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={member.role === "MEMBER"}
                            className={
                              member.role === "MEMBER"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                "MEMBER",
                                member.userId
                              )
                            }
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() =>
                              handleRemoveMember(member.id, member.userId)
                            }
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No team members found for this project.
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this member's role from{" "}
              {memberToUpdate?.currentRole} to {newRole}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={isUpdatingRole}
              className="bg-violet-700 hover:bg-violet-800 text-white"
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the project? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={isRemoving}
              className="bg-red-600/80 hover:bg-red-700 text-white"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
