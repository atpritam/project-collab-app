import React from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PricingProps {
  pricingInView: boolean;
}

const Pricing = React.forwardRef<HTMLDivElement, PricingProps>(
  ({ pricingInView = true }, ref) => {
    const pricingPlans = [
      {
        name: "Starter",
        price: "$0",
        description: "Perfect for individuals and small teams",
        features: [
          { included: true, text: "Up to 5 projects" },
          { included: true, text: "Up to 3 team members" },
          { included: true, text: "Basic task management" },
          { included: true, text: "File sharing (100MB storage)" },
          { included: true, text: "Team chat & messaging" },
          { included: false, text: "Role-based permissions" },
          { included: false, text: "Advanced reporting" },
          { included: false, text: "Priority support" },
        ],
        popular: false,
        cta: "Get Started",
        color:
          "bg-card border-border hover:border-violet-200 dark:hover:border-violet-800/40",
        buttonVariant: "outline",
      },
      {
        name: "Pro",
        price: "$29",
        description: "For growing teams and advanced projects",
        features: [
          { included: true, text: "Unlimited projects" },
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
          "bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200 dark:border-violet-800/40",
        buttonVariant: "default",
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
        cta: "Contact Sales",
        color:
          "bg-card border-border hover:border-violet-200 dark:hover:border-violet-800/40",
        buttonVariant: "outline",
      },
    ];

    return (
      <div className="py-20 bg-background" ref={ref}>
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

          <div className="mt-10 space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl ${
                  plan.color
                } p-8 shadow-sm transition-all duration-300 flex flex-col h-full border ${
                  plan.popular
                    ? "ring-2 ring-violet-500 dark:ring-violet-400"
                    : ""
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <div className="inline-flex bg-violet-600 dark:bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline text-foreground">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-xl font-medium">/month</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-8 space-y-4 grow">
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

                <div className="mt-8">
                  <Button
                    asChild
                    variant={
                      plan.buttonVariant === "default" ? "default" : "outline"
                    }
                    className={`w-full ${
                      plan.popular
                        ? "bg-violet-700 hover:bg-violet-800 text-white"
                        : ""
                    }`}
                    size="lg"
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center justify-center"
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

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
