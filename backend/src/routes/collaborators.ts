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

      const projectIds = userProjects.map((p) => p.projectId);

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

      projectMembers.forEach((member) => {
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
