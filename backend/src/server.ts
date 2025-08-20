import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { testConnection } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import accommodationRoutes from './routes/accommodations';
import transportationRoutes from './routes/transportation';
import tourRoutes from './routes/tours';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import tripPlanRoutes from './routes/tripPlans';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ndarehe.com', 
        'https://www.ndarehe.com',
        'https://ndarehe.vercel.app',
        'https://ndarehe-frontend.vercel.app',
        'https://ndarehe.onrender.com',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      ]
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'NDAREHE API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Favicon handler to avoid noisy 404s
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/transportation', transportationRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/trip-plans', tripPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Legacy/compatibility route: redirect /verify-email to the API endpoint or frontend
app.get('/verify-email', (req, res) => {
  const { token, status } = req.query as { token?: string; status?: string };

  // If token is present, forward to API endpoint for verification
  if (token) {
    const apiBase = process.env.BACKEND_URL || process.env.API_BASE_URL || '';
    const target = `${apiBase}/api/auth/verify-email?token=${encodeURIComponent(token)}&redirect=true`;
    // If BACKEND_URL is not set (same host), just redirect to local path
    if (!apiBase) {
      return res.redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}&redirect=true`);
    }
    return res.redirect(target);
  }

  // If status is present without token, this is likely a redirect meant for the frontend
  if (status) {
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : undefined);
    if (frontendUrl) {
      return res.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=${encodeURIComponent(status)}`);
    }
    // As a last resort, show a simple message instead of 400
    return res
      .status(status === 'success' ? 200 : 400)
      .send(`Email verification status: ${status}. Please open ${process.env.FRONTEND_URL || 'your frontend app'} to view this page.`);
  }

  // Neither token nor status provided
  return res.status(400).send('Missing verification parameters');
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NDAREHE API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
}));

// Welcome message for root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to NDAREHE.COM API',
    version: '1.0.0',
    description: 'Accommodation and Local Experience Booking Platform',
    documentation: 'https://ndarehe.com/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      accommodations: '/api/accommodations',
      transportation: '/api/transportation',
      tours: '/api/tours',
      bookings: '/api/bookings',
      payments: '/api/payments',
      reviews: '/api/reviews',
      tripPlans: '/api/trip-plans',
      notifications: '/api/notifications',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection established');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 NDAREHE API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      // Sanitize and display DB host and key URLs for debugging environment mismatches
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const parsed = dbUrl ? new URL(dbUrl) : null;
        console.log(`🗄️  DB Host: ${parsed ? parsed.hostname + (parsed.port ? ':' + parsed.port : '') : 'unknown'}`);
      } catch {
        console.log('🗄️  DB Host: unknown');
      }
      console.log(`🌐 BACKEND_URL: ${process.env.BACKEND_URL || '(not set)'}`);
      console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || '(not set)'}`);
      console.log(`🌐 BASE_URL: ${process.env.BASE_URL || '(not set)'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 