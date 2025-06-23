// backend/socket.js

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../src/lib/prisma.js';

const connectedUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ✅ Authenticate with token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`✅ User connected: ${userId}`);

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId).push(socket.id);

    socket.join(`user-${userId}`);

    // Join all their conversation rooms
    try {
      const conversations = await prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        select: { id: true },
      });

      conversations.forEach(({ id }) => socket.join(`conversation-${id}`));
    } catch (err) {
      console.error('❌ Failed to fetch conversations:', err);
    }

    // ✅ Handle message sending
    socket.on('send-message', async ({ conversationId, content }) => {
      if (!conversationId || !content) return;

      try {
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
          },
          include: {
            sender: {
              select: { id: true, name: true, profilePhoto: true },
            },
          },
        });

        // Emit to all users in this conversation room
        console.log('📨 New message created and emitting to socket:', message); 

        io.to(`conversation-${conversationId}`).emit('new-message', {
          ...message,
          imageUrls: message.imageUrls || [],
        });

        // Also notify other participants for red dot badge
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversationId,
            userId: { not: userId },
          },
          select: { userId: true },
        });

        participants.forEach(({ userId }) => {
          io.to(`user-${userId}`).emit('conversation-unread', {
            conversationId,
          });
        });
      } catch (err) {
        console.error('❌ Failed to send message:', err);
      }
    });

    // ✅ Booking updates
    socket.on('booking-updated', ({ toUserId, booking }) => {
      io.to(`user-${toUserId}`).emit('booking-updated', booking);
    });

    // ✅ Disconnect cleanup
    socket.on('disconnect', () => {
      const sockets = connectedUsers.get(userId) || [];
      const updated = sockets.filter((id) => id !== socket.id);
      if (updated.length === 0) {
        connectedUsers.delete(userId);
      } else {
        connectedUsers.set(userId, updated);
      }

      console.log(`❌ User disconnected: ${userId}`);
    });
  });

  return io;
};
