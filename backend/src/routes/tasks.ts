import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  canManageTask,
  canUpdateTaskStatus,
  canCreateTasks,
  canManageFile,
  canViewTaskFiles,
  canViewTask,
  isProjectMember,
  canCompleteTask,
  validateTaskAssignee,
} from "../utils/permissions";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const tasksRouter: Router = express.Router();

export default tasksRouter;

// GET /api/tasks/all - Get all tasks for a user
tasksRouter.get("/all", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { limit } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
      },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, image: true, email: true } },
        assignee: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take:
        typeof limit === "string" && !isNaN(parseInt(limit))
          ? parseInt(limit)
          : undefined,
    });

    res.status(200).json(tasks);
  } catch (error) {
    debugError("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET /api/tasks/assigned - Get all tasks assigned to a user
tasksRouter.get("/assigned", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { limit } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, image: true, email: true } },
        assignee: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take:
        typeof limit === "string" && !isNaN(parseInt(limit))
          ? parseInt(limit)
          : undefined,
    });

    res.status(200).json(tasks);
  } catch (error) {
    debugError("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET /api/tasks/created - Get all tasks created by a user
tasksRouter.get("/created", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { limit } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: { creatorId: userId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, image: true, email: true } },
        assignee: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take:
        typeof limit === "string" && !isNaN(parseInt(limit))
          ? parseInt(limit)
          : undefined,
    });

    res.status(200).json(tasks);
  } catch (error) {
    debugError("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET /api/tasks/project/:projectId - Get all tasks for a project
tasksRouter.get("/project/:projectId", function (req: Request, res: Response) {
  const { projectId } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!(await isProjectMember(projectId, userId))) {
        return res.status(403).json({
          message: "You do not have permission to view tasks for this project",
        });
      }

      // Get tasks for this project
      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          creator: {
            select: { id: true, name: true, image: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
        orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
      });

      res.status(200).json(tasks);
    } catch (error) {
      debugError("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  })();
});

// POST /api/tasks/create/:projectId - Create a new task for a project
tasksRouter.post("/create/:projectId", function (req: Request, res: Response) {
  const { projectId } = req.params;
  const {
    title,
    description,
    assigneeId,
    dueDate,
    priority,
    creatorId,
    files,
  } = req.body;

  (async () => {
    try {
      if (!title || title.length < 3 || title.length > 100) {
        return res
          .status(400)
          .json({ message: "Title must be between 3 and 100 characters" });
      }
      if (description && description.length > 2000) {
        return res
          .status(400)
          .json({ message: "Description must be less than 2000 characters" });
      }

      if (!creatorId) {
        return res.status(400).json({ message: "Creator ID is required" });
      }

      // permission check
      if (!(await canCreateTasks(projectId, creatorId))) {
        return res
          .status(403)
          .json({ message: "Only admins or editors can create tasks" });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (assigneeId) {
        const assigneeValidation = await validateTaskAssignee(
          projectId,
          assigneeId
        );
        if (!assigneeValidation.valid) {
          return res.status(400).json({
            message: assigneeValidation.reason,
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const newTask = await tx.task.create({
          data: {
            title,
            description,
            projectId,
            creatorId,
            assigneeId: assigneeId || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || "MEDIUM",
            status: "TODO",
          },
          include: {
            creator: { select: { id: true, name: true, image: true } },
            assignee: { select: { id: true, name: true, image: true } },
          },
        });

        if (files && Array.isArray(files) && files.length > 0) {
          const filePromises = files.map((file) =>
            tx.file.create({
              data: {
                name: file.name,
                url: file.url,
                size: file.size,
                type: file.type,
                uploaderId: creatorId,
                projectId,
                taskId: newTask.id,
                isTaskDeliverable: false, // context file, not a deliverable
              },
            })
          );

          await Promise.all(filePromises);
        }

        return { newTask };
      });

      res.status(201).json(result.newTask);
    } catch (error) {
      debugError("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  })();
});

// PATCH /api/tasks/update/:taskId - Update a task
tasksRouter.patch("/update/:taskId", function (req: Request, res: Response) {
  const { taskId } = req.params;
  const { title, description, assigneeId, dueDate, priority, status, userId } =
    req.body;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if task exists
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: { include: { members: true } },
        },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Status-only update
      if (Object.keys(req.body).length === 2 && status !== undefined) {
        // permission check
        if (!(await canUpdateTaskStatus(taskId, userId))) {
          return res.status(403).json({
            message: "You don't have permission to update this task status",
          });
        }

        const updated = await prisma.task.update({
          where: { id: taskId },
          data: { status },
          include: {
            creator: { select: { id: true, name: true, image: true } },
            assignee: { select: { id: true, name: true, image: true } },
          },
        });

        return res.status(200).json(updated);
      }

      // permission check
      if (!(await canManageTask(taskId, userId))) {
        return res
          .status(403)
          .json({ message: "You don't have permission to modify this task" });
      }

      // Validate inputs
      if (title !== undefined) {
        if (!title.trim() || title.length < 3 || title.length > 100) {
          return res
            .status(400)
            .json({ message: "Title must be between 3 and 100 characters" });
        }
      }

      if (description !== undefined && description.length > 2000) {
        return res
          .status(400)
          .json({ message: "Description must be less than 2000 characters" });
      }

      if (assigneeId !== undefined && assigneeId !== null) {
        const assigneeValidation = await validateTaskAssignee(
          task.projectId,
          assigneeId
        );
        if (!assigneeValidation.valid) {
          return res.status(400).json({
            message: assigneeValidation.reason,
          });
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          title: title ?? undefined,
          description: description ?? undefined,
          assigneeId: assigneeId ?? undefined,
          dueDate:
            dueDate !== undefined
              ? dueDate
                ? new Date(dueDate)
                : null
              : undefined,
          priority: priority ?? undefined,
          status: status ?? undefined,
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          assignee: { select: { id: true, name: true, image: true } },
        },
      });

      res.status(200).json(updatedTask);
    } catch (error) {
      debugError("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  })();
});

// DELETE /api/tasks/delete/:taskId - Delete a task
tasksRouter.delete("/delete/:taskId", function (req: Request, res: Response) {
  const { taskId } = req.params;
  const { userId } = req.body;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // permission check
      if (!(await canManageTask(taskId, userId))) {
        return res
          .status(403)
          .json({ message: "You don't have permission to delete this task" });
      }

      await prisma.task.delete({ where: { id: taskId } });
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      debugError("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  })();
});

// GET /api/tasks/:taskId - Get a task by ID
tasksRouter.get("/:taskId", function (req: Request, res: Response) {
  const { taskId } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!(await canViewTask(taskId, userId))) {
        return res.status(403).json({
          message: "You do not have permission to view this task",
        });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: { members: true },
          },
          creator: { select: { id: true, name: true, image: true } },
          assignee: { select: { id: true, name: true, image: true } },
          taskFiles: true,
        },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json(task);
    } catch (error) {
      debugError("Error retrieving task:", error);
      res.status(500).json({ message: "Failed to retrieve task" });
    }
  })();
});

// POST /api/tasks/complete/:taskId - Add completion note and deliverables to a completed task
tasksRouter.post("/complete/:taskId", function (req: Request, res: Response) {
  const { taskId } = req.params;
  const { completionNote, deliverables } = req.body;
  const userId = req.body.userId;

  (async () => {
    try {
      const completionCheck = await canCompleteTask(taskId, userId);
      if (!completionCheck.allowed) {
        return res.status(403).json({
          message: completionCheck.reason,
        });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const result = await prisma.$transaction(async (tx) => {
        // completion note
        const updatedTask = await tx.task.update({
          where: { id: taskId },
          data: { completionNote },
          include: { taskFiles: true },
        });

        // deliverables
        if (Array.isArray(deliverables) && deliverables.length > 0) {
          const existingFiles = await tx.file.findMany({
            where: {
              taskId: taskId,
              isTaskDeliverable: true,
              url: { in: deliverables.map((f: any) => f.url) },
            },
            select: { url: true },
          });
          const existingUrls = new Set(existingFiles.map((f: any) => f.url));

          const newDeliverables = deliverables.filter(
            (f) => !existingUrls.has(f.url)
          );

          if (newDeliverables.length > 0) {
            const createPromises = newDeliverables.map((file: any) =>
              tx.file.create({
                data: {
                  name: file.name,
                  url: file.url,
                  size: file.size,
                  type: file.type,
                  uploaderId: userId,
                  projectId: task.projectId,
                  taskId: taskId,
                  isTaskDeliverable: true,
                },
              })
            );
            await Promise.all(createPromises);
          }
        }

        const refreshedTask = await tx.task.findUnique({
          where: { id: taskId },
          include: { taskFiles: true },
        });

        return { updatedTask: refreshedTask! };
      });

      res.status(200).json(result.updatedTask);
    } catch (error) {
      debugError("Error updating task completion details:", error);
      res.status(500).json({ message: "Failed to update completion details" });
    }
  })();
});

// DELETE /api/tasks/files/:fileId - Delete a task file
tasksRouter.delete("/files/:fileId", function (req: Request, res: Response) {
  const { fileId } = req.params;
  const { userId } = req.body;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // permission check
      if (!(await canManageFile(fileId, userId))) {
        return res.status(403).json({
          message: "You don't have permission to delete this file",
        });
      }

      await prisma.file.delete({
        where: { id: fileId },
      });

      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      debugError("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  })();
});

// GET /api/tasks/:taskId/files - Get all files for a task
tasksRouter.get("/:taskId/files", function (req: Request, res: Response) {
  const { taskId } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!(await canViewTaskFiles(taskId, userId))) {
        return res.status(403).json({
          message: "You do not have permission to view files for this task",
        });
      }

      const files = await prisma.file.findMany({
        where: {
          taskId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({ files });
    } catch (error) {
      debugError("Error fetching task files:", error);
      res.status(500).json({ message: "Failed to fetch task files" });
    }
  })();
});
