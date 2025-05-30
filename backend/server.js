import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';

import prisma from '../src/lib/prisma.js'; // adjust path if needed
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ================== Multer Config ==================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

// ================== Middleware ==================
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.options('*', cors());

app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// ================== Helpers ==================
const skillsToString = (skillsArray) => skillsArray?.join(',') || '';
const skillsToArray = (skillsString) =>
  skillsString ? skillsString.split(',').map((s) => s.trim()) : [];

const validateEntry = ({ title, description, contact }) =>
  title?.trim() && description?.trim() && contact?.trim();

// ================== Listings Router ==================
const listingsRouter = express.Router();

const listings = [
  { id: 1, type: 'PALVELUT', title: 'Service 1', description: 'Description of service 1' },
  { id: 2, type: 'PALVELUT', title: 'Service 2', description: 'Description of service 2' },
  { id: 3, type: 'PRODUCT', title: 'Product 1', description: 'Description of product 1' },
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

// ================== Palvelut Router ==================
const palvelutRouter = express.Router();

palvelutRouter.get('/', async (req, res) => {
  try {
    const palvelut = await prisma.palvelu.findMany();
    res.json(palvelut);
  } catch (error) {
    console.error('Error fetching palvelut:', error);
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
  } catch (error) {
    console.error('Error creating palvelu:', error);
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
  } catch (error) {
    console.error('Error updating palvelu:', error);
    res.status(500).json({ error: 'Failed to update palvelu' });
  }
});

palvelutRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.palvelu.delete({ where: { id: Number(id) } });
    res.json({ message: 'Palvelu deleted' });
  } catch (error) {
    console.error('Error deleting palvelu:', error);
    res.status(500).json({ error: 'Failed to delete palvelu' });
  }
});

app.use('/palvelut', palvelutRouter);

// ================== Tarpeet Router ==================
const tarpeetRouter = express.Router();

tarpeetRouter.get('/', async (req, res) => {
  try {
    const tarpeet = await prisma.tarve.findMany();
    res.json(tarpeet);
  } catch (error) {
    console.error('Error fetching tarpeet:', error);
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
  } catch (error) {
    console.error('Error creating tarve:', error);
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
  } catch (error) {
    console.error('Error updating tarve:', error);
    res.status(500).json({ error: 'Failed to update tarve' });
  }
});

tarpeetRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tarve.delete({ where: { id: Number(id) } });
    res.json({ message: 'Tarve deleted' });
  } catch (error) {
    console.error('Error deleting tarve:', error);
    res.status(500).json({ error: 'Failed to delete tarve' });
  }
});

app.use('/tarpeet', tarpeetRouter);

// ================== Auth Routes ==================
app.use('/api/auth', authRoutes);

// ================== Profile Update ==================
app.put('/api/profile', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, skills } = req.body;

    // Parse skills safely - either array or CSV string
    let parsedSkills = [];
    if (skills) {
      try {
        parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
      } catch {
        parsedSkills = skills.split(',').map(s => s.trim());
      }
    }

    // Build update object only with provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (parsedSkills.length > 0) updateData.skills = parsedSkills.join(',');
    if (req.file) updateData.profilePhoto = `/uploads/${req.file.filename}`;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      message: 'Profile updated',
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


// ================== Get Current User Profile ==================
// Example GET /api/profile route
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
        description: true,  // Include these new fields here
        skills: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


// ================== Base Routes ==================
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

// ================== Start Server ==================
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

