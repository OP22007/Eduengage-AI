require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const learnerRoutes = require('./routes/learner');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const coursesRoutes = require('./routes/courses');
const notificationsRoutes = require('./routes/notifications');
const achievementsRoutes = require('./routes/achievements');

// Import risk tracking scheduler
const { initializeRiskScheduler } = require('./scripts/dailyRiskUpdate');
const { initializeNotificationScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Production
      process.env.FRONTEND_URL,
      // Vercel patterns - update with your actual project name
      'https://upgrad-hackathon.vercel.app',
      'https://upgrad-hackathon-git-main.vercel.app',
      /^https:\/\/upgrad-hackathon.*\.vercel\.app$/,
      // Generic Vercel pattern (less secure, use specific URLs above when possible)
      /^https:\/\/.*\.vercel\.app$/
    ].filter(Boolean);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // Cache preflight response for 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request from origin:', req.headers.origin);
  }
  next();
});

// Database connection
const connectDB = async () => {
  try {
    console.log('🔗 Attempting MongoDB Atlas connection...');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/engagement-platform';
    
    
    // MongoDB Atlas connection options with proper pooling
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
      // Connection pooling to prevent leaks
      maxPoolSize: 10, // Maximum number of connections in pool
      minPoolSize: 2,  // Minimum number of connections to maintain
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      waitQueueTimeoutMS: 5000, // Max time to wait for a connection from pool
      // Retry and write concern
      retryWrites: true,
      w: 'majority',
      // SSL/TLS Configuration for MongoDB Atlas
      ssl: true,
      tlsAllowInvalidCertificates: true, // Use newer TLS option instead of sslValidate
      tlsAllowInvalidHostnames: true,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error('❌ Primary MongoDB connection failed:', error.message);
    
    // Fallback: Try without SSL for local development
    console.log('🔄 Attempting fallback connection without SSL...');
    try {
      const fallbackOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        ssl: false,
      };
      
      const fallbackConn = await mongoose.connect(
        'mongodb://localhost:27017/engagement-platform', 
        fallbackOptions
      );
      console.log(`✅ MongoDB Connected (Local Fallback): ${fallbackConn.connection.host}`);
      return;
    } catch (fallbackError) {
      console.error('❌ All MongoDB connection attempts failed');
      console.error('Local fallback error:', fallbackError.message);
      
      // Don't exit in development - allow the server to run without DB for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Running in development mode without database connection');
        return;
      }
      
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/learners', learnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/achievements', achievementsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    cors: {
      origin: req.headers.origin || 'no-origin',
      allowed: true
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`👋 ${signal} received. Shutting down gracefully...`);
  
  // Close server first
  server.close((err) => {
    if (err) {
      console.error('❌ Error closing server:', err);
      process.exit(1);
    }
    
    console.log('🔒 HTTP server closed');
  });
  
  // Close database connection (without callback)
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1);
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions to prevent memory leaks
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize risk tracking scheduler after server starts
  if (process.env.ENABLE_RISK_SCHEDULER !== 'false') {
    try {
      await initializeRiskScheduler();
      console.log('✅ Risk tracking scheduler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize risk scheduler:', error);
    }
  }

  // Initialize notification scheduler
  if (process.env.ENABLE_NOTIFICATION_SCHEDULER !== 'false') {
    try {
      initializeNotificationScheduler();
      console.log('✅ Notification scheduler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification scheduler:', error);
    }
  } else {
    console.log('ℹ️ Notification scheduler disabled (set ENABLE_NOTIFICATION_SCHEDULER=true to enable)');
  }
});
