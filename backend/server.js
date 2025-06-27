// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma.js';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';
import conversationRoutes from './routes/conversations.js';
import bookingsRoutes from './routes/bookings.js';
import offersRoutes from './routes/offers.js';
import paymentRoutes from './routes/payments.js';
import messageRoutes from './routes/messages.js';
import http from 'http';
import { initSocket } from './socket.js';
import { Server } from 'socket.io';
import notificationsRouter from './routes/notifications.js';
import sharp from 'sharp';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

/* ------------------ Multer Config ------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${unique}${ext}`);
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
    
    console.log('🔍 Multer fileFilter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: ext,
      isHeicHeif
    });
    
    if (isHeicHeif) {
      console.log('❌ Multer rejecting HEIC/HEIF file');
      return cb(new Error('HEIC/HEIF images are not supported. Please use JPEG or PNG.'), false);
    }
    
    // More aggressive iPhone detection - reject ALL PNG files from iPhones
    const isFromIPhone = file.originalname?.includes('IMG_') || 
                        file.originalname?.includes('IMG') ||
                        file.originalname?.includes('Photo') ||
                        file.originalname?.includes('photo') ||
                        file.originalname?.includes('PXL_') ||
                        file.originalname?.includes('Screenshot') ||
                        file.originalname?.includes('screenshot');
    
    console.log('🔍 iPhone detection check:', {
      originalname: file.originalname,
      extension: ext,
      isFromIPhone,
      isPNG: ext === '.png',
      hasIMG: file.originalname?.includes('IMG_'),
      hasIMGNoUnderscore: file.originalname?.includes('IMG'),
      hasPhoto: file.originalname?.includes('Photo'),
      hasPhotoLower: file.originalname?.includes('photo'),
      hasPXL: file.originalname?.includes('PXL_'),
      hasScreenshot: file.originalname?.includes('Screenshot'),
      hasScreenshotLower: file.originalname?.includes('screenshot')
    });
    
    // Reject ALL PNG files from iPhones as they're likely disguised HEIC
    if (isFromIPhone && ext === '.png') {
      console.log('❌ Rejecting PNG file from iPhone (likely disguised HEIC)');
      return cb(new Error('PNG files from iPhones are not supported as they may be disguised HEIC files. Please convert to JPEG before uploading.'), false);
    }
    
    // Also reject JPEG files from iPhones if they have suspicious names
    if (isFromIPhone && (ext === '.jpg' || ext === '.jpeg') && file.originalname?.includes('IMG_')) {
      console.log('⚠️ Warning: JPEG from iPhone detected, but allowing with caution');
    }
    
    console.log('✅ Multer accepting file');
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

/* ------------------ Middleware ------------------ */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and local network IPs
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('172.20.10.2') ||
          origin.includes('192.168.') ||
          origin.includes('10.') ||
          origin.includes('172.')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.options('*', cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static('../uploads'));

// console.log(`➡ ${req.method} ${req.url}`);


app.use('/api/bookings', bookingsRoutes);

app.use('/api/offers', offersRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/messages', messageRoutes);







/* ------------------ Helper Functions ------------------ */

 // Only title + description are required now; contact has been removed entirely
 const validateEntry = ({ title, description }) =>
   Boolean(title?.trim()) && Boolean(description?.trim());


/* ------------------ Listings Router ------------------ */
const listingsRouter = express.Router();

// In-memory-demo-lista lähtötilanteessa
let listings = [
  {
    id: 1,
    type: 'PALVELUT',
    title: 'Service 1',
    description: 'Description of service 1',
    category: 'Demo',
    location: 'DemoCity',
    createdAt: new Date().toISOString(),
    photoUrl: null,
    price: '20',
    unit: 'hour',
    userName: 'Demo User',
    userPhotoUrl: null,
    rating: 4.5,
  },
  {
    id: 2,
    type: 'PALVELUT',
    title: 'Service 2',
    description: 'Description of service 2',
    category: 'Demo',
    location: 'DemoTown',
    createdAt: new Date().toISOString(),
    photoUrl: null,
    price: '50',
    unit: 'urakka',
    userName: 'Demo User',
    userPhotoUrl: null,
    rating: 4.0,
  },
];
let nextListingId = listings.length + 1;




// GET /listings?type=PALVELUT tai TARPEET
listingsRouter.get('/', (req, res) => {
  const { type } = req.query;
  const filtered = type ? listings.filter((l) => l.type === type) : listings;
  return res.json(filtered);
});

// GET /listings/:id → fetch a single listing by its numeric ID
listingsRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  const found = listings.find((l) => l.id === id);
  if (!found) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  return res.json(found);
});

