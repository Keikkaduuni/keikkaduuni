// routes/offers.js

import express from 'express';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Check if user has already made an offer
router.get('/check', authenticateToken, async (req, res) => {
  const { tarveId } = req.query;
  const userId = req.user.id;

  try {
    const existing = await prisma.offer.findFirst({
      where: {
        userId,
        tarveId: parseInt(tarveId),
      },
    });

    res.json({ hasOffered: !!existing, date: existing?.date });
  } catch (err) {
    console.error('❌ Offer check error:', err);
    res.status(500).json({ error: 'Check failed' });
  }
});

// Create an offer
router.post('/', authenticateToken, async (req, res) => {
  const { tarveId, price, date } = req.body;
  const userId = req.user.id;

  if (!tarveId || !price || !date) {
    return res.status(400).json({ error: 'Tarve ID, price and date are required' });
  }

  try {
    const tarve = await prisma.tarve.findUnique({ where: { id: parseInt(tarveId) } });
    if (!tarve) return res.status(404).json({ error: 'Tarve not found' });

    if (tarve.userId === userId) {
      return res.status(403).json({ error: 'Et voi tarjota omaan tarpeeseesi.' });
    }

    const existing = await prisma.offer.findFirst({
      where: { tarveId: parseInt(tarveId), userId },
    });

    if (existing) {
      return res.status(409).json({ error: 'Olet jo tehnyt tarjouksen tähän tarpeeseen.' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        tarveId: parseInt(tarveId),
        userId,
        price: parseFloat(price),
        date,
        status: 'pending',
      },
    });

    // Notify Tarve owner
    const notification = await prisma.notification.create({
      data: {
        userId: tarve.userId,
        type: 'offerReceived',
        message: 'Uusi tarjous tarpeeseesi.',
        link: `/tarpeet/${tarve.id}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${tarve.userId}`).emit('new-notification', notification);
    }

    return res.status(201).json(newOffer);
  } catch (err) {
    console.error('❌ Offer creation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// View all offers for a Tarve
router.get('/tarve/:tarveId', authenticateToken, async (req, res) => {
  const tarveId = parseInt(req.params.tarveId);
  const userId = req.user.id;

  try {
    const tarve = await prisma.tarve.findUnique({ where: { id: tarveId } });
    if (!tarve || tarve.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const offers = await prisma.offer.findMany({
      where: { tarveId },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(offers);
  } catch (err) {
    console.error('Error loading offers:', err);
    res.status(500).json({ error: 'Could not load offers' });
  }
});

// Approve an offer
router.post('/:offerId/approve', authenticateToken, async (req, res) => {
  const offerId = parseInt(req.params.offerId);
  const userId = req.user.id;

  if (isNaN(offerId)) {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { tarve: true },
    });

    if (!offer || offer.tarve.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed to approve this offer' });
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'approved' },
    });

    // 💬 Check for existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        tarveId: offer.tarveId,
        participants: {
          some: { userId: offer.userId },
        },
      },
    });

    // 🧱 Create conversation if not found
    if (!conversation) {
      const now = new Date();
      conversation = await prisma.conversation.create({
        data: {
          tarveId: offer.tarveId,
        },
      });
      await prisma.conversationParticipant.createMany({
        data: [
          { userId: offer.userId, conversationId: conversation.id, lastSeenAt: now },
          { userId: offer.tarve.userId, conversationId: conversation.id, lastSeenAt: now },
        ],
      });
    }

    // Notify offer sender
    const notification = await prisma.notification.create({
      data: {
        userId: offer.userId,
        type: 'offerApproved',
        message: 'Tarjouksesi hyväksyttiin!',
        link: `/viestit/${conversation.id}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${offer.userId}`).emit('new-notification', notification);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Error approving offer:', err);
    res.status(500).json({ error: 'Could not approve offer' });
  }
});

// Reject an offer
router.post('/:offerId/reject', authenticateToken, async (req, res) => {
  const offerId = parseInt(req.params.offerId);
  const userId = req.user.id;

  if (isNaN(offerId)) {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { tarve: true },
    });

    if (!offer || offer.tarve.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed to reject this offer' });
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'rejected' },
    });

    // Notify offer sender
    const notification = await prisma.notification.create({
      data: {
        userId: offer.userId,
        type: 'offerRejected',
        message: 'Tarjouksesi hylättiin.',
        link: `/tarpeet/${offer.tarveId}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${offer.userId}`).emit('new-notification', notification);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Error rejecting offer:', err);
    res.status(500).json({ error: 'Could not reject offer' });
  }
});

// Delete own offer
router.delete('/:offerId', authenticateToken, async (req, res) => {
  const offerId = parseInt(req.params.offerId);
  const userId = req.user.id;

  if (isNaN(offerId)) {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  try {
    const offer = await prisma.offer.findUnique({ 
      where: { id: offerId },
      include: { tarve: true } // ✅ Include tarve for notification
    });

    if (!offer || offer.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed to delete this offer' });
    }

    await prisma.offer.delete({ where: { id: offerId } });

    // ✅ Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify all connected clients about the deletion
      io.emit('offer-deleted', offerId);
      
      // Notify tarve owner about offer deletion
      const notification = await prisma.notification.create({
        data: {
          userId: offer.tarve.userId,
          type: 'offerDeleted',
          message: 'Tarjous peruutettiin.',
          link: `/tarpeet/${offer.tarveId}`,
        },
      });
      
      io.to(`user-${offer.tarve.userId}`).emit('new-notification', notification);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting offer:', err);
    res.status(500).json({ error: 'Could not delete offer' });
  }
});

// Get offers sent by the user
router.get('/sent', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const offers = await prisma.offer.findMany({
      where: { userId },
      include: {
        tarve: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(offers.map(o => ({
      id: o.id,
      tarveId: o.tarve.id,
      tarveTitle: o.tarve.title,
      price: o.price,
      date: o.date,
      status: o.status
    })));
  } catch (err) {
    console.error('❌ Error fetching sent offers:', err);
    res.status(500).json({ error: 'Could not fetch sent offers' });
  }
});

// Get received offers (offers for needs owned by current user)
router.get('/received', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('📥 GET /offers/received for user:', userId);

    // Get all tarpeet owned by the current user
    const userTarpeet = await prisma.tarve.findMany({
      where: { userId },
      select: { id: true }
    });

    const tarveIds = userTarpeet.map(t => t.id);

    if (tarveIds.length === 0) {
      return res.json([]);
    }

    const offers = await prisma.offer.findMany({
      where: { 
        tarveId: { in: tarveIds }
      },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
        tarve: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${offers.length} received offers for user ${userId}`);

    res.json(offers.map(o => ({
      id: o.id,
      tarveId: o.tarve.id,
      tarveTitle: o.tarve.title,
      price: o.price,
      date: o.date,
      status: o.status,
      createdAt: o.createdAt,
      isRead: o.isRead,
      userId: o.user.id,
      userName: o.user.name,
      userProfilePhoto: o.user.profilePhoto
    })));
  } catch (err) {
    console.error('❌ Error fetching received offers:', err);
    res.status(500).json({ error: 'Could not fetch received offers' });
  }
});

// Mark as read
router.patch('/:offerId/read', authenticateToken, async (req, res) => {
  const offerId = parseInt(req.params.offerId);
  const userId = req.user.id;

  if (isNaN(offerId)) {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { tarve: true },
    });
    
    if (!offer || offer.tarve.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    
    await prisma.offer.update({ 
      where: { id: offerId }, 
      data: { isRead: true } 
    });
    
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Mark offer as read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;
