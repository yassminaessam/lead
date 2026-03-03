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
