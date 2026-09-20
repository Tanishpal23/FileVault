"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

let globalSocket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!globalSocket) {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;

      globalSocket = io(SOCKET_URL, {
        withCredentials: true,
        auth: token ? { token } : undefined,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    const socket = globalSocket;
    socketRef.current = socket;

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const joinFile = useCallback((fileId: string) => {
    if (globalSocket && fileId) {
      globalSocket.emit("join_file", fileId);
    }
  }, []);

  const leaveFile = useCallback((fileId: string) => {
    if (globalSocket && fileId) {
      globalSocket.emit("leave_file", fileId);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (globalSocket) {
      globalSocket.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (globalSocket) {
      if (callback) {
        globalSocket.off(event, callback);
      } else {
        globalSocket.off(event);
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinFile,
    leaveFile,
    on,
    off,
  };
}
