import * as express from "express";
import { Router, Request, Response } from "express";
import { PrismaClient, SubscriptionPlan } from "@prisma/client";
import { 
  createCheckoutSession, 
  createBillingPortalSession,
  canCreateProject,
  canAddTeamMember,
  canUploadFile,
  getSubscriptionLimits,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  stripe
} from "../utils/subscription";
import { debugError, debugLog } from "../utils/debug";

const prisma = new PrismaClient();
const subscriptionRouter: Router = express.Router();

// GET /api/subscriptions/status - Get user's subscription status
subscriptionRouter.get("/status", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;

  (async () => {
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = user.subscription;
    const plan = subscription?.plan || SubscriptionPlan.STARTER;
    const limits = getSubscriptionLimits(plan);

    // Get current usage
    const [projectCount, totalMembers] = await Promise.all([
      prisma.project.count({
        where: {
          OR: [
            { creatorId: userId },
            { members: { some: { userId } } }
          ]
        }
      }),
      prisma.projectMember.groupBy({
        by: ['userId'],
        where: { 
          project: {
            creatorId: userId
          }
        },
        _count: {
          userId: true
        }
      }).then(result => result.length)
    ]);

    res.status(200).json({
      plan,
      status: subscription?.status || 'TRIAL',
      limits,
      usage: {
        projects: projectCount,
        teamMembers: totalMembers,
        storageGB: 0,
      },
      subscription: subscription ? {
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
    });
  } catch (error) {
    debugError("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
  })();
});

// POST /api/subscriptions/checkout - Create checkout session
subscriptionRouter.post("/checkout", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;
  const { plan } = req.body;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
        return res.status(400).json({ message: "Valid plan is required" });
      }

      const limits = getSubscriptionLimits(plan as SubscriptionPlan);
      
      if (!limits.stripePriceId) {
        return res.status(400).json({ message: "Plan not available for purchase" });
      }

      const successUrl = `${process.env.FRONTEND_URL}/dashboard?subscription=success`;
      const cancelUrl = `${process.env.FRONTEND_URL}/dashboard?subscription=cancelled`;

      const session = await createCheckoutSession(
        userId,
        limits.stripePriceId,
        successUrl,
        cancelUrl
      );

      res.status(200).json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error) {
      debugError("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  })();
});

// POST /api/subscriptions/portal - Create billing portal session
subscriptionRouter.post("/portal", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;

  (async () => {
    try {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const returnUrl = `${process.env.FRONTEND_URL}/dashboard`;
      const session = await createBillingPortalSession(userId, returnUrl);

      res.status(200).json({ 
        portalUrl: session.url 
      });
    } catch (error) {
      debugError("Error creating billing portal session:", error);
      res.status(500).json({ message: "Failed to create billing portal session" });
    }
  })();
});

// GET /api/subscriptions/limits/check - Check specific limits
subscriptionRouter.get("/limits/check", function (req: Request, res: Response) {
  const userId = req.headers["x-user-id"] as string;
  const { type, projectId, fileSize } = req.query;

  (async () => {
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let result;

    switch (type) {
      case 'projects':
        result = await canCreateProject(userId);
        break;
      case 'team-members':
        if (!projectId) {
          return res.status(400).json({ message: "Project ID is required for team member check" });
        }
        result = await canAddTeamMember(userId, projectId as string);
        break;
      case 'file-upload':
        if (!fileSize) {
          return res.status(400).json({ message: "File size is required for upload check" });
        }
        result = await canUploadFile(userId, parseInt(fileSize as string));
        break;
      default:
        return res.status(400).json({ message: "Invalid check type" });
    }

    res.status(200).json(result);
  } catch (error) {
    debugError("Error checking limits:", error);
    res.status(500).json({ message: "Failed to check limits" });
  }
  })();
});


// GET /api/subscriptions/plans - Get available plans
subscriptionRouter.get("/plans", function (req: Request, res: Response) {
  (async () => {
    try {
      // Get limits for all plan types
      const starterLimits = getSubscriptionLimits(SubscriptionPlan.STARTER);
      const proLimits = getSubscriptionLimits(SubscriptionPlan.PRO);
      const enterpriseLimits = getSubscriptionLimits(SubscriptionPlan.ENTERPRISE);

      const plans = [
        {
          id: 'STARTER',
          name: 'Starter',
          ...starterLimits,
        },
        {
          id: 'PRO', 
          name: 'Pro',
          ...proLimits,
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise', 
          ...enterpriseLimits,
        }
      ];

      res.status(200).json({ plans });
    } catch (error) {
      debugError("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  })();
});

export default subscriptionRouter;