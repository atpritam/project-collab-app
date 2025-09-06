import express, { Router, Request, Response } from "express";
import { PrismaClient, ProjectStatus } from "@prisma/client";
import crypto from "crypto";
import { sendProjectInvitationEmail } from "../utils/email";
import {
  canManageProject,
  canInviteProjectMembers,
  canManageFile,
  canViewProjectFiles,
  isProjectMember,
  canUpdateMemberRole,
  canRemoveProjectMember,
  canUploadProjectFiles,
  validateProjectRole,
  isExistingProjectMember,
  hasExistingInvitation,
} from "../utils/permissions";
import { canCreateProject, canAddTeamMember } from "../utils/subscription";
import { debugError, debugLog } from "../utils/debug";

const prisma = new PrismaClient();
const projectsRouter: Router = express.Router();

export default projectsRouter;

// POST /api/projects/new - Create a new project
projectsRouter.post("/new", function (req: Request, res: Response) {
  const { name, description, dueDate, creatorId, files } = req.body;

  (async () => {
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    if (!creatorId) {
      return res.status(400).json({ message: "Creator ID is required" });
    }

    // Check subscription limits
    try {
      const limitCheck = await canCreateProject(creatorId);
      if (!limitCheck.canCreate) {
        return res.status(403).json({
          message: "Project limit reached",
          error: "SUBSCRIPTION_LIMIT_EXCEEDED",
          details: {
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            plan: limitCheck.plan,
            upgradeRequired: true
          }
        });
      }
    } catch (error) {
      debugError("Error checking subscription limits:", error);
      return res.status(500).json({ message: "Failed to verify subscription limits" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the project
        const newProject = await tx.project.create({
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

        // file records
        if (files && Array.isArray(files) && files.length > 0) {
          const filePromises = files.map((file: any) =>
            tx.file.create({
              data: {
                name: file.name,
                url: file.url,
                size: file.size,
                type: file.type,
                uploaderId: creatorId,
                projectId: newProject.id,
                taskId: null, // project-level file, not associated with a task
                isTaskDeliverable: false,
              },
            })
          );

          await Promise.all(filePromises);
        }

        return { newProject };
      });

      res.status(201).json(result.newProject);
    } catch (error) {
      debugError("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  })();
});

// GET /api/projects/:id - Get a project by ID
projectsRouter.get("/:id", function (req: Request, res: Response) {
  const { id } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!(await isProjectMember(id, userId))) {
      return res.status(403).json({
        message: "You do not have permission to view this project",
      });
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
      debugError("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  })();
});

// PATCH /api/projects/:id - Update a project
projectsRouter.patch("/:id", function (req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, status, dueDate } = req.body;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      // permission check
      if (!(await canManageProject(id, userId))) {
        return res.status(403).json({
          message: "You do not have permission to update this project",
        });
      }

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
      debugError("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  })();
});

// DELETE /api/projects/:id - Delete a project
projectsRouter.delete("/:id", function (req: Request, res: Response) {
  const { id } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  (async () => {
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    try {
      // permission check
      if (!(await canManageProject(id, userId))) {
        return res.status(403).json({
          message: "You do not have permission to delete this project",
        });
      }

      const deletedProject = await prisma.project.delete({
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
      res.status(200).json(deletedProject);
    } catch (error) {
      debugError("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  })();
});

// POST /api/projects/:id/invite - Invite a user to a project
projectsRouter.post("/:id/invite", function (req: Request, res: Response) {
  const { id } = req.params;
  const { email, role, userId } = req.body;

  (async () => {
    try {
      debugLog(
        `Processing invite request for project ${id}, email: ${email}, role: ${role}`
      );

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      if (!validateProjectRole(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // permission check
      if (!(await canInviteProjectMembers(id, userId))) {
        return res.status(403).json({
          message:
            "You do not have permission to invite members to this project",
        });
      }

      // Check subscription limits for team members
      try {
        const limitCheck = await canAddTeamMember(userId, id);
        if (!limitCheck.canAdd) {
          return res.status(403).json({
            message: "Team member limit reached",
            error: "SUBSCRIPTION_LIMIT_EXCEEDED",
            details: {
              currentCount: limitCheck.currentCount,
              limit: limitCheck.limit,
              plan: limitCheck.plan,
              upgradeRequired: true
            }
          });
        }
      } catch (error) {
        debugError("Error checking subscription limits:", error);
        return res.status(500).json({ message: "Failed to verify subscription limits" });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
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

      const invitedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!invitedUser) {
        return res.status(404).json({
          message: "User with this email does not exist",
        });
      }

      if (await isExistingProjectMember(id, email)) {
        return res.status(400).json({
          message: "This user is already a member of this project",
        });
      }

      if (invitedUser.email === "pritam.amit26@gmail.com") {
        // auto accept invitation for this user
        await prisma.projectMember.create({
          data: {
            userId: invitedUser.id,
            projectId: project.id,
            role,
          },
        });
        return res.status(200).json({
          message: "Member added successfully",
        });
      }

      if (await hasExistingInvitation(id, email)) {
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
      debugError("Error sending project invitation:", error);
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
      debugError("Error fetching project invitations:", error);
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
        debugError("Error cancelling invitation:", error);
        res.status(500).json({ message: "Failed to cancel invitation" });
      }
    })();
  }
);

// GET /api/projects/:id/files - Get all files for a project
projectsRouter.get("/:id/files", function (req: Request, res: Response) {
  const { id } = req.params;
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!(await canViewProjectFiles(id, userId))) {
        return res.status(403).json({
          message: "You do not have permission to view files for this project",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get all project files (not linked to any task)
      const projectFiles = await prisma.file.findMany({
        where: {
          projectId: id,
          taskId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({ projectFiles });
    } catch (error) {
      debugError("Error fetching project files:", error);
      res.status(500).json({ message: "Failed to fetch project files" });
    }
  })();
});

projectsRouter.post("/:id/files/add", function (req: Request, res: Response) {
  const { id } = req.params;
  const { files, userId } = req.body;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!(await canUploadProjectFiles(id, userId))) {
        return res.status(403).json({
          message: "You do not have permission to add files to this project",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (files && Array.isArray(files) && files.length > 0) {
        const filePromises = files.map((file: any) =>
          prisma.file.create({
            data: {
              name: file.name,
              url: file.url,
              size: file.size,
              type: file.type,
              uploaderId: userId,
              projectId: id,
              taskId: null, // project-level file
              isTaskDeliverable: false,
            },
          })
        );

        const createdFiles = await Promise.all(filePromises);

        return res.status(201).json({
          message: "Files added successfully",
          files: createdFiles,
        });
      }

      return res.status(400).json({ message: "No files provided" });
    } catch (error) {
      debugError("Error adding files to project:", error);
      res.status(500).json({ message: "Failed to add files to project" });
    }
  })();
});

// DELETE /api/projects/:id/files/:fileId - Delete a project file
projectsRouter.delete(
  "/:id/files/:fileId",
  function (req: Request, res: Response) {
    const { id: projectId, fileId } = req.params;
    const { userId } = req.body;

    (async () => {
      try {
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const file = await prisma.file.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return res.status(404).json({ message: "File not found" });
        }

        if (file.projectId !== projectId) {
          return res
            .status(400)
            .json({ message: "File does not belong to this project" });
        }

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
        debugError("Error deleting project file:", error);
        res.status(500).json({ message: "Failed to delete file" });
      }
    })();
  }
);

// PATCH /api/projects/:projectId/members/role - Update a member's role
projectsRouter.patch(
  "/:projectId/members/role",
  function (req: Request, res: Response) {
    const { projectId } = req.params;
    const { role } = req.body;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const memberId =
      (req.headers["x-member-id"] as string) || req.body.memberId;

    (async () => {
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      if (!memberId) {
        return res.status(400).json({ message: "Member ID is required" });
      }
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      if (!validateProjectRole(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      try {
        const permissionCheck = await canUpdateMemberRole(
          projectId,
          userId,
          memberId,
          role
        );

        if (!permissionCheck.allowed) {
          return res.status(403).json({
            message: permissionCheck.reason,
          });
        }

        // Update the member's role
        const updatedMember = await prisma.projectMember.update({
          where: { id: memberId },
          data: { role },
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
        });

        res.status(200).json({
          message: "Member role updated successfully",
          member: updatedMember,
        });
      } catch (error) {
        debugError("Error updating member role:", error);
        res.status(500).json({ message: "Failed to update member role" });
      }
    })();
  }
);

// DELETE /api/projects/:projectId/members/remove - Remove a member from a project
projectsRouter.delete(
  "/:projectId/members/remove",
  function (req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const memberId =
      (req.headers["x-member-id"] as string) || req.body.memberId;

    (async () => {
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      if (!memberId) {
        return res.status(400).json({ message: "Member ID is required" });
      }
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      try {
        const permissionCheck = await canRemoveProjectMember(
          projectId,
          userId,
          memberId
        );

        if (!permissionCheck.allowed) {
          return res.status(403).json({
            message: permissionCheck.reason,
          });
        }

        // Delete the member
        await prisma.projectMember.delete({
          where: { id: memberId },
        });

        res.status(200).json({
          message: "Member removed successfully",
        });
      } catch (error) {
        debugError("Error removing project member:", error);
        res.status(500).json({ message: "Failed to remove member" });
      }
    })();
  }
);
