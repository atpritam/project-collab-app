"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Edit,
  UserPlus,
  PlusCircle,
  MessageSquare,
  Menu,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { getStatusBadge } from "@/lib/badge-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditProjectDialog from "./EditProjectDialog";
import DeleteProjectDialog from "./DeleteProjectDialog";
import InviteDialog from "./InviteDialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formattedDueDate = project.dueDate
    ? format(new Date(project.dueDate), "MMM d, yyyy")
    : "No due date";

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleInviteClick = () => {
    setIsInviteDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="max-w-full">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">
            {project.name}
          </h1>
          <div
            onClick={handleEditClick}
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground cursor-pointer"
          >
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
                onClick={handleEditClick}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleInviteClick}
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
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInviteClick}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDeleteClick}
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

      {/* Dialog Components */}
      <EditProjectDialog
        project={project}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onProjectUpdated={onProjectUpdated}
        onDeleteClick={handleDeleteClick}
      />

      <DeleteProjectDialog
        project={project}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <InviteDialog
        project={project}
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  );
}
