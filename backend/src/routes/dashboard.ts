import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dashboardRouter: Router = express.Router();

export default dashboardRouter;

// GET /api/dashboard/projects
dashboardRouter.get(
  "/projects/:userId",
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      // projects where user is the creator or a member
      const projects = await prisma.project.findMany({
        where: {
          OR: [{ creatorId: userId }, { members: { some: { userId } } }],
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          members: {
            select: {
              userId: true,
              user: { select: { name: true, image: true } },
            },
          },
          _count: { select: { tasks: true } },
          tasks: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6, // 6 recent projects
      });

      // completion percentage for each project
      const projectsWithStats = projects.map((project: any) => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(
          (task: any) => task.status === "DONE"
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const { tasks, ...projectWithoutTasks } = project;

        return {
          ...projectWithoutTasks,
          memberCount: project.members.length,
          taskCount: totalTasks,
          completedTaskCount: completedTasks,
          completionPercentage,
        };
      });

      res.status(200).json(projectsWithStats);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  }
);

// GET /api/dashboard/tasks
dashboardRouter.get("/tasks/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // tasks assigned to the user
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
      },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 6, // 6 tasks
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET /api/dashboard/activity
dashboardRouter.get(
  "/activity/:userId",
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      // projects the user is part of
      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const projectIds = userProjects.map((p) => p.projectId);

      // Activity from chat messages
      const chatMessages = await prisma.chatMessage.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          user: { select: { id: true, name: true, image: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Activity from task comments
      const taskComments = await prisma.taskComment.findMany({
        where: {
          task: {
            projectId: { in: projectIds },
          },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const activities = [
        ...chatMessages.map((msg: any) => ({
          type: "CHAT_MESSAGE",
          id: msg.id,
          content: msg.content,
          projectId: msg.projectId,
          projectName: msg.project.name,
          userId: msg.userId,
          userName: msg.user.name,
          userImage: msg.user.image,
          createdAt: msg.createdAt,
          entityId: null,
          entityTitle: null,
        })),
        ...taskComments.map((comment: any) => ({
          type: "TASK_COMMENT",
          id: comment.id,
          content: comment.content,
          projectId: comment.task.projectId,
          projectName: comment.task.project.name,
          userId: comment.userId,
          userName: comment.user.name,
          userImage: comment.user.image,
          createdAt: comment.createdAt,
          entityId: comment.task.id,
          entityTitle: comment.task.title,
        })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10); // 10 most recent activities

      res.status(200).json(activities);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  }
);
