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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ------------------ Multer Config ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profilePhoto-${unique}${ext}`);
  },
});
const upload = multer({ storage });

// ------------------ Middleware ------------------
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.options('*', cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ------------------ Helper Functions ------------------
const validateEntry = ({ title, description, contact }) =>
  title?.trim() && description?.trim() && contact?.trim();

// ------------------ Listings Router ------------------
const listingsRouter = express.Router();
const listings = [
  { id: 1, type: 'PALVELUT', title: 'Service 1', description: 'Description of service 1' },
  { id: 2, type: 'PALVELUT', title: 'Service 2', description: 'Description of service 2' },
];
let nextListingId = listings.length + 1;

listingsRouter.get('/', (req, res) => {
  const { type } = req.query;
  const filtered = type ? listings.filter((l) => l.type === type) : listings;
  res.json(filtered);
});

listingsRouter.post('/', (req, res) => {
  const { title, type, category, location, description } = req.body;
  if (!title || !type || !category || !location) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const newListing = {
    id: nextListingId++,
    title,
    type,
    category,
    location,
    description: description || '',
    createdAt: new Date().toISOString(),
  };
  listings.push(newListing);
  res.status(201).json(newListing);
});

app.use('/listings', listingsRouter);

// ------------------ Palvelut Routes ------------------
const palvelutRouter = express.Router();

palvelutRouter.get('/', async (req, res) => {
  try {
    const palvelut = await prisma.palvelu.findMany();
    res.json(palvelut);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch palvelut' });
  }
});

palvelutRouter.post('/', authenticateToken, async (req, res) => {
  if (!validateEntry(req.body)) {
    return res.status(400).json({ error: 'Title, description and contact are required.' });
  }
  try {
    const { title, description, contact } = req.body;
    const newPalvelu = await prisma.palvelu.create({ data: { title, description, contact } });
    res.status(201).json(newPalvelu);
  } catch {
    res.status(500).json({ error: 'Failed to create palvelu' });
  }
});

palvelutRouter.put('/:id', async (req, res) => {
  if (!validateEntry(req.body)) {
    return res.status(400).json({ error: 'Title, description and contact are required.' });
  }
  try {
    const { id } = req.params;
    const { title, description, contact } = req.body;
    const updatedPalvelu = await prisma.palvelu.update({
      where: { id: Number(id) },
      data: { title, description, contact },
    });
    res.json(updatedPalvelu);
  } catch {
    res.status(500).json({ error: 'Failed to update palvelu' });
  }
});

palvelutRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.palvelu.delete({ where: { id: Number(id) } });
    res.json({ message: 'Palvelu deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete palvelu' });
  }
});

app.use('/palvelut', palvelutRouter);

// ------------------ Tarpeet Routes ------------------
const tarpeetRouter = express.Router();

tarpeetRouter.get('/', async (req, res) => {
  try {
    const tarpeet = await prisma.tarve.findMany();
    res.json(tarpeet);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tarpeet' });
  }
});

tarpeetRouter.post('/', async (req, res) => {
  if (!validateEntry(req.body)) {
    return res.status(400).json({ error: 'Title, description and contact are required.' });
  }
  try {
    const { title, description, contact } = req.body;
    const newTarve = await prisma.tarve.create({ data: { title, description, contact } });
    res.status(201).json(newTarve);
  } catch {
    res.status(500).json({ error: 'Failed to create tarve' });
  }
});

tarpeetRouter.put('/:id', async (req, res) => {
  if (!validateEntry(req.body)) {
    return res.status(400).json({ error: 'Title, description and contact are required.' });
  }
  try {
    const { id } = req.params;
    const { title, description, contact } = req.body;
    const updatedTarve = await prisma.tarve.update({
      where: { id: Number(id) },
      data: { title, description, contact },
    });
    res.json(updatedTarve);
  } catch {
    res.status(500).json({ error: 'Failed to update tarve' });
  }
});

tarpeetRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tarve.delete({ where: { id: Number(id) } });
    res.json({ message: 'Tarve deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete tarve' });
  }
});

app.use('/tarpeet', tarpeetRouter);

// ------------------ Auth Routes ------------------
app.use('/api/auth', authRoutes);

// ------------------ Update Profile Route ------------------
app.put('/api/profile', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name = '', description = '', skills = '', removePhoto } = req.body;

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
    const oldPhotoPath = user?.profilePhoto ? path.join('uploads', path.basename(user.profilePhoto)) : null;

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      skills: parsedSkills.join(','),
    };

    if (req.file) {
      // Delete old photo if it exists and being replaced
      if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      updateData.profilePhoto = `/uploads/${req.file.filename}`;
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

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        skills: updatedUser.skills ? updatedUser.skills.split(',') : [],
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// ------------------ Get Profile Route ------------------
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

    res.json({
      ...user,
      skills: user.skills ? user.skills.split(',') : [],
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Add this route near the other profile-related ones
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


// ------------------ Default Routes ------------------
app.get('/', (req, res) => res.send('Backend server is up and running'));

app.get('/routes', (req, res) => {
  res.json([
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/listings' },
    { method: 'POST', path: '/listings' },
    { method: 'POST', path: '/api/auth/login' },
    { method: 'PUT', path: '/api/profile' },
  ]);
});

// ------------------ Start Server ------------------
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

