const cron = require('node-cron');
const notificationService = require('./services/notificationService');
const DailyRiskTracking = require('./models/DailyRiskTracking');
const Learner = require('./models/Learner');

// Initialize notification scheduler
function initializeNotificationScheduler() {
  console.log('🔔 Initializing notification scheduler...');

  // Run risk notifications every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running scheduled risk notification check...');
    try {
      const result = await notificationService.processAllRiskNotifications();
      console.log(`✅ Processed risk notifications for ${result.length} learners`);
    } catch (error) {
      console.error('❌ Error in scheduled risk notifications:', error);
    }
  });

  // Run daily risk tracking update at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('📊 Running daily risk tracking update...');
    try {
      await updateDailyRiskTracking();
      console.log('✅ Daily risk tracking updated successfully');
    } catch (error) {
      console.error('❌ Error updating daily risk tracking:', error);
    }
  });

  // Run retry logic for unread notifications every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Checking for notification retries...');
    try {
      await retryUnreadNotifications();
      console.log('✅ Notification retry check completed');
    } catch (error) {
      console.error('❌ Error in notification retry check:', error);
    }
  });

  // Send motivational quotes to low-risk learners daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('💪 Sending daily motivational notifications...');
    try {
      await sendDailyMotivationalQuotes();
      console.log('✅ Daily motivational notifications sent');
    } catch (error) {
      console.error('❌ Error sending motivational notifications:', error);
    }
  });

  console.log('✅ Notification scheduler initialized successfully');
}

