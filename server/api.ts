import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import memberRoutes from './routes/members';
import circulationRoutes from './routes/circulation';
import stockOpnameRoutes from './routes/stockOpname';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import aiRoutes from './routes/ai';
import { db } from './db';

dotenv.config();

const app = express();

let isDbReady = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDbInit() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = db
      .init()
      .then(() => {
        isDbReady = true;
      })
      .catch((err) => {
        console.error('[API] Database init error:', err);
        isDbReady = true;
      });
  }
  return dbInitPromise;
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(async (req, res, next) => {
  await ensureDbInit();
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/circulation', circulationRoutes);
app.use('/api/stock-opname', stockOpnameRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Astra Library System - Politeknik Astra',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default app;
