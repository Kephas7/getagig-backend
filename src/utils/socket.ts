import { Server as SocketIOServer, Socket } from "socket.io";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export let io: SocketIOServer;

export function initializeSocket(server: Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3005",
      ],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      // JWT payload uses `id` (see UserService.LoginUser). Use that consistently.
      const uid = decoded.userId ?? decoded.id;
      socket.data.userId = uid?.toString();
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(
      `Socket connected: ${socket.id} for User: ${socket.data.userId}`,
    );

    // Join a personal room to receive direct notifications/messages
    socket.join(socket.data.userId);

    socket.on("joinConversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.data.userId} joined conversation ${conversationId}`,
      );
    });

    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
