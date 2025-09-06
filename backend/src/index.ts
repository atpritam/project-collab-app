import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
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
import subscriptionRouter from "./routes/subscriptions";
import { 
  handleSubscriptionCreated, 
  handleSubscriptionUpdated, 
  handleSubscriptionDeleted,
  stripe
} from "./utils/subscription";
import { debugError } from "./utils/debug";

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

// Stripe webhook route (must be before JSON parsing middleware)
app.post("/api/subscriptions/webhook", express.raw({ type: 'application/json' }), function (req: any, res: any) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  (async () => {
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret');
      res.status(500).json({ message: 'Webhook secret not configured' });
      return;
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).json({ message: 'Invalid signature' });
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      debugError("Error handling webhook:", error);
      res.status(500).json({ message: "Webhook handling failed" });
    }
  })();
});

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
app.use("/api/subscriptions", subscriptionRouter);

// Start server
const PORT = parseInt(process.env.PORT || "4000", 10);

server.listen(PORT, "0.0.0.0", () => {
  debugLog(`Server running on port ${PORT}`);
  debugLog(`Socket.io server configured and ready`);
});
