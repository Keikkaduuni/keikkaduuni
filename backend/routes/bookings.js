// backend/routes/bookings.js

import express from 'express';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  const { palveluId, date, hours } = req.body;
  const parsedPalveluId = parseInt(palveluId);
  const parsedHours = parseInt(hours);

  if (!date || isNaN(parsedPalveluId) || isNaN(parsedHours) || parsedHours < 1) {
    return res.status(400).json({ error: 'Palvelu ID, date and valid hours required' });
  }

  try {
    const palvelu = await prisma.palvelu.findUnique({ where: { id: parsedPalveluId } });
    if (!palvelu) return res.status(404).json({ error: 'Palvelu not found' });
    if (String(palvelu.userId) === String(req.user.id)) {
      return res.status(403).json({ error: 'Et voi varata omaa palvelua.' });
    }

    const existing = await prisma.booking.findFirst({
      where: { userId: req.user.id, palveluId: parsedPalveluId },
    });
    if (existing) return res.status(409).json({ error: 'Olet jo tehnyt varauksen tähän palveluun.' });

    const newBooking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        palveluId: parsedPalveluId,
        date: new Date(date),
        hours: parsedHours,
      },
    });
    console.log("🟢 Booking made by:", req.user.id);
    res.json(newBooking);
  } catch (err) {
    console.error('❌ Booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
     const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: { palvelu: true },
    });
    if (!booking || booking.palvelu.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.booking.update({ where: { id: parseInt(id) }, data: { isRead: true } });
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Approve booking
router.post('/:bookingId/approve', authenticateToken, async (req, res) => {
  try {
    const id = req.params.bookingId;
    const booking = await prisma.booking.findUnique({ where: { id }, include: { palvelu: true } });
    if (!booking || booking.palvelu.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.booking.update({ where: { id }, data: { status: 'approved' } });

    // Notify booker
    const notification = await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'bookingApproved',
        message: 'Varauspyyntösi hyväksyttiin.',
        link: `/palvelut/${booking.palveluId}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.userId}`).emit('new-notification', notification);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Approve booking error', err);
    res.status(500).json({ error: 'Could not approve booking' });
  }
});

// Reject booking
router.post('/:bookingId/reject', authenticateToken, async (req, res) => {
  try {
    const id = req.params.bookingId;
    const booking = await prisma.booking.findUnique({ where: { id }, include: { palvelu: true } });
    if (!booking || booking.palvelu.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.booking.update({ where: { id }, data: { status: 'rejected' } });

    // Notify booker
    const notification = await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'bookingRejected',
        message: 'Varauspyyntösi hylättiin.',
        link: `/palvelut/${booking.palveluId}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.userId}`).emit('new-notification', notification);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Reject booking error', err);
    res.status(500).json({ error: 'Could not reject booking' });
  }
});

router.get('/check', authenticateToken, async (req, res) => {
  const { palveluId } = req.query;
  try {
    const existing = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        palveluId: parseInt(palveluId),
      },
    });

    if (existing) {
      return res.json({
        hasBooked: true,
        date: existing.date,
        bookingId: existing.id,
      });
    }

    return res.json({
      hasBooked: false,
    });

  } catch (err) {
    console.error('Booking check error:', err);
    res.status(500).json({ error: 'Check failed' });
  }
});


// Get sent bookings (by current user)
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📥 GET /bookings/sent for user:', userId);

    const bookings = await prisma.booking.findMany({
      where: { userId, paymentCompleted: false },
      include: {
        palvelu: {
          select: { id: true, title: true, unit: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${bookings.length} bookings sent by user ${userId}`);
    console.log("📥 Fetching bookings for:", req.user.id);


    bookings.forEach((b, i) => {
      console.log(`📌 Booking #${i + 1}:`, {
        id: b.id,
        palveluTitle: b.palvelu.title,
        date: b.date,
        hours: b.hours,
        status: b.status
      });
    });

    res.json(bookings.map((b) => ({
      id: b.id,
      palveluId: b.palvelu.id,
      palveluTitle: b.palvelu.title,
      date: b.date,
      hours: b.hours,
      status: b.status,
      unit: b.palvelu.unit,      // ✅ Add this line
      createdAt: b.createdAt 
    })));
  } catch (err) {
    console.error('❌ Fetch sent bookings error:', err);
    res.status(500).json({ error: 'Failed to load sent bookings' });
  }
});

// Get received bookings (bookings for services owned by current user)
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📥 GET /bookings/received for user:', userId);

    // Get all palvelut owned by the current user
    const userPalvelut = await prisma.palvelu.findMany({
      where: { userId },
      select: { id: true }
    });

    const palveluIds = userPalvelut.map(p => p.id);

    if (palveluIds.length === 0) {
      return res.json([]);
    }

    const bookings = await prisma.booking.findMany({
      where: { 
        palveluId: { in: palveluIds }
      },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
        palvelu: { select: { id: true, title: true, unit: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${bookings.length} received bookings for user ${userId}`);

    res.json(bookings.map((b) => ({
      id: b.id,
      palveluId: b.palvelu.id,
      palveluTitle: b.palvelu.title,
      date: b.date,
      hours: b.hours,
      status: b.status,
      unit: b.palvelu.unit,
      createdAt: b.createdAt,
      isRead: b.isRead,
      userId: b.user.id,
      userName: b.user.name,
      userProfilePhoto: b.user.profilePhoto,
      paymentCompleted: b.paymentCompleted
    })));
  } catch (err) {
    console.error('❌ Fetch received bookings error:', err);
    res.status(500).json({ error: 'Failed to load received bookings' });
  }
});

// Complete booking
router.patch('/:bookingId/complete', authenticateToken, async (req, res) => {
  try {
    const id = req.params.bookingId;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { palvelu: true }
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    // Only provider or client can complete
    if (
      booking.userId !== req.user.id &&
      booking.palvelu.userId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Booking already completed' });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'completed' }
    });

    // Notify the other party
    const otherUserId = booking.userId === req.user.id ? booking.palvelu.userId : booking.userId;
    const notification = await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'bookingCompleted',
        message: 'Varaus on merkitty valmiiksi.',
        link: `/palvelut/${booking.palveluId}`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${otherUserId}`).emit('new-notification', notification);
    }

    res.json(updated);
  } catch (err) {
    console.error('Complete booking error', err);
    res.status(500).json({ error: 'Could not complete booking' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { palvelu: true },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this booking.' });
    }

    await prisma.booking.delete({ where: { id: bookingId } });

    // ✅ Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify all connected clients about the deletion
      io.emit('booking-deleted', bookingId);
      
      // Notify provider about cancellation
      const notification = await prisma.notification.create({
        data: {
          userId: booking.palvelu.userId,
          type: 'bookingCancelled',
          message: 'Varaus peruutettiin.',
          link: `/palvelut/${booking.palveluId}`,
        },
      });
      
      io.to(`user-${booking.palvelu.userId}`).emit('new-notification', notification);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete booking:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Get all bookings for a specific service (palveluId)
router.get('/palvelu/:palveluId', authenticateToken, async (req, res) => {
  const palveluId = parseInt(req.params.palveluId);
  const userId = req.user.id;
  try {
    const palvelu = await prisma.palvelu.findUnique({ where: { id: palveluId } });
    if (!palvelu || palvelu.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    const bookings = await prisma.booking.findMany({
      where: { palveluId },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error('Error loading bookings for palvelu:', err);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

export default router;