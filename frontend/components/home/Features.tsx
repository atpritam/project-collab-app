"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Users,
  Shield,
  FileText,
  Zap,
  BarChart,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturesProps {
  featuresInView: boolean;
}

const Features = React.forwardRef<HTMLDivElement, FeaturesProps>(
  ({ featuresInView }, ref) => {
    const features = [
      {
        icon: <FileText />,
        title: "Project Management",
        description:
          "Create and organize projects with workflows and tasks to match your team's process.",
        size: "large",
        accent: "violet",
      },
      {
        icon: <Users />,
        title: "Team Collaboration",
        description:
          "Invite team members, assign tasks, and communicate effectively within the platform.",
        size: "medium",
        accent: "blue",
      },
      {
        icon: <CheckCircle />,
        title: "Task Tracking",
        description:
          "Create, assign, and track tasks with different statuses to monitor progress.",
        size: "medium",
        accent: "green",
      },
      {
        icon: <Shield />,
        title: "Role-Based Access",
        description:
          "Control what project members can do with three-tier permission levels.",
        size: "small",
        accent: "violet",
      },
      {
        icon: <BarChart />,
        title: "Progress Tracking",
        description:
          "Monitor project progress with visual dashboards and status updates.",
        size: "medium",
        accent: "violet",
      },
      {
        icon: <MessageSquare />,
        title: "Team Chat",
        description:
          "Communicate with your team in real-time with built-in messaging.",
        size: "small",
        accent: "blue",
      },
    ];

    const container = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.3,
        },
      },
    };

    const item = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const getAccentColor = (accent: string) => {
      const colors = {
        violet: {
          bg: "bg-violet-100 dark:bg-violet-900/30",
          text: "text-violet-700 dark:text-violet-400 dark:group-hover:text-white",
          hover: "group-hover:bg-violet-700 dark:group-hover:bg-violet-800/40",
          gradient: "from-violet-500/20 to-transparent",
          patternColor: "rgba(139, 92, 246, 0.4)",
          patternColorDark: "rgba(139, 92, 246, 0.6)",
          beamColor: "rgba(139, 92, 246, 0.8)",
        },
        blue: {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-400 dark:group-hover:text-white",
          hover: "group-hover:bg-blue-700 dark:group-hover:bg-blue-800/60",
          gradient: "from-blue-500/20 to-transparent",
          patternColor: "rgba(59, 130, 246, 0.4)",
          patternColorDark: "rgba(59, 130, 246, 0.6)",
          beamColor: "rgba(59, 130, 246, 0.8)",
        },
        green: {
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          text: "text-emerald-700 dark:text-emerald-400 dark:group-hover:text-white",
          hover:
            "group-hover:bg-emerald-700 dark:group-hover:bg-emerald-800/60",
          gradient: "from-emerald-500/20 to-transparent",
          patternColor: "rgba(16, 185, 129, 0.4)",
          patternColorDark: "rgba(16, 185, 129, 0.6)",
          beamColor: "rgba(16, 185, 129, 0.8)",
        },
      };
      return colors[accent as keyof typeof colors] || colors.violet;
    };

    return (
      <div className="py-16 bg-background relative overflow-hidden" ref={ref}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 mb-4">
              <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1.5" /> Features
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Powerful Features for Effective Collaboration
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground mx-auto">
              Our platform provides all the tools you need to manage projects
              efficiently and keep your team aligned.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate={featuresInView ? "show" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-4"
          >
            {features.map((feature, index) => {
              const accentColors = getAccentColor(feature.accent);

              const specialPositions = {
                0: "md:col-span-4 md:row-span-1",
                1: "md:col-span-2 md:row-span-1",
                2: "md:col-span-3 md:row-span-1",
                3: "md:col-span-3 md:row-span-1",
                4: "md:col-span-2 md:row-span-1",
                5: "md:col-span-4 md:row-span-1",
              };

              return (
                <div
                  key={index}
                  className={cn(
                    "group relative bg-card/40 rounded-2xl border border-border transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden",
                    specialPositions[index as keyof typeof specialPositions],
                    index === 0 && "md:col-start-1",
                    index === 1 && "md:col-start-5",
                    index === 2 && "md:col-start-1",
                    index === 3 && "md:col-start-4",
                    index === 4 && "md:col-start-1",
                    index === 5 && "md:col-start-3"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br transition-opacity duration-500",
                      accentColors.gradient
                    )}
                  />

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at bottom right, ${accentColors.patternColorDark} 0%, ${accentColors.patternColor} 30%, transparent 70%)`,
                        maskImage: `
                        repeating-conic-gradient(
                          currentColor 0deg 30deg, 
                          transparent 30deg 60deg
                        )`,
                        WebkitMaskImage: `
                        repeating-conic-gradient(
                          currentColor 0deg 30deg, 
                          transparent 30deg 60deg
                        )`,
                        maskSize: "24px 24px",
                        WebkitMaskSize: "24px 24px",
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at bottom right, ${accentColors.patternColorDark} 0%, ${accentColors.patternColor} 40%, transparent 80%)`,
                        maskImage: `
                        repeating-conic-gradient(
                          transparent 0deg 15deg, 
                          currentColor 15deg 30deg,
                          transparent 30deg 60deg
                        )`,
                        WebkitMaskImage: `
                        repeating-conic-gradient(
                          transparent 0deg 15deg, 
                          currentColor 15deg 30deg,
                          transparent 30deg 60deg
                        )`,
                        maskSize: "32px 32px",
                        WebkitMaskSize: "32px 32px",
                        maskPosition: "4px 4px",
                        WebkitMaskPosition: "4px 4px",
                      }}
                    />
                  </div>

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute origin-bottom-right"
                        style={{
                          bottom: "0",
                          right: "0",
                          width: "200%",
                          height: "6px",
                          background: accentColors.beamColor,
                          transform: `rotate(${i * 22.5}deg)`,
                          transformOrigin: "bottom right",
                          opacity: 0,
                          animation: `beamEffect 2s ease-out ${
                            i * 0.15
                          }s forwards`,
                        }}
                      />
                    ))}
                  </div>

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/10 dark:bg-black/10 z-[1]"
                    style={{
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  />

                  <div className="p-5 h-full flex flex-col relative z-10">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        accentColors.bg,
                        accentColors.hover
                      )}
                    >
                      {React.cloneElement(feature.icon, {
                        className: cn(
                          "h-5 w-5 transition-colors",
                          accentColors.text,
                          "group-hover:text-white"
                        ),
                      })}
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-muted-foreground flex-grow">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    );
  }
);

Features.displayName = "Features";

export default Features;
