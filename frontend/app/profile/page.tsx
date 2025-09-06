"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { CollaborationPreferences } from "@/components/profile/collaboration-preferences";
import { SecuritySettings } from "@/components/profile/security-settings";
import { NotificationPreferences } from "@/components/profile/notification-preferences";
import { AccountActions } from "@/components/profile/account-actions";
import { useUserSettings } from "@/components/context/UserSettingsContext";
import { checkPassword } from "@/lib/utils";

// Loading fallback component
function LoadingProfile() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Content component
function ProfileContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: settingsLoading } = useUserSettings();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "settings" ? "settings" : "profile"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    jobTitle: "",
    department: "",
    skills: "",
    bio: "",
    dateJoined: "",
    projectsCount: 0,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [hasPasswordAuth, setHasPasswordAuth] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [OAuthProviders, setOAuthProviders] = useState<string[]>([]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + url.search);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }

    if (session?.user && !profileDataLoaded) {
      fetchUserProfile();
    }
  }, [status, router, session, profileDataLoaded]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "settings" || tab === "profile") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/profile");

      if (response.ok) {
        const userData = await response.json();

        // auth type
        setHasPasswordAuth(userData.authType?.hasPasswordAuth || false);

        // OAuth providers
        if (userData.authType?.oauthProviders) {
          setOAuthProviders(userData.authType.oauthProviders);
        }

        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          jobTitle: userData.profile?.jobTitle || "",
          department: userData.profile?.department || "",
          skills: userData.profile?.skills || "",
          bio: userData.profile?.bio || "",
          dateJoined: userData.createdAt
            ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          projectsCount: userData.memberProjectsCount || 0,
        });

        setProfileDataLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // personal info form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          jobTitle: formData.jobTitle,
          department: formData.department,
          skills: formData.skills,
        }),
      });

      if (response.ok) {
        // session update
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
          },
        });

        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!hasPasswordAuth) {
      const providers = OAuthProviders.join(", ");
      const provider = OAuthProviders.length > 1 ? "these" : "this";
      setPasswordError(
        `Password login is disabled. Use ${provider} OAuth to sign in: ${providers}`
      );
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "New password cannot be the same as the current password"
      );
      return;
    }

    if (!checkPassword(newPassword)) {
      setPasswordError(
        "New password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.message || "Failed to update password");
      } else {
        toast.success("Password updated successfully");
        setPasswordSuccess("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (status === "loading" || !session || isLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen ">
      <Header />

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <ProfileHeader isSaving={isSaving} onSave={handleSubmit} />

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ProfileSidebar
                  dateJoined={formData.dateJoined}
                  projectsCount={formData.projectsCount}
                />
                <PersonalInfoForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
                <CollaborationPreferences />
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid grid-cols-1 gap-8">
                <SecuritySettings
                  currentPassword={currentPassword}
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  setCurrentPassword={setCurrentPassword}
                  setNewPassword={setNewPassword}
                  setConfirmPassword={setConfirmPassword}
                  handlePasswordUpdate={handlePasswordUpdate}
                  isUpdatingPassword={isUpdatingPassword}
                  passwordError={passwordError}
                  passwordSuccess={passwordSuccess}
                />
                <NotificationPreferences />
                <AccountActions hasPasswordAuth={hasPasswordAuth} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingProfile />}>
      <ProfileContent />
    </Suspense>
  );
}
