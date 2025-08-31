import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { specs } from './config/swagger';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logActivity } from './utils/activity';
// import { testConnection } from './config/database';

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

import testRoutes from './routes/test-routes';





dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const prisma = new PrismaClient();
let server: any;

app.use('/api/test', testRoutes);


// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Enhanced CORS configuration with debugging
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://ndarehe.com', 
      'https://www.ndarehe.com',
      'https://ndarehe.vercel.app',
      'https://ndarehe-frontend.vercel.app',
      'https://ndarehe.onrender.com',
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:5173',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    ];
    
    // Log CORS requests for debugging
    console.log('CORS request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin) || 
        process.env.NODE_ENV !== 'production') {
      console.log('CORS allowed for origin:', origin);
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Explicitly handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
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

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'NDAREHE API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins: [
        'https://ndarehe.com', 
        'https://www.ndarehe.com',
        'https://ndarehe.vercel.app',
        'https://ndarehe-frontend.vercel.app',
        'https://ndarehe.onrender.com',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      ]
    }
  });
});

// Root endpoint for Render health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'NDAREHE API Server is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
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
app.use('/api/transactions', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/trip-plans', tripPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Email verification route - FIXED VERSION
app.get('/verify-email', async (req, res) => {
  const { token, status } = req.query as { token?: string; status?: string };

  console.log('Verify-email route called with:', { token, status });

  // If token is present, handle the verification directly
  if (token) {
    try {
      // Verify token directly
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };
      
      // Update user verification status
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { isVerified: true }
      });

      console.log('Email verified successfully for user:', user.email);

      // Always redirect to the deployed frontend URL, not localhost
      const frontendUrl = process.env.FRONTEND_URL || 'https://ndarehe.vercel.app';
      
      return res.redirect(`${frontendUrl}/verify-email?status=success`);
    } catch (error) {
      console.error('Email verification failed:', error);
      
      const frontendUrl = process.env.FRONTEND_URL || 'https://ndarehe.vercel.app';
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.redirect(`${frontendUrl}/verify-email?status=error&message=Invalid or expired verification token`);
      }
      
      return res.redirect(`${frontendUrl}/verify-email?status=error&message=Verification failed`);
    }
  }

  // If status is present without token, redirect to frontend
  if (status) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://ndarehe.vercel.app';
    
    return res.redirect(`${frontendUrl}/verify-email?status=${encodeURIComponent(status)}`);
  }

  // Neither token nor status provided
  console.error('Missing verification parameters');
  return res.status(400).send('Missing verification parameters. Please provide a token or status.');
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
    },
    cors: {
      enabled: true,
      allowedOrigins: [
        'https://ndarehe.com', 
        'https://www.ndarehe.com',
        'https://ndarehe.vercel.app',
        'https://ndarehe-frontend.vercel.app',
        'https://ndarehe.onrender.com',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      ]
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
    // await testConnection();
    // console.log('✅ Database connection established');

    // Start server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 NDAREHE API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`📚 API Docs: http://0.0.0.0:${PORT}/api-docs`);
      
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
      
      // Display CORS configuration
      console.log('🌍 CORS Allowed Origins:', [
        'https://ndarehe.com', 
        'https://www.ndarehe.com',
        'https://ndarehe.vercel.app',
        'https://ndarehe-frontend.vercel.app',
        'https://ndarehe.onrender.com',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      ]);

      // Start automatic cleanup job for expired PENDING bookings
      startCleanupJob();
    });

    // Add error handling for the server
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
      }
      process.exit(1);
    });

    console.log(`✅ Server started successfully on port ${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Automatic cleanup job for expired PENDING bookings
const startCleanupJob = () => {
  const cleanupInterval = 15 * 60 * 1000; // 15 minutes
  
  const cleanupExpiredBookings = async () => {
    try {
      console.log('🧹 Starting automatic cleanup of expired PENDING bookings...');
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING' as any,
          createdAt: {
            lt: fifteenMinutesAgo
          }
        },
        include: {
          payment: true,
          review: true
        }
      });

      if (expiredBookings.length > 0) {
        // Use a transaction to safely delete related records
        const deleteResult = await prisma.$transaction(async (tx) => {
          let deletedCount = 0;
          
          for (const booking of expiredBookings) {
            try {
              // Delete related records first
              if (booking.payment) {
                await tx.payment.delete({
                  where: { id: booking.payment.id }
                });
              }
              
              if (booking.review) {
                await tx.review.delete({
                  where: { id: booking.review.id }
                });
              }
              
              // Now delete the booking
              await tx.booking.delete({
                where: { id: booking.id }
              });
              
              deletedCount++;
            } catch (error) {
              console.error(`❌ Failed to delete booking ${booking.id}:`, error);
            }
          }
          
          return { count: deletedCount };
        });

        console.log(`🧹 Cleaned up ${deleteResult.count} expired PENDING bookings`);
        
        // Log cleanup activity
        await logActivity({
          type: 'BOOKING_CANCELLED' as any,
          actorUserId: 'SYSTEM',
          targetType: 'BOOKING',
          targetId: 'AUTO_CLEANUP',
          message: `Automatically cleaned up ${deleteResult.count} expired PENDING bookings`,
          metadata: { cleanedCount: deleteResult.count, cleanupType: 'AUTO_EXPIRED_PENDING' },
        }).catch(() => {});
      } else {
        console.log('🧹 No expired PENDING bookings found');
      }
    } catch (error) {
      console.error('❌ Cleanup job error:', error);
    }
  };

  // Run cleanup immediately on startup
  cleanupExpiredBookings();
  
  // Schedule cleanup every 15 minutes
  setInterval(cleanupExpiredBookings, cleanupInterval);
  
  console.log('🧹 Automatic cleanup job started (runs every 15 minutes)');
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

startServer();