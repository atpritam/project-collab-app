"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Mail,
  Briefcase,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { getStatusBadge, getRoleBadge } from "@/lib/badge-utils";
import { formatDate } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  profile?: {
    bio?: string;
    skills?: string;
    jobTitle?: string;
    department?: string;
  };
  projectsCount: number;
  publicProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    memberCount: number;
    userRole: string;
  }>;
}

function UserProfileContent() {
  const params = useParams();
  const { data: session } = useSession();
  const email = decodeURIComponent(params.email as string);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email === email) {
      // Redirect to own profile page
      window.location.href = "/profile";
      return;
    }

    fetchUserProfile();
  }, [email, session]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/user/profile/view?email=${encodeURIComponent(email)}`
      );

      if (response.status === 404) {
        setError("User not found");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              {error === "User not found" ? "User Not Found" : "Error"}
            </h1>
            <p className="text-muted-foreground">
              {error === "User not found"
                ? "The user you're looking for doesn't exist or isn't available."
                : "Failed to load user profile. Please try again later."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage
                  src={userProfile.image || ""}
                  alt={userProfile.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-2xl">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">
                  {userProfile.name || "Unnamed User"}
                </h1>
                <div className="flex items-center justify-center md:justify-start mt-2 text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{userProfile.email}</span>
                </div>
                {userProfile.profile?.jobTitle && (
                  <div className="flex items-center justify-center md:justify-start mt-1 text-muted-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{userProfile.profile.jobTitle}&nbsp;</span>
                    {userProfile.profile.department && (
                      <span>at {userProfile.profile.department}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  {userProfile.profile?.bio ? (
                    <p className="text-muted-foreground leading-relaxed">
                      {userProfile.profile.bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      This user hasn't added a bio yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Skills Section */}
              {userProfile.profile?.skills && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.profile.skills
                        .split(",")
                        .map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-sm"
                          >
                            {skill.trim()}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <CardTitle>Shared Projects</CardTitle>
              {userProfile.publicProjects.length > 0 ? (
                <div className="space-y-4">
                  {userProfile.publicProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.description.length > 100
                                  ? `${project.description.substring(
                                      0,
                                      100
                                    )}...`
                                  : project.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {getStatusBadge(project.status)}
                              {getRoleBadge(project.userRole)}
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                {project.memberCount} member
                                {project.memberCount !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  You don't share any projects with this user yet.
                </p>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Member Since
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(userProfile.createdAt)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Projects
                    </span>
                    <span className="text-sm font-medium">
                      {userProfile.projectsCount}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Shared Projects
                    </span>
                    <span className="text-sm font-medium">
                      {userProfile.publicProjects.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
          </main>
          <Footer />
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
