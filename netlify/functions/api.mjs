import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';

// Import models
import '../../server/src/models/User.js';
import '../../server/src/models/Lead.js';
import '../../server/src/models/Call.js';
import '../../server/src/models/Meeting.js';
import '../../server/src/models/Activity.js';
import '../../server/src/models/Settings.js';

// Import routes
import authRouter from '../../server/src/routes/auth.js';
import leadsRouter from '../../server/src/routes/leads.js';
import callsRouter from '../../server/src/routes/calls.js';
import meetingsRouter from '../../server/src/routes/meetings.js';
import usersRouter from '../../server/src/routes/users.js';
import activitiesRouter from '../../server/src/routes/activities.js';
import settingsRouter from '../../server/src/routes/settings.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes — mounted at root because Netlify redirects /api/* → /.netlify/functions/api/*
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/settings', settingsRouter);

// Save scraped leads endpoint (extracted from scrape route to avoid puppeteer dependency)
const Lead = mongoose.model('Lead');
app.post('/api/scrape/save', async (req, res) => {
  try {
    const { leads: leadsData, assignTo } = req.body;
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    let noPhone = 0;
    const created = [];

    for (const data of leadsData) {
      if (!data.company_name) { failed++; continue; }
      if (!data.phone) { noPhone++; continue; }

      try {
        const lead = await Lead.create({
          company_name: data.company_name,
          phone: String(data.phone).replace(/\s+/g, ''),
          email: data.email || '',
          website: data.website || '',
          industry: data.industry || 'غير محدد',
          city: data.city || 'غير محدد',
          source: data.source || 'gmaps',
          status: 'new',
          assigned_to: assignTo || '',
          notes: data.address ? `العنوان: ${data.address}` : '',
          rating: data.rating || 0,
        });
        created.push(lead);
        success++;
      } catch (err) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          failed++;
        }
      }
    }

    res.status(201).json({ success, failed, duplicates, noPhone, leads: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB connection (reuse across invocations)
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverApi: { version: '1', strict: true, deprecationErrors: true },
  });
  isConnected = true;
}

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return serverlessHandler(event, context);
};
