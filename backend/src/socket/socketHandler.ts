import { Server as SocketIOServer } from "socket.io";
import { debugLog } from "../utils/debug";
import { setupAllSocketHandlers } from "./handlers";

export function setupSocketHandlers(io: SocketIOServer) {
  io.on("connection", (socket) => {
    debugLog(`User connected: ${socket.id}`);
    debugLog(`Transport: ${socket.conn.transport.name}`);

    socket.conn.on("upgrade", (transport) => {
      debugLog(`Transport upgraded to: ${transport.name}`);
    });

    setupAllSocketHandlers(socket, io);
  });

  return io;
}
