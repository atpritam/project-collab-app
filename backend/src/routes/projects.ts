import express, { Router, Request, Response } from "express";
import { PrismaClient, ProjectStatus } from "@prisma/client";
import crypto from "crypto";
import { sendProjectInvitationEmail } from "../utils/email";

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

// GET /api/projects/:id/tasks - Get all tasks for a project
projectsRouter.get("/:id/tasks", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
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
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
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

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is authorized to create tasks (Admin or Editor only)
      const isCreator = project.creatorId === creatorId;
      const userMember = project.members.find(
        (member: any) => member.userId === creatorId
      );

      const isAdmin = isCreator || userMember?.role === "ADMIN";
      const isEditor = userMember?.role === "EDITOR";

      if (!isAdmin && !isEditor) {
        return res.status(403).json({
          message: "Only project admins and editors can create tasks",
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
        const isEditor = userRole === "EDITOR";

        // Check if task was created by a project admin
        const taskCreatorMember = task.project.members.find(
          (member: any) => member.userId === task.creatorId
        );
        const isTaskCreatorAdmin =
          taskCreatorMember?.role === "ADMIN" ||
          task.creatorId === task.project.creatorId;

        if (
          !isTaskCreator &&
          !isProjectCreator &&
          !isAdmin &&
          !(isEditor && !isTaskCreatorAdmin)
        ) {
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

// POST /api/projects/:id/invite - Invite a user to a project
projectsRouter.post("/:id/invite", function (req: Request, res: Response) {
  const { id } = req.params;
  const { email, role, userId } = req.body;

  (async () => {
    try {
      console.log(
        `Processing invite request for project ${id}, email: ${email}, role: ${role}`
      );

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      if (!["ADMIN", "EDITOR", "MEMBER"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // user permission check (project creator or admin)
      const isCreator = project.creatorId === userId;
      const isAdmin = project.members.some(
        (member: any) => member.userId === userId && member.role === "ADMIN"
      );

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          message:
            "You do not have permission to invite members to this project",
        });
      }

      const invitedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!invitedUser) {
        return res.status(404).json({
          message: "User with this email does not exist",
        });
      }

      const isAlreadyMember = project.members.some(
        (member: any) => member.user.email === email
      );

      if (isAlreadyMember) {
        return res.status(400).json({
          message: "This user is already a member of this project",
        });
      }

      const existingInvitation = await prisma.projectInvitation.findFirst({
        where: {
          projectId: id,
          email,
        },
      });

      if (existingInvitation) {
        return res.status(400).json({
          message: "An invitation has already been sent to this email",
        });
      }

      // invitation token creation, expiry (24 hours)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const invitation = await prisma.projectInvitation.create({
        data: {
          projectId: id,
          email,
          role,
          token,
          expiresAt,
        },
      });

      // invitation email
      await sendProjectInvitationEmail(
        email,
        token,
        project.name,
        project.creator.name || "A team member"
      );

      res.status(201).json({
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error("Error sending project invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  })();
});

// GET /api/projects/:id/invitations - Get all invitations for a project
projectsRouter.get("/:id/invitations", function (req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.body.userId;

  (async () => {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // user permission (project creator or admin)
      const isCreator = project.creatorId === userId;
      const isAdmin = project.members.some(
        (member: any) => member.userId === userId && member.role === "ADMIN"
      );

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          message: "You do not have permission to view project invitations",
        });
      }

      // all invitations for the project
      const invitations = await prisma.projectInvitation.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json(invitations);
    } catch (error) {
      console.error("Error fetching project invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  })();
});

// DELETE /api/projects/:id/invitations/:invitationId - Cancel an invitation
projectsRouter.delete(
  "/:id/invitations/:invitationId",
  function (req: Request, res: Response) {
    const { id, invitationId } = req.params;
    const userId = req.body.userId;

    (async () => {
      try {
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

        // user permission (project creator or admin)
        const isCreator = project.creatorId === userId;
        const isAdmin = project.members.some(
          (member: any) => member.userId === userId && member.role === "ADMIN"
        );

        if (!isCreator && !isAdmin) {
          return res.status(403).json({
            message: "You do not have permission to cancel invitations",
          });
        }

        const invitation = await prisma.projectInvitation.findUnique({
          where: { id: invitationId },
        });

        if (!invitation || invitation.projectId !== id) {
          return res.status(404).json({ message: "Invitation not found" });
        }

        await prisma.projectInvitation.delete({
          where: { id: invitationId },
        });

        res.status(200).json({ message: "Invitation cancelled successfully" });
      } catch (error) {
        console.error("Error cancelling invitation:", error);
        res.status(500).json({ message: "Failed to cancel invitation" });
      }
    })();
  }
);
