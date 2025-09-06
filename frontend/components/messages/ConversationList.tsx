import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSocket } from "../context/SocketContext";
import { getInitials } from "@/lib/utils";

interface Conversation {
  // Common fields
  lastMessageAt: string;
  lastMessageContent: string;
  unreadCount: number;

  // Direct message specific fields
  userId?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };

  // Team chat specific fields
  projectId?: string;
  isTeamChat?: boolean;
  name?: string;
  description?: string;
  memberCount?: number;
  lastMessageSender?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  teamConversations: Conversation[];
  selectedId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onConversationsUpdate?: (updatedConversations: Conversation[]) => void;
  onTeamConversationsUpdate?: (updatedConversations: Conversation[]) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  teamConversations,
  selectedId,
  onSelectConversation,
  searchQuery,
  setSearchQuery,
  onConversationsUpdate,
  onTeamConversationsUpdate,
}) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // direct message conversation updates
    const handleConversationUpdate = (data: {
      userId: string;
      lastMessageAt: string;
      lastMessageContent?: string;
      isUnread: boolean;
    }) => {
      const updatedConversations = [...conversations];

      const conversationIndex = updatedConversations.findIndex(
        (conv) => conv.userId === data.userId
      );

      if (conversationIndex >= 0) {
        const updatedConversation = {
          ...updatedConversations[conversationIndex],
          lastMessageAt: data.lastMessageAt,
          unreadCount: data.isUnread
            ? updatedConversations[conversationIndex].unreadCount + 1
            : updatedConversations[conversationIndex].unreadCount,
        };

        if (data.lastMessageContent) {
          updatedConversation.lastMessageContent = data.lastMessageContent;
        }

        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(updatedConversation);
      }

      if (onConversationsUpdate) {
        onConversationsUpdate(updatedConversations);
      }
    };

    // team conversation updates
    const handleTeamConversationUpdate = (data: {
      projectId: string;
      lastMessageAt: string;
      lastMessageContent?: string;
      lastMessageSender?: {
        id: string;
        name: string | null;
        image: string | null;
      } | null;
      isUnread: boolean;
    }) => {
      const updatedTeamConversations = [...teamConversations];

      const conversationIndex = updatedTeamConversations.findIndex(
        (conv) => conv.projectId === data.projectId
      );

      if (conversationIndex >= 0) {
        const updatedConversation = {
          ...updatedTeamConversations[conversationIndex],
          lastMessageAt: data.lastMessageAt,
          unreadCount: data.isUnread
            ? updatedTeamConversations[conversationIndex].unreadCount + 1
            : updatedTeamConversations[conversationIndex].unreadCount,
        };

        if (data.lastMessageContent) {
          updatedConversation.lastMessageContent = data.lastMessageContent;
        }

        if (data.lastMessageSender) {
          updatedConversation.lastMessageSender = data.lastMessageSender;
        }

        updatedTeamConversations.splice(conversationIndex, 1);
        updatedTeamConversations.unshift(updatedConversation);
      }

      if (onTeamConversationsUpdate) {
        onTeamConversationsUpdate(updatedTeamConversations);
      }
    };

    const handleMessagesRead = (data: { userId: string }) => {
      const updatedConversations = conversations.map((conv) => {
        if (conv.userId === data.userId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });

      if (onConversationsUpdate) {
        onConversationsUpdate(updatedConversations);
      }
    };

    socket.on("conversation_update", handleConversationUpdate);
    socket.on("team_conversation_update", handleTeamConversationUpdate);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("conversation_update", handleConversationUpdate);
      socket.off("team_conversation_update", handleTeamConversationUpdate);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [
    socket,
    conversations,
    teamConversations,
    onConversationsUpdate,
    onTeamConversationsUpdate,
  ]);

  const formatLastActive = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const truncateMessage = (message: string, maxLength = 30) => {
    if (!message) return "New conversation";
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  // Combine conversations and teamConversations
  const allConversations = [...conversations, ...teamConversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  const filteredConversations = allConversations.filter((conversation) => {
    if (conversation.isTeamChat) {
      // Team chat search
      const projectName = conversation.name?.toLowerCase() || "";
      const projectDesc = conversation.description?.toLowerCase() || "";
      const messageContent =
        conversation.lastMessageContent?.toLowerCase() || "";
      return (
        projectName.includes(searchQuery.toLowerCase()) ||
        projectDesc.includes(searchQuery.toLowerCase()) ||
        messageContent.includes(searchQuery.toLowerCase())
      );
    } else {
      // Direct message search
      const userName = conversation.user?.name?.toLowerCase() || "";
      const userEmail = conversation.user?.email.toLowerCase() || "";
      const messageContent =
        conversation.lastMessageContent?.toLowerCase() || "";
      return (
        userName.includes(searchQuery.toLowerCase()) ||
        userEmail.includes(searchQuery.toLowerCase()) ||
        messageContent.includes(searchQuery.toLowerCase())
      );
    }
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No conversations match your search"
                : "No conversations yet"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isTeamChat = !!conversation.isTeamChat;
            const conversationId = isTeamChat
              ? conversation.projectId
              : conversation.userId;
            const isSelected = conversationId === selectedId;

            return (
              <div
                key={
                  isTeamChat ? `team-${conversationId}` : `dm-${conversationId}`
                }
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                  isSelected && "bg-accent",
                  conversation.unreadCount > 0 && "bg-accent/20" // Subtle highlight for unread
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="relative">
                  {isTeamChat ? (
                    // Team Chat Avatar
                    <Avatar className="bg-violet-100 dark:bg-violet-900/30">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white">
                        {getInitials(conversation.name ?? null)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    // Direct Message Avatar
                    <Avatar>
                      <AvatarImage
                        src={conversation.user?.image || ""}
                        alt={conversation.user?.name || "User"}
                      />
                      <AvatarFallback>
                        {getInitials(conversation.user?.name ?? null)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3
                      className={cn(
                        "font-medium truncate flex items-center",
                        conversation.unreadCount > 0 && "font-semibold"
                      )}
                    >
                      {isTeamChat ? (
                        <>
                          {conversation.name || "Project Chat"}
                          <Users className="h-3 w-3 ml-1 text-muted-foreground" />
                        </>
                      ) : (
                        conversation.user?.name || conversation.user?.email
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatLastActive(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      conversation.unreadCount > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {isTeamChat && conversation.lastMessageSender ? (
                      <span>
                        <span className="font-medium">
                          {conversation.lastMessageSender.name || "User"}:
                        </span>{" "}
                        {truncateMessage(conversation.lastMessageContent)}
                      </span>
                    ) : (
                      truncateMessage(conversation.lastMessageContent)
                    )}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="bg-primary text-primary-foreground text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
