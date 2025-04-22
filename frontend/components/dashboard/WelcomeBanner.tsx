"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

export function WelcomeBanner({ userName }: { userName: string }) {
  const hours = new Date().getHours();
  let greeting = "Good morning";

  if (hours >= 12 && hours < 18) {
    greeting = "Good afternoon";
  } else if (hours >= 18) {
    greeting = "Good evening";
  }

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  const dateString = today.toLocaleDateString("en-US", options);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-violet-800 p-8 text-white shadow-lg"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
          >
            <Clock className="mr-2 h-3 w-3" />
            <span>{dateString}</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold">
            {greeting}, {userName}!
          </motion.h1>
          <motion.p variants={itemVariants} className="text-white/80">
            You have 8 tasks and 3 projects due this week.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          <Link href="/calender">
            <Button
              size="sm"
              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm dark:text-accent-foreground cursor-pointer"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </Link>
          <Link href="/projects/create">
            <Button
              size="sm"
              className="rounded-full bg-white text-violet-800 hover:bg-white/90 cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
