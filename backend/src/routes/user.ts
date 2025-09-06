import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/hash";
import { sendDeleteVerificationEmail, sendSubsEmail } from "../utils/email";
import { canDeleteAccount, canUpdatePassword } from "../utils/permissions";
import { debugError, debugLog } from "../utils/debug";

const prisma = new PrismaClient();
const userRouter: Router = express.Router();

export default userRouter;

// GET /api/user/profile
userRouter.get("/profile", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;

  (async () => {
    try {
      // user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          password: true,
          createdAt: true,
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // user profile info
      const userInfo = await prisma.userInfo.findUnique({
        where: { userId },
      });

      // Count projects user is part of (both created and member of)
      const [createdProjectsCount, memberProjectsCount] = await Promise.all([
        prisma.project.count({
          where: { creatorId: userId },
        }),
        prisma.projectMember.count({
          where: { userId },
        }),
      ]);

      // authentication
      const hasPasswordAuth = user.password !== null;
      const oauthProviders =
        user.accounts.map((account) => account.provider) || [];

      // Removal of sensitive data before sending response
      const { password, ...safeUser } = user;

      res.status(200).json({
        ...safeUser,
        profile: userInfo || {},
        createdProjectsCount: createdProjectsCount,
        memberProjectsCount: memberProjectsCount,
        authType: {
          hasPasswordAuth,
          oauthProviders,
        },
      });
    } catch (error) {
      debugError("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  })();
});

// PUT /api/user/profile/:userId
userRouter.put("/profile/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, bio, jobTitle, department, skills } = req.body;

  try {
    // Update user's name
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    // Upsert user info
    const updatedUserInfo = await prisma.userInfo.upsert({
      where: { userId },
      update: {
        bio,
        jobTitle,
        department,
        skills,
      },
      create: {
        userId,
        bio,
        jobTitle,
        department,
        skills,
      },
    });

    res.status(200).json({
      ...updatedUser,
      profile: updatedUserInfo,
    });
  } catch (error) {
    debugError("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

// POST /api/user/subscribe
userRouter.post("/subscribe", function (req: Request, res: Response) {
  const email = req.body.email;

  (async () => {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    try {
      sendSubsEmail(email);
      res.status(200).json({ message: "Subscription successful" });
    } catch (error) {
      debugError("Error subscribing user:", error);
      res.status(500).json({
        message: "Failed to subscribe user",
      });
    }
  })();
});

// POST /api/user/update-password
userRouter.post("/update-password", function (req: Request, res: Response) {
  const { userId, currentPassword, newPassword } = req.body;
  (async () => {
    try {
      const passwordCheck = await canUpdatePassword(userId, currentPassword);
      if (!passwordCheck.allowed) {
        return res.status(400).json({ message: passwordCheck.reason });
      }

      // hash new password
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      debugError("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  })();
});

// PATCH /api/user/profile-image
userRouter.patch("/profile-image", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;
  const { imageUrl } = req.body;

  (async () => {
    try {
      // Update user's image
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      debugError("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  })();
});

// GET /api/users/byEmail?email=user@example.com
userRouter.get("/byEmail", function (req: Request, res: Response) {
  const email = req.query.email as string;

  (async () => {
    if (!email) {
      return res.status(400).json({ message: "Email parameter is required" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      debugError("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  })();
});

// POST /api/user/send-delete-verification
userRouter.post(
  "/send-delete-verification",
  function (req: Request, res: Response) {
    const { userId, email } = req.body;
    (async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // existing verification code cleanup
        await prisma.deleteAccountToken.deleteMany({
          where: { email: user.email },
        });

        // new verification code
        await prisma.deleteAccountToken.create({
          data: {
            email: user.email,
            code,
            expiresAt,
          },
        });

        // verification email
        try {
          await sendDeleteVerificationEmail(user.email, code);
        } catch (error) {
          console.error("Error sending verification email:", error);
          return res.status(500).json({
            message:
              error instanceof Error
                ? error.message
                : error || "Failed to send verification email",
          });
        }

        res.status(200).json({
          message: "Verification code sent to your email",
          expiresAt,
        });
      } catch (error) {
        debugError("Error sending verification code:", error);
        res.status(500).json({ message: "Failed to send verification code" });
      }
    })();
  }
);

// POST /api/user/verify-delete-code
userRouter.post("/verify-delete-code", function (req: Request, res: Response) {
  const { userId, code } = req.body;
  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const verificationToken = await prisma.deleteAccountToken.findFirst({
        where: {
          email: user.email,
          code,
        },
      });

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // code expiration check
      if (verificationToken.expiresAt < new Date()) {
        return res
          .status(400)
          .json({ message: "Verification code has expired" });
      }

      res.status(200).json({
        message: "Verification code is valid",
        verified: true,
      });
    } catch (error) {
      debugError("Error verifying code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  })();
});

// DELETE /api/user/delete - delete the user account and all associated data
userRouter.delete("/delete", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;
  const { password, verificationCode } = req.body;
  (async () => {
    try {
      const authCheck = await canDeleteAccount(
        userId,
        password,
        verificationCode
      );
      if (!authCheck.authorized) {
        return res.status(401).json({ message: authCheck.reason });
      }

      await prisma.$transaction(async (tx) => {
        // STEP 1: User's files
        await tx.file.deleteMany({
          where: { uploaderId: userId },
        });

        // STEP 2: User's projects
        const userProjects = await tx.project.findMany({
          where: { creatorId: userId },
          include: { members: true },
        });

        for (const project of userProjects) {
          const otherAdmins = project.members.filter(
            (member: any) => member.userId !== userId && member.role === "ADMIN"
          );

          // If there are other admins, transfer ownership to the first one
          if (otherAdmins.length > 0) {
            await tx.project.update({
              where: { id: project.id },
              data: { creatorId: otherAdmins[0].userId },
            });
            debugLog(
              `Project ${project.id} transferred to ${otherAdmins[0].userId}`
            );
          }
          // If there are other members but no admins, promote one member to admin and transfer
          else if (
            project.members.some((member: any) => member.userId !== userId)
          ) {
            const newOwner = project.members.find(
              (member: any) => member.userId !== userId
            );
            if (newOwner) {
              // Update the member's role to ADMIN
              await tx.projectMember.update({
                where: {
                  projectId_userId: {
                    projectId: project.id,
                    userId: newOwner.userId,
                  },
                },
                data: { role: "ADMIN" },
              });

              // Update the project creator
              await tx.project.update({
                where: { id: project.id },
                data: { creatorId: newOwner.userId },
              });
            }
          }
          // If there are no other members, delete the project and all related records
          else {
            await tx.file.deleteMany({
              where: { projectId: project.id },
            });

            await tx.task.deleteMany({
              where: { projectId: project.id },
            });

            await tx.chatMessage.deleteMany({
              where: { projectId: project.id },
            });

            await tx.projectInvitation.deleteMany({
              where: { projectId: project.id },
            });

            await tx.projectMember.deleteMany({
              where: { projectId: project.id },
            });

            // delete the project
            await tx.project.delete({
              where: { id: project.id },
            });
          }
        }

        // STEP 3: User's tasks
        // For tasks where user is creator but not assigned
        await tx.task.updateMany({
          where: {
            creatorId: userId,
            NOT: { assigneeId: userId },
          },
          data: {
            creatorId: undefined,
          },
        });

        const createdTasks = await tx.task.findMany({
          where: { creatorId: userId },
          include: { project: true },
        });

        for (const task of createdTasks) {
          if (task.assigneeId && task.assigneeId !== userId) {
            // If task has another assignee, transfer creation to them
            await tx.task.update({
              where: { id: task.id },
              data: { creatorId: task.assigneeId },
            });
          } else {
            // Otherwise, try to transfer to project creator if not the user
            if (task.project.creatorId !== userId) {
              await tx.task.update({
                where: { id: task.id },
                data: { creatorId: task.project.creatorId },
              });
            } else {
              await tx.task.delete({
                where: { id: task.id },
              });
            }
          }
        }

        // Clear user as assignee from tasks
        await tx.task.updateMany({
          where: { assigneeId: userId },
          data: { assigneeId: null },
        });

        // STEP 4: Chat messages
        await tx.chatMessage.deleteMany({
          where: { userId: userId },
        });

        // STEP 5: Direct messages
        await tx.directMessage.deleteMany({
          where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
        });

        // STEP 6: Project memberships
        await tx.projectMember.deleteMany({
          where: { userId: userId },
        });

        // STEP 7: User settings and info
        await tx.userSettings.deleteMany({
          where: { userId: userId },
        });

        await tx.userInfo.deleteMany({
          where: { userId: userId },
        });

        // STEP 8: Accounts
        await tx.account.deleteMany({
          where: { userId: userId },
        });

        // Clean up verification codes
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (user) {
          await tx.deleteAccountToken.deleteMany({
            where: { email: user.email },
          });
        }

        // Delete the user
        await tx.user.delete({
          where: { id: userId },
        });
      });

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      debugError("Account deletion error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  })();
});
