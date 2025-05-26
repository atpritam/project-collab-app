import express, { Router, Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/hash";
import { generateToken, isTokenExpired } from "../utils/token";
import { sendPasswordResetEmail } from "../utils/email";
import { sendEmailVerificationEmail } from "../utils/email";
import { checkPassword } from "../utils/pass";
import { validate, authValidation } from "../middleware/validation";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const authRouter: Router = express.Router();

export default authRouter;

// POST /api/auth/register
authRouter.post(
  "/register",
  validate(authValidation.register) as express.RequestHandler,
  function (req: Request, res: Response) {
    const { email, password, name } = req.body;

    (async () => {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          // check if user has Account (OAuth)
          const existingAccount = await prisma.account.findFirst({
            where: { userId: existingUser.id },
          });
          if (existingAccount) {
            // What OAuth provider?
            const provider = existingAccount.provider;
            if (provider) {
              return res.status(400).json({
                message: `User already exists with ${provider} account`,
              });
            }
          }
          return res.status(400).json({ message: "User already exists" });
        }

        // Password validation
        if (!checkPassword(password)) {
          return res.status(400).json({
            message:
              "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            // emailVerified is null by default until the user verifies their email
          },
        });

        // verification code and expiry
        const verificationCode = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
          data: {
            id: crypto.randomUUID(),
            email,
            code: verificationCode,
            expiresAt,
          },
        });

        // Send verification email
        await sendEmailVerificationEmail(email, verificationCode);

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
          ...userWithoutPassword,
          message:
            "Sign Up successful. Please check your email to activate your account.",
        });
      } catch (err) {
        debugError(err);
        res.status(500).json({ message: "Registration failed" });
      }
    })();
  }
);

// POST /api/auth/login
authRouter.post(
  "/login",
  validate(authValidation.login) as express.RequestHandler,
  function (req: Request, res: Response) {
    const { email, password } = req.body;

    (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.password) {
          return res.status(500).json({ message: "User password not set." });
        }

        const isValid = await verifyPassword(password, user.password!);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if email is verified - for email/password users
        const hasOAuthAccount = await prisma.account.findFirst({
          where: { userId: user.id },
        });

        if (!hasOAuthAccount && !user.emailVerified) {
          return res.status(403).json({
            message:
              "Email not verified. Please check your inbox for verification link.",
            emailVerified: false,
            email: user.email,
          });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      } catch (err) {
        debugError(err);
        res.status(500).json({ message: "Login failed" });
      }
    })();
  }
);

// POST /api/auth/oauth
authRouter.post("/oauth", function (req: Request, res: Response) {
  const {
    email,
    name,
    image,
    provider,
    providerAccountId,
    access_token,
    refresh_token,
    expires_at,
    token_type,
    scope,
    id_token,
    email_verified,
  } = req.body;

  (async () => {
    try {
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      // Find or create the user
      let user = await prisma.user.findUnique({ where: { email } });
      let isNewUser = false;

      if (!user) {
        // new user
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            email,
            name,
            image,
            emailVerified: new Date(),
          },
        });
      } else {
        const existingOAuthAccount = await prisma.account.findFirst({
          where: { userId: user.id },
        });

        if (!existingOAuthAccount && !user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      // account info Update
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider,
          providerAccountId,
          access_token,
          refresh_token,
          expires_at,
          token_type,
          scope,
          id_token,
        },
        update: {
          userId: user.id,
          access_token,
          refresh_token,
          expires_at,
          token_type,
          scope,
          id_token,
        },
      });

      if (email_verified !== undefined && !user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: email_verified ? new Date() : null,
          },
        });
      }

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      const { password: _, ...userWithoutPassword } = updatedUser!;
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      debugError(err);
      res.status(500).json({ message: "OAuth sync failed" });
    }
  })();
});

// POST /api/auth/forgot-password
authRouter.post("/forgot-password", function (req: Request, res: Response) {
  const { email } = req.body;

  (async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(200).json({
          message:
            "If your email is in our system, you will receive a password reset link shortly",
        });
      }

      if (!user.password) {
        const existingAccount = await prisma.account.findFirst({
          where: { userId: user.id },
        });
        if (existingAccount) {
          const provider = existingAccount.provider;
          // OAuth account
          return res.status(400).json({
            message: `cannot reset password. Please Sign in with your ${provider} account`,
          });
        }
      }

      // reset token
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // deleting existing tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email },
      });

      // new reset token
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: resetToken,
          expiresAt,
        },
      });

      // reset email
      await sendPasswordResetEmail(email, resetToken);

      res.status(200).json({
        message:
          "If your email is in our system, you will receive a password reset link shortly",
      });
    } catch (err) {
      debugError("Password reset request error:", err);
      res
        .status(500)
        .json({ message: "Failed to process password reset request" });
    }
  })();
});

// POST /api/auth/reset-password
authRouter.post(
  "/reset-password",
  validate(authValidation.resetPassword) as express.RequestHandler,
  function (req: Request, res: Response) {
    const { token, password } = req.body;

    (async () => {
      try {
        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { token },
        });

        // token validation
        if (!resetToken || isTokenExpired(resetToken.expiresAt)) {
          return res
            .status(400)
            .json({ message: "Invalid or expired reset token" });
        }

        const user = await prisma.user.findUnique({
          where: { email: resetToken.email },
        });

        if (!user) {
          return res.status(400).json({ message: "User not found" });
        }

        // Password validation
        if (!checkPassword(password)) {
          return res.status(400).json({
            message:
              "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          });
        }

        const hashedPassword = await hashPassword(password);

        // update user password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id },
        });

        res
          .status(200)
          .json({ message: "Password has been reset successfully" });
      } catch (err) {
        debugError("Password reset error:", err);
        res.status(500).json({ message: "Failed to reset password" });
      }
    })();
  }
);

// POST /api/auth/validate-reset-token
authRouter.post(
  "/validate-reset-token",
  validate(authValidation.validateResetToken) as express.RequestHandler,
  function (req: Request, res: Response) {
    const { token } = req.body;

    (async () => {
      try {
        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { token },
        });

        // Token validation
        if (!resetToken || isTokenExpired(resetToken.expiresAt)) {
          return res.status(400).json({ valid: false });
        }

        res.status(200).json({ valid: true });
      } catch (err) {
        debugError("Token validation error:", err);
        res.status(500).json({ valid: false });
      }
    })();
  }
);

// POST /api/auth/verify-email
authRouter.post("/verify-email", function (req: Request, res: Response) {
  const { code, email } = req.body;

  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }
      const foundToken = await prisma.verificationToken.findFirst({
        where: {
          code,
          email,
        },
      });

      if (!foundToken) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Token validation
      if (isTokenExpired(foundToken.expiresAt)) {
        return res
          .status(400)
          .json({ message: "Verification code has expired" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // update user emailVerified field
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      // verification token deletion
      await prisma.verificationToken.deleteMany({
        where: {
          id: foundToken.id,
          code: foundToken.code,
        },
      });

      res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
      debugError("Email verification error:", err);
      res.status(500).json({ message: "Failed to verify email" });
    }
  })();
});

// POST /api/auth/resend-verification
authRouter.post("/resend-verification", function (req: Request, res: Response) {
  const { email } = req.body;

  (async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Delete existing verification tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { email },
      });

      // verification code and expiry
      const verificationCode = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          email,
          code: verificationCode,
          expiresAt,
        },
      });

      // Send verification email
      await sendEmailVerificationEmail(email, verificationCode);

      res.status(200).json({
        message: "Verification email sent successfully",
      });
    } catch (err) {
      debugError("Error resending verification email:", err);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  })();
});
