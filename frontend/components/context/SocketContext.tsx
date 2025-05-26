"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { debugError, debugLog } from "@/lib/utils";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinTeamChat: (projectId: string) => void;
  leaveTeamChat: (projectId: string) => void;
  sendTeamMessage: (projectId: string, content: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinTeamChat: () => {},
  leaveTeamChat: () => {},
  sendTeamMessage: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // socket is initiated only when user is authenticated
    if (status === "authenticated" && session?.user?.id) {
      // CRITICAL: we use the Socket.io proxy route in Next.js

      const socketInstance = io({
        path: "/api/socket",
        transports: ["polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: {
          userId: session.user.id,
          clientTime: new Date().toISOString(),
        },
      });

      socketInstance.on("connect", () => {
        debugLog("Socket connected with ID:", socketInstance.id);
        setIsConnected(true);

        socketInstance.emit("authenticate", session.user.id);
      });

      socketInstance.on("disconnect", (reason) => {
        debugLog("Socket disconnected, reason:", reason);
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (error) => {
        debugError("Socket connection error:", error);
        setIsConnected(false);
      });

      socketInstance.on("error", (error) => {
        debugError("Socket error:", error);
      });

      socketInstance.on("welcome", (data) => {
        debugLog("Received welcome from server:", data);
      });

      setSocket(socketInstance);

      return () => {
        debugLog("Disconnecting socket");
        socketInstance.disconnect();
      };
    }
  }, [status, session?.user?.id]);

  // team chat room
  const joinTeamChat = (projectId: string) => {
    if (socket && isConnected && session?.user?.id) {
      debugLog(`Joining team chat for project: ${projectId}`);
      socket.emit("join_team_chat", {
        userId: session.user.id,
        projectId,
      });
    }
  };

  const leaveTeamChat = (projectId: string) => {
    if (socket && isConnected && session?.user?.id) {
      debugLog(`Leaving team chat for project: ${projectId}`);
      socket.emit("leave_team_chat", {
        userId: session.user.id,
        projectId,
      });
    }
  };

  const sendTeamMessage = (projectId: string, content: string) => {
    if (socket && isConnected && session?.user?.id) {
      debugLog(`Sending team message to project: ${projectId}`);
      socket.emit("send_team_message", {
        userId: session.user.id,
        projectId,
        content,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTeamChat,
        leaveTeamChat,
        sendTeamMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
