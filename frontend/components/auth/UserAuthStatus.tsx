"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAuthStatusProps {
  mobile?: boolean;
  onAction?: () => void; // Callback for when an action is taken (e.g., signout or link click)
}

export default function UserAuthStatus({
  mobile = false,
  onAction,
}: UserAuthStatusProps) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = status === "authenticated";

  // user profile data fetching
  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserProfile();
    }
  }, [isAuthenticated, session?.user?.id]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // User data
  const userName = userData?.name || session?.user?.name || "";
  const userEmail = userData?.email || session?.user?.email || "";
  const userImage = userData?.image || session?.user?.image || "";

  const handleSignOut = async () => {
    if (onAction) onAction();
    await signOut({ callbackUrl: "/" });
  };

  const handleLinkClick = () => {
    if (onAction) onAction();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (mobile) {
    // Mobile version
    return (
      <>
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10 border border-violet-100">
              <AvatarImage
                src={userImage}
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-sm">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-foreground">
              {userName}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {userEmail}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1 px-2">
          <Link
            href="/profile"
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900"
            onClick={handleLinkClick}
          >
            Your Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  // Desktop version
  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10 border border-violet-100">
          <AvatarImage
            src={userImage}
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-sm">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </div>
    </div>
  );
}
