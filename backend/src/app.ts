import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

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

const app = express();

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed: (string | RegExp)[] = [
      'http://localhost:5173',
      'http://localhost:3000',
      /\.vercel\.app$/,
      'https://krishiai.in',
      'https://www.krishiai.in',
    ];
    const isAllowed = allowed.some(p =>
      typeof p === 'string' ? p === origin : p.test(origin)
    );
    const envUrl = process.env.FRONTEND_URL;
    callback(null, isAllowed || (!!envUrl && origin === envUrl) || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check — Vercel hits this to confirm the function is alive
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

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

app.use(errorHandler);

export default app;
