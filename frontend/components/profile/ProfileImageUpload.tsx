"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Check, X, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  onImageUpdated?: () => void;
}

export default function ProfileImageUpload({
  onImageUpdated,
}: ProfileImageUploadProps) {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [confirmationView, setConfirmationView] = useState<"none" | "delete">(
    "none"
  );

  const isAuthenticated = status === "authenticated";
  const hasExistingImage = !!userData?.image;
  const isUploading = isLoading && !previewImage;

  // Helper function to get user initials for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // user profile data when authenticated
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchUserProfile();
    }
  }, [session?.user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const resetState = () => {
    setPreviewImage(null);
    setIsLoading(false);
    setConfirmationView("none");
  };

  const updateProfileImage = async (imageUrl: string | null) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/user/profile-image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile image");
      }

      // update session
      await update({
        ...session,
        user: {
          ...session?.user,
          image: imageUrl,
        },
      });

      // update local user data
      setUserData({
        ...userData,
        image: imageUrl,
      });

      toast.success(
        imageUrl
          ? "Profile picture updated successfully!"
          : "Profile picture removed successfully!"
      );

      if (onImageUpdated) {
        onImageUpdated();
      }

      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile image");
      console.error("Error updating profile image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (previewImage) {
      updateProfileImage(previewImage);
    }
  };

  const handleDeleteProfileImage = () => {
    setConfirmationView("none");
    updateProfileImage(null);
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
  };

  const ProfileAvatar = ({
    size = "large",
    showOverlay = false,
  }: {
    size?: "large" | "medium";
    showOverlay?: boolean;
  }) => {
    const sizeClasses = {
      large: "h-32 w-32 border-4",
      medium: "h-28 w-28 border-2",
    };

    const fallbackTextSize = size === "large" ? "text-2xl" : "text-2xl";

    return (
      <div className="relative">
        <Avatar
          className={`${sizeClasses[size]} border-white shadow-md transition-all duration-300`}
        >
          <AvatarImage
            src={userData?.image || ""}
            alt={userData?.name || ""}
            className="object-cover"
          />
          <AvatarFallback
            className={`${fallbackTextSize} bg-gradient-to-br from-violet-500 to-indigo-700 text-white`}
          >
            {getInitials(userData?.name || "")}
          </AvatarFallback>
        </Avatar>

        {showOverlay && (
          <div
            className={`absolute inset-0 bg-black/60 rounded-full flex items-center justify-center transition-opacity duration-300 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetState();
          }
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <ProfileAvatar size="large" showOverlay={true} />
                </div>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change profile picture</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              Profile Photo
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Upload a professional profile picture
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isLoading ? (
              <div className="h-40 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
                <p className="text-sm text-center">
                  {isUploading
                    ? "Uploading image..."
                    : "Saving your profile picture..."}
                </p>
              </div>
            ) : confirmationView === "delete" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <h3 className="font-medium text-red-800 mb-2">
                    Remove profile picture?
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    This will remove your current profile picture and replace it
                    with your initials. This action cannot be undone.
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmationView("none")}
                      size="sm"
                      className="flex items-center px-4"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteProfileImage}
                      size="sm"
                      className="flex items-center bg-red-600 hover:bg-red-700 px-4"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : previewImage ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt=""
                    className="w-40 h-40 object-cover rounded-full border-4 border-violet-100"
                  />
                </div>
                <p className="text-sm text-center text-gray-600">
                  How does this look?
                </p>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelPreview}
                    size="sm"
                    className="flex items-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-4"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmUpload}
                    size="sm"
                    className="flex items-center bg-violet-600 hover:bg-violet-700 px-4"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Set as profile picture
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                {hasExistingImage && (
                  <div className="w-full flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center cursor-pointer"
                      onClick={() => setConfirmationView("delete")}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Remove photo
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-center">
                  <ProfileAvatar size="medium" />
                </div>
                <div className="w-full max-w-xs">
                  <UploadButton
                    endpoint="profileImage"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        const uploadUrl = res[0].ufsUrl;
                        if (uploadUrl) {
                          console.log("Upload completed, URL:", uploadUrl);
                          setPreviewImage(uploadUrl);
                        } else {
                          toast.error("Invalid response from upload service");
                        }
                        setIsLoading(false);
                      } else {
                        toast.error("No files were uploaded");
                        setIsLoading(false);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload error:", error);
                      toast.error(`Upload failed: ${error.message}`);
                      setIsLoading(false);
                    }}
                    onUploadBegin={() => {
                      setIsLoading(true);
                    }}
                    appearance={{
                      button:
                        "bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-md font-medium w-full",
                      allowedContent: "hidden",
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    JPEG, PNG, or GIF (max. 1MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
