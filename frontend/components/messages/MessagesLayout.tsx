import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSocket } from "../context/SocketContext";
import { Skeleton } from "@/components/ui/skeleton";
const ConversationList = lazy(() => import("./ConversationList"));
const Chat = lazy(() => import("./Chat"));
const TeamChat = lazy(() => import("./TeamChat"));
const NewMessageButton = lazy(() => import("./NewMessageButton"));
const EmptyState = lazy(() => import("./EmptyState"));

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  creator: string;
  memberCount: number;
}

interface Conversation {
  // Common fields
  lastMessageAt: string;
  lastMessageContent: string;
  unreadCount: number;

  // Direct message specific fields
  userId?: string;
  user?: User;

  // Team chat specific fields
  projectId?: string;
  isTeamChat?: boolean;
  name?: string;
  description?: string;
  creator?: string;
  memberCount?: number;
  lastMessageSender?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

const MessagesLayout = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { socket, isConnected } = useSocket();

  const [directConversations, setDirectConversations] = useState<
    Conversation[]
  >([]);
  const [teamConversations, setTeamConversations] = useState<Conversation[]>(
    []
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [showConversationList, setShowConversationList] = useState(
    !isMobile || (!searchParams.get("email") && !searchParams.get("projectId"))
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Refs to track info requests in progress
  const fetchingUserRef = useRef<Set<string>>(new Set());
  const fetchingProjectRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDirectConversations();
      fetchTeamConversations();

      // URL params for chat selection
      const email = searchParams.get("email");
      const projectId = searchParams.get("projectId");

      if (email) {
        fetchUserInfo(email);
      } else if (projectId) {
        fetchProjectInfo(projectId);
      }
    }
  }, [status, searchParams]);

  useEffect(() => {
    if (isMobile) {
      setShowConversationList(!selectedUser && !selectedProject);
    } else {
      setShowConversationList(true);
    }
  }, [selectedUser, selectedProject, isMobile]);

  useEffect(() => {
    if (!socket || !isConnected || !session?.user?.id) return;

    const handleNewMessage = (message: any) => {
      if (
        selectedUser &&
        (message.senderId === selectedUser.id ||
          message.receiverId === selectedUser.id)
      ) {
        return;
      }

      if (message.senderId !== session.user.id) {
        const sender = directConversations.find(
          (c) => c.userId === message.senderId
        );
        const senderName = sender?.user?.name || "Someone";
        toast(`New message from ${senderName}`, {
          description:
            message.content.length > 50
              ? message.content.substring(0, 50) + "..."
              : message.content,
          action: {
            label: "View",
            onClick: () => handleSelectDirectConversation(message.senderId),
          },
        });
      }
    };

    const handleNewTeamMessage = (data: {
      message: any;
      projectId: string;
    }) => {
      if (selectedProject && selectedProject.id === data.projectId) {
        return;
      }

      if (data.message.userId !== session.user.id) {
        const project = teamConversations.find(
          (c) => c.projectId === data.projectId
        );
        const projectName = project?.name || "Project";
        const senderName = data.message.user?.name || "Someone";

        toast(`New message in ${projectName}`, {
          description: `${senderName}: ${
            data.message.content.length > 50
              ? data.message.content.substring(0, 50) + "..."
              : data.message.content
          }`,
          action: {
            label: "View",
            onClick: () => handleSelectTeamConversation(data.projectId),
          },
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_team_message", handleNewTeamMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_team_message", handleNewTeamMessage);
    };
  }, [
    socket,
    isConnected,
    session?.user?.id,
    selectedUser,
    selectedProject,
    directConversations,
    teamConversations,
  ]);

  const fetchDirectConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/messages/conversations");

      if (response.ok) {
        const data = await response.json();
        setDirectConversations(data);
      } else {
        console.error("Failed to fetch direct conversations");
        toast.error("Failed to load conversations");
      }
    } catch (error) {
      console.error("Error fetching direct conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamConversations = async () => {
    try {
      const response = await fetch("/api/team-messages/projects");

      if (response.ok) {
        const data = await response.json();
        setTeamConversations(data);
      } else {
        console.error("Failed to fetch team conversations");
        toast.error("Failed to load team conversations");
      }
    } catch (error) {
      console.error("Error fetching team conversations:", error);
      toast.error("Failed to load team conversations");
    }
  };

  const fetchUserInfo = async (email: string) => {
    if (fetchingUserRef.current.has(email)) {
      return;
    }

    if (selectedUser?.email === email) {
      return;
    }

    fetchingUserRef.current.add(email);

    try {
      const response = await fetch(`/api/user/byEmail?email=${email}`);

      if (response.ok) {
        const user = await response.json();
        setSelectedUser(user);
        setSelectedProject(null);
        if (isMobile) {
          setShowConversationList(false);
        }
      } else {
        console.error("Failed to fetch user info");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      fetchingUserRef.current.delete(email);
    }
  };

  const fetchProjectInfo = async (projectId: string) => {
    if (fetchingProjectRef.current.has(projectId)) {
      return;
    }

    if (selectedProject?.id === projectId) {
      return;
    }

    fetchingProjectRef.current.add(projectId);

    try {
      const existingProject = teamConversations.find(
        (conv) => conv.projectId === projectId
      );

      if (existingProject) {
        setSelectedProject({
          id: projectId,
          name: existingProject.name || "Project Chat",
          description: existingProject.description,
          creator: existingProject.creator || "",
          memberCount: existingProject.memberCount || 0,
        });
        setSelectedUser(null);
        if (isMobile) {
          setShowConversationList(false);
        }
      } else {
        const response = await fetch(`/api/projects/${projectId}`);

        if (response.ok) {
          const project = await response.json();
          setSelectedProject({
            id: projectId,
            name: project.name,
            description: project.description,
            creator: project.creator.name,
            memberCount: project.members.length,
          });
          setSelectedUser(null);
          if (isMobile) {
            setShowConversationList(false);
          }
        } else {
          console.error("Failed to fetch project info");
        }
      }
    } catch (error) {
      console.error("Error fetching project info:", error);
    } finally {
      fetchingProjectRef.current.delete(projectId);
    }
  };

  const handleSelectDirectConversation = (userId: string) => {
    if (selectedUser?.id === userId) return;

    const conversation = directConversations.find(
      (c: any) => c.userId === userId
    );
    if (conversation && conversation.user) {
      setSelectedUser(conversation.user);
      setSelectedProject(null);
      router.push(`/messages`);
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  };

  const handleSelectTeamConversation = (projectId: string) => {
    if (selectedProject?.id === projectId) return;

    const conversation = teamConversations.find(
      (c) => c.projectId === projectId
    );
    if (conversation) {
      setSelectedProject({
        id: projectId,
        name: conversation.name || "Project Chat",
        description: conversation.description,
        creator: conversation.creator || "",
        memberCount: conversation.memberCount || 0,
      });
      setSelectedUser(null);
      router.push(`/messages?projectId=${projectId}`);
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // Check if this is a team chat or direct message
    if (conversation.isTeamChat && conversation.projectId) {
      handleSelectTeamConversation(conversation.projectId);
    } else if (conversation.userId) {
      handleSelectDirectConversation(conversation.userId);
    }
  };

  const handleNewMessage = (user: User) => {
    setSelectedUser(user);
    setSelectedProject(null);
    router.push(`/messages`);
    if (isMobile) {
      setShowConversationList(false);
    }
    const existingConversation = directConversations.find(
      (c) => c.userId === user.id
    );

    if (!existingConversation) {
      const newConversation: Conversation = {
        userId: user.id,
        user,
        lastMessageAt: new Date().toISOString(),
        lastMessageContent: "",
        unreadCount: 0,
      };

      setDirectConversations([newConversation, ...directConversations]);
    }
  };

  const handleBackClick = () => {
    setSelectedUser(null);
    setSelectedProject(null);
    router.push("/messages");
    setShowConversationList(true);
  };

  const handleDirectConversationsUpdate = (
    updatedConversations: Conversation[]
  ) => {
    setDirectConversations(updatedConversations);
  };

  const handleTeamConversationsUpdate = (
    updatedConversations: Conversation[]
  ) => {
    setTeamConversations(updatedConversations);
  };

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading && isInitialRender) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/messages");
    return null;
  }

  return (
    <div
      className={`flex ${
        isMobile ? "h-[calc(100vh-9rem)]" : "h-[calc(100vh-7rem)]"
      } overflow-hidden bg-background rounded-lg border w-auto`}
    >
      {showConversationList && (
        <div
          className={`${isMobile ? "w-full" : "w-80"} border-r flex flex-col`}
        >
          <div className="p-3 border-b">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <Suspense
                fallback={<Skeleton className="h-10 w-full rounded-md" />}
              >
                <NewMessageButton onSelectUser={handleNewMessage} />
              </Suspense>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-10 w-full rounded-md" />
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-md" />
                    ))}
                  </div>
                }
              >
                <ConversationList
                  conversations={directConversations}
                  teamConversations={teamConversations}
                  selectedId={selectedUser?.id || selectedProject?.id || null}
                  onSelectConversation={handleSelectConversation}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onConversationsUpdate={handleDirectConversationsUpdate}
                  onTeamConversationsUpdate={handleTeamConversationsUpdate}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          isLoading ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <Skeleton className="h-10 w-48 rounded-md" />
              </div>
              <div className="flex-1 p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      i % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <Skeleton className={`h-12 w-4/5 max-w-md rounded-lg`} />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <Skeleton className="h-10 w-48 rounded-md" />
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          i % 2 === 0 ? "justify-start" : "justify-end"
                        }`}
                      >
                        <Skeleton
                          className={`h-12 w-4/5 max-w-md rounded-lg`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </div>
              }
            >
              <Chat
                selectedUser={selectedUser}
                currentUserId={session?.user?.id || ""}
                onBackClick={isMobile ? handleBackClick : undefined}
              />
            </Suspense>
          )
        ) : selectedProject ? (
          isLoading ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <Skeleton className="h-10 w-48 rounded-md" />
              </div>
              <div className="flex-1 p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      i % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <Skeleton className={`h-12 w-4/5 max-w-md rounded-lg`} />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <Skeleton className="h-10 w-48 rounded-md" />
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          i % 2 === 0 ? "justify-start" : "justify-end"
                        }`}
                      >
                        <Skeleton
                          className={`h-12 w-4/5 max-w-md rounded-lg`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </div>
              }
            >
              <TeamChat
                selectedProject={selectedProject}
                currentUserId={session?.user?.id || ""}
                onBackClick={isMobile ? handleBackClick : undefined}
              />
            </Suspense>
          )
        ) : (
          !showConversationList && (
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-48 w-64 rounded-md" />
                </div>
              }
            >
              <EmptyState />
            </Suspense>
          )
        )}
      </div>

      {/* Floating loading indicator for subsequent data fetches */}
      {isLoading && !isInitialRender && (
        <div className="fixed bottom-4 right-4 bg-background shadow-lg rounded-full p-2 z-50 border">
          <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
        </div>
      )}
    </div>
  );
};

export default MessagesLayout;
