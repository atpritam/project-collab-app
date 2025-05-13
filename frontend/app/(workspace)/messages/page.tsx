"use client";

import React, { Suspense, lazy } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MessagesLayout = lazy(
  () => import("@/components/messages/MessagesLayout")
);

export default function MessagesPage() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div>
        <h1
          className={`text-3xl font-bold tracking-tight flex items-center gap-2 ${
            isMobile ? "mt-2" : ""
          }`}
        >
          <MessageSquare className="h-7 w-7" />
          Messages
        </h1>
        {!isMobile && (
          <p className="text-muted-foreground mt-1">
            Chat with your team members and collaborators
          </p>
        )}
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
          </div>
        }
      >
        <MessagesLayout />
      </Suspense>
    </div>
  );
}
