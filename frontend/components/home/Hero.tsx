"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Zap, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { Calendar } from "lucide-react";

interface HeroProps {
  heroInView?: boolean;
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ heroInView = true }, ref) => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const [scrolled, setScrolled] = useState(false);

    const handleSignOut = () => {
      signOut({ callbackUrl: "/" });
    };

    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
      <div
        className="bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-violet-950/30 dark:via-background dark:to-purple-950/20"
        ref={ref}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
            scrolled ? "pt-10" : "pt-30"
          } pb-10`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-1.5" /> Introducing Nudge
                </span>
              </motion.div>
              <motion.h1
                className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="block">Collaborate</span>
                <span className="block">Seamlessly on</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-500 dark:to-purple-400">
                  Projects
                </span>
              </motion.h1>
              <motion.p
                className="mt-8 text-xl text-muted-foreground max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Streamline your team's workflow with our intuitive project
                management platform. Create projects, manage tasks, and
                collaborate effectively.
              </motion.p>
              <motion.div
                className="mt-10 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {isAuthenticated ? (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-violet-700 hover:bg-violet-900 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-medium px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <Link href="/dashboard">
                        Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-border text-foreground hover:bg-muted font-medium px-8 py-6 rounded-lg transition-all"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-violet-700 hover:bg-violet-900 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-medium px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <Link href="/auth/signup">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-border text-foreground hover:bg-muted font-medium px-8 py-6 rounded-lg transition-all"
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                  </>
                )}
              </motion.div>
              <motion.div
                className="mt-8 flex items-center text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                No credit card required
                <span className="mx-2">•</span>
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Free 14-day trial
              </motion.div>
            </motion.div>
            <motion.div
              className="flex items-center justify-center lg:justify-end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative w-full max-w-lg">
                <motion.div
                  className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-700 to-purple-600 opacity-30 blur-xl"
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                />
                <div className="relative rounded-2xl bg-card dark:bg-card/90 p-6 shadow-2xl backdrop-blur-sm border border-violet-100 dark:border-violet-700/30">
                  {/* Dashboard visualization content */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-md bg-violet-700 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-foreground">
                          Project Dashboard
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex flex-col items-center justify-center p-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                        <Calendar className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Calendar
                        </span>
                      </div>
                      <div className="h-24 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex flex-col items-center justify-center p-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                        <Users className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Team
                        </span>
                      </div>
                      <div className="h-24 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex flex-col items-center justify-center p-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                        <FileText className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Tasks
                        </span>
                      </div>
                    </div>

                    <div className="h-40 rounded-lg bg-violet-50 dark:bg-violet-900/20 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-foreground">
                          Project Progress
                        </h3>
                        <span className="text-sm text-violet-700 dark:text-violet-400">
                          75%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-violet-100 dark:bg-violet-800/50 rounded-full mb-4">
                        <div className="h-2 rounded-full bg-violet-700 dark:bg-violet-500 w-3/4"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Research completed
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Design phase completed
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 border-2 border-violet-300 dark:border-violet-600 rounded-full mr-2"></div>
                          <span className="text-sm text-muted-foreground">
                            Development in progress
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-violet-700 dark:bg-violet-600 text-white hover:bg-violet-900 dark:hover:bg-violet-700"
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
);

Hero.displayName = "Hero";

export default Hero;
