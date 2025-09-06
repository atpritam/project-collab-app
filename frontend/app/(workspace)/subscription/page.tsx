'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/components/context/SubscriptionContext';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Crown, 
  Zap, 
  Users, 
  FolderPlus, 
  HardDrive, 
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const planInfo = {
  STARTER: {
    name: 'Starter',
    icon: Zap,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  PRO: {
    name: 'Pro',
    icon: Crown,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    borderColor: 'border-violet-200 dark:border-violet-700',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-700',
  },
};

export default function SubscriptionPage() {
  const { subscription, loading, error, refreshSubscription } = useSubscription();
  const { data: session } = useSession();
  const [downgradeLoading, setDowngradeLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const upgradeType = searchParams.get('upgrade');

  // Refresh subscription data when page loads
  useEffect(() => {
    refreshSubscription();
  }, []);

  // Show upgrade message when redirected from project creation
  useEffect(() => {
    if (upgradeType === 'projects') {
      toast.info('You\'ve reached your project limit. Upgrade your plan to create more projects!');
    }
  }, [upgradeType]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading subscription: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">No subscription data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = planInfo[subscription.plan];
  const PlanIcon = plan.icon;

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

  const handleDowngrade = async (targetPlan: string) => {
    if (!session?.user?.id) {
      console.error('No user session found');
      return;
    }

    setDowngradeLoading(targetPlan);
    
    try {
      // For now, redirect to billing portal for downgrades
      // In a real implementation, you'd want to handle this through Stripe
      toast.info('Please use the billing portal to manage your plan changes.');
      
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
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setDowngradeLoading(null);
    }
  };

  const handleUpgrade = async (targetPlan: string) => {
    if (!session?.user?.id) {
      console.error('No user session found');
      return;
    }

    // Validate plan
    if (!['PRO', 'ENTERPRISE'].includes(targetPlan)) {
      toast.error('Invalid plan selected');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session?.user?.id || '',
        },
        body: JSON.stringify({
          plan: targetPlan,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/subscription`,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl || data.url) {
        window.location.href = data.checkoutUrl || data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.';
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return 'text-green-600 dark:text-green-400';
    const percentage = getUsagePercentage(current, limit);
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-base sm:text-base text-muted-foreground mt-2">
            Manage your subscription and billing preferences
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={refreshSubscription}
            disabled={loading}
            className="flex items-center gap-2 text-sm sm:text-sm px-4 py-2"
          >
            <RefreshCw className={`h-4 w-4 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </Button>
          <Badge 
            variant="outline" 
            className={`${plan.color} ${plan.borderColor} ${plan.bgColor} text-sm sm:text-sm px-3 py-1`}
          >
            <PlanIcon className="h-4 w-4 mr-2" />
            {plan.name}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Active Plan + Available Plans */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Main Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`${plan.bgColor} ${plan.borderColor} border`}>
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${plan.bgColor}`}>
                      <PlanIcon className={`h-6 w-6 sm:h-6 sm:w-6 ${plan.color}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-xl sm:text-xl ${plan.color}`}>
                        {plan.name} Plan
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        {subscription.status === 'ACTIVE' ? 'Active subscription' : 
                         subscription.status === 'TRIAL' ? 'Free trial' :
                         subscription.status === 'CANCELED' ? 'Canceled' :
                         subscription.status === 'PAST_DUE' ? 'Past due' :
                         'Unpaid'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm sm:text-sm self-start sm:self-center px-3 py-1">
                    ${subscription.limits.price / 100}/month
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-6">
                {/* Usage Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <FolderPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Projects</span>
                      </div>
                      <span className={`font-semibold ${getUsageColor(subscription.usage.projects, subscription.limits.projects)}`}>
                        {subscription.usage.projects} / {subscription.limits.projects === -1 ? '∞' : subscription.limits.projects}
                      </span>
                    </div>
                    {subscription.limits.projects !== -1 && (
                      <Progress 
                        value={getUsagePercentage(subscription.usage.projects, subscription.limits.projects)} 
                        className="h-3"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Team Members</span>
                      </div>
                      <span className={`font-semibold ${getUsageColor(subscription.usage.teamMembers, subscription.limits.teamMembers)}`}>
                        {subscription.usage.teamMembers} / {subscription.limits.teamMembers === -1 ? '∞' : subscription.limits.teamMembers}
                      </span>
                    </div>
                    {subscription.limits.teamMembers !== -1 && (
                      <Progress 
                        value={getUsagePercentage(subscription.usage.teamMembers, subscription.limits.teamMembers)} 
                        className="h-3"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <HardDrive className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <span className="font-medium">Storage</span>
                      </div>
                      <span className={`font-semibold ${getUsageColor(subscription.usage.storageGB, subscription.limits.storageGB)}`}>
                        {subscription.usage.storageGB.toFixed(1)}GB / {subscription.limits.storageGB}GB
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscription.usage.storageGB, subscription.limits.storageGB)} 
                      className="h-3"
                    />
                  </div>
                </div>

                <Separator />

                {/* Billing Information */}
                {subscription.subscription && (
                  <div className="space-y-4 sm:space-y-4">
                    <h3 className="text-lg sm:text-lg font-semibold">Billing Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4 text-sm sm:text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">Current Period:</span>
                        <p className="font-semibold mt-1">
                          {formatDate(subscription.subscription.currentPeriodStart)} - {formatDate(subscription.subscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Status:</span>
                        <p className="font-semibold capitalize mt-1">{subscription.subscription.cancelAtPeriodEnd ? 'Canceling at period end' : 'Active'}</p>
                      </div>
                    </div>
                      </div>
                    )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-4 sm:pt-4">
                  <Button 
                    onClick={handleManageBilling}
                    variant="outline"
                    className="flex items-center gap-3 text-base px-6 py-3"
                    size="default"
                  >
                    <CreditCard className="h-5 w-5 sm:h-4 sm:w-4" />
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
        </motion.div>

          {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Desktop Card Wrapper */}
            <Card className="hidden sm:block">
              <CardHeader className="pb-6">
                <CardTitle className="text-lg sm:text-lg">Available Plans</CardTitle>
                <CardDescription className="text-base mt-2">
                  {subscription.plan === 'STARTER' 
                    ? 'Upgrade to unlock more features and higher limits'
                    : subscription.plan === 'ENTERPRISE' 
                    ? 'You can downgrade to a lower tier plan' 
                    : 'You can upgrade to a higher tier plan or downgrade to a lower one'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
                  {/* Pro Plan Option */}
                  {(subscription.plan === 'STARTER' || subscription.plan === 'ENTERPRISE') && (
                    <Card className="flex flex-col">
                      <CardContent className="p-4 sm:p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4 sm:mb-3">
                          <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 sm:h-5 sm:w-5 text-violet-600" />
                            <h3 className="font-semibold text-base sm:text-base">Pro Plan</h3>
                          </div>
                          <Badge variant="outline" className="text-violet-600 text-sm sm:text-sm px-3 py-1">
                            $29/month
                          </Badge>
                        </div>
                        <div className="space-y-2 sm:space-y-2 text-sm sm:text-sm text-muted-foreground mb-4 sm:mb-4 flex-1">
                          <div>• Up to 100 projects</div>
                          <div>• Up to 15 team members</div>
                          <div>• 10GB storage</div>
                          <div>• Advanced task management</div>
                        </div>
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            size="default"
                            className={`w-full text-base sm:text-sm px-4 py-3 ${
                              subscription.plan === 'STARTER' 
                                ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600'
                                : 'border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                            }`}
                            onClick={() => subscription.plan === 'STARTER' ? handleUpgrade('PRO') : handleDowngrade('PRO')}
                            disabled={downgradeLoading === 'PRO'}
                          >
                            {subscription.plan === 'STARTER' 
                              ? 'Upgrade to Pro'
                              : downgradeLoading === 'PRO' ? 'Processing...' : 'Downgrade to Pro'
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Starter Plan Option */}
                  {subscription.plan !== 'STARTER' && (
                    <Card className="flex flex-col">
                      <CardContent className="p-4 sm:p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4 sm:mb-3">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 sm:h-5 sm:w-5 text-gray-600" />
                            <h3 className="font-semibold text-base sm:text-base">Starter Plan</h3>
                          </div>
                          <Badge variant="outline" className="text-gray-600 text-sm sm:text-sm px-3 py-1">
                            Free
                          </Badge>
                        </div>
                        <div className="space-y-2 sm:space-y-2 text-sm sm:text-sm text-muted-foreground mb-4 sm:mb-4 flex-1">
                          <div>• Up to 5 projects</div>
                          <div>• Up to 4 team members</div>
                          <div>• 100MB storage</div>
                          <div>• Basic task management</div>
                        </div>
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            size="default"
                            className="w-full text-base sm:text-sm px-4 py-3 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            onClick={() => handleDowngrade('STARTER')}
                            disabled={downgradeLoading === 'STARTER'}
                          >
                            {downgradeLoading === 'STARTER' ? 'Processing...' : 'Downgrade to Starter'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enterprise Plan Option */}
                  {(subscription.plan === 'STARTER' || subscription.plan === 'PRO') && (
                    <Card className="flex flex-col">
                      <CardContent className="p-4 sm:p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4 sm:mb-3">
                          <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 sm:h-5 sm:w-5 text-purple-600" />
                            <h3 className="font-semibold text-base sm:text-base">Enterprise Plan</h3>
                          </div>
                          <Badge variant="outline" className="text-purple-600 text-sm sm:text-sm px-3 py-1">
                            $79/month
                          </Badge>
                        </div>
                        <div className="space-y-2 sm:space-y-2 text-sm sm:text-sm text-muted-foreground mb-4 sm:mb-4 flex-1">
                          <div>• Unlimited projects</div>
                          <div>• Unlimited team members</div>
                          <div>• 100GB storage</div>
                          <div>• Advanced analytics</div>
                          <div>• Priority support</div>
                        </div>
                        <div className="mt-auto">
                          <Button 
                            size="default"
                            className={`w-full text-base sm:text-sm px-4 py-3 ${
                              subscription.plan === 'STARTER' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                            }`}
                            onClick={() => subscription.plan === 'STARTER' ? handleUpgrade('ENTERPRISE') : handleUpgrade('ENTERPRISE')}
                          >
                            {subscription.plan === 'STARTER' ? 'Upgrade to Enterprise' : 'Upgrade to Enterprise'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Direct Plan Cards */}
            <div className="block sm:hidden">
              <div className="grid grid-cols-1 gap-4">
                {/* Pro Plan Option - Mobile */}
                {(subscription.plan === 'STARTER' || subscription.plan === 'ENTERPRISE') && (
                  <Card className="flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-violet-600" />
                          <h3 className="font-semibold text-base">Pro Plan</h3>
                        </div>
                        <Badge variant="outline" className="text-violet-600 text-sm px-3 py-1">
                          $29/month
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
                        <div>• Up to 100 projects</div>
                        <div>• Up to 15 team members</div>
                        <div>• 10GB storage</div>
                        <div>• Advanced task management</div>
                      </div>
                      <div className="mt-auto">
                        <Button 
                          variant="outline" 
                          size="default"
                          className={`w-full text-base px-4 py-3 ${
                            subscription.plan === 'STARTER' 
                              ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600'
                              : 'border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          }`}
                          onClick={() => subscription.plan === 'STARTER' ? handleUpgrade('PRO') : handleDowngrade('PRO')}
                          disabled={downgradeLoading === 'PRO'}
                        >
                          {subscription.plan === 'STARTER' 
                            ? 'Upgrade to Pro'
                            : downgradeLoading === 'PRO' ? 'Processing...' : 'Downgrade to Pro'
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Starter Plan Option - Mobile */}
                {subscription.plan !== 'STARTER' && (
                  <Card className="flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-base">Starter Plan</h3>
                        </div>
                        <Badge variant="outline" className="text-gray-600 text-sm px-3 py-1">
                          Free
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
                        <div>• Up to 5 projects</div>
                        <div>• Up to 4 team members</div>
                        <div>• 100MB storage</div>
                        <div>• Basic task management</div>
                      </div>
                      <div className="mt-auto">
                        <Button 
                          variant="outline" 
                          size="default"
                          className="w-full text-base px-4 py-3 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          onClick={() => handleDowngrade('STARTER')}
                          disabled={downgradeLoading === 'STARTER'}
                        >
                          {downgradeLoading === 'STARTER' ? 'Processing...' : 'Downgrade to Starter'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enterprise Plan Option - Mobile */}
                {(subscription.plan === 'STARTER' || subscription.plan === 'PRO') && (
                  <Card className="flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-base">Enterprise Plan</h3>
                        </div>
                        <Badge variant="outline" className="text-purple-600 text-sm px-3 py-1">
                          $79/month
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
                        <div>• Unlimited projects</div>
                        <div>• Unlimited team members</div>
                        <div>• 100GB storage</div>
                        <div>• Advanced analytics</div>
                        <div>• Priority support</div>
                      </div>
                      <div className="mt-auto">
                        <Button 
                          size="default"
                          className={`w-full text-base px-4 py-3 ${
                            subscription.plan === 'STARTER' 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-violet-600 hover:bg-violet-700 text-white'
                          }`}
                          onClick={() => subscription.plan === 'STARTER' ? handleUpgrade('ENTERPRISE') : handleUpgrade('ENTERPRISE')}
                        >
                          {subscription.plan === 'STARTER' ? 'Upgrade to Enterprise' : 'Upgrade to Enterprise'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Quick Stats + Plan Features */}
        <div className="space-y-6 sm:space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-lg sm:text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-sm sm:text-sm font-medium">Plan Tier</span>
                  </div>
                  <Badge variant="outline" className="text-sm sm:text-sm px-3 py-1">{plan.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 sm:h-4 sm:w-4 text-blue-600" />
                    <span className="text-sm sm:text-sm font-medium">Status</span>
                  </div>
                  <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-sm sm:text-sm px-3 py-1">
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-sm sm:text-sm font-medium">Features</span>
                  </div>
                  <span className="text-sm sm:text-sm font-semibold">
                    {subscription.limits.projects === -1 ? 'Unlimited' : 'Limited'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plan Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-lg sm:text-lg">Plan Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-sm sm:text-sm font-medium">
                    {subscription.limits.projects === -1 ? 'Unlimited' : subscription.limits.projects} Projects
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-sm sm:text-sm font-medium">
                    {subscription.limits.teamMembers === -1 ? 'Unlimited' : subscription.limits.teamMembers} Team Members
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-sm sm:text-sm font-medium">{subscription.limits.storageGB}GB Storage</span>
                </div>
                {subscription.plan === 'PRO' && (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Priority Support</span>
                    </div>
                  </>
                )}
                {subscription.plan === 'ENTERPRISE' && (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Priority Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Custom Integrations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-sm sm:text-sm font-medium">Dedicated Account Manager</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
        </motion.div>
        </div>
      </div>
    </div>
  );
}