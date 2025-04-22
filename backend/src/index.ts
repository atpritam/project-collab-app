import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import settingsRouter from "./routes/settings";
import dashboardRouter from "./routes/dashboard";
import projectsRouter from "./routes/projects";
import invitationsRouter from "./routes/invitations"; // Import the new router

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (_, res) => {
  res.send("API is running");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/invitations", invitationsRouter);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