// POST /listings (accepts multipart/form-data with photo)
listingsRouter.post(
  '/',
  upload.single('photo'),
  async (req, res) => {
    console.log('=== POST /listings vastaanotettu ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const {
      title,
      type,
      category,
      location,
      description,
      price,
      unit,
      userName,
      userPhotoUrl,
      rating,
    } = req.body;

    if (!title || !type || !category || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let photoUrl = null;
    if (req.file) {
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
      
      console.log('🔍 File upload debug:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        extension: ext,
        isHeicHeif,
        path: filePath
      });
      
      if (isHeicHeif) {
        console.log('❌ HEIC/HEIF detected, rejecting file');
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
      }
      
      console.log('✅ File passed HEIC check, processing with sharp');
      const tempPath = filePath + '-resized';
      try {
        await sharp(filePath)
          .resize(1280, 720, { fit: 'cover' })
          .toFile(tempPath);
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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

    const newListing = {
      id: nextListingId++,
      type,
      title,
      description: description || '',
      category,
      location,
      photoUrl,
      price: price || null,
      unit: unit || null,
      userName: userName || 'Tuntematon',
      userPhotoUrl: userPhotoUrl || null,
      rating: rating ? parseFloat(rating) : null,
      createdAt: new Date().toISOString(),
    };

    listings.unshift(newListing);
    return res.status(201).json(newListing);
  }
);

app.use('/listings', listingsRouter);

/* ------------------ Palvelut Routes ------------------ */
const palvelutRouter = express.Router();

palvelutRouter.get('/', async (req, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const take = parseInt(req.query.take) || 10;

  try {
    const palvelut = await prisma.palvelu.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            profilePhoto: true,
        },
      },
    },
 });

    const total = await prisma.palvelu.count();

    return res.json({ items: palvelut, total });
  } catch (err) {
    console.error('Failed to fetch palvelut with user info:', err);
    return res.status(500).json({ error: 'Failed to fetch palvelut' });
  }
});

