import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Set up multer storage for message attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/messages';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Always use lowercase extension
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1e5)}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

/**
 * GET /api/messages/:conversationId
 */
router.get('/:conversationId', authenticateToken, async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const skip = (page - 1) * pageSize;

  try {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
      },
    });

    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = convo.participants.some(p => `${p.userId}` === `${userId}`);
    if (!isParticipant) return res.status(403).json({ error: 'Not authorized' });

    const rawMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        sender: { select: { id: true, name: true, profilePhoto: true } },
      },
    });

    const totalCount = await prisma.message.count({ where: { conversationId } });

    const messages = rawMessages.reverse().map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt,
      imageUrls: msg.imageUrls ? JSON.parse(msg.imageUrls) : [],
    }));

    return res.json({ messages, page, pageSize, totalCount });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/messages/:conversationId
 */
router.post('/:conversationId', authenticateToken, upload.array('files'), async (req, res) => {
  const { conversationId } = req.params;
  const senderId = req.user.id;
  const { content = '' } = req.body;
  const files = req.files || [];

  if (!content.trim() && files.length === 0) {
    return res.status(400).json({ error: 'Message must contain content or an image' });
  }

  try {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    });

    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = convo.participants.some(p => `${p.userId}` === `${senderId}`);
    if (!isParticipant) return res.status(403).json({ error: 'Not authorized' });

    const imageUrls = files.map(file => `/${file.path.replace(/\\/g, '/')}`);

    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        imageUrls: JSON.stringify(imageUrls),
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        imageUrls: true,
        createdAt: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: senderId },
        deleted: true,
      },
      data: { deleted: false },
    });

    // 🔔 Emit new-message via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new-message', {
        id: newMessage.id,
        senderId: newMessage.senderId,
        content: newMessage.content,
        imageUrls,
        createdAt: newMessage.createdAt,
        conversationId,
      });
    }

    return res.status(201).json({
      id: newMessage.id,
      senderId: newMessage.senderId,
      content: newMessage.content,
      imageUrls,
      createdAt: newMessage.createdAt,
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/messages/:messageId
 */
router.delete('/:messageId', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ error: 'Not your message' });

    await prisma.message.delete({ where: { id: messageId } });

    return res.json({ message: 'Deleted successfully', messageId });
  } catch (err) {
    console.error('Error deleting message:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;