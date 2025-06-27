import express from 'express';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - List notifications for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/:id/read - Mark a notification as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.sendStatus(204);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router; 