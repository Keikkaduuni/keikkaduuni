import express from 'express';
import prisma from '../../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/conversations
 * Fetch all conversations for the authenticated user,
 * including participants, related listing titles, and latest message preview.
 */
router.get('/', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const convosRaw = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: currentUserId, deleted: false },
        },
      },
      include: {
        participants: {
          select: {
            userId: true,
            lastSeenAt: true,
            user: {
              select: {
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        liittyyPalveluun: {
          select: {
            id: true,
            title: true,
          },
        },
        liittyyTarpeeseen: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    const convos = convosRaw.map((c) => {
      const messages = c.messages || [];
      const lastMessage = messages[messages.length - 1];
      const currentParticipant = c.participants.find(p => p.userId === currentUserId);
      const lastSeenAt = currentParticipant?.lastSeenAt;
      const isUnread = lastMessage &&
         lastMessage.senderId !== currentUserId &&
         (!lastSeenAt || new Date(lastMessage.createdAt) > new Date(lastSeenAt));


      return {
        id: c.id,
        participants: c.participants.map((p) => ({
          userId: p.userId,
          name: p.user.name,
          profilePhoto: p.user.profilePhoto,
        })),
        palveluId: c.palveluId,
        tarveId: c.tarveId,
        palveluTitle: c.liittyyPalveluun?.title,
        tarveTitle: c.liittyyTarpeeseen?.title,
        messages: messages,
        isUnread,
      };
    });

    return res.json(convos);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/conversations/booking/:bookingId
 * Find conversation for a specific booking
 */
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  const bookingId = req.params.bookingId;
  const currentUserId = req.user.id;

  try {
    // First find the booking to get the palveluId
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { palvelu: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is authorized (either the booking owner or the service provider)
    if (booking.userId !== currentUserId && booking.palvelu.userId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to access this booking' });
    }

    // Find conversation for this palvelu
    const conversation = await prisma.conversation.findFirst({
      where: {
        palveluId: booking.palveluId,
        participants: {
          some: { userId: currentUserId, deleted: false },
        },
      },
      select: { id: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found for this booking' });
    }

    return res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error finding conversation for booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/conversations/offer/:offerId
 * Find conversation for a specific offer
 */
router.get('/offer/:offerId', authenticateToken, async (req, res) => {
  const offerId = parseInt(req.params.offerId);
  const currentUserId = req.user.id;

  try {
    // First find the offer to get the tarveId
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { tarve: true },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check if user is authorized (either the offer sender or the need owner)
    if (offer.userId !== currentUserId && offer.tarve.userId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to access this offer' });
    }

    // Find conversation for this tarve
    const conversation = await prisma.conversation.findFirst({
      where: {
        tarveId: offer.tarveId,
        participants: {
          some: { userId: currentUserId, deleted: false },
        },
      },
      select: { id: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found for this offer' });
    }

    return res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error finding conversation for offer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/conversations
 * Create a new conversation (or retrieve if it already exists),
 * tied to exactly one Palvelu or one Tarve.
 */
router.post('/', authenticateToken, async (req, res) => {
  const { otherUserId, palveluId, tarveId } = req.body;
  const currentUserId = req.user.id;

  if (!otherUserId || (!palveluId && !tarveId)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (palveluId && tarveId) {
    return res.status(400).json({ error: 'Only one of palveluId or tarveId can be set' });
  }

  try {
    const existing = await prisma.conversation.findFirst({
      where: {
        palveluId: palveluId || undefined,
        tarveId: tarveId || undefined,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        liittyyPalveluun: { select: { title: true } },
        liittyyTarpeeseen: { select: { title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
    });

    if (existing) {
      const convo = {
        id: existing.id,
        participants: existing.participants.map((p) => ({
          userId: p.userId,
          name: p.user.name,
          profilePhoto: p.user.profilePhoto,
        })),
        palveluId: existing.palveluId,
        tarveId: existing.tarveId,
        palveluTitle: existing.liittyyPalveluun?.title,
        tarveTitle: existing.liittyyTarpeeseen?.title,
        messages: existing.messages,
      };
      return res.status(200).json({ message: 'Conversation already exists', conversation: convo });
    }

    const created = await prisma.conversation.create({
      data: {
        palveluId: palveluId || undefined,
        tarveId: tarveId || undefined,
        participants: {
          create: [
            { userId: currentUserId },
            { userId: otherUserId },
          ],
        },
      },
    });

    const fullConvo = await prisma.conversation.findUnique({
      where: { id: created.id },
      include: {
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        liittyyPalveluun: { select: { title: true } },
        liittyyTarpeeseen: { select: { title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
    });

    const convo = {
      id: fullConvo.id,
      participants: fullConvo.participants.map((p) => ({
        userId: p.userId,
        name: p.user.name,
        profilePhoto: p.user.profilePhoto,
      })),
      palveluId: fullConvo.palveluId,
      tarveId: fullConvo.tarveId,
      palveluTitle: fullConvo.liittyyPalveluun?.title,
      tarveTitle: fullConvo.liittyyTarpeeseen?.title,
      messages: fullConvo.messages,
    };

    return res.status(201).json({ message: 'Conversation created', conversation: convo });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/conversations/:id/read
 * Mark the conversation as read by updating lastSeenAt for current user.
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;

  try {
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        deleted: false,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Failed to mark conversation as read:', err);
    res.status(500).json({ error: 'Could not mark conversation as read' });
  }
});

/**
 * DELETE /api/conversations/:id
 * Soft delete for current user
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;

  try {
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: { userId, conversationId },
      },
      data: {
        deleted: true,
      },
    });

    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Failed to delete conversation:', err);
    res.status(500).json({ error: 'Could not delete conversation' });
  }
});


/**
 * GET /api/conversations/:id
 * Fetch a single conversation by ID for the current user
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const convo = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        liittyyPalveluun: {
          select: {
            id: true,
            title: true,
          },
        },
        liittyyTarpeeseen: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = convo.participants.some(p => p.userId === currentUserId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    const formatted = {
      id: convo.id,
      participants: convo.participants.map((p) => ({
        userId: p.userId,
        name: p.user.name,
        profilePhoto: p.user.profilePhoto,
      })),
      palveluId: convo.palveluId,
      tarveId: convo.tarveId,
      palveluTitle: convo.liittyyPalveluun?.title,
      tarveTitle: convo.liittyyTarpeeseen?.title,
      messages: convo.messages,
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching single conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
