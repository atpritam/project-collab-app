"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  FolderPlus,
  CheckCircle2,
  Users,
  Clock,
  FileText,
  Lightbulb,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import ProjectFileUpload from "@/components/projects/ProjectFileUpload";
import { useSubscription } from "@/components/context/SubscriptionContext";

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreateProject } = useSubscription();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [projectFiles, setProjectFiles] = useState<any[]>([]);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/projects/new");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setFormError("Project name is required");
      return;
    }

    // Check subscription limits before submitting
    if (!canCreateProject) {
      router.push('/subscription?upgrade=projects');
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          dueDate: dueDate || null,
          files: projectFiles,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle subscription limit exceeded error
        if (data.error === 'SUBSCRIPTION_LIMIT_EXCEEDED') {
          router.push('/subscription?upgrade=projects');
          return;
        }
        
        throw new Error(data.message || "Failed to create project");
      }

      router.push("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-[80vh]">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
            <p className="text-muted-foreground">Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Project
            </h1>
            <p className="text-muted-foreground mt-1">
              Set up a new project and invite team members to collaborate
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="px-3 py-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
              New Project
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent>
            {formError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 text-sm mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="project-name"
                  className="text-base font-medium flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2 text-violet-600" />
                  Project Name*
                </Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter a descriptive project name"
                  className="h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Choose a clear, specific name that reflects the project's
                  purpose
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="project-description"
                  className="text-base font-medium flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2 text-violet-600" />
                  Description
                </Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the project goals, scope, and any other relevant details"
                  className="min-h-[120px] resize-y"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  A thorough description helps team members understand the
                  project's purpose
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="due-date"
                  className="text-base font-medium flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2 text-violet-600" />
                  Due Date (Optional)
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11"
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  When should this project be completed?
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="project-files"
                  className="text-base font-medium flex items-center"
                >
                  <Paperclip className="h-4 w-4 mr-2 text-violet-600" />
                  Project Files (Optional)
                </Label>
                <ProjectFileUpload
                  files={projectFiles}
                  setFiles={setProjectFiles}
                  maxFiles={5}
                />
                <p className="text-xs text-muted-foreground">
                  Add project documentation or reference materials for your team
                </p>
              </div>

              <div className="pt-4">
                <Separator className="mb-6" />
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white order-1 sm:order-2"
                    disabled={!projectName || isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="text-lg pb-4">Project Preview</div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                    Name
                  </h3>
                  <p className="font-medium">
                    {projectName || "Your project name will appear here"}
                  </p>
                </div>

                {dueDate && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                      Due Date
                    </h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-violet-600" />
                      <span>
                        {new Date(dueDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                    Team Members
                  </h3>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-violet-600" />
                    <span>You (Admin)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can invite team members after creating the project
                  </p>
                </div>

                {projectFiles.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1.5">
                      Attached Files
                    </h3>
                    <div className="flex items-center text-sm">
                      <Paperclip className="h-4 w-4 mr-2 text-violet-600" />
                      <span>{projectFiles.length} file(s) attached</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-lg pb-4">Project Tips</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <Lightbulb className="h-8 w-8 mr-2 text-amber-500 mt-0.5" />
                  <span>
                    Break down your project into smaller, manageable tasks
                  </span>
                </div>
                <li className="flex items-start">
                  <Lightbulb className="h-8 w-8 mr-2 text-amber-500 mt-0.5" />
                  <span>
                    Set clear milestones and deadlines for better tracking
                  </span>
                </li>
                <li className="flex items-start">
                  <Lightbulb className="h-8 w-8 mr-2 text-amber-500 mt-0.5" />
                  <span>
                    Invite all relevant team members for better collaboration
                  </span>
                </li>
                <li className="flex items-start">
                  <Lightbulb className="h-8 w-8 mr-2 text-amber-500 mt-0.5" />
                  <span>
                    Use task descriptions to provide clear context and
                    requirements
                  </span>
                </li>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
