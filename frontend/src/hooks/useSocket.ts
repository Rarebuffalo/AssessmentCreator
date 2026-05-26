import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

interface UseSocketOptions {
  assignmentId?: string;
  onProgress?: (data: { status: string; message: string }) => void;
  onCompleted?: (data: { status: string; assignmentId: string; message: string }) => void;
  onFailed?: (data: { status: string; message: string }) => void;
}

export function useSocket({
  assignmentId,
  onProgress,
  onCompleted,
  onFailed,
}: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sock = getSocket();
    socketRef.current = sock;

    if (assignmentId) {
      sock.emit("join-assignment", assignmentId);
    }

    if (onProgress) sock.on("job:progress", onProgress);
    if (onCompleted) sock.on("job:completed", onCompleted);
    if (onFailed) sock.on("job:failed", onFailed);

    return () => {
      if (onProgress) sock.off("job:progress", onProgress);
      if (onCompleted) sock.off("job:completed", onCompleted);
      if (onFailed) sock.off("job:failed", onFailed);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const joinRoom = useCallback((id: string) => {
    socketRef.current?.emit("join-assignment", id);
  }, []);

  return { socket: socketRef.current, joinRoom };
}
