import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, `profile-${unique}`);
  },
});

const upload = multer({ storage });

router.put('/', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, description, skills, removePhoto } = req.body;
    const userId = req.user.id;

    const updates = {
      name,
      description: description || '',
      skills: skills ? JSON.parse(skills) : [],
    };

    if (removePhoto === 'true') {
      updates.profilePhoto = null;
    } else if (req.file) {
      updates.profilePhoto = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Profiilin päivitys epäonnistui' });
  }
});

export default router;
