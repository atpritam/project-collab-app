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

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(
  cors({
    origin: [
      "https://project-collab-app.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      "https://project-collab-app.vercel.app",
    ],
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

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/collaborators", collaboratorsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/team-messages", teamMessagesRouter);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  console.log(`Transport: ${socket.conn.transport.name}`);

  socket.conn.on("upgrade", (transport) => {
    console.log(`Transport upgraded to: ${transport.name}`);
  });

  // authentication
  socket.on("authenticate", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated and joined their room`);
    }
  });

  // chat messages
  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, content } = data;

      if (!senderId || !receiverId || !content) {
        console.error("Missing data in send_message event", data);
        return;
      }

      console.log(
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

      console.log("Message successfully processed and emitted");
    } catch (error) {
      console.error("Error handling message via socket:", error);
    }
  });

  // typing status
  socket.on("typing", ({ senderId, receiverId, isTyping }) => {
    if (!senderId || !receiverId) {
      console.error("Missing data in typing event");
      return;
    }

    console.log(
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
      console.error("Missing data in mark_read event");
      return;
    }

    console.log(`Marking messages from ${otherUserId} to ${userId} as read`);

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

      console.log("Messages marked as read");
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // team messages
  socket.on("send_team_message", async (data) => {
    try {
      const { projectId, userId, content } = data;

      if (!projectId || !userId || !content) {
        console.error("Missing data in send_team_message event", data);
        return;
      }

      console.log(
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
        console.error("Project not found", projectId);
        return;
      }

      const isCreator = project.creatorId === userId;
      const isMember = project.members.some(
        (member: any) => member.userId === userId
      );

      if (!isCreator && !isMember) {
        console.error(
          "User is not a member of this project",
          userId,
          projectId
        );
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

      console.log("Team message successfully processed and emitted");
    } catch (error) {
      console.error("Error handling team message via socket:", error);
    }
  });

  socket.on("join_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      console.error("Missing data in join_team_chat event", data);
      return;
    }

    socket.join(`project:${projectId}`);
    console.log(`User ${userId} joined project chat ${projectId}`);
  });

  socket.on("leave_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      console.error("Missing data in leave_team_chat event", data);
      return;
    }

    socket.leave(`project:${projectId}`);
    console.log(`User ${userId} left project chat ${projectId}`);
  });

  socket.emit("welcome", { message: "Connected to Socket.io server" });
});

// Start server
const PORT = parseInt(process.env.PORT || "4000", 10);

// we use server.listen instead of app.listen for using Socket.io
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
