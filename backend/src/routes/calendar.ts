import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const calendarRouter: Router = express.Router();

export default calendarRouter;

// GET /api/calendar/events/all - Get all calendar events for a user
calendarRouter.get("/events/all", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { startDate, endDate } = req.query;

  try {
    const dateFilter: any = {};

    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }

    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get all projects where the user is a member
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ creatorId: userId }, { members: { some: { userId } } }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true,
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,
            priority: true,
            assigneeId: true,
            assignee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          where:
            dateFilter.gte || dateFilter.lte
              ? {
                  dueDate: dateFilter,
                }
              : undefined,
        },
      },
    });

    // Get all tasks directly assigned to the user
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        ...(dateFilter.gte || dateFilter.lte ? { dueDate: dateFilter } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // data format for gantt chart and calendar
    const projectEvents = projects.map((project: any) => ({
      id: `project-${project.id}`,
      title: project.name,
      type: "project",
      start: project.createdAt,
      end: project.dueDate || null,
      status: project.status,
      description: project.description,
      resourceId: "projects",
      tasks: project.tasks.map((task: any) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: "task",
        start: project.createdAt,
        end: task.dueDate || null,
        parentId: `project-${project.id}`,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        description: task.description,
        resourceId: task.assigneeId || "unassigned",
      })),
    }));

    const resources = [
      { id: "projects", title: "Projects", color: "#7c3aed" },
      { id: "unassigned", title: "Unassigned", color: "#6b7280" },
      ...projects.flatMap((project: any) =>
        project.tasks
          .filter((task: any) => task.assigneeId)
          .map((task: any) => ({
            id: task.assigneeId!,
            title: task.assignee?.name || "Unknown",
            imageUrl: task.assignee?.image || null,
          }))
      ),
    ].filter(
      (resource, index, self) =>
        // Remove duplicates by id
        index === self.findIndex((r) => r.id === resource.id)
    );

    const calendarEvents = [
      // Project start dates
      ...projects.map((project: any) => ({
        id: `project-start-${project.id}`,
        title: `${project.name} (Start)`,
        start: project.createdAt,
        allDay: true,
        type: "project-start",
        projectId: project.id,
        color: "#7c3aed",
      })),

      // Project due dates
      ...projects
        .filter((project: any) => project.dueDate)
        .map((project: any) => ({
          id: `project-due-${project.id}`,
          title: `${project.name} (Due)`,
          start: project.dueDate!,
          allDay: true,
          type: "project-due",
          projectId: project.id,
          color: "#dc2626",
        })),

      // Task due dates
      ...assignedTasks
        .filter((task: any) => task.dueDate)
        .map((task: any) => ({
          id: `task-due-${task.id}`,
          title: `Task Due: ${task.title}`,
          start: task.dueDate!,
          allDay: true,
          type: "task-due",
          taskId: task.id,
          projectId: task.project.id,
          color: task.status === "DONE" ? "#22c55e" : "#f59e0b",
        })),
    ];

    res.status(200).json({
      gantt: {
        projects: projectEvents,
        resources,
      },
      calendar: calendarEvents,
    });
  } catch (error) {
    debugError("Error fetching calendar data:", error);
    res.status(500).json({ message: "Failed to fetch calendar data" });
  }
});

// GET /api/calendar/deadlines - Get upcoming deadlines for a user
calendarRouter.get("/deadlines", async (req: Request, res: Response) => {
  const userId =
    (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const { days = "7" } = req.query;

  const daysAhead = parseInt(days as string);

  try {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
        dueDate: {
          gte: today,
          lte: endDate,
        },
        status: {
          not: "DONE",
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // project deadlines
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ creatorId: userId }, { members: { some: { userId } } }],
        dueDate: {
          gte: today,
          lte: endDate,
        },
        status: {
          not: "COMPLETED",
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        dueDate: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Combine and sort by date
    const deadlines = [
      ...tasks.map((task: any) => ({
        id: `task-${task.id}`,
        title: task.title,
        dueDate: task.dueDate,
        type: "task",
        priority: task.priority,
        project: {
          id: task.project.id,
          name: task.project.name,
        },
        assignee: task.assignee,
      })),
      ...projects.map((project: any) => ({
        id: `project-${project.id}`,
        title: project.name,
        dueDate: project.dueDate,
        type: "project",
        project: {
          id: project.id,
          name: project.name,
        },
        description: project.description,
      })),
    ].sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );

    res.status(200).json(deadlines);
  } catch (error) {
    debugError("Error fetching deadlines:", error);
    res.status(500).json({ message: "Failed to fetch deadline data" });
  }
});
