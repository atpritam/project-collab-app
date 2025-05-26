import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { isTokenExpired } from "../utils/token";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const invitationsRouter: Router = express.Router();

export default invitationsRouter;

// GET /api/invitations/pending - Get all pending invitations for a user
invitationsRouter.get("/pending", function (req: Request, res: Response) {
  const email = req.query.email as string;

  (async () => {
    try {
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const pendingInvitations = await prisma.projectInvitation.findMany({
        where: {
          email,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedInvitations = pendingInvitations.map(
        (invitation: any) => ({
          id: invitation.id,
          projectId: invitation.projectId,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          projectName: invitation.project.name,
          inviterName: invitation.project.creator.name || "A team member",
        })
      );

      res.status(200).json(formattedInvitations);
    } catch (error) {
      debugError("Error fetching pending invitations:", error);
      res.status(500).json({ message: "Failed to fetch pending invitations" });
    }
  })();
});

// POST /api/invitations/accept - Accept an invitation
invitationsRouter.post("/accept", function (req: Request, res: Response) {
  const { invitationId, userId } = req.body;

  (async () => {
    try {
      if (!invitationId) {
        return res.status(400).json({ message: "Invitation ID is required" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const invitation = await prisma.projectInvitation.findUnique({
        where: { id: invitationId },
        include: {
          project: true,
        },
      });

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // invitation expiration check
      if (isTokenExpired(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.email !== invitation.email) {
        return res.status(403).json({
          message: "This invitation was not sent to your email address",
        });
      }

      const existingMember = await prisma.projectMember.findFirst({
        where: {
          projectId: invitation.projectId,
          userId,
        },
      });

      if (existingMember) {
        await prisma.projectInvitation.delete({
          where: { id: invitationId },
        });

        return res.status(400).json({
          message: "You are already a member of this project",
          projectId: invitation.projectId,
        });
      }

      const result = await prisma.$transaction(async (prisma) => {
        const projectMember = await prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId,
            role: invitation.role,
          },
        });

        await prisma.projectInvitation.delete({
          where: { id: invitationId },
        });

        return { projectMember };
      });

      res.status(200).json({
        message: "Successfully joined the project",
        projectId: invitation.projectId,
        projectName: invitation.project.name,
        role: invitation.role,
      });
    } catch (error) {
      debugError("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  })();
});

// POST /api/invitations/decline - Decline an invitation
invitationsRouter.post("/decline", function (req: Request, res: Response) {
  const { invitationId, userId } = req.body;

  (async () => {
    try {
      if (!invitationId) {
        return res.status(400).json({ message: "Invitation ID is required" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const invitation = await prisma.projectInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.email !== invitation.email) {
        return res.status(403).json({
          message: "This invitation was not sent to your email address",
        });
      }

      await prisma.projectInvitation.delete({
        where: { id: invitationId },
      });

      res.status(200).json({ message: "Invitation declined successfully" });
    } catch (error) {
      debugError("Error declining invitation:", error);
      res.status(500).json({ message: "Failed to decline invitation" });
    }
  })();
});

// GET /api/invitations/token/:token - Validate an invitation token
invitationsRouter.get("/token/:token", function (req: Request, res: Response) {
  const { token } = req.params;

  (async () => {
    try {
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const invitation = await prisma.projectInvitation.findFirst({
        where: { token },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (isTokenExpired(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      res.status(200).json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        projectId: invitation.projectId,
        projectName: invitation.project.name,
        inviterName: invitation.project.creator.name || "A team member",
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      debugError("Error validating invitation token:", error);
      res.status(500).json({ message: "Failed to validate invitation token" });
    }
  })();
});
