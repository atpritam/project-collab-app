import { Socket, Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { debugLog, debugError } from "../../utils/debug";

const prisma = new PrismaClient();

export function setupMessageHandlers(socket: Socket, io: SocketIOServer) {
  // Direct messages
  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, content } = data;

      if (!senderId || !receiverId || !content) {
        debugError("Missing data in send_message event", data);
        return;
      }

      debugLog(
        `Message from ${senderId} to ${receiverId}: ${content.substring(
          0,
          20
        )}...`
      );

      // Save to database
      const message = await prisma.directMessage.create({
        data: {
          content,
          senderId,
          receiverId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Emit to both sender and receiver
      io.to(`user:${senderId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", message);

      io.to(`user:${receiverId}`).emit("conversation_update", {
        userId: senderId,
        lastMessageAt: message.createdAt,
        lastMessageContent: message.content,
        isUnread: true,
      });

      io.to(`user:${senderId}`).emit("conversation_update", {
        userId: receiverId,
        lastMessageAt: message.createdAt,
        lastMessageContent: message.content,
        isUnread: false,
      });

      debugLog("Message successfully processed and emitted");
    } catch (error) {
      debugError("Error handling message via socket:", error);
    }
  });

  // Typing status
  socket.on("typing", ({ senderId, receiverId, isTyping }) => {
    if (!senderId || !receiverId) {
      debugError("Missing data in typing event");
      return;
    }

    debugLog(
      `Typing event: ${senderId} is ${
        isTyping ? "typing" : "not typing"
      } to ${receiverId}`
    );

    io.to(`user:${receiverId}`).emit("user_typing", {
      userId: senderId,
      isTyping,
    });
  });

  // Mark messages as read
  socket.on("mark_read", async ({ userId, otherUserId }) => {
    if (!userId || !otherUserId) {
      debugError("Missing data in mark_read event");
      return;
    }

    debugLog(`Marking messages from ${otherUserId} to ${userId} as read`);

    try {
      await prisma.directMessage.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      io.to(`user:${otherUserId}`).emit("messages_read", {
        userId: userId,
      });

      debugLog("Messages marked as read");
    } catch (error) {
      debugError("Error marking messages as read:", error);
    }
  });
}
