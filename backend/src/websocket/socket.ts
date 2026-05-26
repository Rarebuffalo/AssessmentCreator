import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-assignment', (assignmentId: string) => {
      socket.join(`assignment-${assignmentId}`);
      console.log(`Socket ${socket.id} joined room assignment-${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToAssignment = (
  assignmentId: string,
  event: string,
  data: unknown
): void => {
  if (io) {
    io.to(`assignment-${assignmentId}`).emit(event, data);
  }
};
