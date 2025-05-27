import { Socket } from "socket.io";
import { debugLog } from "../../utils/debug";

export function setupAuthHandlers(socket: Socket) {
  // Authentication
  socket.on("authenticate", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      debugLog(`User ${userId} authenticated and joined their room`);
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    debugLog(`User disconnected: ${socket.id}`);
  });

  // Welcome message
  socket.emit("welcome", { message: "Connected to Socket.io server" });
}
