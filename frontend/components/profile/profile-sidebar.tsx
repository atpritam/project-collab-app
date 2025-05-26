"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";

interface ProfileSidebarProps {
  dateJoined: string;
  projectsCount: number;
}

export function ProfileSidebar({
  dateJoined,
  projectsCount,
}: ProfileSidebarProps) {
  return (
    <Card className="col-span-1 md:row-span-2 h-fit">
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Your profile picture will be visible to team members
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="flex justify-center mb-6">
          <ProfileImageUpload
            onImageUpdated={() => {
              // Optional: Refresh profile data if needed
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Click on the avatar to upload a new image. JPG, GIF or PNG. 1MB max.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 border-t border-border pt-6">
        <div className="w-full">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Account Summary
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member Since</span>
            <span className="text-foreground">{dateJoined}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Projects</span>
            <span className="text-foreground">{projectsCount}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