// Update daily risk tracking for all active learners
async function updateDailyRiskTracking() {
  try {
    const activeLearners = await Learner.find({
      'enrollments.status': 'active'
    }).populate('userId', 'profile.name email');

    let processed = 0;
    let errors = 0;

    for (const learner of activeLearners) {
      try {
        // Calculate average risk score
        const activeEnrollments = learner.enrollments.filter(e => e.status === 'active');
        if (activeEnrollments.length === 0) continue;

        const avgRiskScore = activeEnrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / activeEnrollments.length;
        const riskLevel = avgRiskScore > 0.7 ? 'high' : avgRiskScore > 0.4 ? 'medium' : 'low';

        // Update or create daily risk tracking
        await DailyRiskTracking.findOneAndUpdate(
          {
            learnerId: learner._id,
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          },
          {
            learnerId: learner._id,
            date: new Date(),
            riskScore: avgRiskScore,
            riskLevel: riskLevel,
            enrollmentCount: activeEnrollments.length,
            avgProgress: activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length,
            lastActivity: learner.lastActivity || new Date(),
            interventionsSent: 0, // Will be updated by notification service
            metadata: {
              courses: activeEnrollments.map(e => e.courseId),
              calculatedAt: new Date()
            }
          },
          { upsert: true, new: true }
        );

        processed++;
      } catch (learnerError) {
        console.error(`Error processing learner ${learner._id}:`, learnerError);
        errors++;
      }
    }

    console.log(`Daily risk tracking: ${processed} processed, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('Error in updateDailyRiskTracking:', error);
    throw error;
  }
}

// Retry unread notifications based on frequency rules
async function retryUnreadNotifications() {
  try {
    const Notification = require('./models/Notification');
    
    // Find notifications that need retry
    const hoursAgo24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hoursAgo48 = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Get unread notifications older than 24 hours
    const notifications = await Notification.find({
      readAt: null,
      status: { $in: ['sent', 'delivered'] },
      createdAt: { $lt: hoursAgo24 },
      riskLevel: { $in: ['high', 'medium'] },
      'frequencyRules.maxRetries': { $gt: 0 }
    }).populate('learnerId userId');

    let retryCount = 0;

    for (const notification of notifications) {
      try {
        const timeSinceCreated = Date.now() - notification.createdAt.getTime();
        const hoursSince = timeSinceCreated / (1000 * 60 * 60);

        // High risk: retry every 24 hours for 3 times
        if (notification.riskLevel === 'high' && hoursSince >= 24) {
          if (notification.frequencyRules.retryCount < 3) {
            await retryNotification(notification);
            retryCount++;
          }
        }
        // Medium risk: retry every 48 hours for 2 times
        else if (notification.riskLevel === 'medium' && hoursSince >= 48) {
          if (notification.frequencyRules.retryCount < 2) {
            await retryNotification(notification);
            retryCount++;
          }
        }
      } catch (notificationError) {
        console.error(`Error retrying notification ${notification._id}:`, notificationError);
      }
    }

    console.log(`Retried ${retryCount} notifications`);
    return retryCount;

  } catch (error) {
    console.error('Error in retryUnreadNotifications:', error);
    throw error;
  }
}

// Retry a specific notification
async function retryNotification(notification) {
  const Notification = require('./models/Notification');
  
  // Create a new notification (retry)
  const retryNotification = new Notification({
    userId: notification.userId,
    learnerId: notification.learnerId,
    type: notification.type,
    title: `Reminder: ${notification.title}`,
    message: `This is a follow-up to ensure you received our message: ${notification.message}`,
    priority: notification.priority,
    riskLevel: notification.riskLevel,
    channels: notification.channels,
    actionRequired: notification.actionRequired,
    frequencyRules: {
      ...notification.frequencyRules,
      retryCount: notification.frequencyRules.retryCount + 1,
      lastRetry: new Date()
    },
    data: {
      ...notification.data,
      isRetry: true,
      originalNotificationId: notification._id
    }
  });

  await retryNotification.save();

  // Update original notification
  notification.frequencyRules.retryCount = notification.frequencyRules.retryCount + 1;
  notification.frequencyRules.lastRetry = new Date();
  await notification.save();

  console.log(`Retried notification ${notification._id} for learner ${notification.learnerId}`);
}

// Send daily motivational quotes to low-risk learners
async function sendDailyMotivationalQuotes() {
  try {
    const lowRiskLearners = await Learner.find({
      'enrollments.status': 'active'
    }).populate('userId', 'profile.name email');

    const motivationalQuotes = [
      "Keep going! Every expert was once a beginner. 🌟",
      "Your dedication to learning is inspiring! 📚",
      "Small daily improvements lead to stunning results! 💪",
      "Learning is a treasure that will follow its owner everywhere. 🎓",
      "The beautiful thing about learning is that no one can take it away from you! 🌈",
      "Success is the sum of small efforts repeated day in and day out. ⭐",
      "Don't stop when you're tired. Stop when you're done! 🏃‍♀️",
      "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice. 🎁"
    ];

    let sentCount = 0;

    for (const learner of lowRiskLearners) {
      try {
        // Calculate risk level
        const activeEnrollments = learner.enrollments.filter(e => e.status === 'active');
        if (activeEnrollments.length === 0) continue;

        const avgRiskScore = activeEnrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / activeEnrollments.length;
        
        // Only send to low-risk learners
        if (avgRiskScore <= 0.4) {
          const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
          
          await notificationService.sendInAppNotification({
            userId: learner.userId._id,
            learnerId: learner._id,
            type: 'motivation',
            title: 'Daily Inspiration 💫',
            message: randomQuote,
            priority: 'low',
            riskLevel: 'low',
            actionRequired: false,
            data: {
              category: 'daily-motivation',
              sentAt: new Date()
            }
          });

          sentCount++;
        }
      } catch (learnerError) {
        console.error(`Error sending motivation to learner ${learner._id}:`, learnerError);
      }
    }

    console.log(`Sent ${sentCount} motivational notifications`);
    return sentCount;

  } catch (error) {
    console.error('Error in sendDailyMotivationalQuotes:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down notification scheduler...');
  cron.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down notification scheduler...');
  cron.destroy();
  process.exit(0);
});

module.exports = {
  initializeNotificationScheduler,
  updateDailyRiskTracking,
  retryUnreadNotifications,
  sendDailyMotivationalQuotes
};
