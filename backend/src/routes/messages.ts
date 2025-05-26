import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { validate, messageValidation } from "../middleware/validation";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const messagesRouter: Router = express.Router();

export default messagesRouter;

// GET /api/messages/conversations - Get all conversations for a user
messagesRouter.get("/conversations", async (req: Request, res: Response) => {
  const userId = req.headers["x-user-id"] as string;
  try {
    const sentMessages = await prisma.directMessage.findMany({
      where: {
        senderId: userId,
      },
      select: {
        receiverId: true,
        content: true,
        createdAt: true,
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const receivedMessages = await prisma.directMessage.findMany({
      where: {
        receiverId: userId,
      },
      select: {
        senderId: true,
        content: true,
        createdAt: true,
        read: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const unreadCounts = await prisma.directMessage.groupBy({
      by: ["senderId"],
      where: {
        receiverId: userId,
        read: false,
      },
      _count: {
        id: true,
      },
    });

    const unreadCountMap = new Map();
    unreadCounts.forEach((count: any) => {
      unreadCountMap.set(count.senderId, count._count.id);
    });

    const userMap = new Map();
    const latestMessageMap = new Map();
    sentMessages.forEach((message: any) => {
      if (!userMap.has(message.receiverId)) {
        userMap.set(message.receiverId, message.receiver);
        latestMessageMap.set(message.receiverId, {
          content: message.content,
          createdAt: message.createdAt,
        });
      } else if (
        message.createdAt > latestMessageMap.get(message.receiverId).createdAt
      ) {
        latestMessageMap.set(message.receiverId, {
          content: message.content,
          createdAt: message.createdAt,
        });
      }
    });

    receivedMessages.forEach((message: any) => {
      if (!userMap.has(message.senderId)) {
        userMap.set(message.senderId, message.sender);
        latestMessageMap.set(message.senderId, {
          content: message.content,
          createdAt: message.createdAt,
        });
      } else if (
        message.createdAt > latestMessageMap.get(message.senderId).createdAt
      ) {
        latestMessageMap.set(message.senderId, {
          content: message.content,
          createdAt: message.createdAt,
        });
      }
    });

    const conversations = Array.from(userMap.entries()).map(
      ([userId, user]) => {
        const latestMessage = latestMessageMap.get(userId);
        return {
          userId,
          user,
          lastMessageAt: latestMessage.createdAt,
          lastMessageContent: latestMessage.content,
          unreadCount: unreadCountMap.get(userId) || 0,
        };
      }
    );
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    res.status(200).json(conversations);
  } catch (error) {
    debugError("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// GET /api/messages/direct - Get conversation between two users
messagesRouter.get("/direct", async (req: Request, res: Response) => {
  const userId = req.headers["x-user-id"] as string;
  const otherUserId = req.headers["x-other-user-id"] as string;

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
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

    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // we notify the other user that their messages have been read via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${otherUserId}`).emit("messages_read", {
        userId: userId,
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    debugError("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// POST /api/messages/send - Send a message
messagesRouter.post(
  "/send",
  validate(messageValidation.send) as express.RequestHandler,
  function (req: Request, res: Response) {
    const { senderId, receiverId, content } = req.body;

    (async () => {
      try {
        if (!senderId || !receiverId || !content) {
          return res
            .status(400)
            .json({ message: "Sender, receiver, and content are required" });
        }

        const [sender, receiver] = await Promise.all([
          prisma.user.findUnique({ where: { id: senderId } }),
          prisma.user.findUnique({ where: { id: receiverId } }),
        ]);

        if (!sender || !receiver) {
          return res
            .status(404)
            .json({ message: "Sender or receiver not found" });
        }

        const message = await prisma.directMessage.create({
          data: {
            content,
            senderId,
            receiverId,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        // Socket.io to notify clients
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${senderId}`)
            .to(`user:${receiverId}`)
            .emit("new_message", message);

          io.to(`user:${receiverId}`).emit("conversation_update", {
            userId: senderId,
            lastMessageAt: message.createdAt,
            lastMessageContent: message.content,
            isUnread: true,
          });

          io.to(`user:${senderId}`).emit("conversation_update", {
            userId: receiverId,
            lastMessageAt: message.createdAt,
            lastMessageContent: message.content,
            isUnread: false,
          });
        }

        res.status(201).json(message);
      } catch (error) {
        debugError("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    })();
  }
);

// GET /api/messages/unread - Get count of unread messages
messagesRouter.get("/unread", async (req: Request, res: Response) => {
  const userId = req.headers["x-user-id"] as string;

  try {
    const unreadCount = await prisma.directMessage.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    const unreadBySender = await prisma.directMessage.groupBy({
      by: ["senderId"],
      where: {
        receiverId: userId,
        read: false,
      },
      _count: {
        id: true,
      },
    });

    res.status(200).json({
      unreadCount,
      unreadBySender: unreadBySender.map((item: any) => ({
        senderId: item.senderId,
        count: item._count.id,
      })),
    });
  } catch (error) {
    debugError("Error counting unread messages:", error);
    res.status(500).json({ message: "Failed to count unread messages" });
  }
});

// PATCH /api/messages/mark-read/:userId/:otherUserId - Mark messages as read
messagesRouter.patch("/mark-read", async (req: Request, res: Response) => {
  const userId = req.headers["x-user-id"] as string;
  const otherUserId = req.headers["x-other-user-id"] as string;

  try {
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // we notify the other user that their messages have been read via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${otherUserId}`).emit("messages_read", {
        userId: userId,
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    debugError("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});