// GET /api/palvelut/omat
palvelutRouter.get(
  '/omat',
  authenticateToken,
  async (req, res) => {
    console.log('🔥 HIT /api/palvelut/omat 🔥');
    try {
      const userId = req.user.id;

      // fetch all services for this user
      const services = await prisma.palvelu.findMany({
        where: { userId },
      });

      // get user's reviews once
      const reviews = await prisma.review.findMany({
        where: { userId },
      });

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      // attach rating + unread booking count per service
      const withCounts = await Promise.all(
        services.map(async (s) => {
          const pendingCount = await prisma.booking.count({
            where: { palveluId: s.id, status: 'pending' },
          });

          const unreadBookings = await prisma.booking.count({
            where: { palveluId: s.id, status: 'pending', isRead: false },
          });

          return {
            id: s.id,
            title: s.title,
            description: s.description,
            category: s.category,
            location: s.location,
            price: s.price,
            unit: s.unit,
            photoUrl: s.photoUrl,
            createdAt: s.createdAt,
            rating: avgRating,
            pendingCount,
            hasUnreadBookings: unreadBookings > 0,
          };
        })
      );

      res.json(withCounts);
    } catch (err) {
      console.error('❌ GET /api/palvelut/omat failed:', err.message, err.stack);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
);



// GET /api/palvelut/:id/bookings
palvelutRouter.get(
  '/:id/bookings',
  authenticateToken,
  async (req, res) => {
    console.log('🔥 GET /api/palvelut/omat was called');
    try {
      const palveluId = parseInt(req.params.id);
      // verify ownership (optional)
      const svc = await prisma.palvelu.findUnique({ where: { id: palveluId } });
      if (!svc || svc.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not allowed' });
      }
      // load bookings with user info
      const bookings = await prisma.booking.findMany({
        where: {
          palveluId,
          paymentCompleted: false,
          status: { not: 'rejected' },
        },
        include: {
          user: { select: { id: true, name: true, profilePhoto: true } },
          palvelu: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      // shape date and hours on the front-end
      res.json(bookings);
    } catch (err) {
      console.error('Error in GET /:id/bookings', err);
      res.status(500).json({ error: 'Failed to load bookings' });
    }
  }
);

// GET /palvelut/:id → fetch a single Palvelu by its numeric ID
palvelutRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const palvelu = await prisma.palvelu.findUnique({
      where: { id },
    });
    if (!palvelu) {
      return res.status(404).json({ error: 'Palvelu not found' });
    }
    return res.json(palvelu);
  } catch (err) {
    console.error('Error fetching palvelu by ID:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

palvelutRouter.post('/', authenticateToken, upload.single('photo'), handleMulterError, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      price,
      unit,
    } = req.body;
    const userId = req.user.id;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

      let photoUrl = null;
      if (req.file) {
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
        
        // Additional check: Read file header to detect disguised HEIC files
        let isDisguisedHeic = false;
        try {
          const buffer = fs.readFileSync(filePath);
          const header = buffer.slice(0, 12);
          
          // HEIC files start with specific bytes
          // Check for HEIC/HEIF file signatures
          if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
            // This is a container format, check for HEIC/HEIF subtypes
            const subtype = header.slice(8, 12).toString('ascii');
            if (subtype.includes('heic') || subtype.includes('heif') || subtype.includes('mif1') || subtype.includes('msf1')) {
              isDisguisedHeic = true;
              console.log('🔍 Detected disguised HEIC file by header analysis:', subtype);
            }
          }
        } catch (headerError) {
          console.log('⚠️ Could not read file header for analysis');
        }
        
        console.log('🔍 File upload debug:', {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          extension: ext,
          isHeicHeif,
          isDisguisedHeic,
          path: filePath
        });
        
        if (isHeicHeif || isDisguisedHeic) {
          console.log('❌ HEIC/HEIF detected, rejecting file');
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
        }
        
        console.log('✅ File passed HEIC check, processing with sharp');
        const tempPath = filePath + '-resized';
        try {
          await sharp(filePath)
            .resize(1280, 720, { fit: 'cover' })
            .toFile(tempPath);
          fs.unlinkSync(filePath);
          fs.renameSync(tempPath, filePath);
          photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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


    const newPalvelu = await prisma.palvelu.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        location: location || null,
        price: price ? parseFloat(price) : null,
        unit: unit || null,
        photoUrl,
        userId,
      },
    });

    return res.status(201).json(newPalvelu);
  } catch (err) {
    console.error('Failed to create palvelu:', err);
    return res.status(500).json({ error: 'Failed to create palvelu' });
  }
});


palvelutRouter.put('/:id', authenticateToken, upload.single('photo'), handleMulterError, async (req, res) => {
  const id = Number(req.params.id);

  const {
    title,
    description,
    category,
    location,
    price,
    unit,
    existingPhoto, // fallback if no new upload
  } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  let photoUrl = null;

  if (req.file) {
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
    
    // Additional check: Read file header to detect disguised HEIC files
    let isDisguisedHeic = false;
    try {
      const buffer = fs.readFileSync(filePath);
      const header = buffer.slice(0, 12);
      
      // HEIC files start with specific bytes
      // Check for HEIC/HEIF file signatures
      if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
        // This is a container format, check for HEIC/HEIF subtypes
        const subtype = header.slice(8, 12).toString('ascii');
        if (subtype.includes('heic') || subtype.includes('heif') || subtype.includes('mif1') || subtype.includes('msf1')) {
          isDisguisedHeic = true;
          console.log('🔍 Detected disguised HEIC file by header analysis:', subtype);
        }
      }
    } catch (headerError) {
      console.log('⚠️ Could not read file header for analysis');
    }
    
    console.log('🔍 File upload debug:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      extension: ext,
      isHeicHeif,
      isDisguisedHeic,
      path: filePath
    });
    
    if (isHeicHeif || isDisguisedHeic) {
      console.log('❌ HEIC/HEIF detected, rejecting file');
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
    }
    
    console.log('✅ File passed HEIC check, processing with sharp');
    const tempPath = filePath + '-resized';
    try {
      await sharp(filePath)
        .resize(1280, 720, { fit: 'cover' })
        .toFile(tempPath);
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
  } else if (existingPhoto) {
    photoUrl = existingPhoto;
  }

  try {
    const updatedPalvelu = await prisma.palvelu.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        location: location || null,
        price: price ? parseFloat(price) : null,
        unit: unit || null,
        photoUrl,
      },
    });

    return res.json(updatedPalvelu);
  } catch (err) {
    console.error('Failed to update palvelu:', err);
    return res.status(500).json({ error: 'Failed to update palvelu' });
  }
});



