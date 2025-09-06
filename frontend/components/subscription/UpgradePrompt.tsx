'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Users, FolderPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/components/context/SubscriptionContext';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  type: 'projects' | 'team-members' | 'file-upload';
  currentCount?: number;
  limit?: number;
  plan?: string;
  onClose: () => void;
}

const planFeatures = {
  STARTER: {
    name: 'Starter',
    projects: 5,
    teamMembers: 4,
    storageGB: 0.1,
    price: '$0',
  },
  PRO: {
    name: 'Pro',
    projects: 100,
    teamMembers: 15,
    storageGB: 10,
    price: '$29',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    projects: 'Unlimited',
    teamMembers: 'Unlimited',
    storageGB: 100,
    price: '$79',
  },
};

const limitMessages = {
  projects: {
    title: 'Project Limit Reached',
    description: 'You\'ve reached your project limit. Upgrade to create more projects and collaborate with larger teams.',
    icon: FolderPlus,
    actionText: 'Create More Projects',
  },
  'team-members': {
    title: 'Team Member Limit Reached',
    description: 'You\'ve reached your team member limit. Upgrade to invite more collaborators to your projects.',
    icon: Users,
    actionText: 'Invite More Members',
  },
  'file-upload': {
    title: 'Storage Limit Reached',
    description: 'You\'ve reached your storage limit. Upgrade to upload more files and documents.',
    icon: Upload,
    actionText: 'Get More Storage',
  },
};

export function UpgradePrompt({ type, currentCount, limit, plan, onClose }: UpgradePromptProps) {
  const { subscription, refreshSubscription } = useSubscription();
  const router = useRouter();
  const limitInfo = limitMessages[type];
  const Icon = limitInfo.icon;

  const handleUpgrade = async (targetPlan: 'PRO' | 'ENTERPRISE') => {
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': subscription?.subscription?.currentPeriodStart || '',
        },
        body: JSON.stringify({ plan: targetPlan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': subscription?.subscription?.currentPeriodStart || '',
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                  <Icon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {limitInfo.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {limitInfo.description}
              </CardDescription>
              {currentCount !== undefined && limit !== undefined && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="text-sm">
                    {currentCount} / {limit === -1 ? '∞' : limit} used
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Choose your plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(planFeatures).map(([planKey, features]) => {
                    const isCurrentPlan = plan === planKey;
                    const isRecommended = planKey === 'PRO';
                    
                    return (
                      <div
                        key={planKey}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isCurrentPlan
                            ? 'border-violet-200 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/20'
                            : isRecommended
                            ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/20'
                            : 'border-border hover:border-violet-200 dark:hover:border-violet-400'
                        }`}
                      >
                        {isRecommended && (
                          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-violet-600">
                            Recommended
                          </Badge>
                        )}
                        {isCurrentPlan && (
                          <Badge variant="outline" className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            Current Plan
                          </Badge>
                        )}
                        
                        <div className="text-center">
                          <h4 className="font-semibold text-lg">{features.name}</h4>
                          <div className="text-3xl font-bold my-2">{features.price}</div>
                          <div className="text-sm text-muted-foreground mb-4">per month</div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Projects:</span>
                              <span className="font-medium">
                                {features.projects === 'Unlimited' ? '∞' : features.projects}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Team Members:</span>
                              <span className="font-medium">
                                {features.teamMembers === 'Unlimited' ? '∞' : features.teamMembers}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Storage:</span>
                              <span className="font-medium">{features.storageGB}GB</span>
                            </div>
                          </div>
                          
                          <Button
                            className={`w-full mt-4 ${
                              isCurrentPlan
                                ? 'opacity-50 cursor-not-allowed'
                                : isRecommended
                                ? 'bg-violet-600 hover:bg-violet-700'
                                : ''
                            }`}
                            disabled={isCurrentPlan}
                            onClick={() => handleUpgrade(planKey as 'PRO' | 'ENTERPRISE')}
                          >
                            {isCurrentPlan ? 'Current Plan' : `Upgrade to ${features.name}`}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  className="flex-1"
                >
                  Manage Billing
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
