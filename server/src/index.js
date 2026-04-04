import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import callsRouter from './routes/calls.js';
import meetingsRouter from './routes/meetings.js';
import usersRouter from './routes/users.js';
import activitiesRouter from './routes/activities.js';
import settingsRouter from './routes/settings.js';
import scrapeRouter from './routes/scrape.js';
import backupRouter from './routes/backup.js';
import emailRouter from './routes/email.js';
import messagingRouter from './routes/messaging.js';
import { setupSignaling, dialDevice } from './signaling.js';
import { scheduleBackups } from './services/scheduler.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadengine';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/backup', backupRouter);
app.use('/api/email', emailRouter);
app.use('/api/messaging', messagingRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI, {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
})
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Schedule automatic backups
    await scheduleBackups();
    
    const httpServer = createServer(app);

    // Socket.IO signaling server for WebRTC voice bridge
    const io = new SocketIOServer(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });
    setupSignaling(io);

    // Expose dialDevice for call routes
    app.set('dialDevice', dialDevice);

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebRTC signaling server ready on ws://localhost:${PORT}`);
    });
    // Allow long-running scrape requests (up to 2 hours for comprehensive search with expanded areas)
    httpServer.timeout = 120 * 60 * 1000;
    httpServer.keepAliveTimeout = 120 * 60 * 1000;
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