// DELETE /api/palvelut/:id
palvelutRouter.delete('/:id', authenticateToken, async (req, res) => {
  const palveluId = parseInt(req.params.id, 10);
  const userId = req.user?.id;

  console.log('🧨 Attempting to delete palvelu:', palveluId);
  console.log('🔑 Authenticated user ID:', userId, '| type:', typeof userId);

  try {
    const svc = await prisma.palvelu.findUnique({ where: { id: palveluId } });

    if (!svc) {
      console.log('❌ Palvelu not found');
      return res.status(404).json({ error: 'Palvelua ei löytynyt.' });
    }

    console.log('📦 Palvelun omistaja:', svc.userId, '| type:', typeof svc.userId);
    console.log('📏 userId length:', userId?.length, '— palvelu.userId length:', svc.userId?.length);
    console.log('🆚 Equality check:', String(svc.userId).trim() === String(userId).trim());

    if (String(svc.userId).trim() !== String(userId).trim()) {
      console.log('⛔️ Ownership mismatch — not allowed to delete');
      return res.status(403).json({ error: 'Et voi poistaa tätä palvelua.' });
    }

    await prisma.palvelu.delete({ where: { id: palveluId } });

    console.log('✅ Palvelu deleted successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('🔥 Unexpected error during deletion:', err);
    res.status(500).json({ error: 'Poisto epäonnistui palvelinvirheen vuoksi.' });
  }
});








app.get('/palvelut/:id/reviews', async (req, res) => {
  const { id } = req.params;

  try {
    const palvelu = await prisma.palvelu.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!palvelu) return res.status(404).json({ error: 'Palvelu not found' });

    const reviews = await prisma.review.findMany({
      where: { userId: palvelu.userId },
      include: {
        reviewer: {
          select: { name: true, profilePhoto: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});



/* ------------------ Tarpeet Routes ------------------ */
const tarpeetRouter = express.Router();

// GET /api/tarpeet → fetch all Tarpeet
tarpeetRouter.get('/', async (req, res) => {
  try {
    const tarpeet = await prisma.tarve.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tarpeet);
  } catch (err) {
    console.error('Error fetching all Tarpeet:', err);
    res.status(500).json({ error: 'Failed to fetch Tarpeet' });
  }
});

tarpeetRouter.get(
  '/omat',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const needs = await prisma.tarve.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          photoUrl: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // attach offer count + unread offer count per tarve
      const withCounts = await Promise.all(
        needs.map(async (t) => {
          const pendingCount = await prisma.offer.count({
            where: { tarveId: t.id, status: 'pending' },
          });

          const unreadOffers = await prisma.offer.count({
            where: { tarveId: t.id, status: 'pending', isRead: false },
          });

          return {
            id: t.id,
            title: t.title,
            createdAt: t.createdAt,
            photoUrl: t.photoUrl,
            pendingCount,
            hasUnreadOffers: unreadOffers > 0,
          };
        })
      );

      res.json(withCounts);
    } catch (err) {
      console.error('Error in GET /omat (tarpeet):', err);
      res.status(500).json({ error: 'Failed to load your tarpeet' });
    }
  }
);

tarpeetRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const tarve = await prisma.tarve.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!tarve) {
      return res.status(404).json({ error: 'Tarve not found' });
    }

    // ✅ Format for frontend
    const result = {
      ...tarve,
      userName: tarve.user?.name || '',
      userProfilePhoto: tarve.user?.profilePhoto || null,
    };

    return res.json(result);
  } catch (err) {
    console.error('Error fetching tarve by ID:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





// POST /tarpeet (JSON only, requires auth)
tarpeetRouter.post('/', authenticateToken, upload.single('photo'), handleMulterError, async (req, res) => {
  const { title, description, category, location } = req.body;
  const userId = req.user.id;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  let photoUrl = null;
  if (req.file) {
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
    
    // Additional check: Read file header to detect disguised HEIC files
    let isDisguisedHeic = false;
    try {
      const buffer = fs.readFileSync(filePath);
      const header = buffer.slice(0, 12);
      
      // HEIC files start with specific bytes
      // Check for HEIC/HEIF file signatures
      if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
        // This is a container format, check for HEIC/HEIF subtypes
        const subtype = header.slice(8, 12).toString('ascii');
        if (subtype.includes('heic') || subtype.includes('heif') || subtype.includes('mif1') || subtype.includes('msf1')) {
          isDisguisedHeic = true;
          console.log('🔍 Detected disguised HEIC file by header analysis:', subtype);
        }
      }
    } catch (headerError) {
      console.log('⚠️ Could not read file header for analysis');
    }
    
    console.log('🔍 File upload debug:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      extension: ext,
      isHeicHeif,
      isDisguisedHeic,
      path: filePath
    });
    
    if (isHeicHeif || isDisguisedHeic) {
      console.log('❌ HEIC/HEIF detected, rejecting file');
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
    }
    
    console.log('✅ File passed HEIC check, processing with sharp');
    const tempPath = filePath + '-resized';
    try {
      await sharp(filePath)
        .resize(1280, 720, { fit: 'cover' })
        .toFile(tempPath);
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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

  try {
    const newTarve = await prisma.tarve.create({
      data: {
        title,
        description,
        category: category || null,
        location: location || null,
        userId,
        photoUrl,
      },
    });
    return res.status(201).json(newTarve);
  } catch (err) {
    console.error('Failed to create tarve:', err);
    return res.status(500).json({ error: 'Failed to create tarve' });
  }
});


tarpeetRouter.put('/:id', authenticateToken, upload.single('photo'), handleMulterError, async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, category, location, existingPhoto } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  let photoUrl = null;
  if (req.file) {
    // 📸 New photo uploaded
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
    
    // Additional check: Read file header to detect disguised HEIC files
    let isDisguisedHeic = false;
    try {
      const buffer = fs.readFileSync(filePath);
      const header = buffer.slice(0, 12);
      
      // HEIC files start with specific bytes
      // Check for HEIC/HEIF file signatures
      if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
        // This is a container format, check for HEIC/HEIF subtypes
        const subtype = header.slice(8, 12).toString('ascii');
        if (subtype.includes('heic') || subtype.includes('heif') || subtype.includes('mif1') || subtype.includes('msf1')) {
          isDisguisedHeic = true;
          console.log('🔍 Detected disguised HEIC file by header analysis:', subtype);
        }
      }
    } catch (headerError) {
      console.log('⚠️ Could not read file header for analysis');
    }
    
    console.log('🔍 File upload debug:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      extension: ext,
      isHeicHeif,
      isDisguisedHeic,
      path: filePath
    });
    
    if (isHeicHeif || isDisguisedHeic) {
      console.log('❌ HEIC/HEIF detected, rejecting file');
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
    }
    
    console.log('✅ File passed HEIC check, processing with sharp');
    const tempPath = filePath + '-resized';
    try {
      await sharp(filePath)
        .resize(1280, 720, { fit: 'cover' })
        .toFile(tempPath);
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
  } else if (existingPhoto) {
    // 🖼 Keep existing photo
    photoUrl = existingPhoto;
  }

  try {
    const updatedTarve = await prisma.tarve.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        location: location || null,
        photoUrl,
      },
    });

    return res.json(updatedTarve);
  } catch (err) {
    console.error('Failed to update tarve:', err);
    return res.status(500).json({ error: 'Failed to update tarve' });
  }
});


tarpeetRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    const tarve = await prisma.tarve.findUnique({ where: { id } });
    if (!tarve) {
      return res.status(404).json({ error: 'Tarve not found' });
    }

    if (String(tarve.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Et voi poistaa tätä tarvetta.' });
    }

    // 🔥 Delete related offers first
    await prisma.offer.deleteMany({ where: { tarveId: id } });

    // ✅ Then delete the Tarve
    await prisma.tarve.delete({ where: { id } });

    console.log('✅ Tarve deleted:', id);
    return res.json({ message: 'Tarve deleted successfully' });
  } catch (err) {
    console.error('🔥 Tarve delete error:', err);
    return res.status(500).json({ error: 'Server error while deleting tarve' });
  }
});




app.use('/api/tarpeet', tarpeetRouter);

app.use('/api/palvelut', palvelutRouter);

/* ------------------ Auth Routes ------------------ */
app.use('/api/auth', authRoutes);

/* ------------------ Conversations Routes ------------------ */
app.use('/api/conversations', conversationRoutes);

/* ------------------ Messages Routes ------------------ */




/* ------------------ Update Profile Route ------------------ */
app.put(
  '/api/profile',
  authenticateToken,
  upload.single('profilePhoto'),
  handleMulterError,
  async (req, res) => {
    try {
      const userId = req.user.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { name = '', companyName = '', description = '', skills = '', removePhoto } =
        req.body;

      if (!name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      let parsedSkills = [];
      try {
        parsedSkills = Array.isArray(skills)
          ? skills
          : typeof skills === 'string'
          ? JSON.parse(skills)
          : [];
      } catch {
        parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const oldPhotoPath = user?.profilePhoto
        ? path.join('uploads', path.basename(user.profilePhoto))
        : null;

      const updateData = {
        name: name.trim(),
        companyName: companyName.trim(),
        description: description.trim(),
        skills: parsedSkills.join(','),
      };

      if (req.file) {
        if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
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
        
        // Additional check: Read file header to detect disguised HEIC files
        let isDisguisedHeic = false;
        try {
          const buffer = fs.readFileSync(filePath);
          const header = buffer.slice(0, 12);
          
          // HEIC files start with specific bytes
          // Check for HEIC/HEIF file signatures
          if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
            // This is a container format, check for HEIC/HEIF subtypes
            const subtype = header.slice(8, 12).toString('ascii');
            if (subtype.includes('heic') || subtype.includes('heif') || subtype.includes('mif1') || subtype.includes('msf1')) {
              isDisguisedHeic = true;
              console.log('🔍 Detected disguised HEIC file by header analysis:', subtype);
            }
          }
        } catch (headerError) {
          console.log('⚠️ Could not read file header for analysis');
        }
        
        console.log('🔍 File upload debug:', {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          extension: ext,
          isHeicHeif,
          isDisguisedHeic,
          path: filePath
        });
        
        if (isHeicHeif || isDisguisedHeic) {
          console.log('❌ HEIC/HEIF detected, rejecting file');
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'HEIC/HEIF images are not supported by the backend. Please use JPEG or PNG.' });
        }
        
        console.log('✅ File passed HEIC check, processing with sharp');
        const tempPath = filePath + '-resized';
        try {
          await sharp(filePath)
            .resize(1280, 720, { fit: 'cover' })
            .toFile(tempPath);
          fs.unlinkSync(filePath);
          fs.renameSync(tempPath, filePath);
          updateData.profilePhoto = `/uploads/${req.file.filename}`;
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
      } else if (removePhoto === 'true') {
        if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
        updateData.profilePhoto = null;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return res.json({
        message: 'Profile updated successfully',
        user: {
          ...updatedUser,
          skills: updatedUser.skills ? updatedUser.skills.split(',') : [],
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/* ------------------ Get Profile Route ------------------ */
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        profilePhoto: true,
        description: true,
        skills: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      ...user,
      skills: user.skills ? user.skills.split(',') : [],
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/* ------------------ Check Name / Company Routes ------------------ */
app.get('/api/check-name', authenticateToken, async (req, res) => {
  const { name, email } = req.query;
  if (!name || !email) return res.status(400).json({ error: 'Missing name or email' });

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        name: name.toString(),
        email: { not: email.toString() },
      },
    });
    return res.json({ taken: !!existingUser });
  } catch (err) {
    console.error('Name check error:', err);
    return res.status(500).json({ error: 'Name check failed' });
  }
});

app.get('/api/check-company', authenticateToken, async (req, res) => {
  const { companyName, email } = req.query;
  if (!companyName || !email) {
    return res.status(400).json({ error: 'Missing company name or email' });
  }
  try {
    const existing = await prisma.user.findFirst({
      where: {
        companyName: companyName.toString(),
        email: { not: email.toString() },
      },
    });
    return res.json({ taken: !!existing });
  } catch (err) {
    console.error('Company name check error:', err);
    return res.status(500).json({ error: 'Company name check failed' });
  }
});


app.post('/api/reports', authenticateToken, async (req, res) => {
  const { palveluId, tarveId, reason } = req.body;

  console.log('📩 Incoming report:', { userId: req.user?.id, palveluId, tarveId, reason });

  if (!reason || (!palveluId && !tarveId)) {
    return res.status(400).json({ error: 'Reason and either palveluId or tarveId are required.' });
  }

  try {
    const report = await prisma.report.create({
      data: {
        reason,
        userId: req.user?.id || null,
        palveluId: palveluId ? parseInt(palveluId, 10) : null,
        tarveId: tarveId ? parseInt(tarveId, 10) : null, // ✅ Fix: parse to number

      },
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('❌ Failed to submit report:', err); // <-- full error here
    res.status(500).json({ error: 'Internal server error' });
  }
});




/* ------------------ Default Routes ------------------ */
app.get('/', (req, res) => res.send('Backend server is up and running'));

app.get('/routes', (req, res) => {
  return res.json([
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/listings' },
    { method: 'POST', path: '/listings' },
    { method: 'POST', path: '/api/auth/login' },
    { method: 'PUT', path: '/api/profile' },
  ]);
});

/* ------------------ Start Server ------------------ */
const server = http.createServer(app); // 🔁 convert Express to HTTP server
initSocket(server);                    // 🔌 attach WebSocket support

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Backend + Socket.IO running at http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accessible from mobile at http://172.20.10.2:${PORT}`);
});

app.use('/api/notifications', notificationsRouter);

// Global error handler for unhandled sharp errors
app.use((error, req, res, next) => {
  console.error('🔥 Global error handler caught:', error.message);
  
  if (error.message.includes('heif') || error.message.includes('HEIC')) {
    // Clean up any uploaded files
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    return res.status(400).json({ error: 'HEIC/HEIF images are not supported. Please use JPEG or PNG.' });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason && reason.message && (reason.message.includes('heif') || reason.message.includes('HEIC'))) {
    console.log('✅ Caught HEIC error, preventing crash');
    return;
  }
});

process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error.message);
  if (error.message.includes('heif') || error.message.includes('HEIC')) {
    console.log('✅ Caught HEIC error, preventing crash');
    return;
  }
  process.exit(1);
});
