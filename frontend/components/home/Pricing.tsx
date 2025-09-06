import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PricingProps {
  pricingInView: boolean;
}

const Pricing = React.forwardRef<HTMLDivElement, PricingProps>(
  ({ pricingInView = true }, ref) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    // Handle success redirect from checkout - use window.location for SSR safety
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const upgraded = urlParams.get("upgraded");
        if (upgraded === "true") {
          toast.success("🎉 Welcome to your new plan! Your subscription has been activated.");
        }
      }
    }, []);

    // Fetch subscription data when user is authenticated
    useEffect(() => {
      const fetchSubscription = async () => {
        if (status === "authenticated" && session?.user?.id) {
          try {
            const response = await fetch("/api/subscriptions/status", {
              headers: {
                "x-user-id": session.user.id,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setSubscription(data);
            }
          } catch (error) {
            console.error("Error fetching subscription:", error);
          }
        }
      };

      fetchSubscription();
    }, [status, session?.user?.id]);

    // Helper function to get plan status
    const getPlanStatus = (planName: string) => {
      if (!subscription) return null;
      
      const planMap: { [key: string]: string } = {
        'STARTER': 'Starter',
        'PRO': 'Pro', 
        'ENTERPRISE': 'Enterprise'
      };
      
      if (planMap[subscription.plan] === planName) {
        return {
          isCurrent: true,
          status: subscription.status,
          isCanceled: subscription.status === 'CANCELED',
          isActive: subscription.status === 'ACTIVE'
        };
      }
      return null;
    };

    // Helper function to get plan tier level
    const getPlanTier = (planName: string) => {
      const tierMap: { [key: string]: number } = {
        'Starter': 1,
        'Pro': 2,
        'Enterprise': 3
      };
      return tierMap[planName] || 0;
    };

    // Helper function to get current user's plan tier
    const getCurrentPlanTier = () => {
      if (!subscription) return 0;
      const planMap: { [key: string]: string } = {
        'STARTER': 'Starter',
        'PRO': 'Pro', 
        'ENTERPRISE': 'Enterprise'
      };
      const currentPlanName = planMap[subscription.plan];
      return getPlanTier(currentPlanName);
    };

    // Helper function to get dynamic CTA text
    const getCtaText = (plan: any) => {
      if (status !== "authenticated") {
        return plan.name === "Starter" ? "Get Started" : `Try ${plan.name} Free`;
      }
      
      if (plan.name === "Starter") {
        // Check if this is a downgrade for users with higher-tier plans
        const currentTier = getCurrentPlanTier();
        const planTier = getPlanTier(plan.name);
        
        if (currentTier > planTier) {
          return `Downgrade to ${plan.name}`;
        }
        
        return "Go to Dashboard";
      }
      
      if (plan.planStatus?.isCurrent) {
        if (plan.planStatus.isActive) return "Current Plan";
        if (plan.planStatus.isCanceled) return "Reactivate";
      }
      
      // Check if this is a downgrade
      const currentTier = getCurrentPlanTier();
      const planTier = getPlanTier(plan.name);
      
      if (currentTier > planTier) {
        return `Downgrade to ${plan.name}`;
      } else if (currentTier < planTier) {
        return `Upgrade to ${plan.name}`;
      }
      
      return `Upgrade to ${plan.name}`;
    };

    // Helper function to check if this is a downgrade
    const isDowngrade = (plan: any) => {
      if (status !== "authenticated" || !subscription) return false;
      const currentTier = getCurrentPlanTier();
      const planTier = getPlanTier(plan.name);
      return currentTier > planTier;
    };

    const pricingPlans = [
      {
        name: "Starter",
        price: "$0",
        description: "Perfect for individuals and small teams",
        features: [
          { included: true, text: "Up to 5 projects" },
          { included: true, text: "Up to 4 team members" },
          { included: true, text: "Basic task management" },
          { included: true, text: "File sharing (100MB storage)" },
          { included: true, text: "Team chat & messaging" },
          { included: true, text: "Role-based permissions" },
          { included: false, text: "Advanced reporting" },
          { included: false, text: "Priority support" },
        ],
        popular: false,
        cta: status === "authenticated" ? "Go to Dashboard" : "Get Started",
        color:
          "bg-card border-border hover:border-violet-200 dark:hover:border-violet-400",
        buttonVariant: "outline",
        last: false,
        priceId: null, // Free plan
        planStatus: getPlanStatus("Starter"),
      },
      {
        name: "Pro",
        price: "$29",
        description: "For growing teams and advanced projects",
        features: [
          { included: true, text: "Up to 100 projects" },
          { included: true, text: "Up to 15 team members" },
          { included: true, text: "Advanced task management" },
          { included: true, text: "File sharing (10GB storage)" },
          { included: true, text: "Team chat & messaging" },
          { included: true, text: "Role-based permissions" },
          { included: false, text: "Advanced reporting" },
          { included: false, text: "Priority support" },
        ],
        popular: true,
        cta: "Try Pro Free",
        color:
          "bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200 dark:border-violet-400",
        buttonVariant: "default",
        last: false,
        priceId: "price_1S4DQICKziAtH8BYuY73xOLJ", // Pro plan price ID ($29)
        planStatus: getPlanStatus("Pro"),
      },
      {
        name: "Enterprise",
        price: "$79",
        description: "For large teams with advanced needs",
        features: [
          { included: true, text: "Unlimited projects" },
          { included: true, text: "Unlimited team members" },
          { included: true, text: "Advanced task management" },
          { included: true, text: "File sharing (100GB storage)" },
          { included: true, text: "Team chat & messaging" },
          { included: true, text: "Role-based permissions" },
          { included: true, text: "Advanced reporting" },
          { included: true, text: "Priority support" },
        ],
        popular: false,
        cta: "Try Enterprise Free",
        color:
          "bg-card border-border hover:border-violet-200 dark:hover:border-violet-400",
        buttonVariant: "outline",
        last: true,
        priceId: "price_1S4DQTCKziAtH8BYeZh1NhJo", // Enterprise plan price ID ($79)
        planStatus: getPlanStatus("Enterprise"),
      },
    ];

    const handlePlanClick = async (plan: typeof pricingPlans[0]) => {
      // If user is not logged in, redirect to signup
      if (status === "unauthenticated") {
        router.push("/auth/signup");
        return;
      }

      // If user is logged in but session is loading, wait
      if (status === "loading") {
        return;
      }

      // Handle Starter plan (free)
      if (plan.name === "Starter") {
        // Check if this is a downgrade for Enterprise users
        if (isDowngrade(plan)) {
          toast.info("Please visit the subscription page to manage your plan changes.");
          router.push("/subscription");
          return;
        }
        // Otherwise, redirect to dashboard for new users
        router.push("/dashboard");
        return;
      }

      // Check if user already has this plan
      if (plan.planStatus?.isCurrent) {
        if (plan.planStatus.isActive) {
          toast.info("You already have this plan active!");
          router.push("/subscription");
          return;
        } else if (plan.planStatus.isCanceled) {
          toast.info("This plan is canceled. Visit subscription page to reactivate.");
          router.push("/subscription");
          return;
        }
      }

      // Handle downgrades - redirect to subscription page for now
      if (isDowngrade(plan)) {
        toast.info("Please visit the subscription page to manage your plan changes.");
        router.push("/subscription");
        return;
      }

      // Handle paid plans
      if (plan.priceId) {
        setLoading(plan.name);
        try {
          const response = await fetch("/api/subscriptions/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": session?.user?.id || "",
            },
            body: JSON.stringify({
              plan: plan.name.toUpperCase(),
              successUrl: `${window.location.origin}/dashboard?upgraded=true`,
              cancelUrl: `${window.location.origin}/#pricing`,
            }),
          });

          const data = await response.json();

          if (data.checkoutUrl || data.url) {
            window.location.href = data.checkoutUrl || data.url;
          } else {
            throw new Error(data.error || "Failed to create checkout session");
          }
        } catch (error) {
          console.error("Error creating checkout session:", error);
          // Show a more user-friendly error message
          const errorMessage = error instanceof Error ? error.message : "Failed to start checkout process. Please try again.";
          toast.error(errorMessage);
        } finally {
          setLoading(null);
        }
      }
    };

    return (
      <div className="py-10 bg-background" ref={ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={
              pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={
                pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1.5" /> Pricing
              </span>
            </motion.div>
            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={
                pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={
                pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Choose the plan that's right for your team's collaboration needs
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-10 space-y-8 lg:grid lg:grid-cols-3 lg:gap-0 lg:space-y-0 lg:-space-x-4"
            initial={{ opacity: 0, y: 30 }}
            animate={
              pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.5, delay: 0.34 }}
          >
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative rounded-2xl ${
                  plan.color
                } p-8 shadow-sm transition-all duration-300 flex flex-col h-full border ${
                  plan.popular
                    ? "ring-2 ring-violet-500 dark:ring-violet-400"
                    : ""
                }
                    ${plan.popular ? "z-10 bg-accent" : "z-0"}
                    `}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <div className="inline-flex bg-violet-600 dark:bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className={`${plan.last ? "lg:pl-4" : "pl-0"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </h3>
                    {plan.planStatus?.isCurrent && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.planStatus.isActive 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : plan.planStatus.isCanceled
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {plan.planStatus.isActive ? 'Current Plan' : 
                         plan.planStatus.isCanceled ? 'Canceled' : 
                         plan.planStatus.status}
                      </div>
                    )}
                  </div>
                  <div
                    className={`mt-4 flex items-baseline text-foreground ${
                      plan.popular
                        ? ""
                        : "group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors duration-200"
                    }`}
                  >
                    <span className="text-4xl font-extrabold tracking-tight ">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-xl font-medium">/month</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`mt-8 space-y-4 grow ${
                    plan.last ? "lg:pl-4" : "pl-0"
                  }`}
                >
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <span
                        className={`ml-3 ${
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`mt-8 ${plan.last ? "lg:pl-4" : "pl-0"}`}>
                  <Button
                    onClick={() => handlePlanClick(plan)}
                    disabled={loading === plan.name || status === "loading" || (plan.planStatus?.isCurrent && plan.planStatus.isActive)}
                    variant={
                      plan.planStatus?.isCurrent && plan.planStatus.isActive
                        ? "outline"
                        : plan.buttonVariant === "default" ? "default" : "outline"
                    }
                    className={`w-full ${
                      plan.popular && !(plan.planStatus?.isCurrent && plan.planStatus.isActive) && !isDowngrade(plan)
                        ? "bg-violet-700 hover:bg-violet-800 text-white"
                        : plan.planStatus?.isCurrent && plan.planStatus.isActive
                        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : isDowngrade(plan)
                        ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                        : ""
                    }`}
                    size="lg"
                  >
                    {loading === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {getCtaText(plan)}
                        {!(plan.planStatus?.isCurrent && plan.planStatus.isActive) && (
                          <ArrowRight className="ml-2 h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={
              pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-flex items-center p-4 bg-muted/50 rounded-lg border border-border">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <span className="text-foreground text-md">
                All plans include a 14-day free trial. No credit card required.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
);

Pricing.displayName = "Pricing";

export default Pricing;
