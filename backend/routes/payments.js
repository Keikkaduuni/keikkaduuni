import express from 'express';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payments/booking/:id
 * Simulates payment confirmation — marks booking as paid, creates chat + notifies.
 */
router.post('/booking/:id', authenticateToken, async (req, res) => {
  const bookingId = req.params.id;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required.' });
  }

  console.log('🧾 Attempting to confirm payment for booking:', bookingId);

  try {
    // 🔍 Fetch booking and related palvelu
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { palvelu: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to pay for this booking.' });
    }

    if (booking.paymentCompleted) {
      return res.status(409).json({ error: 'Booking already paid.' });
    }

    if (!booking.palvelu?.userId) {
      return res.status(400).json({ error: 'Palvelulla ei ole omistajaa.' });
    }

    // ✅ Mark booking as paid
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentCompleted: true },
    });

    // 💬 Check for existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        palveluId: booking.palveluId,
        participants: {
          some: { userId: booking.userId },
        },
      },
    });

    // 🧱 Create conversation if not found
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          palveluId: booking.palveluId,
          participants: {
            create: [
              { userId: booking.userId },
              { userId: booking.palvelu.userId },
            ],
          },
        },
      });
    }

    // 🔔 Notify provider
    await prisma.notification.create({
      data: {
        userId: booking.palvelu.userId,
        type: 'bookingPaid',
        message: `Asiakas on maksanut varauksen palveluun "${booking.palvelu.title}".`,
        link: `/viestit/${conversation.id}`,
      },
    });

    return res.json({ conversationId: conversation.id });

  } catch (err) {
    console.error('❌ Booking payment failed:', err);
    return res.status(500).json({ error: 'Could not complete booking payment.' });
  }
});

export default router;
