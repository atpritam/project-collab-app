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
