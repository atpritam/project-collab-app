import { Socket, Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { debugLog, debugError } from "../../utils/debug";

const prisma = new PrismaClient();

export function setupTeamChatHandlers(socket: Socket, io: SocketIOServer) {
  // Team messages
  socket.on("send_team_message", async (data) => {
    try {
      const { projectId, userId, content } = data;

      if (!projectId || !userId || !content) {
        debugError("Missing data in send_team_message event", data);
        return;
      }

      debugLog(
        `Team message from ${userId} to project ${projectId}: ${content.substring(
          0,
          20
        )}...`
      );

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        debugError("Project not found", projectId);
        return;
      }

      const isCreator = project.creatorId === userId;
      const isMember = project.members.some(
        (member: any) => member.userId === userId
      );

      if (!isCreator && !isMember) {
        debugError("User is not a member of this project", userId, projectId);
        return;
      }

      // Save to database
      const message = await prisma.chatMessage.create({
        data: {
          content,
          projectId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const memberIds = project.members.map((member: any) => member.userId);
      if (!memberIds.includes(project.creatorId)) {
        memberIds.push(project.creatorId);
      }

      // Emit to all project members
      memberIds.forEach((memberId: any) => {
        io.to(`user:${memberId}`).emit("new_team_message", {
          message,
          projectId,
        });

        io.to(`user:${memberId}`).emit("team_conversation_update", {
          projectId,
          lastMessageAt: message.createdAt,
          lastMessageContent: message.content,
          lastMessageSender: message.user,
          isUnread: memberId !== userId,
        });
      });

      debugLog("Team message successfully processed and emitted");
    } catch (error) {
      debugError("Error handling team message via socket:", error);
    }
  });

  // Join team chat room
  socket.on("join_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      debugError("Missing data in join_team_chat event", data);
      return;
    }

    socket.join(`project:${projectId}`);
    debugLog(`User ${userId} joined project chat ${projectId}`);
  });

  // Leave team chat room
  socket.on("leave_team_chat", async (data) => {
    const { userId, projectId } = data;

    if (!userId || !projectId) {
      debugError("Missing data in leave_team_chat event", data);
      return;
    }

    socket.leave(`project:${projectId}`);
    debugLog(`User ${userId} left project chat ${projectId}`);
  });
}
