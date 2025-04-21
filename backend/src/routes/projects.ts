import express, { Router, Request, Response } from "express";
import { PrismaClient, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();
const projectsRouter: Router = express.Router();

export default projectsRouter;

// POST /api/projects/new
projectsRouter.post("/new", function (req: Request, res: Response) {
  const { name, description, dueDate, creatorId } = req.body;

  (async () => {
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    if (!creatorId) {
      return res.status(400).json({ message: "Creator ID is required" });
    }

    try {
      // Create new project
      const newProject = await prisma.project.create({
        data: {
          name,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId,
          status: "IN_PROGRESS" as ProjectStatus,
          // Also add the creator as a project member with ADMIN role
          members: {
            create: {
              userId: creatorId,
              role: "ADMIN",
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  })();
});

// GET /api/projects/test
projectsRouter.get("/test", (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  console.log(`Backend: Test endpoint hit with userId: ${userId}`);

  res.status(200).json({
    message: "Projects API is working",
    userId: userId,
  });
});

// GET /api/projects/:id - Get a project by ID
projectsRouter.get("/:id", function (req: Request, res: Response) {
  const { id } = req.params;

  (async () => {
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(200).json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  })();
});

// PATCH /api/projects/:id - Update a project
projectsRouter.patch("/:id", function (req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, status, dueDate, userId } = req.body;

  (async () => {
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    try {
      // authorize user
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // check ADMIN role
      const isCreator = project.creatorId === userId;
      const isAdmin = project.members.some(
        (member: any) => member.userId === userId && member.role === "ADMIN"
      );

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          message: "You do not have permission to update this project",
        });
      }

      // Update the project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          status: status as ProjectStatus | undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  })();
});

// POST /api/projects/:id/tasks - Create a new task for a project
projectsRouter.post("/:id/tasks", function (req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, assigneeId, dueDate, priority, creatorId } =
    req.body;

  (async () => {
    try {
      if (!title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      if (title.length < 3) {
        return res
          .status(400)
          .json({ message: "Title must be at least 3 characters" });
      }

      if (title.length > 100) {
        return res
          .status(400)
          .json({ message: "Title must be less than 100 characters" });
      }

      if (description && description.length > 2000) {
        return res
          .status(400)
          .json({ message: "Description must be less than 2000 characters" });
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is authorized to create tasks
      const isCreator = project.creatorId === creatorId;
      const isMember = project.members.some(
        (member: any) => member.userId === creatorId
      );

      if (!isCreator && !isMember) {
        return res.status(403).json({
          message:
            "You do not have permission to create tasks for this project",
        });
      }

      // If assigneeId is provided, check if that user is a member of the project
      if (assigneeId) {
        const isAssigneeMember = project.members.some(
          (member: any) => member.userId === assigneeId
        );

        if (!isAssigneeMember) {
          return res.status(400).json({
            message: "Assignee must be a member of this project",
          });
        }
      }

      // Create the task
      const newTask = await prisma.task.create({
        data: {
          title,
          description,
          projectId: id,
          creatorId,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "MEDIUM",
          status: "TODO",
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  })();
});

// PATCH /api/projects/:id/tasks/:taskId - Update a task
projectsRouter.patch(
  "/:id/tasks/:taskId",
  function (req: Request, res: Response) {
    const { id, taskId } = req.params;
    const {
      title,
      description,
      assigneeId,
      dueDate,
      priority,
      status,
      userId,
    } = req.body;

    (async () => {
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
          return res.status(404).json({ message: "Task not found" });
        }

        if (task.projectId !== id) {
          return res
            .status(400)
            .json({ message: "Task does not belong to this project" });
        }

        // user permissions
        const isTaskCreator = task.creatorId === userId;
        const isProjectCreator = task.project.creatorId === userId;

        const userMember = task.project.members.find(
          (member: any) => member.userId === userId
        );

        const userRole = userMember?.role || null;
        const isAdmin = userRole === "ADMIN";
        const isEditor = userRole === "EDITOR";
        const isAssignee = task.assigneeId === userId;

        // Full edit: Creator, Admin, Editor
        // Status only: Assignee
        // No permissions: Regular members who are not task creator or assignee
        const canFullEdit =
          isTaskCreator || isProjectCreator || isAdmin || isEditor;
        const canUpdateStatus = canFullEdit || isAssignee;

        if (Object.keys(req.body).length === 2 && status && canUpdateStatus) {
          const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { status },
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              assignee: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          return res.status(200).json(updatedTask);
        }

        // For full edits, verify permissions
        if (!canFullEdit) {
          return res.status(403).json({
            message: "You don't have permission to modify this task",
          });
        }

        // Validate inputs if they exist
        if (title !== undefined) {
          if (title.trim() === "") {
            return res.status(400).json({ message: "Task title is required" });
          }
          if (title.length < 3) {
            return res
              .status(400)
              .json({ message: "Title must be at least 3 characters" });
          }
          if (title.length > 100) {
            return res
              .status(400)
              .json({ message: "Title must be less than 100 characters" });
          }
        }

        if (description !== undefined && description.length > 2000) {
          return res
            .status(400)
            .json({ message: "Description must be less than 2000 characters" });
        }

        if (assigneeId !== undefined && assigneeId !== null) {
          const isAssigneeMember = task.project.members.some(
            (member: any) => member.userId === assigneeId
          );

          if (!isAssigneeMember) {
            return res.status(400).json({
              message: "Assignee must be a member of this project",
            });
          }
        }

        // Update the task
        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            title: title !== undefined ? title : undefined,
            description: description !== undefined ? description : undefined,
            assigneeId: assigneeId !== undefined ? assigneeId : undefined,
            dueDate:
              dueDate !== undefined
                ? dueDate
                  ? new Date(dueDate)
                  : null
                : undefined,
            priority: priority !== undefined ? priority : undefined,
            status: status !== undefined ? status : undefined,
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        res.status(200).json(updatedTask);
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Failed to update task" });
      }
    })();
  }
);

// DELETE /api/projects/:id/tasks/:taskId - Delete a task
projectsRouter.delete(
  "/:id/tasks/:taskId",
  function (req: Request, res: Response) {
    const { id, taskId } = req.params;
    const { userId } = req.body;

    (async () => {
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
          return res.status(404).json({ message: "Task not found" });
        }

        if (task.projectId !== id) {
          return res
            .status(400)
            .json({ message: "Task does not belong to this project" });
        }

        // user permissions
        const isTaskCreator = task.creatorId === userId;
        const isProjectCreator = task.project.creatorId === userId;

        const userMember = task.project.members.find(
          (member: any) => member.userId === userId
        );

        const userRole = userMember?.role || null;
        const isAdmin = userRole === "ADMIN";

        // Only task creator, project creator, or admins can delete tasks
        if (!isTaskCreator && !isProjectCreator && !isAdmin) {
          return res.status(403).json({
            message: "You don't have permission to delete this task",
          });
        }

        await prisma.task.delete({
          where: { id: taskId },
        });

        res.status(200).json({ message: "Task deleted successfully" });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Failed to delete task" });
      }
    })();
  }
);
