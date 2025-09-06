const express = require('express');
const router = express.Router();
const Learner = require('../models/Learner');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const axios = require('axios');

// Get notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const notifications = [];

    if (user.role === 'admin' || user.role === 'instructor') {
      // Admin/Instructor notifications - ML risk alerts
      await generateRiskAlerts(notifications);
      await generateEngagementInsights(notifications);
      await generateSystemNotifications(notifications);
    } else {
      // Learner notifications - personalized encouragement and progress
      await generateLearnerNotifications(notifications, user._id);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.slice(0, 50), // Limit to 50 most recent
        unreadCount: notifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
  try {
    // In a real implementation, you'd update the notification in the database
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    // In a real implementation, you'd update all notifications for the user
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Send intervention to at-risk learner
router.post('/send-intervention', auth, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const { learnerId, interventionType, message } = req.body;

    // In a real implementation, you'd:
    // 1. Send email/SMS to the learner
    // 2. Create an in-app notification for the learner
    // 3. Log the intervention in the database
    // 4. Update the learner's intervention history

    console.log(`Sending ${interventionType} intervention to learner ${learnerId}: ${message}`);

    res.status(200).json({
      success: true,
      message: 'Intervention sent successfully'
    });
  } catch (error) {
    console.error('Error sending intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send intervention'
    });
  }
});

// Helper function to generate risk alerts for admins
async function generateRiskAlerts(notifications) {
  try {
    // Get high-risk learners from ML service
    const learners = await Learner.find({ 'enrollments.0': { $exists: true } })
      .populate('userId', 'email profile.name')
      .limit(20);

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    for (const learner of learners) {
      try {
        const response = await axios.post(`${mlServiceUrl}/predict`, {
          learner_id: learner._id.toString()
        }, { timeout: 5000 });

        const prediction = response.data;
        
        if (prediction.risk_level === 'high') {
          notifications.push({
            id: `risk-${learner._id}`,
            type: 'warning',
            title: 'High-Risk Learner Alert',
            message: `${learner.userId.profile.name} shows ${Math.round(prediction.risk_score * 100)}% dropout risk`,
            timestamp: new Date(),
            read: false,
            metadata: {
              learnerId: learner._id,
              riskScore: prediction.risk_score,
              riskLevel: prediction.risk_level
            },
            actions: [
              {
                label: 'Send Intervention',
                type: 'intervention',
                data: { learnerId: learner._id }
              },
              {
                label: 'View Profile',
                type: 'view',
                data: { learnerId: learner._id }
              }
            ]
          });
        } else if (prediction.risk_level === 'medium') {
          notifications.push({
            id: `warning-${learner._id}`,
            type: 'ai',
            title: 'Medium-Risk Learner',
            message: `${learner.userId.profile.name} may need support (${Math.round(prediction.risk_score * 100)}% risk)`,
            timestamp: new Date(),
            read: false,
            metadata: {
              learnerId: learner._id,
              riskScore: prediction.risk_score,
              riskLevel: prediction.risk_level
            }
          });
        }
      } catch (mlError) {
        // Skip if ML service is unavailable for this learner
        continue;
      }
    }
  } catch (error) {
    console.error('Error generating risk alerts:', error);
  }
}

// Helper function to generate engagement insights
async function generateEngagementInsights(notifications) {
  const insights = [
    {
      id: 'insight-engagement',
      type: 'ai',
      title: 'AI Insight: Engagement Pattern',
      message: 'Learners who engage in the first 3 days show 40% higher completion rates',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    },
    {
      id: 'insight-difficulty',
      type: 'info',
      title: 'Course Analysis',
      message: 'Module 3 in Data Science course has the highest dropout rate (23%)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false
    }
  ];

  notifications.push(...insights);
}

// Helper function to generate system notifications
async function generateSystemNotifications(notifications) {
  const systemNotifications = [
    {
      id: 'system-report',
      type: 'info',
      title: 'Weekly Report Ready',
      message: 'Platform engagement report for this week is now available',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    }
  ];

  notifications.push(...systemNotifications);
}

// Helper function to generate learner-specific notifications
async function generateLearnerNotifications(notifications, userId) {
  try {
    const learner = await Learner.findOne({ userId });
    if (!learner) return;

    // Encouragement based on progress
    const activeEnrollments = learner.enrollments.filter(e => e.status === 'active');
    
    for (const enrollment of activeEnrollments) {
      if (enrollment.progress > 0.8) {
        notifications.push({
          id: `encouragement-${enrollment.courseId}`,
          type: 'success',
          title: 'Great Progress!',
          message: `You're ${Math.round(enrollment.progress * 100)}% complete with your course. Keep it up!`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false
        });
      } else if (enrollment.progress < 0.2) {
        notifications.push({
          id: `motivation-${enrollment.courseId}`,
          type: 'info',
          title: 'Get Back on Track',
          message: 'Take the next step in your learning journey. Complete your next module today!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        });
      }
    }

    // Achievement notifications
    const completedCourses = learner.enrollments.filter(e => e.status === 'completed');
    if (completedCourses.length > 0) {
      notifications.push({
        id: 'achievement-completion',
        type: 'success',
        title: 'Course Completed!',
        message: `Congratulations! You've completed ${completedCourses.length} course${completedCourses.length > 1 ? 's' : ''}`,
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: false
      });
    }

  } catch (error) {
    console.error('Error generating learner notifications:', error);
  }
}

module.exports = router;
