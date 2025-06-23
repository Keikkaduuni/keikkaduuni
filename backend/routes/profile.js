import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ---------- Multer config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, `profile-${unique}`);
  },
});
const upload = multer({ storage });

// ---------- GET /profile ----------
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      description: user.description,
      skills: user.skills?.split(',') || [],
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Virhe haettaessa profiilia' });
  }
});

// ---------- PUT /profile (update profile) ----------
// ---------- PUT /profile (update profile) ----------
router.put('/profile', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  console.log('⚡ PUT /api/profile triggered');

  try {
    const userId = req.user.id;

    // 🔒 Ensure all inputs are strings and trimmed
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const companyName = typeof req.body.companyName === 'string' ? req.body.companyName.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const removePhoto = req.body.removePhoto === 'true';

    let skills = '';
    if (typeof req.body.skills === 'string') {
      try {
        const parsed = JSON.parse(req.body.skills);
        if (Array.isArray(parsed)) {
          skills = parsed.map((s) => s.trim()).join(',');
        }
      } catch (err) {
        console.warn('⚠️ Invalid skills JSON:', req.body.skills);
      }
    }

    const updates = {
      name,
      companyName,
      description,
      skills,
    };

    if (removePhoto) {
      updates.profilePhoto = null;
    } else if (req.file) {
      updates.profilePhoto = `/uploads/${req.file.filename}`;
    }

    console.log('✅ Final update payload:', updates);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    res.status(500).json({ message: 'Profiilin päivitys epäonnistui' });
  }
});


// ---------- GET /check-name ----------
router.get('/check-name', authenticateToken, async (req, res) => {
  const { name, email } = req.query;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        name,
        NOT: { email },
      },
    });

    res.json({ taken: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Name check failed' });
  }
});

// ---------- GET /check-company ----------
router.get('/check-company', authenticateToken, async (req, res) => {
  const { companyName, email } = req.query;

  if (!companyName || !email) {
    return res.status(400).json({ error: 'Missing companyName or email' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        companyName,
        NOT: { email },
      },
    });

    res.json({ taken: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Company name check failed' });
  }
});

export default router;

