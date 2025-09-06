const express = require('express');
const router = express.Router();
const Learner = require('../models/Learner');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const { auth, authorize } = require('../middleware/auth');
const axios = require('axios');

// Test route to verify notifications endpoint is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications API is working!',
    timestamp: new Date().toISOString()
  });
});

// Test route to create a sample notification (for testing)
router.post('/test-create', auth, async (req, res) => {
  try {
    const notificationService = require('../services/notificationService');
    
    // Create a test notification
    await notificationService.sendInAppNotification({
      userId: req.user._id,
      learnerId: null, // Optional for test
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'low',
      actionRequired: false,
      data: {
        testCreatedAt: new Date(),
        testBy: req.user._id
      }
    });

    res.json({
      success: true,
      message: 'Test notification created successfully!'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});

// Get notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    let query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.readAt = null;
      query.status = { $in: ['sent', 'delivered'] };
    }

    // Get notifications from database
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('learnerId', 'enrollments')
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
      status: { $in: ['sent', 'delivered'] }
    });

    // If no notifications in DB, generate some legacy notifications for compatibility
    let legacyNotifications = [];
    if (notifications.length === 0) {
      if (req.user.role === 'admin' || req.user.role === 'instructor') {
        await generateRiskAlerts(legacyNotifications);
        await generateEngagementInsights(legacyNotifications);
        await generateSystemNotifications(legacyNotifications);
      } else {
        await generateLearnerNotifications(legacyNotifications, req.user._id);
      }
    }

    // Combine database notifications with legacy notifications
    const allNotifications = [
      ...notifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        read: !!n.readAt,
        priority: n.priority,
        metadata: n.data,
        channels: n.channels,
        riskLevel: n.riskLevel,
        actionRequired: n.actionRequired
      })),
      ...legacyNotifications
    ];

    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        notifications: allNotifications.slice(0, 50), // Limit to 50 most recent
        unreadCount: unreadCount + legacyNotifications.filter(n => !n.read).length,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
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
router.post('/:notificationId/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    // Check if this is a legacy notification ID (non-ObjectId format)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      // For legacy notifications, just return success without database operation
      return res.status(200).json({
        success: true,
        message: 'Legacy notification marked as read (client-side only)'
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

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
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        userId: req.user._id,
        readAt: null 
      },
      { 
        readAt: new Date(),
        status: 'read'
      }
    );

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

// Track notification click
router.post('/:notificationId/click', auth, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    // Check if this is a legacy notification ID (non-ObjectId format)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      // For legacy notifications, just return success without database operation
      return res.status(200).json({
        success: true,
        message: 'Legacy notification click tracked (client-side only)'
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsClicked();

    res.status(200).json({
      success: true,
      message: 'Notification click tracked'
    });
  } catch (error) {
    console.error('Error tracking notification click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click'
    });
  }
});

// Dismiss notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    // Check if this is a legacy notification ID (non-ObjectId format)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      // For legacy notifications, just return success without database operation
      return res.status(200).json({
        success: true,
        message: 'Legacy notification dismissed (client-side only)'
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.dismiss();

    res.status(200).json({
      success: true,
      message: 'Notification dismissed'
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss notification'
    });
  }
});

// Send intervention to at-risk learner
router.post('/send-intervention', auth, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const { learnerId, interventionType, message, riskLevel } = req.body;

    if (!learnerId || !interventionType) {
      return res.status(400).json({
        success: false,
        message: 'Learner ID and intervention type are required'
      });
    }

    // Get learner details
    const learner = await Learner.findById(learnerId).populate('userId');
    
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    // Determine risk level if not provided
    let finalRiskLevel = riskLevel;
    if (!finalRiskLevel) {
      const avgRiskScore = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length;
      finalRiskLevel = avgRiskScore > 0.7 ? 'high' : avgRiskScore > 0.4 ? 'medium' : 'low';
    }

    // Send risk-based notification
    const result = await notificationService.sendRiskBasedNotification(
      learnerId, 
      finalRiskLevel, 
      0.5 // Default risk score
    );

    // Send custom message if provided
    if (message) {
      await notificationService.sendInAppNotification({
        userId: learner.userId._id,
        learnerId: learnerId,
        type: 'admin-intervention',
        title: `Message from ${req.user.role}`,
        message: message,
        priority: finalRiskLevel === 'high' ? 'high' : 'medium',
        riskLevel: finalRiskLevel,
        actionRequired: true,
        data: {
          sentBy: req.user._id,
          sentByName: req.user.profile?.name || req.user.role,
          interventionType
        }
      });
    }

    console.log(`Sending ${interventionType} intervention to learner ${learnerId}: ${message}`);

    res.status(200).json({
      success: true,
      message: 'Intervention sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send intervention'
    });
  }
});

// Get notification statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await Notification.getNotificationStats(req.user._id, parseInt(days));
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification stats'
    });
  }
});

// Test risk notification system (Admin only)
router.post('/test-risk-system', auth, authorize(['admin']), async (req, res) => {
  try {
    const result = await notificationService.processAllRiskNotifications();
    
    res.status(200).json({
      success: true,
      message: 'Risk notification system test completed',
      data: result
    });
  } catch (error) {
    console.error('Error testing risk system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test risk system'
    });
  }
});

// Process risk notifications manually (Admin only)
router.post('/process-risk-notifications', auth, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const result = await notificationService.processAllRiskNotifications();
    
    res.status(200).json({
      success: true,
      message: 'Risk notifications processed successfully',
      data: {
        processed: result.length,
        results: result
      }
    });
  } catch (error) {
    console.error('Error processing risk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process risk notifications'
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
  const timestamp = Date.now();
  const insights = [
    {
      id: `insight-engagement-${timestamp}`,
      type: 'ai',
      title: 'AI Insight: Engagement Pattern',
      message: 'Learners who engage in the first 3 days show 40% higher completion rates',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    },
    {
      id: `insight-difficulty-${timestamp}`,
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
  const timestamp = Date.now();
  const systemNotifications = [
    {
      id: `system-report-${timestamp}`,
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
          id: `encouragement-${enrollment.courseId}-${userId}`,
          type: 'success',
          title: 'Great Progress!',
          message: `You're ${Math.round(enrollment.progress * 100)}% complete with your course. Keep it up!`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false
        });
      } else if (enrollment.progress < 0.2) {
        notifications.push({
          id: `motivation-${enrollment.courseId}-${userId}`,
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
        id: `achievement-completion-${userId}`,
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
