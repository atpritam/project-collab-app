import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Users,
  Shield,
  FileText,
  Zap,
  ChevronRight,
  BarChart,
  MessageSquare,
} from "lucide-react";

interface FeaturesProps {
  featuresInView: boolean;
}

const Features = React.forwardRef<HTMLDivElement, FeaturesProps>(
  ({ featuresInView }, ref) => {
    const features = [
      {
        icon: (
          <FileText className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Project Management",
        description:
          "Create and organize projects with customizable workflows to match your team's process.",
      },
      {
        icon: (
          <Users className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Team Collaboration",
        description:
          "Invite team members, assign tasks, and communicate effectively within the platform.",
      },
      {
        icon: (
          <CheckCircle className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Task Tracking",
        description:
          "Create, assign, and track tasks with different statuses to monitor progress.",
      },
      {
        icon: (
          <Shield className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Role-Based Access",
        description:
          "Control what project members can do with customizable permission levels.",
      },
      {
        icon: (
          <BarChart className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Progress Tracking",
        description:
          "Monitor project progress with visual dashboards and status updates.",
      },
      {
        icon: (
          <MessageSquare className="h-6 w-6 text-violet-700 group-hover:text-white" />
        ),
        title: "Team Chat",
        description:
          "Communicate with your team in real-time with built-in messaging.",
      },
    ];

    return (
      <div className="py-20 bg-background" ref={ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 mb-4">
                <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-1.5" /> Features
                </span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Powerful Features for Effective Collaboration
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
                Our platform provides all the tools you need to manage projects
                efficiently and keep your team aligned.
              </p>
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="relative bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-all hover:border-violet-200 dark:hover:border-violet-800 group"
                  >
                    <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-700 dark:group-hover:bg-violet-700 transition-colors">
                      {React.cloneElement(feature.icon, {
                        className:
                          "h-6 w-6 text-violet-700 dark:text-violet-400 group-hover:text-white transition-colors",
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
);

export default Features;
