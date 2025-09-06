import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  currentUserId: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
}) => {
  const isCurrentUser = message.sender.id === currentUserId;

  return (
    <div
      className={cn("flex gap-3 mb-4", isCurrentUser ? "flex-row-reverse" : "")}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={message.sender.image || ""}
            alt={message.sender.name || "User"}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isCurrentUser ? "items-end" : ""
        )}
      >
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
