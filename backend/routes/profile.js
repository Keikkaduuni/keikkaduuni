import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import sharp from 'sharp';

const router = express.Router();

// ---------- Multer config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, `profile-${unique}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Enhanced HEIC/HEIF detection at multer level
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype?.toLowerCase() || '';
    
    const isHeicHeif = 
      ext === '.heic' || ext === '.heif' || ext === '.HEIC' || ext === '.HEIF' ||
      mime === 'image/heic' || mime === 'image/heif' ||
      mime === 'image/heic-sequence' || mime === 'image/heif-sequence' ||
      file.originalname?.toLowerCase().includes('heic') ||
      file.originalname?.toLowerCase().includes('heif');
    
    console.log('🔍 Profile multer fileFilter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: ext,
      isHeicHeif
    });
    
    if (isHeicHeif) {
      console.log('❌ Profile multer rejecting HEIC/HEIF file');
      return cb(new Error('HEIC/HEIF images are not supported. Please use JPEG or PNG.'), false);
    }
    
    // Additional check: If it's a PNG/JPEG but from iPhone, it might be HEIC
    const isFromIPhone = file.originalname?.includes('IMG_') || 
                        file.originalname?.includes('IMG') ||
                        file.originalname?.includes('Photo') ||
                        file.originalname?.includes('photo');
    
    console.log('🔍 Profile iPhone detection check:', {
      originalname: file.originalname,
      extension: ext,
      isFromIPhone,
      isPNGJPEG: ext === '.png' || ext === '.jpg' || ext === '.jpeg'
    });
    
    if (isFromIPhone && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
      console.log('⚠️ Profile multer: Possible disguised HEIC file from iPhone detected');
      return cb(new Error('This appears to be a HEIC file with a different extension. Please convert to JPEG or PNG before uploading.'), false);
    }
    
    console.log('✅ Profile multer accepting file');
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error.message);
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }
  
  if (error.message && error.message.includes('HEIC/HEIF')) {
    console.error('❌ HEIC/HEIF rejected by multer:', error.message);
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

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
router.put('/profile', authenticateToken, upload.single('profilePhoto'), handleMulterError, async (req, res) => {
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
      const filePath = req.file.path;
      const ext = path.extname(filePath).toLowerCase();
      const mime = req.file.mimetype?.toLowerCase() || '';
      
      // Enhanced HEIC/HEIF detection
      const isHeicHeif = 
        ext === '.heic' || ext === '.heif' || ext === '.HEIC' || ext === '.HEIF' ||
        mime === 'image/heic' || mime === 'image/heif' ||
        mime === 'image/heic-sequence' || mime === 'image/heif-sequence' ||
        req.file.originalname?.toLowerCase().includes('heic') ||
        req.file.originalname?.toLowerCase().includes('heif');
      
      console.log('🔍 Profile file upload debug:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        extension: ext,
        isHeicHeif,
        path: filePath
      });
      
      if (isHeicHeif) {
        console.log('❌ HEIC/HEIF detected in profile upload, rejecting file');
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
      }
      
      console.log('✅ Profile file passed HEIC check, processing with sharp');
      const tempPath = filePath + '-resized';
      try {
        await sharp(filePath)
          .resize(1280, 720, { fit: 'cover' })
          .toFile(tempPath);
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        updates.profilePhoto = `/uploads/${req.file.filename}`;
      } catch (sharpError) {
        console.error('❌ Sharp processing failed:', sharpError.message);
        // Clean up files
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        
        if (sharpError.message.includes('heif') || sharpError.message.includes('HEIC')) {
          return res.status(400).json({ error: 'HEIC/HEIF images are not supported. Please use JPEG or PNG.' });
        }
        return res.status(500).json({ error: 'Image processing failed. Please try a different image.' });
      }
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

// POST /api/reviews - Create a review
router.post('/reviews', authenticateToken, async (req, res) => {
  const { userId, rating, comment } = req.body;
  const reviewerId = req.user.id;

  if (!userId || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        reviewerId,
        rating: parseInt(rating),
        comment,
      },
    });

    // Notify reviewed user
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'reviewReceived',
        message: 'Sait uuden arvostelun.',
        link: `/profiili`,
      },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('new-notification', notification);
    }

    res.status(201).json(review);
  } catch (err) {
    console.error('Review creation error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET /api/reviews/received - Get reviews received by the current user
router.get('/reviews/received', authenticateToken, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    console.error('Failed to fetch received reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

export default router;

