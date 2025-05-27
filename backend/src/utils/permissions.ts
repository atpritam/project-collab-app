import { PrismaClient } from "@prisma/client";
import { debugError } from "./debug";

const prisma = new PrismaClient();

/**
 * Check if a user has admin permissions for a project
 */
export async function canManageProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return false;
    }

    const isCreator = project.creatorId === userId;
    const isAdmin = project.members.some(
      (member: any) => member.userId === userId && member.role === "ADMIN"
    );

    return isCreator || isAdmin;
  } catch (error) {
    debugError("Error checking project permissions:", error);
    return false;
  }
}

/**
 * Check if user can edit task (admin, editor, or task creator)
 */
export async function canManageTask(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return false;
    }

    const isTaskCreator = task.creatorId === userId;
    const isProjectCreator = task.project.creatorId === userId;
    const member = task.project.members.find((m: any) => m.userId === userId);
    const isAdmin = member?.role === "ADMIN";
    const isEditor = member?.role === "EDITOR";

    return isTaskCreator || isProjectCreator || isAdmin || isEditor;
  } catch (error) {
    debugError("Error checking task management permissions:", error);
    return false;
  }
}

/**
 * Check if user can create tasks in a project (admin or editor)
 */
export async function canCreateTasks(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return false;
    }

    const isCreator = project.creatorId === userId;
    const membership = project.members.find((m: any) => m.userId === userId);
    const isAdmin = membership?.role === "ADMIN";
    const isEditor = membership?.role === "EDITOR";

    return isCreator || isAdmin || isEditor;
  } catch (error) {
    debugError("Error checking task creation permissions:", error);
    return false;
  }
}

/**
 * Check if user can update task status (assigned member, admin, editor, creator)
 */
export async function canUpdateTaskStatus(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return false;
    }

    const canFullEdit = await canManageTask(taskId, userId);
    const isAssignee = task.assigneeId === userId;

    return canFullEdit || isAssignee;
  } catch (error) {
    debugError("Error checking task status update permissions:", error);
    return false;
  }
}

/**
 * Check if user can manage files (project admin, editor, or file uploader)
 */
export async function canManageFile(
  fileId: string,
  userId: string
): Promise<boolean> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!file) {
      return false;
    }

    const isUploader = file.uploaderId === userId;
    const isProjectCreator = file.project.creatorId === userId;
    const membership = file.project.members.find(
      (m: any) => m.userId === userId
    );
    const isAdmin = membership?.role === "ADMIN";
    const isEditor = membership?.role === "EDITOR";

    return isUploader || isProjectCreator || isAdmin || isEditor;
  } catch (error) {
    debugError("Error checking file management permissions:", error);
    return false;
  }
}

/**
 * Check if user can invite members to a project (admin only)
 */
export async function canInviteProjectMembers(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canManageProject(projectId, userId);
}

/**
 * Check if user is a member of a project (including creator)
 */
export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return false;
    }

    const isCreator = project.creatorId === userId;
    const isMember = project.members.some(
      (member: any) => member.userId === userId
    );

    return isCreator || isMember;
  } catch (error) {
    debugError("Error checking project membership:", error);
    return false;
  }
}

/**
 * Check if user has access to view a task
 */
export async function canViewTask(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return false;
    }

    // Check if user is a member of the task's project
    return isProjectMember(task.projectId, userId);
  } catch (error) {
    debugError("Error checking task view permission:", error);
    return false;
  }
}

/**
 * Check if user has access to view files in a project
 */
export async function canViewProjectFiles(
  projectId: string,
  userId: string
): Promise<boolean> {
  // Project members and creator can view files
  return isProjectMember(projectId, userId);
}

/**
 * Check if user has access to view files for a task
 */
export async function canViewTaskFiles(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        projectId: true,
      },
    });

    if (!task) {
      return false;
    }

    // Check if user is a member of the task's project
    return isProjectMember(task.projectId, userId);
  } catch (error) {
    debugError("Error checking task files view permission:", error);
    return false;
  }
}

/**
 * Check if user can update a member's role in a project
 */
