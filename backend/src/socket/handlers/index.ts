import { Socket, Server as SocketIOServer } from "socket.io";
import { setupAuthHandlers } from "./authHandler";
import { setupMessageHandlers } from "./messageHandler";
import { setupTeamChatHandlers } from "./teamChatHandler";

export function setupAllSocketHandlers(socket: Socket, io: SocketIOServer) {
  setupAuthHandlers(socket);
  setupMessageHandlers(socket, io);
  setupTeamChatHandlers(socket, io);
}
