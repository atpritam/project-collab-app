import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import { Loader2, Info } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ChatProps {
  selectedUser: User | null;
  currentUserId: string;
  onBackClick?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  selectedUser,
  currentUserId,
  onBackClick,
}) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [useFallback, setUseFallback] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef<boolean>(false);
  const selectedUserRef = useRef<string | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const pendingOptimisticMessagesRef = useRef<Map<string, string>>(new Map());

  // if socket io is not connected we use fallback polling
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setUseFallback(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setUseFallback(false);
    }
  }, [isConnected]);

  const fetchMessages = useCallback(
    async (showLoading = true, force = false) => {
      if (!selectedUser) return;

      if (loadingRef.current && !force) {
        console.log("Already loading messages, skipping duplicate fetch");
        return;
      }

      if (selectedUserRef.current === selectedUser.id && !force) {
        console.log("Selected user hasn't changed, skipping duplicate fetch");
        return;
      }

      loadingRef.current = true;
      selectedUserRef.current = selectedUser.id;

      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/messages/direct`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-other-user-id": selectedUser.id,
          },
        });

        if (response.ok) {
          const data = await response.json();
          processedMessagesRef.current = new Set();
          data.forEach((msg: Message) => {
            processedMessagesRef.current.add(msg.id);
          });
          setMessages(data);
        } else {
          console.error("Failed to fetch messages");
          if (showLoading) {
            toast.error("Failed to load messages");
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (showLoading) {
          toast.error("Failed to load messages");
        }
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
        loadingRef.current = false;

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [selectedUser]
  );

  useEffect(() => {
    if (selectedUser && selectedUser.id !== selectedUserRef.current) {
      setMessages([]);
      processedMessagesRef.current = new Set();
      pendingOptimisticMessagesRef.current.clear();
      fetchMessages(true, true);
      markMessagesAsRead();
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [selectedUser, fetchMessages]);

  // polling if in fallback mode
  useEffect(() => {
    if (selectedUser && useFallback && !pollInterval) {
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 3000); // Poll every 3 seconds

      setPollInterval(interval);
      return () => clearInterval(interval);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [selectedUser, useFallback, fetchMessages, pollInterval]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!socket || !selectedUser || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      if (
        (message.senderId === currentUserId &&
          message.receiverId === selectedUser.id) ||
        (message.senderId === selectedUser.id &&
          message.receiverId === currentUserId)
      ) {
        setMessages((prevMessages) => {
          // Check if we've already processed this message ID
          if (processedMessagesRef.current.has(message.id)) {
            console.log(`Skipping duplicate message: ${message.id}`);
            return prevMessages;
          }

          const tempMessageContent = pendingOptimisticMessagesRef.current.get(
            message.content
          );
          if (tempMessageContent && message.senderId === currentUserId) {
            pendingOptimisticMessagesRef.current.delete(message.content);
            processedMessagesRef.current.add(message.id);

            return prevMessages
              .filter((msg) => msg.id !== tempMessageContent)
              .concat(message);
          }

          processedMessagesRef.current.add(message.id);
          return [...prevMessages, message];
        });

        if (message.senderId === selectedUser.id) {
          markMessagesAsRead();
        }
      }
    };

    // typing indicator
    const handleTypingStatus = (data: {
      userId: string;
      isTyping: boolean;
    }) => {
      if (data.userId === selectedUser.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTypingStatus);

    socket.on("welcome", (data) => {
      console.log("Received welcome message:", data);
    });

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTypingStatus);
      socket.off("welcome");
    };
  }, [socket, selectedUser, currentUserId, isConnected]);

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;

    try {
      await fetch(`/api/messages/mark-read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-other-user-id": selectedUser.id,
        },
      });

      if (socket && isConnected) {
        socket.emit("mark_read", {
          userId: currentUserId,
          otherUserId: selectedUser.id,
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedUser || !content.trim()) return;

    setIsSending(true);

    try {
      const tempId = `temp-${Date.now()}`;

      // Using Socket.io for instant message delivery if connected
      if (socket && isConnected && !useFallback) {
        const optimisticMessage = {
          id: tempId,
          content,
          senderId: currentUserId,
          receiverId: selectedUser.id,
          createdAt: new Date().toISOString(),
          sender: {
            id: currentUserId,
            name: null,
            image: null,
          },
        };

        pendingOptimisticMessagesRef.current.set(content, tempId);
        processedMessagesRef.current.add(tempId);

        setMessages((prev) => [...prev, optimisticMessage]);

        socket.emit("send_message", {
          senderId: currentUserId,
          receiverId: selectedUser.id,
          content,
        });
      } else {
        // Fallback to REST API
        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiverId: selectedUser.id,
            content,
          }),
        });

        if (response.ok) {
          const newMessage = await response.json();
          processedMessagesRef.current.add(newMessage.id);
          setMessages((prev) => [...prev, newMessage]);
        } else {
          console.error("Failed to send message");
          toast.error("Failed to send message");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);

      if (socket && isConnected && typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
        socket.emit("typing", {
          senderId: currentUserId,
          receiverId: selectedUser.id,
          isTyping: false,
        });
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  const handleTyping = (isCurrentlyTyping: boolean) => {
    if (!socket || !selectedUser || !isConnected || useFallback) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    socket.emit("typing", {
      senderId: currentUserId,
      receiverId: selectedUser.id,
      isTyping: isCurrentlyTyping,
    });

    if (isCurrentlyTyping) {
      const timeout = setTimeout(() => {
        if (socket && isConnected) {
          socket.emit("typing", {
            senderId: currentUserId,
            receiverId: selectedUser.id,
            isTyping: false,
          });
        }
        setTypingTimeout(null);
      }, 3000);

      setTypingTimeout(timeout);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!selectedUser) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader user={selectedUser} onBackClick={onBackClick} />

      {useFallback && (
        <Alert
          variant="default"
          className="m-2 bg-yellow-50 dark:bg-yellow-900/20"
        >
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Real-time chat is currently unavailable. Using polling instead.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              title="No messages yet"
              description={`Start a conversation with ${
                selectedUser.name || "this user"
              }`}
            />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}
            {isTyping && !useFallback && (
              <div className="flex items-center text-sm text-muted-foreground my-2">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="ml-2">
                  {selectedUser.name || "User"} is typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isSending}
          onTyping={handleTyping}
          inputRef={inputRef}
          fallbackMode={useFallback}
        />
      </div>
    </div>
  );
};

export default Chat;
