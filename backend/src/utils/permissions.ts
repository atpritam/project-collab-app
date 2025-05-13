import { PrismaClient } from "@prisma/client";

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
    console.error("Error checking project permissions:", error);
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
    console.error("Error checking task management permissions:", error);
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
    console.error("Error checking task creation permissions:", error);
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
    console.error("Error checking task status update permissions:", error);
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
    console.error("Error checking file management permissions:", error);
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
    console.error("Error checking project membership:", error);
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
    console.error("Error checking task view permission:", error);
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
    console.error("Error checking task files view permission:", error);
    return false;
  }
}
