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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
    version: '1.0.0'
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

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
