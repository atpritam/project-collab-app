"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAuthStatusProps {
  mobile?: boolean;
  onAction?: () => void; // Callback for when an action is taken (e.g., signout or link click)
  Authenticated?: boolean;
  Name?: string;
  Email?: string;
  Image?: string;
  avatarOnly?: boolean;
  clickable?: boolean;
}

export default function UserAuthStatus({
  mobile = false,
  onAction,
  Authenticated = false,
  Name = "",
  Email = "",
  Image = "",
  avatarOnly = false,
  clickable = false,
}: UserAuthStatusProps) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Authenticated || status === "authenticated";

  // user profile data fetching
  useEffect(() => {
    if (isAuthenticated && session?.user?.id && (!Name || !Email || !Image)) {
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
  const userName = Name || userData?.name || session?.user?.name || "";
  const userEmail = Email || userData?.email || session?.user?.email || "";
  const userImage = Image || userData?.image || session?.user?.image || "";

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

  const AvatarComponent = () => (
    <Avatar className="h-10 w-10">
      <AvatarImage src={userImage} alt={userName} className="object-cover" />
      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-sm">
        {getInitials(userName)}
      </AvatarFallback>
    </Avatar>
  );

  const ClickableAvatar = clickable ? (
    <Link
      href="/profile"
      onClick={handleLinkClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <AvatarComponent />
    </Link>
  ) : (
    <AvatarComponent />
  );

  if (mobile) {
    // Mobile version
    return (
      <>
        <div className="flex items-center px-4">
          <div className="flex-shrink-0 mr-2">{ClickableAvatar}</div>
          {!avatarOnly && (
            <div className="flex flex-col">
              {clickable ? (
                <Link
                  href="/profile"
                  onClick={handleLinkClick}
                  className="text-sm font-medium hover:text-violet-700 transition-colors"
                >
                  {userName}
                </Link>
              ) : (
                <p className="text-sm font-medium">{userName}</p>
              )}
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          )}
        </div>
        {!avatarOnly && (
          <div className="mt-3 space-y-1 px-2">
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900"
              onClick={handleLinkClick}
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </>
    );
  }

  // Desktop version
  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-3">
        {ClickableAvatar}
        {!avatarOnly && (
          <div className="flex flex-col">
            {clickable ? (
              <Link
                href="/profile"
                onClick={handleLinkClick}
                className="text-sm font-medium hover:text-violet-700 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <p className="text-sm font-medium">{userName}</p>
            )}
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
