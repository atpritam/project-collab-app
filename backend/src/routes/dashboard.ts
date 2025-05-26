import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const dashboardRouter: Router = express.Router();

export default dashboardRouter;

// GET /api/dashboard/projects
dashboardRouter.get("/projects", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { limit } = req.query;

  try {
    const whereCondition = {
      OR: [{ creatorId: userId }, { members: { some: { userId } } }],
    };

    // projects the user is part of
    const totalProjectCount = await prisma.project.count({
      where: whereCondition,
    });

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        members: {
          select: {
            userId: true,
            user: {
              select: { id: true, name: true, image: true, email: true },
            },
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
      take:
        typeof limit === "string" && !isNaN(parseInt(limit))
          ? parseInt(limit) // optional limit
          : undefined,
    });

    // project stats
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

    res.status(200).json({
      total: totalProjectCount,
      projects: projectsWithStats,
    });
  } catch (error) {
    debugError("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// GET /api/dashboard/activity
dashboardRouter.get("/activity", function (req: Request, res: Response) {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);

  (async () => {
    try {
      // projects the user is part of
      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const createdProjects = await prisma.project.findMany({
        where: { creatorId: userId },
        select: { id: true },
      });

      const allProjectIds = [
        ...userProjects.map((p) => p.projectId),
        ...createdProjects.map((p) => p.id),
      ];
      const uniqueProjectIds = [...new Set(allProjectIds)];

      if (uniqueProjectIds.length === 0) {
        return res.status(200).json([]);
      }

      // recent project creations
      const projectCreations = await prisma.project.findMany({
        where: {
          id: { in: uniqueProjectIds },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          id: true,
          name: true,
          creatorId: true,
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // recent project member additions
      const memberAdditions = await prisma.projectMember.findMany({
        where: {
          projectId: { in: uniqueProjectIds },
          joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              creatorId: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 10,
      });

      // recent task creations
      const taskCreations = await prisma.task.findMany({
        where: {
          projectId: { in: uniqueProjectIds },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          creatorId: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // recently completed tasks
      const completedTasks = await prisma.task.findMany({
        where: {
          projectId: { in: uniqueProjectIds },
          status: "DONE",
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          assigneeId: true,
          updatedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });

      const taskUpdates = await prisma.task.findMany({
        where: {
          projectId: { in: uniqueProjectIds },
          status: { not: "DONE" },
          updatedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Last 14 days
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          assigneeId: true,
          status: true,
          updatedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });

      const activities = [
        // Project creations
        ...projectCreations
          .filter((p: any) => p.creatorId === userId) // Only show projects created by this user
          .map((project: any) => ({
            id: `project-created-${project.id}`,
            type: "PROJECT_CREATED",
            projectId: project.id,
            projectName: project.name,
            userId: project.creatorId,
            userName: project.creator.name,
            userImage: project.creator.image,
            userEmail: project.creator.email,
            createdAt: project.createdAt,
          })),

        // Member additions
        ...memberAdditions
          .filter(
            (m: any) => m.user.id === userId || m.project.creatorId === userId
          )
          .map((member: any) => ({
            id: `member-added-${member.projectId}-${member.userId}`,
            type: "MEMBER_ADDED",
            projectId: member.projectId,
            projectName: member.project.name,
            userId: member.project.creatorId,
            userName: member.project.creator.name,
            userImage: member.project.creator.image,
            userEmail: member.project.creator.email,
            createdAt: member.joinedAt,
            targetUser: member.user,
            details: {
              role: member.role,
            },
          })),

        // Task creations
        ...taskCreations
          .filter((t: any) => t.creatorId === userId || t.creatorId === userId)
          .map((task: any) => ({
            id: `task-created-${task.id}`,
            type: "TASK_CREATED",
            projectId: task.projectId,
            projectName: task.project.name,
            userId: task.creatorId,
            userName: task.creator.name,
            userImage: task.creator.image,
            userEmail: task.creator.email,
            createdAt: task.createdAt,
            entityId: task.id,
            entityTitle: task.title,
          })),

        // Task completions
        ...completedTasks
          .filter((t: any) => t.assigneeId === userId)
          .map((task: any) => ({
            id: `task-completed-${task.id}`,
            type: "TASK_COMPLETED",
            projectId: task.projectId,
            projectName: task.project.name,
            userId: task.assigneeId || "",
            userName: task.assignee?.name || "Unknown",
            userImage: task.assignee?.image || null,
            userEmail: task.assignee?.email || "",
            createdAt: task.updatedAt,
            entityId: task.id,
            entityTitle: task.title,
          })),

        // Task updates
        ...taskUpdates
          .filter((t: any) => t.assigneeId === userId) // Only show tasks assigned to this user
          .map((task: any) => ({
            id: `task-updated-${task.id}-${task.updatedAt.getTime()}`,
            type: "TASK_UPDATED",
            projectId: task.projectId,
            projectName: task.project.name,
            userId: task.assigneeId || "",
            userName: task.assignee?.name || "Unknown",
            userImage: task.assignee?.image || null,
            userEmail: task.assignee?.email || "",
            createdAt: task.updatedAt,
            entityId: task.id,
            entityTitle: task.title,
            details: {
              newStatus: task.status,
            },
          })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10); // 10 most recent activities

      res.status(200).json(activities);
    } catch (error) {
      debugError("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  })();
});
