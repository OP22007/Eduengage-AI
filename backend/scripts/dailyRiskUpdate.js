const cron = require('node-cron');
const mongoose = require('mongoose');
const riskTrackingService = require('../services/riskTrackingService');

// Configure MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Database connected for daily risk update');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Daily risk update function
const runDailyRiskUpdate = async () => {
  const startTime = new Date();
  console.log(`Starting daily risk update at ${startTime.toISOString()}`);
  
  try {
    const result = await riskTrackingService.runDailyRiskUpdate();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log('Daily risk update completed successfully:');
    console.log(`- Processed ${result.processedLearners} learners`);
    console.log(`- Risk distribution updated`);
    console.log(`- Duration: ${duration} seconds`);
    console.log(`- Completed at: ${endTime.toISOString()}`);
    
    return result;
  } catch (error) {
    console.error('Daily risk update failed:', error);
    
    // Could add notification service here to alert admins
    // await notificationService.sendAlert('Daily risk update failed', error.message);
    
    throw error;
  }
};

// Cleanup old risk tracking data (keep last 90 days)
const cleanupOldRiskData = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const result = await riskTrackingService.cleanupOldRiskData(cutoffDate);
    console.log(`Cleaned up ${result.deletedCount} old risk tracking records`);
    
    return result;
  } catch (error) {
    console.error('Risk data cleanup failed:', error);
    throw error;
  }
};

// Schedule daily risk update at 2:00 AM every day
const scheduleDailyRiskUpdate = () => {
  // Run at 2:00 AM every day (0 2 * * *)
  cron.schedule('0 2 * * *', async () => {
    try {
      await runDailyRiskUpdate();
    } catch (error) {
      console.error('Scheduled risk update failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Daily risk update scheduled for 2:00 AM UTC');
};

// Schedule weekly cleanup on Sundays at 3:00 AM
const scheduleWeeklyCleanup = () => {
  // Run at 3:00 AM every Sunday (0 3 * * 0)
  cron.schedule('0 3 * * 0', async () => {
    try {
      await cleanupOldRiskData();
    } catch (error) {
      console.error('Weekly cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Weekly cleanup scheduled for 3:00 AM UTC on Sundays');
};

// Manual execution for testing
const runManualUpdate = async () => {
  await connectDB();
  await runDailyRiskUpdate();
  await mongoose.connection.close();
  console.log('Manual risk update completed');
};

// Initialize the scheduler
const initializeRiskScheduler = async () => {
  try {
    await connectDB();
    
    // Schedule the recurring jobs
    scheduleDailyRiskUpdate();
    scheduleWeeklyCleanup();
    
    console.log('Risk tracking scheduler initialized successfully');
    
    // Optionally run initial update
    if (process.env.RUN_INITIAL_RISK_UPDATE === 'true') {
      console.log('Running initial risk update...');
      await runDailyRiskUpdate();
    }
    
  } catch (error) {
    console.error('Failed to initialize risk scheduler:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down risk scheduler...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down risk scheduler...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = {
  initializeRiskScheduler,
  runDailyRiskUpdate,
  runManualUpdate,
  cleanupOldRiskData
};

// If this script is run directly, initialize the scheduler
if (require.main === module) {
  if (process.argv[2] === 'manual') {
    runManualUpdate();
  } else {
    initializeRiskScheduler();
  }
}
