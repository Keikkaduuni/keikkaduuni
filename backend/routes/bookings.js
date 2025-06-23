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
      where: { userId },
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



router.delete('/:id', authenticateToken, async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this booking.' });
    }

    // Optional: delete related conversation if one exists
    await prisma.booking.delete({ where: { id: bookingId } });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete booking:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});



export default router;