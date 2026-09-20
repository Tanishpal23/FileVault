import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface SocketUser {
  userId: string;
  email: string;
  name: string;
}

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:3000"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication Middleware for Socket.IO
  io.use((socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      // Check cookie if token not in auth/headers
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";");
        for (const cookie of cookies) {
          const [key, value] = cookie.trim().split("=");
          if (key === "accessToken") {
            token = decodeURIComponent(value);
            break;
          }
        }
      }

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userRoom = `user:${user.userId}`;
    socket.join(userRoom);

    // Join file room for real-time collaboration / live comments
    socket.on("join_file", (fileId: string) => {
      if (fileId && typeof fileId === "string") {
        socket.join(`file:${fileId}`);
      }
    });

    // Leave file room
    socket.on("leave_file", (fileId: string) => {
      if (fileId && typeof fileId === "string") {
        socket.leave(`file:${fileId}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, data: any): boolean {
  if (!ioInstance) return false;
  ioInstance.to(`user:${userId}`).emit(event, data);
  return true;
}

export function emitToFile(fileId: string, event: string, data: any): boolean {
  if (!ioInstance) return false;
  ioInstance.to(`file:${fileId}`).emit(event, data);
  return true;
}
