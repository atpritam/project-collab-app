"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface TestimonialsProps {
  testimonialsInView?: boolean;
}

interface TestimonialData {
  name: string;
  handle: string;
  avatar: string;
  content: string;
  highlight?: string;
}

const Testimonials = React.forwardRef<HTMLDivElement, TestimonialsProps>(
  ({ testimonialsInView = true }, ref) => {
    const testimonials1: TestimonialData[] = [
      {
        name: "Sarah Johnson",
        handle: "@sarahjdev",
        avatar: "/female-icon.jpg?height=48&width=48",
        content:
          "I'm using @Nudge_App for our team projects and the role-based permissions are a game-changer. No more access confusion!",
        highlight: "@Nudge_App",
      },
      {
        name: "Michael Chen",
        handle: "@mchen_tech",
        avatar: "/placeholder.jpg?height=48&width=48",
        content:
          "Switched from Dyla to @Nudge_App and our team productivity increased by 40%. The Kanban board view is incredibly intuitive.",
        highlight: "@Nudge_App",
      },
      {
        name: "Emily Rodriguez",
        handle: "@emilyr_design",
        avatar: "/female-icon.jpg?height=48&width=48",
        content:
          "The real-time chat in @Nudge_App eliminated our need for chat_App. One platform for everything = less context switching!",
        highlight: "@Nudge_App",
      },
      {
        name: "David Kim",
        handle: "@davidkim_dev",
        avatar: "/placeholder.jpg?height=48&width=48",
        content:
          "Our remote team relies on @Nudge_App for everything. The file management system has been crucial for our design handoffs.",
        highlight: "@Nudge_App",
      },
      {
        name: "Jessica Taylor",
        handle: "@jtaylor_pm",
        avatar: "/female-icon.jpg?height=48&width=48",
        content:
          "Just migrated our entire project tracking to @Nudge_App and it's been a game changer. The dashboard gives me the perfect overview.",
        highlight: "@Nudge_App",
      },
    ];

    // Second row testimonials
    const testimonials2: TestimonialData[] = [
      {
        name: "Alex Wilson",
        handle: "@alexw_cto",
        avatar: "/placeholder.jpg?height=48&width=48",
        content:
          "As a CTO, I appreciate how @Nudge_App handles permissions. The three-tier system (Admin, Editor, Member) is exactly what we needed.",
        highlight: "@Nudge_App",
      },
      {
        name: "Sophia Martinez",
        handle: "@sophiam_ux",
        avatar: "/female-icon.jpg?height=48&width=48",
        content:
          "The UI of @Nudge_App is so clean and intuitive. As a UX designer, I'm impressed by how they've simplified complex workflows.",
        highlight: "@Nudge_App",
      },
      {
        name: "James Thompson",
        handle: "@jamest_agile",
        avatar: "/placeholder.jpg?height=48&width=48",
        content:
          "We've been using @Nudge_App for our sprints since March, and it's been an absolute joy. The task tracking and calendar features are perfect.",
        highlight: "@Nudge_App",
      },
      {
        name: "Olivia Parker",
        handle: "@oliviap_content",
        avatar: "/female-icon.jpg?height=48&width=48",
        content:
          "@Nudge_App has the best email notification system. Never miss an update, but also not overwhelmed with alerts. Perfect balance!",
        highlight: "@Nudge_App",
      },
      {
        name: "Daniel Lee",
        handle: "@danlee_dev",
        avatar: "/placeholder.jpg?height=48&width=48",
        content:
          "Moving from Apex to @Nudge_App was the best decision we made this year. Better UI, faster performance, and the Socket.IO integration is brilliant.",
        highlight: "@Nudge_App",
      },
    ];

    const TestimonialCard = ({
      testimonial,
    }: {
      testimonial: TestimonialData;
    }) => {
      const highlightText = (text: string, highlight: string) => {
        if (!highlight) return text;

        const parts = text.split(new RegExp(`(${highlight})`, "gi"));
        return parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={i}
              className="text-violet-600 dark:text-violet-400 cursor-pointer"
              onClick={() => {
                window.location.href =
                  "https://github.com/atpritam/project-collab-app";
              }}
            >
              {part}
            </span>
          ) : (
            part
          )
        );
      };

      return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 min-w-[260px] sm:min-w-[300px] max-w-[300px] sm:max-w-[350px] mx-2 sm:mx-3 flex-shrink-0 h-auto relative overflow-hidden shadow-sm dark:shadow-none py-8 sm:py-10">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden mr-2 sm:mr-3 bg-gray-100 dark:bg-zinc-800">
              <Image
                src={testimonial.avatar || "/placeholder.jpg"}
                alt={testimonial.name}
                width={40}
                height={40}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => {
                  window.location.href = "https://github.com/atpritam";
                }}
              />
            </div>
            <div>
              <h4
                className="text-gray-900 dark:text-white font-medium text-sm sm:text-base cursor-pointer"
                onClick={() => {
                  window.location.href = "https://github.com/atpritam";
                }}
              >
                {testimonial.name}
              </h4>
              <p
                className="text-gray-500 dark:text-zinc-500 text-xs sm:text-sm cursor-pointer"
                onClick={() => {
                  window.location.href = "https://github.com/atpritam";
                }}
              >
                {testimonial.handle}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            {highlightText(testimonial.content, testimonial.highlight || "")}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent"></div>
        </div>
      );
    };

    return (
      <div
        className="py-10 sm:py-16 bg-gray-50 dark:bg-zinc-950 overflow-hidden"
        ref={ref}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center rounded-full bg-violet-50 dark:bg-zinc-800/50 px-3 py-1 sm:px-4 sm:py-1.5 mb-3 sm:mb-4">
              <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                <Star className="h-4 w-4 mr-1.5" /> Testimonials
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Loved by teams worldwide
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-zinc-400 mx-auto px-2">
              See what users have to say about how Nudge has transformed their
              workflow.
            </p>
          </div>

          <div className="relative mb-6 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-gray-50 dark:from-zinc-950 to-transparent pointer-events-none"></div>

            <motion.div
              className="flex"
              initial={{ x: "0%" }}
              animate={{ x: "-100%" }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              }}
            >
              {[...testimonials1, ...testimonials1].map(
                (testimonial, index) => (
                  <TestimonialCard
                    key={`row1-${index}`}
                    testimonial={testimonial}
                  />
                )
              )}
            </motion.div>

            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-gray-50 dark:from-zinc-950 to-transparent pointer-events-none"></div>
          </div>

          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-gray-50 dark:from-zinc-950 to-transparent pointer-events-none"></div>

            <motion.div
              className="flex"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              }}
            >
              {[...testimonials2, ...testimonials2].map(
                (testimonial, index) => (
                  <TestimonialCard
                    key={`row2-${index}`}
                    testimonial={testimonial}
                  />
                )
              )}
            </motion.div>

            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-gray-50 dark:from-zinc-950 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    );
  }
);

Testimonials.displayName = "Testimonials";

export default Testimonials;
