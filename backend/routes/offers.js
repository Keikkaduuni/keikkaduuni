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
  const offerId = req.params.offerId;
  const userId = req.user.id;

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

    res.sendStatus(204);
  } catch (err) {
    console.error('Error approving offer:', err);
    res.status(500).json({ error: 'Could not approve offer' });
  }
});

// Reject an offer
router.post('/:offerId/reject', authenticateToken, async (req, res) => {
  const offerId = req.params.offerId;
  const userId = req.user.id;

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

    res.sendStatus(204);
  } catch (err) {
    console.error('Error rejecting offer:', err);
    res.status(500).json({ error: 'Could not reject offer' });
  }
});

// Delete own offer
router.delete('/:offerId', authenticateToken, async (req, res) => {
  const offerId = req.params.offerId;
  const userId = req.user.id;

  try {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });

    if (!offer || offer.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed to delete this offer' });
    }

    await prisma.offer.delete({ where: { id: offerId } });

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


export default router;
