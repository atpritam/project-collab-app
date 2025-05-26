import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const teamMessagesRouter: Router = express.Router();

export default teamMessagesRouter;

// GET /api/team-messages/projects/:userId - Get all projects the user is a member of
teamMessagesRouter.get(
  "/projects/:userId",
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const projects = await prisma.project.findMany({
        where: {
          OR: [{ creatorId: userId }, { members: { some: { userId } } }],
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

          chatMessages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const teamConversations = projects.map((project: any) => {
        const lastMessage = project.chatMessages[0];

        return {
          projectId: project.id,
          isTeamChat: true,
          name: project.name,
          description: project.description,
          creator: project.creator.name,
          image: null,
          memberCount: project.members.length,
          lastMessageAt: lastMessage
            ? lastMessage.createdAt
            : project.updatedAt,
          lastMessageContent: lastMessage
            ? lastMessage.content
            : "No messages yet",
          lastMessageSender: lastMessage ? lastMessage.user : null,
          unreadCount: 0,
        };
      });

      res.status(200).json(teamConversations);
    } catch (error) {
      debugError("Error fetching team conversations:", error);
      res.status(500).json({ message: "Failed to fetch team conversations" });
    }
  }
);

// GET /api/team-messages/project/:projectId - Get all messages for a project
teamMessagesRouter.get(
  "/project/:projectId",
  function (req: Request, res: Response) {
    const { projectId } = req.params;
    (async () => {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });

        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        // Get all messages for this project
        const messages = await prisma.chatMessage.findMany({
          where: {
            projectId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        res.status(200).json(messages);
      } catch (error) {
        debugError("Error fetching project messages:", error);
        res.status(500).json({ message: "Failed to fetch project messages" });
      }
    })();
  }
);

// POST /api/team-messages/send - Send a message to a project team
teamMessagesRouter.post("/send", function (req: Request, res: Response) {
  const { projectId, userId, content } = req.body;

  (async () => {
    if (!projectId || !userId || !content) {
      return res
        .status(400)
        .json({ message: "Project ID, user ID, and content are required" });
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // membership check
      const isCreator = project.creatorId === userId;
      const isMember = project.members.some(
        (member: any) => member.userId === userId
      );

      if (!isCreator && !isMember) {
        return res
          .status(403)
          .json({ message: "User is not a member of this project" });
      }

      // new message creation
      const message = await prisma.chatMessage.create({
        data: {
          content,
          projectId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const io = req.app.get("io");
      if (io) {
        // Emit to all project members
        const memberIds = project.members.map((member: any) => member.userId);
        if (!memberIds.includes(project.creatorId)) {
          memberIds.push(project.creatorId);
        }

        memberIds.forEach((memberId: any) => {
          io.to(`user:${memberId}`).emit("new_team_message", {
            message,
            projectId,
          });

          io.to(`user:${memberId}`).emit("team_conversation_update", {
            projectId,
            lastMessageAt: message.createdAt,
            lastMessageContent: message.content,
            lastMessageSender: message.user,
            isUnread: memberId !== userId,
          });
        });
      }

      res.status(201).json(message);
    } catch (error) {
      debugError("Error sending team message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  })();
});