export async function canUpdateMemberRole(
  projectId: string,
  currentUserId: string,
  targetMemberId: string,
  newRole: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return { allowed: false, reason: "Project not found" };
    }

    const memberToUpdate = await prisma.projectMember.findUnique({
      where: { id: targetMemberId },
    });

    if (!memberToUpdate || memberToUpdate.projectId !== projectId) {
      return { allowed: false, reason: "Member not found in project" };
    }

    if (memberToUpdate.userId === currentUserId) {
      return { allowed: false, reason: "Cannot change your own role" };
    }

    const isProjectCreator = project.creatorId === currentUserId;
    const currentUser = project.members.find(
      (member: any) => member.userId === currentUserId
    );

    if (memberToUpdate.role === "ADMIN" && !isProjectCreator) {
      return {
        allowed: false,
        reason: "Only the project creator can modify admin roles",
      };
    }

    if (!isProjectCreator && (!currentUser || currentUser.role !== "ADMIN")) {
      return { allowed: false, reason: "Only admins can change member roles" };
    }

    if (
      memberToUpdate.role === "ADMIN" &&
      newRole !== "ADMIN" &&
      project.members.filter((m: any) => m.role === "ADMIN").length <= 1
    ) {
      return { allowed: false, reason: "Project must have at least one admin" };
    }

    return { allowed: true };
  } catch (error) {
    debugError("Error checking member role update permissions:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * Check if user can remove a member from a project
 */
export async function canRemoveProjectMember(
  projectId: string,
  currentUserId: string,
  targetMemberId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return { allowed: false, reason: "Project not found" };
    }

    const memberToRemove = await prisma.projectMember.findUnique({
      where: { id: targetMemberId },
    });

    if (!memberToRemove || memberToRemove.projectId !== projectId) {
      return { allowed: false, reason: "Member not found in project" };
    }

    if (memberToRemove.userId === currentUserId) {
      return {
        allowed: false,
        reason: "Cannot remove yourself from the project",
      };
    }

    const isProjectCreator = project.creatorId === currentUserId;
    const currentUser = project.members.find(
      (member: any) => member.userId === currentUserId
    );

    if (memberToRemove.role === "ADMIN" && !isProjectCreator) {
      return {
        allowed: false,
        reason: "Only the project creator can remove admins",
      };
    }

    if (!isProjectCreator && (!currentUser || currentUser.role !== "ADMIN")) {
      return { allowed: false, reason: "Only admins can remove members" };
    }

    return { allowed: true };
  } catch (error) {
    debugError("Error checking member removal permissions:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * Check if user can upload files to a project (admin or editor)
 */
export async function canUploadProjectFiles(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return false;
    }

    const isCreator = project.creatorId === userId;
    const membership = project.members.find((m: any) => m.userId === userId);
    const isAdmin = membership?.role === "ADMIN";
    const isEditor = membership?.role === "EDITOR";

    return isCreator || isAdmin || isEditor;
  } catch (error) {
    debugError("Error checking file upload permissions:", error);
    return false;
  }
}

/**
 * Validate if role is allowed in the system
 */
export function validateProjectRole(role: string): boolean {
  return ["ADMIN", "EDITOR", "MEMBER"].includes(role);
}

/**
 * Check if user with email is already a project member
 */
export async function isExistingProjectMember(
  projectId: string,
  email: string
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!project) {
      return false;
    }

    return project.members.some((member: any) => member.user.email === email);
  } catch (error) {
    debugError("Error checking existing project member:", error);
    return false;
  }
}

/**
 * Check if invitation already exists for email in project
 */
export async function hasExistingInvitation(
  projectId: string,
  email: string
): Promise<boolean> {
  try {
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email,
      },
    });

    return !!existingInvitation;
  } catch (error) {
    debugError("Error checking existing invitation:", error);
    return false;
  }
}

/**
 * Check if user can add completion details to a task
 */
export async function canCompleteTask(
  taskId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeId: true,
        status: true,
      },
    });

    if (!task) {
      return { allowed: false, reason: "Task not found" };
    }

    if (task.assigneeId !== userId) {
      return {
        allowed: false,
        reason: "Only the assigned user can add completion details",
      };
    }

    if (task.status !== "DONE") {
      return {
        allowed: false,
        reason: "Task must be marked as done before adding completion details",
      };
    }

    return { allowed: true };
  } catch (error) {
    debugError("Error checking task completion permissions:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * Validate if assignee is a project member
 */
export async function validateTaskAssignee(
  projectId: string,
  assigneeId: string | null
): Promise<{ valid: boolean; reason?: string }> {
  if (!assigneeId) {
    return { valid: true }; // null assigneeId is allowed (unassigned task)
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return { valid: false, reason: "Project not found" };
    }

    const isCreator = project.creatorId === assigneeId;
    const isMember = project.members.some(
      (member: any) => member.userId === assigneeId
    );

    if (!isCreator && !isMember) {
      return { valid: false, reason: "Assignee must be a project member" };
    }

    return { valid: true };
  } catch (error) {
    debugError("Error validating task assignee:", error);
    return { valid: false, reason: "Validation failed" };
  }
}

/**
 * Check if user is assigned to a specific task
 */
export async function isTaskAssignee(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeId: true,
      },
    });

    return task?.assigneeId === userId;
  } catch (error) {
    debugError("Error checking task assignee:", error);
    return false;
  }
}

/**
 * Check if user has permission to update task status only
 */
export async function canUpdateTaskStatusOnly(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return false;
    }

    // Task assignee can always update status
    if (task.assigneeId === userId) {
      return true;
    }

    // Check if user can fully manage the task
    return canManageTask(taskId, userId);
  } catch (error) {
    debugError("Error checking task status update permissions:", error);
    return false;
  }
}

/**
 * Validate authorization for account deletion
 */
export async function canDeleteAccount(
  userId: string,
  password?: string,
  verificationCode?: string
): Promise<{ authorized: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      return { authorized: false, reason: "User not found" };
    }

    let isAuthorized = false;

    // Check password authorization
    if (password && user.password) {
      const { verifyPassword } = await import("./hash");
      const isValidPassword = await verifyPassword(password, user.password);
      if (isValidPassword) {
        isAuthorized = true;
      }
    }

    // Check verification code authorization
    if (verificationCode && !isAuthorized) {
      const verificationToken = await prisma.deleteAccountToken.findFirst({
        where: {
          email: user.email,
          code: verificationCode,
        },
      });

      if (verificationToken && verificationToken.expiresAt > new Date()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        authorized: false,
        reason:
          "Verification failed. Please provide a valid password or verification code.",
      };
    }

    return { authorized: true };
  } catch (error) {
    debugError("Error checking account deletion authorization:", error);
    return { authorized: false, reason: "Authorization check failed" };
  }
}

/**
 * Validate password update authorization
 */
export async function canUpdatePassword(
  userId: string,
  currentPassword: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return { allowed: false, reason: "User not found" };
    }

    if (!user.password) {
      return {
        allowed: false,
        reason: "Cannot update password for accounts that use social login",
      };
    }

    const { verifyPassword } = await import("./hash");
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return { allowed: false, reason: "Current password is incorrect" };
    }

    return { allowed: true };
  } catch (error) {
    debugError("Error checking password update permissions:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}
