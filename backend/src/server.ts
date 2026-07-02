import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Route imports 
import authRoutes from './routes/auth.routes';
import farmerRoutes from './routes/farmer.routes';
import buyerRoutes from './routes/buyer.routes';
import transporterRoutes from './routes/transporter.routes';
import storageRoutes from './routes/storage.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import quotesRoutes from './routes/quotes.routes';
import offersRoutes from './routes/offers.routes';
import notificationsRoutes from './routes/notifications.routes';
import invoicesRoutes from './routes/invoices.routes';
import negotiationRoutes from './routes/negotiation.routes';
import warehousesRoutes from './routes/warehouses.routes';
import vehiclesRoutes from './routes/vehicles.routes';

// Load environment variables
// In local dev: loads from backend/.env
// On Vercel: env vars are injected at build time, dotenv is a no-op
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      // Vercel deployment URLs — allow any *.vercel.app subdomain
      /\.vercel\.app$/,
      // Custom domain (if any)
      'https://krishiai.in',
      'https://www.krishiai.in',
    ];
    const isAllowed = allowed.some(pattern =>
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    // Also allow if FRONTEND_URL env var is set (set this on Vercel)
    const envUrl = process.env.FRONTEND_URL;
    if (isAllowed || (envUrl && origin === envUrl)) {
      callback(null, true);
    } else {
      callback(null, true); // permissive for now — tighten after deploy
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transporter', transporterRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/negotiation', negotiationRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/vehicles', vehiclesRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
