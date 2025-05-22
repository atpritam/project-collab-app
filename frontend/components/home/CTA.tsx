import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CTAProps {
  ctaInView?: boolean;
}

const CTA = React.forwardRef<HTMLDivElement, CTAProps>(
  ({ ctaInView = true }, ref) => {
    return (
      <div className="bg-background border-t border-border" ref={ref}>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <motion.div
            className="lg:grid lg:grid-cols-2 lg:gap-8 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Ready to Transform Your Team's Workflow?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Join thousands of teams who have already improved their
                collaboration with our platform. Start your free trial today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white font-medium"
                >
                  <Link href="/auth/signup">Get Started for Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-border text-foreground hover:bg-muted font-medium"
                >
                  <Link href="#" className="inline-flex items-center">
                    Schedule a Demo <Calendar className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <Card className="border border-border shadow-sm dark:shadow-none overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          Free 14-day trial
                        </h3>
                        <p className="text-muted-foreground">
                          No credit card required
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          Cancel anytime
                        </h3>
                        <p className="text-muted-foreground">
                          No long-term commitments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          24/7 customer support
                        </h3>
                        <p className="text-muted-foreground">
                          We're here to help you succeed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
);

CTA.displayName = "CTA";

export default CTA;
