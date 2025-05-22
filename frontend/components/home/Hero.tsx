"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  FileText,
  MousePointer,
  Calendar as CalendarIcon,
  User,
  Shield,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroProps {
  heroInView?: boolean;
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ heroInView = true }, ref) => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const [scrolled, setScrolled] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);
    const [projectProgress, setProjectProgress] = useState(75);
    const [activeCard, setActiveCard] = useState<string | null>(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);
    const [completedTasks, setCompletedTasks] = useState([true, true, false]);
    const [currentView, setCurrentView] = useState("tasks");
    const [dashboardRef, setDashboardRef] = useState<HTMLDivElement | null>(
      null
    );

    const isMobile = useIsMobile();
    const isDesktop = !isMobile;

    const handleSignOut = () => {
      signOut({ callbackUrl: "/" });
    };

    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    useEffect(() => {
      const isChromeLike = !navigator.userAgent.includes("Firefox");

      const taskCheckboxY = isChromeLike ? 315 : 355;
      const taskCheckboxX = isChromeLike ? 20 : 25;
      const taskCardX = isChromeLike ? 430 : 460;
      const calendarCardX = isChromeLike ? 110 : 120;
      const calendarCardY = isChromeLike ? 120 : 130;

      const animationSequence = [
        {
          step: 0,
          x: calendarCardX,
          y: calendarCardY,
          duration: 1000,
          target: "calendar",
        },
        // Step 1: Click Calendar card
        {
          step: 1,
          x: calendarCardX,
          y: calendarCardY,
          duration: 500,
          target: "calendar",
        },
        // Step 2: Move to Team card
        { step: 2, x: 210, y: 130, duration: 1200, target: "team" },
        // Step 3: Click Team card
        { step: 3, x: 210, y: 130, duration: 500, target: "team" },
        // Step 4: Move to Tasks card
        { step: 4, x: taskCardX, y: 130, duration: 1200, target: "tasks" },
        // Step 5: Click Tasks card
        { step: 5, x: taskCardX, y: 130, duration: 500, target: "tasks" },
        // Step 6: Move to third task checkbox (browser-adaptive Y coordinate)
        {
          step: 6,
          x: taskCheckboxX,
          y: taskCheckboxY,
          duration: 1000,
          target: "task",
        },
        // Step 7: Complete third task (click checkbox) (browser-adaptive Y coordinate)
        {
          step: 7,
          x: taskCheckboxX,
          y: taskCheckboxY,
          duration: 500,
          target: "task",
        },
        // Step 8: Hide cursor and reset
        { step: 8, x: 40, y: 305, duration: 1500, target: null },
      ];

      let timeoutId: NodeJS.Timeout;
      let currentIndex = 0;

      const runAnimation = () => {
        if (currentIndex < animationSequence.length) {
          const current = animationSequence[currentIndex];
          setShowCursor(currentIndex < animationSequence.length - 1);
          setCursorPosition({ x: current.x, y: current.y });
          setCurrentStep(current.step);

          switch (current.step) {
            case 1:
              setActiveCard("calendar");
              setTimeout(() => {
                setCurrentView("calendar");
                setActiveCard(null);
              }, 300);
              break;
            case 3:
              setActiveCard("team");
              setTimeout(() => {
                setCurrentView("team");
                setActiveCard(null);
              }, 300);
              break;
            case 5:
              setActiveCard("tasks");
              setTimeout(() => {
                setCurrentView("tasks");
                setActiveCard(null);
              }, 300);
              break;
            case 7:
              setProjectProgress(100);
              setTimeout(() => {
                setCompletedTasks([true, true, true]);
              }, 200);
              break;
            case 8:
              setTimeout(() => {
                setCompletedTasks([true, true, false]);
                setProjectProgress(75);
                setCurrentView("tasks");
                currentIndex = 0;
                runAnimation();
              }, 2000);
              return;
          }

          currentIndex++;
          timeoutId = setTimeout(runAnimation, current.duration);
        }
      };

      timeoutId = setTimeout(() => {
        runAnimation();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }, [dashboardRef]);

    const renderDashboardContent = () => {
      switch (currentView) {
        case "calendar":
          return (
            <div className="h-40 rounded-lg bg-violet-50 dark:bg-violet-900/20 p-3 overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Calendar View
                </h3>
                <span className="text-xs text-violet-700 dark:text-violet-400">
                  May 2025
                </span>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-xs">
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  S
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  M
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  T
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  W
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  T
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  F
                </div>
                <div className="text-center font-medium text-muted-foreground py-1 text-xs">
                  S
                </div>

                {Array.from({ length: 21 }, (_, i) => {
                  const date = i + 11;
                  const isToday = date === 22;
                  const hasEvent = [15, 18, 22, 25].includes(date);

                  return (
                    <div
                      key={i}
                      className={`text-center py-1 px-0.5 rounded text-xs h-6 flex items-center justify-center ${
                        isToday
                          ? "bg-violet-700 text-white"
                          : hasEvent
                          ? "bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-300"
                          : "text-foreground hover:bg-violet-100 dark:hover:bg-violet-800"
                      }`}
                    >
                      {date > 31 ? date - 31 : date}
                    </div>
                  );
                })}
              </div>
            </div>
          );

        case "team":
          return (
            <div className="h-40 rounded-lg bg-violet-50 dark:bg-violet-900/20 p-3 overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Team Members
                </h3>
                <span className="text-xs text-violet-700 dark:text-violet-400">
                  3 members
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center mr-2">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        Sarah Johnson
                      </div>
                      <div className="text-xs text-muted-foreground">Admin</div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                      <Edit3 className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        Mike Chen
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Editor
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        Emma Davis
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Member
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div className="h-40 rounded-lg bg-violet-50 dark:bg-violet-900/20 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-foreground">
                  Project Progress
                </h3>
                <motion.span
                  className="text-sm text-violet-700 dark:text-violet-400"
                  key={projectProgress}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {projectProgress}%
                </motion.span>
              </div>
              <div className="h-2 w-full bg-violet-100 dark:bg-violet-800/50 rounded-full mb-4">
                <motion.div
                  className="h-2 rounded-full bg-violet-700 dark:bg-violet-500"
                  initial={{ width: "75%" }}
                  animate={{ width: `${projectProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
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
                <div className="flex items-center relative">
                  <motion.div
                    animate={completedTasks[2] ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {completedTasks[2] ? (
                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-violet-300 dark:border-violet-600 rounded-full mr-2"></div>
                    )}
                  </motion.div>
                  <span className="text-sm text-muted-foreground">
                    Development{" "}
                    {completedTasks[2] ? "completed" : "in progress"}
                    {completedTasks[2] && (
                      <span className="text-xs text-green-500 ml-1">
                        Task Done!
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
      }
    };

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
                  className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-700 to-purple-600 opacity-30 blur-xl dark:from-violet-700/20 dark:to-purple-600/20"
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
                <div className="relative rounded-2xl bg-card dark:bg-card/90 p-6 shadow-2xl backdrop-blur-sm overflow-hidden">
                  <AnimatePresence>
                    {showCursor && isDesktop && (
                      <motion.div
                        className="absolute z-50 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: cursorPosition.x,
                          y: cursorPosition.y,
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <MousePointer
                          className={`h-5 w-5 text-violet-700 dark:text-violet-200 drop-shadow-lg rotate-6 ${
                            currentStep === 0 ||
                            currentStep === 2 ||
                            currentStep === 4 ||
                            currentStep === 6
                              ? "cursor-pointer"
                              : ""
                          }`}
                        />
                        {(currentStep === 1 ||
                          currentStep === 3 ||
                          currentStep === 5 ||
                          currentStep === 7) && (
                          <motion.div
                            className="absolute -inset-2 rounded-full border-2 border-violet-400"
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      <motion.div
                        className={`h-24 rounded-lg flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                          activeCard === "calendar"
                            ? "bg-violet-200 dark:bg-violet-700/50 scale-105 shadow-lg"
                            : currentView === "calendar"
                            ? "bg-violet-100 dark:bg-violet-800/40"
                            : "bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                        }`}
                        animate={
                          activeCard === "calendar"
                            ? { scale: 1.05 }
                            : { scale: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <CalendarIcon className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Calendar
                        </span>
                      </motion.div>
                      <motion.div
                        className={`h-24 rounded-lg flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                          activeCard === "team"
                            ? "bg-violet-200 dark:bg-violet-700/50 scale-105 shadow-lg"
                            : currentView === "team"
                            ? "bg-violet-100 dark:bg-violet-800/40"
                            : "bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                        }`}
                        animate={
                          activeCard === "team" ? { scale: 1.05 } : { scale: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <Users className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Team
                        </span>
                      </motion.div>
                      <motion.div
                        className={`h-24 rounded-lg flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                          activeCard === "tasks"
                            ? "bg-violet-200 dark:bg-violet-700/50 scale-105 shadow-lg"
                            : currentView === "tasks"
                            ? "bg-violet-100 dark:bg-violet-800/40"
                            : "bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                        }`}
                        animate={
                          activeCard === "tasks"
                            ? { scale: 1.05 }
                            : { scale: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <FileText className="h-8 w-8 text-violet-500 dark:text-violet-400 mb-1" />
                        <span className="text-xs text-violet-900 dark:text-violet-300 font-medium">
                          Tasks
                        </span>
                      </motion.div>
                    </div>

                    {/* Dynamic content area */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {renderDashboardContent()}
                      </motion.div>
                    </AnimatePresence>

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
