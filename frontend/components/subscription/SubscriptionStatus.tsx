'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Users, FolderPlus, HardDrive, Calendar, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/components/context/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SubscriptionStatusProps {
  className?: string;
}

const planInfo = {
  STARTER: {
    name: 'Starter',
    icon: Zap,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  PRO: {
    name: 'Pro',
    icon: Crown,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

export function SubscriptionStatus({ className }: SubscriptionStatusProps) {
  const { subscription, loading, error } = useSubscription();
  const { data: session } = useSession();
  const router = useRouter();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load subscription status</p>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = planInfo[subscription.plan];
  const Icon = currentPlan.icon;

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  const handleManageBilling = async () => {
    if (!session?.user?.id) {
      console.error('No user session found');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { portalUrl } = await response.json();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentPlan.bgColor}`}>
                <Icon className={`h-5 w-5 ${currentPlan.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{currentPlan.name} Plan</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge 
                    variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {subscription.status.toLowerCase()}
                  </Badge>
                  {subscription.subscription && (
                    <span className="text-xs text-muted-foreground">
                      Renews {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            {subscription.plan !== 'ENTERPRISE' && (
              <Button size="sm" onClick={handleUpgrade}>
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  <span>Projects</span>
                </div>
                <span className={`font-medium ${getStatusColor(
                  getUsagePercentage(subscription.usage.projects, subscription.limits.projects)
                )}`}>
                  {subscription.usage.projects} / {subscription.limits.projects === -1 ? '∞' : subscription.limits.projects}
                </span>
              </div>
              {subscription.limits.projects !== -1 && (
                <Progress 
                  value={getUsagePercentage(subscription.usage.projects, subscription.limits.projects)}
                  className="h-2"
                />
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Team Members</span>
                </div>
                <span className={`font-medium ${getStatusColor(
                  getUsagePercentage(subscription.usage.teamMembers, subscription.limits.teamMembers)
                )}`}>
                  {subscription.usage.teamMembers} / {subscription.limits.teamMembers === -1 ? '∞' : subscription.limits.teamMembers}
                </span>
              </div>
              {subscription.limits.teamMembers !== -1 && (
                <Progress 
                  value={getUsagePercentage(subscription.usage.teamMembers, subscription.limits.teamMembers)}
                  className="h-2"
                />
              )}
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>Storage</span>
                </div>
                <span className={`font-medium ${getStatusColor(
                  getUsagePercentage(subscription.usage.storageGB, subscription.limits.storageGB)
                )}`}>
                  {subscription.usage.storageGB.toFixed(1)}GB / {subscription.limits.storageGB === -1 ? '∞' : `${subscription.limits.storageGB}GB`}
                </span>
              </div>
              {subscription.limits.storageGB !== -1 && (
                <Progress 
                  value={getUsagePercentage(subscription.usage.storageGB, subscription.limits.storageGB)}
                  className="h-2"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            {subscription.plan !== 'STARTER' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage Billing
              </Button>
            )}
            {subscription.plan === 'STARTER' && (
              <Button
                size="sm"
                onClick={handleUpgrade}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
