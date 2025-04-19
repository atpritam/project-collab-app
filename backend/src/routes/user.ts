import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/hash";
import { sendDeleteVerificationEmail } from "../utils/email";

const prisma = new PrismaClient();
const userRouter: Router = express.Router();

export default userRouter;

// GET /api/user/profile/:userId
userRouter.get("/profile/:userId", function (req: Request, res: Response) {
  const { userId } = req.params;
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

      // authentication
      const hasPasswordAuth = user.password !== null;
      const oauthProviders =
        user.accounts.map((account) => account.provider) || [];

      // Removal of sensitive data before sending response
      const { password, ...safeUser } = user;

      res.status(200).json({
        ...safeUser,
        profile: userInfo || {},
        authType: {
          hasPasswordAuth,
          oauthProviders,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

// POST /api/user/update-password
userRouter.post("/update-password", function (req: Request, res: Response) {
  const { userId, currentPassword, newPassword } = req.body;
  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.password) {
        return res.status(400).json({
          message: "Cannot update password for accounts that use social login",
        });
      }

      // verification
      const isValidPassword = await verifyPassword(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // hash new password
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  })();
});

// PATCH /api/user/profile-image/:userId
userRouter.patch(
  "/profile-image/:userId",
  function (req: Request, res: Response) {
    const { userId } = req.params;
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
        console.error("Error updating profile image:", error);
        res.status(500).json({ message: "Failed to update profile image" });
      }
    })();
  }
);

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
      console.error("Error fetching user:", err);
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
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
        await sendDeleteVerificationEmail(user.email, code);

        res.status(200).json({
          message: "Verification code sent to your email",
          expiresAt,
        });
      } catch (error) {
        console.error("Error sending verification code:", error);
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
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  })();
});

// DELETE /api/user/:userId
userRouter.delete("/:userId", function (req: Request, res: Response) {
  const { userId } = req.params;
  const { password, verificationCode } = req.body;
  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let isAuthorized = false;

      // If password is provided
      if (password && user.password) {
        const isValidPassword = await verifyPassword(password, user.password);
        if (isValidPassword) {
          isAuthorized = true;
          console.log("User authorized via password");
        }
      }

      // If verification code is provided
      if (verificationCode && !isAuthorized) {
        const verificationToken = await prisma.deleteAccountToken.findFirst({
          where: {
            email: user.email,
            code: verificationCode,
          },
        });

        if (verificationToken && verificationToken.expiresAt > new Date()) {
          isAuthorized = true;
          console.log("User authorized via verification code");

          // verification code cleanup
          await prisma.deleteAccountToken.delete({
            where: { id: verificationToken.id },
          });
        } else {
          console.log("Invalid or expired verification code");
          if (verificationToken) {
            console.log("Code expired at:", verificationToken.expiresAt);
            console.log("Current time:", new Date());
          }
        }
      }

      // If neither valid password nor verification code worked
      if (!isAuthorized) {
        return res.status(401).json({
          message:
            "Verification failed. Please provide a valid password or verification code.",
        });
      }

      // delete user
      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  })();
});
