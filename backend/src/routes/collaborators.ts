import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const collaboratorsRouter: Router = express.Router();

export default collaboratorsRouter;

// GET /api/collaborators/:userId
collaboratorsRouter.get("/:userId", function (req: Request, res: Response) {
  const { userId } = req.params;

  (async () => {
    try {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const projectIds = userProjects.map((p: any) => p.projectId);

      if (projectIds.length === 0) {
        return res.status(200).json({ collaborators: [] });
      }

      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId: { in: projectIds },
          userId: { not: userId },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      const collaboratorMap = new Map();

      projectMembers.forEach((member: any) => {
        const collaboratorId = member.user.id;

        if (!collaboratorMap.has(collaboratorId)) {
          collaboratorMap.set(collaboratorId, {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image,
            projectCount: 0,
            commonProjects: [],
          });
        }

        const collaborator = collaboratorMap.get(collaboratorId);

        const existingProject = collaborator.commonProjects.find(
          (p: any) => p.id === member.project.id
        );

        if (!existingProject) {
          collaborator.projectCount += 1;
          collaborator.commonProjects.push({
            id: member.project.id,
            name: member.project.name,
            role: member.role,
          });
        }
      });

      const collaborators = Array.from(collaboratorMap.values()).sort(
        (a, b) => b.projectCount - a.projectCount
      );

      res.status(200).json({ collaborators });
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  })();
});

collaboratorsRouter.get("/", function (req: Request, res: Response) {
  const { search } = req.query;
  const userId = req.query.userId as string;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      let whereCondition: any = {
        id: { not: userId },
      };

      if (search && typeof search === "string" && search.trim().length > 0) {
        whereCondition.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const users = await prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: 10,
      });

      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const projectIds = userProjects.map((p: any) => p.projectId);

      if (projectIds.length > 0) {
        const projectMembers = await prisma.projectMember.findMany({
          where: {
            projectId: { in: projectIds },
            userId: { not: userId },
          },
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
        });

        const collaboratorMap = new Map();

        projectMembers.forEach((member: any) => {
          const collaboratorId = member.user.id;

          if (!collaboratorMap.has(collaboratorId)) {
            collaboratorMap.set(collaboratorId, {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              image: member.user.image,
              projectCount: 0,
              commonProjects: [],
            });
          }

          const collaborator = collaboratorMap.get(collaboratorId);

          const existingProject = collaborator.commonProjects.find(
            (p: any) => p.id === member.projectId
          );

          if (!existingProject) {
            collaborator.projectCount += 1;
            collaborator.commonProjects.push({
              id: member.projectId,
              role: member.role,
            });
          }
        });
        const collaborators = Array.from(collaboratorMap.values());

        const collaboratorIds = new Set(collaborators.map((c: any) => c.id));
        const otherUsers = users.filter(
          (user) => !collaboratorIds.has(user.id)
        );
        const allUsers = [...collaborators, ...otherUsers];

        if (search && typeof search === "string" && search.trim().length > 0) {
          const searchLower = search.toLowerCase();
          return res.status(200).json({
            collaborators: allUsers
              .filter(
                (user) =>
                  user.name?.toLowerCase().includes(searchLower) ||
                  user.email.toLowerCase().includes(searchLower)
              )
              .sort((a, b) => {
                const aNameMatch = a.name?.toLowerCase().startsWith(searchLower)
                  ? 2
                  : a.name?.toLowerCase().includes(searchLower)
                  ? 1
                  : 0;
                const bNameMatch = b.name?.toLowerCase().startsWith(searchLower)
                  ? 2
                  : b.name?.toLowerCase().includes(searchLower)
                  ? 1
                  : 0;

                if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;

                const aEmailMatch = a.email
                  .toLowerCase()
                  .startsWith(searchLower)
                  ? 2
                  : a.email.toLowerCase().includes(searchLower)
                  ? 1
                  : 0;
                const bEmailMatch = b.email
                  .toLowerCase()
                  .startsWith(searchLower)
                  ? 2
                  : b.email.toLowerCase().includes(searchLower)
                  ? 1
                  : 0;

                if (aEmailMatch !== bEmailMatch)
                  return bEmailMatch - aEmailMatch;
                return (b.projectCount || 0) - (a.projectCount || 0);
              })
              .slice(0, 10),
          });
        }

        return res.status(200).json({ collaborators: allUsers.slice(0, 10) });
      } else {
        return res.status(200).json({ collaborators: users });
      }
    } catch (error) {
      console.error("Error searching collaborators:", error);
      res.status(500).json({ message: "Failed to search collaborators" });
    }
  })();
});
