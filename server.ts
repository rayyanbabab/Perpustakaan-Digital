import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth';
import bookRoutes from './server/routes/books';
import memberRoutes from './server/routes/members';
import circulationRoutes from './server/routes/circulation';
import stockOpnameRoutes from './server/routes/stockOpname';
import reportRoutes from './server/routes/reports';
import settingsRoutes from './server/routes/settings';
import aiRoutes from './server/routes/ai';
import { db } from './server/db';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database (Neon PostgreSQL / Local sync)
  await db.init();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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

  // Vite middleware for development or Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  📚 ASTRA LIBRARY SYSTEM - POLITEKNIK ASTRA`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer();
