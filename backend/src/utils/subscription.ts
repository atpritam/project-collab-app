import Stripe from 'stripe';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Subscription plan limits
export const SUBSCRIPTION_LIMITS = {
  STARTER: {
    projects: 5,
    teamMembers: 4,
    storageGB: 0.1, // 100MB
    price: 0,
    stripePriceId: null,
  },
  PRO: {
    projects: 100,
    teamMembers: 15,
    storageGB: 10,
    price: 2900, // $29.00 in cents
    stripePriceId: 'price_1S4DQICKziAtH8BYuY73xOLJ',
  },
  ENTERPRISE: {
    projects: -1, // unlimited
    teamMembers: -1, // unlimited
    storageGB: 100,
    price: 7900, // $79.00 in cents
    stripePriceId: 'price_1S4DQTCKziAtH8BYeZh1NhJo',
  },
};

export interface SubscriptionLimits {
  projects: number;
  teamMembers: number;
  storageGB: number;
  price: number;
  stripePriceId: string | null;
}

/**
 * Get subscription limits for a plan
 */
export function getSubscriptionLimits(plan: SubscriptionPlan): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[plan];
}

/**
 * Check if user can create more projects
 */
export async function canCreateProject(userId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number; plan: SubscriptionPlan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const plan = user.subscription?.plan || SubscriptionPlan.STARTER;
  const limits = getSubscriptionLimits(plan);
  
  // Count projects where user is creator or member
  const projectCount = await prisma.project.count({
    where: {
      OR: [
        { creatorId: userId },
        { members: { some: { userId } } }
      ]
    }
  });

  const canCreate = limits.projects === -1 || projectCount < limits.projects;

  return {
    canCreate,
    currentCount: projectCount,
    limit: limits.projects,
    plan
  };
}

/**
 * Check if user can add more team members to a project
 */
export async function canAddTeamMember(userId: string, projectId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number; plan: SubscriptionPlan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const plan = user.subscription?.plan || SubscriptionPlan.STARTER;
  const limits = getSubscriptionLimits(plan);

  // Count current team members across all projects (excluding the project creator)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const memberCount = await prisma.projectMember.groupBy({
    by: ['userId'],
    where: { 
      project: {
        creatorId: project.creatorId
      }
    },
    _count: {
      userId: true
    }
  }).then(result => result.length);

  const canAdd = limits.teamMembers === -1 || memberCount < limits.teamMembers;

  return {
    canAdd,
    currentCount: memberCount,
    limit: limits.teamMembers,
    plan
  };
}

/**
 * Check if user can upload files (storage limit)
 */
export async function canUploadFile(userId: string, fileSizeBytes: number): Promise<{ canUpload: boolean; currentUsageGB: number; limitGB: number; plan: SubscriptionPlan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const plan = user.subscription?.plan || SubscriptionPlan.STARTER;
  const limits = getSubscriptionLimits(plan);

  // Calculate current storage usage (simplified - in real app, you'd track actual file sizes)
  const fileCount = await prisma.file.count({
    where: { uploaderId: userId }
  });
  
  // Estimate current usage (assuming average file size)
  const estimatedCurrentUsageGB = (fileCount * 0.5) / 1024; // Rough estimate
  
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const newTotalUsageGB = estimatedCurrentUsageGB + fileSizeGB;
  
  const canUpload = limits.storageGB === -1 || newTotalUsageGB <= limits.storageGB;

  return {
    canUpload,
    currentUsageGB: estimatedCurrentUsageGB,
    limitGB: limits.storageGB,
    plan
  };
}

/**
 * Create or update Stripe customer
 */
export async function createOrUpdateStripeCustomer(userId: string, email: string, name?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });
    customerId = customer.id;

    // Update user subscription record
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        plan: SubscriptionPlan.STARTER,
        status: 'TRIAL',
      },
      update: {
        stripeCustomerId: customerId,
      },
    });
  }

  return customerId;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const customerId = await createOrUpdateStripeCustomer(userId, user.email, user.name || undefined);

  // If user has an existing active subscription, cancel it first
  if (user.subscription?.stripeSubscriptionId && user.subscription.status === 'ACTIVE') {
    console.log('Canceling existing subscription before upgrade:', user.subscription.stripeSubscriptionId);
    try {
      await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
        proration_behavior: 'create_prorations',
      });
      
      // Cancel immediately for upgrades
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
      
      console.log('Successfully canceled existing subscription');
    } catch (error) {
      console.error('Error canceling existing subscription:', error);
      // Continue with checkout even if cancellation fails
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Create Stripe billing portal session
 */
export async function createBillingPortalSession(userId: string, returnUrl: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user?.subscription?.stripeCustomerId) {
    throw new Error('No active subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Handle successful subscription webhook
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  console.log('Processing subscription created webhook:', {
    customerId,
    priceId,
    subscriptionId: subscription.id,
    status: subscription.status
  });

  // First try to find user by customer ID
  let userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  // If not found, try to find by Stripe customer metadata
  if (!userSubscription) {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && customer.metadata?.userId) {
      userSubscription = await prisma.subscription.findUnique({
        where: { userId: customer.metadata.userId },
        include: { user: true },
      });
      
      // Update the subscription with the customer ID
      if (userSubscription) {
        await prisma.subscription.update({
          where: { userId: customer.metadata.userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }
  }

  if (!userSubscription) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Determine plan from price ID
  let plan: SubscriptionPlan = SubscriptionPlan.STARTER;
  if (priceId === SUBSCRIPTION_LIMITS.PRO.stripePriceId) {
    plan = SubscriptionPlan.PRO;
  } else if (priceId === SUBSCRIPTION_LIMITS.ENTERPRISE.stripePriceId) {
    plan = SubscriptionPlan.ENTERPRISE;
  }

  // Get the subscription item for period information
  const subscriptionItem = subscription.items.data[0];
  
  // Update subscription
  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: 'ACTIVE',
      plan,
      currentPeriodStart: subscriptionItem?.current_period_start ? new Date(subscriptionItem.current_period_start * 1000) : null,
      currentPeriodEnd: subscriptionItem?.current_period_end ? new Date(subscriptionItem.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

/**
 * Handle subscription updated webhook
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!userSubscription) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Determine plan from price ID
  let plan: SubscriptionPlan = SubscriptionPlan.STARTER;
  if (priceId === SUBSCRIPTION_LIMITS.PRO.stripePriceId) {
    plan = SubscriptionPlan.PRO;
  } else if (priceId === SUBSCRIPTION_LIMITS.ENTERPRISE.stripePriceId) {
    plan = SubscriptionPlan.ENTERPRISE;
  }

  // Get the subscription item for period information
  const subscriptionItem = subscription.items.data[0];

  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      stripePriceId: priceId,
      status: subscription.status.toUpperCase() as any,
      plan,
      currentPeriodStart: subscriptionItem?.current_period_start ? new Date(subscriptionItem.current_period_start * 1000) : null,
      currentPeriodEnd: subscriptionItem?.current_period_end ? new Date(subscriptionItem.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

/**
 * Handle subscription deleted webhook
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!userSubscription) {
    console.error('No user found for customer:', customerId);
    return;
  }

  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: true,
    },
  });
}

export { stripe };
