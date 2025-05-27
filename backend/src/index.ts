import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { PrismaClient } from "@prisma/client";

// routes
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

// middleware
import {
  globalRateLimit,
  authRateLimit,
  securityHeaders,
  messageRateLimit,
} from "./middleware/security";
import { sanitizeHtml } from "./middleware/validation";

// Socket.io configuration and handlers
import { createSocketServer } from "./socket/socketConfig";
import { setupSocketHandlers } from "./socket/socketHandler";

// debug utilities
import { debugLog } from "./utils/debug";

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Socket.io server
const io = createSocketServer(server);
setupSocketHandlers(io);

app.set("io", io);

// security middleware
app.use(securityHeaders);
app.use(globalRateLimit);

// CORS configuration
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

// test route
app.get("/", (_, res) => {
  res.send("API is running");
});

// API Routes
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

// Start server
const PORT = parseInt(process.env.PORT || "4000", 10);

server.listen(PORT, "0.0.0.0", () => {
  debugLog(`Server running on port ${PORT}`);
  debugLog(`Socket.io server configured and ready`);
});
