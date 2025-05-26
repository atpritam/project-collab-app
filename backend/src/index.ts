import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import settingsRouter from "./routes/settings";
import dashboardRouter from "./routes/dashboard";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import invitationsRouter from "./routes/invitations";
import calendarRouter from "./routes/calendar";
import collaboratorsRouter from "./routes/collaborators";
import messagesRouter from "./routes/messages";
import teamMessagesRouter from "./routes/teamMessages";
import {
  globalRateLimit,
  authRateLimit,
  securityHeaders,
  messageRateLimit,
} from "./middleware/security";

import { sanitizeHtml } from "./middleware/validation";

import { debugLog, debugError } from "./utils/debug";

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(securityHeaders);
app.use(globalRateLimit);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization
app.use(sanitizeHtml);

app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  pingTimeout: 30000,
  pingInterval: 25000,
});

app.set("io", io);

// Routes
app.get("/", (_, res) => {
  res.send("API is running");
});

app.use("/api/auth", authRateLimit, authRouter);
app.use("/api/user", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/collaborators", collaboratorsRouter);
app.use("/api/messages", messageRateLimit, messagesRouter);
app.use("/api/team-messages", messageRateLimit, teamMessagesRouter);

// Socket.io connection handling
io.on("connection", (socket) => {
  debugLog(`User connected: ${socket.id}`);

  debugLog(`Transport: ${socket.conn.transport.name}`);

  socket.conn.on("upgrade", (transport) => {
    debugLog(`Transport upgraded to: ${transport.name}`);
  });

  // authentication
  socket.on("authenticate", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      debugLog(`User ${userId} authenticated and joined their room`);
    }
  });

  // chat messages
  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, content } = data;

      if (!senderId || !receiverId || !content) {
        debugError("Missing data in send_message event", data);
        return;
      }

      debugLog(
        `Message from ${senderId} to ${receiverId}: ${content.substring(
          0,
          20
        )}...`
      );

      // save to db
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

      // emit to both sender and receiver
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

      debugLog("Message successfully processed and emitted");
    } catch (error) {
      console.error("Error handling message via socket:", error);
    }
  });

  // typing status
  socket.on("typing", ({ senderId, receiverId, isTyping }) => {
    if (!senderId || !receiverId) {
      debugError("Missing data in typing event");
      return;
    }

    debugLog(
      `Typing event: ${senderId} is ${
        isTyping ? "typing" : "not typing"
      } to ${receiverId}`
    );

    io.to(`user:${receiverId}`).emit("user_typing", {
      userId: senderId,
      isTyping,
    });
  });

  socket.on("mark_read", async ({ userId, otherUserId }) => {
    if (!userId || !otherUserId) {
      debugError("Missing data in mark_read event");
      return;
    }

    debugLog(`Marking messages from ${otherUserId} to ${userId} as read`);

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

      io.to(`user:${otherUserId}`).emit("messages_read", {
        userId: userId,
      });

      debugLog("Messages marked as read");
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    debugLog(`User disconnected: ${socket.id}`);
  });

  // team messages
  socket.on("send_team_message", async (data) => {
    try {
      const { projectId, userId, content } = data;

      if (!projectId || !userId || !content) {
        debugError("Missing data in send_team_message event", data);
        return;
      }

      debugLog(
        `Team message from ${userId} to project ${projectId}: ${content.substring(
          0,
          20
        )}...`
      );

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        debugError("Project not found", projectId);
        return;
      }

      const isCreator = project.creatorId === userId;
      const isMember = project.members.some(
        (member: any) => member.userId === userId
      );

      if (!isCreator && !isMember) {
        debugError("User is not a member of this project", userId, projectId);
        return;
      }

      // save to db
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

      const memberIds = project.members.map((member: any) => member.userId);
      if (!memberIds.includes(project.creatorId)) {
        memberIds.push(project.creatorId);
      }

      // emit to all project members
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

      debugLog("Team message successfully processed and emitted");
    } catch (error) {
      console.error("Error handling team message via socket:", error);
    }
  });

  socket.on("join_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      debugError("Missing data in join_team_chat event", data);
      return;
    }

    socket.join(`project:${projectId}`);
    debugLog(`User ${userId} joined project chat ${projectId}`);
  });

  socket.on("leave_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      debugError("Missing data in leave_team_chat event", data);
      return;
    }

    socket.leave(`project:${projectId}`);
    debugLog(`User ${userId} left project chat ${projectId}`);
  });

  socket.emit("welcome", { message: "Connected to Socket.io server" });
});

// Start server
const PORT = parseInt(process.env.PORT || "4000", 10);

// we use server.listen instead of app.listen for using Socket.io
server.listen(PORT, "0.0.0.0", () => {
  debugLog(`Server running on port ${PORT}`);
});
