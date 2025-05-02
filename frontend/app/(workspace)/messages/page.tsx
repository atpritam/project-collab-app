"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import MessagesLayout from "@/components/messages/MessagesLayout";
import { useIsMobile } from "@/hooks/use-mobile";

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

      <MessagesLayout />
    </div>
  );
}
