import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export function createSocketServer(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  return io;
}
