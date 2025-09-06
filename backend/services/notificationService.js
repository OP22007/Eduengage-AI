const Learner = require('../models/Learner');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Email transporter setup (placeholder)
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'noreply@platform.com',
        pass: process.env.EMAIL_PASS || 'password'
      }
    });
    
    // SMS service setup (placeholder)
    this.smsService = {
      send: async (to, message) => {
        console.log(`SMS sent to ${to}: ${message}`);
        return { success: true, messageId: Date.now() };
      }
    };
  }

  // Main notification dispatcher based on risk level
  async sendRiskBasedNotification(learnerId, riskLevel, riskScore) {
    try {
      const learner = await Learner.findById(learnerId).populate('userId');
      if (!learner) {
        throw new Error('Learner not found');
      }

      const user = learner.userId;
      const lastLoginHours = this.getHoursSinceLastLogin(user.lastLogin);
      
      // Check if we should send notification based on last notification time
      const shouldSend = await this.shouldSendNotification(learnerId, riskLevel, lastLoginHours);
      
      if (!shouldSend) {
        console.log(`Skipping notification for learner ${learnerId} - too recent`);
        return { success: false, reason: 'Too recent notification' };
      }

      let result = {};

      switch (riskLevel) {
        case 'high':
          result = await this.handleHighRiskNotification(learner, riskScore, lastLoginHours);
          break;
        case 'medium':
          result = await this.handleMediumRiskNotification(learner, riskScore, lastLoginHours);
          break;
        case 'low':
          result = await this.handleLowRiskNotification(learner, riskScore);
          break;
        default:
          result = { success: false, error: 'Invalid risk level' };
      }

      // Record notification sent
      await this.recordNotification(learnerId, riskLevel, result);
      
      return result;
    } catch (error) {
      console.error('Error sending risk-based notification:', error);
      return { success: false, error: error.message };
    }
  }

  // High risk: Email + SMS + In-app notification
  async handleHighRiskNotification(learner, riskScore, lastLoginHours) {
    const user = learner.userId;
    const urgencyLevel = lastLoginHours > 48 ? 'URGENT' : 'HIGH';
    
    const results = {
      email: false,
      sms: false,
      notification: false,
      escalation: false
    };

    // Send email
    try {
      const emailResult = await this.sendEmail({
        to: user.email,
        subject: `${urgencyLevel}: Action Required - Your Learning Progress`,
        template: 'high-risk',
        data: {
          name: user.profile.name,
          riskScore: Math.round(riskScore * 100),
          lastLogin: this.formatLastLogin(lastLoginHours),
          courses: learner.enrollments.filter(e => e.riskScore > 0.7).map(e => e.courseId.title),
          urgency: urgencyLevel
        }
      });
      results.email = emailResult.success;
    } catch (error) {
      console.error('Email failed:', error);
    }

    // Send SMS for high urgency
    if (urgencyLevel === 'URGENT') {
      try {
        const smsResult = await this.sendSMS({
          to: user.profile.phone || '+1234567890',
          message: `URGENT: ${user.profile.name}, your learning progress needs immediate attention. Login now to avoid course suspension. Reply STOP to opt out.`
        });
        results.sms = smsResult.success;
      } catch (error) {
        console.error('SMS failed:', error);
      }
    }

    // Send in-app notification
    try {
      const notificationResult = await this.sendInAppNotification({
        userId: user._id,
        learnerId: learner._id,
        type: 'high-risk-alert',
        title: 'Urgent: Learning Intervention Required',
        message: `Your progress has significantly declined. Immediate action needed to stay on track.`,
        priority: 'high',
        riskLevel: 'high',
        actionRequired: true,
        data: {
          riskScore: riskScore,
          suggestedActions: [
            'Complete overdue assignments',
            'Schedule study session',
            'Contact course instructor',
            'Review learning materials'
          ]
        }
      });
      results.notification = notificationResult.success;
    } catch (error) {
      console.error('In-app notification failed:', error);
    }

    return {
      success: true,
      level: 'high',
      interventions: results,
      message: 'High-risk interventions sent'
    };
  }

  // Medium risk: Email + In-app notification
  async handleMediumRiskNotification(learner, riskScore, lastLoginHours) {
    const user = learner.userId;
    
    const results = {
      email: false,
      notification: false
    };

    // Send email
    try {
      const emailResult = await this.sendEmail({
        to: user.email,
        subject: 'Learning Support - Stay on Track',
        template: 'medium-risk',
        data: {
          name: user.profile.name,
          riskScore: Math.round(riskScore * 100),
          lastLogin: this.formatLastLogin(lastLoginHours),
          suggestions: [
            'Review your recent progress',
            'Set daily learning goals',
            'Join study groups',
            'Access learning resources'
          ]
        }
      });
      results.email = emailResult.success;
    } catch (error) {
      console.error('Email failed:', error);
    }

    // Send in-app notification
    try {
      const notificationResult = await this.sendInAppNotification({
        userId: user._id,
        learnerId: learner._id,
        type: 'learning-support',
        title: 'Learning Support Available',
        message: `We've noticed some challenges in your learning journey. Let's get you back on track!`,
        priority: 'medium',
        riskLevel: 'medium',
        data: {
          riskScore: riskScore,
          supportResources: [
            'Study guides',
            'Video tutorials',
            'Discussion forums',
            'One-on-one mentoring'
          ]
        }
      });
      results.notification = notificationResult.success;
    } catch (error) {
      console.error('In-app notification failed:', error);
    }

    return {
      success: true,
      level: 'medium',
      interventions: results,
      message: 'Medium-risk support sent'
    };
  }

  // Low risk: Motivational in-app notification only
  async handleLowRiskNotification(learner, riskScore) {
    const user = learner.userId;
    
    const motivationalQuotes = [
      "Great progress! Keep up the excellent work! 🌟",
      "You're doing amazing! Stay consistent and reach new heights! 🚀",
      "Learning is a journey, and you're on the right path! 📚",
      "Your dedication is inspiring! Continue building your knowledge! 💪",
      "Excellence is a habit, and you're forming great ones! ⭐",
      "Small steps daily lead to big results yearly! Keep going! 🎯",
      "Your learning streak is impressive! Maintain the momentum! 🔥",
      "Knowledge is power, and you're becoming more powerful daily! 💡"
    ];

    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    try {
      const notificationResult = await this.sendInAppNotification({
        userId: user._id,
        learnerId: learner._id,
        type: 'motivation',
        title: 'You\'re Doing Great!',
        message: randomQuote,
        priority: 'low',
        riskLevel: 'low',
        data: {
          riskScore: riskScore,
          encouragement: true,
          nextMilestone: this.getNextMilestone(learner)
        }
      });

      return {
        success: true,
        level: 'low',
        interventions: { motivation: notificationResult.success },
        message: 'Motivational message sent'
      };
    } catch (error) {
      console.error('Motivation notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if notification should be sent based on timing rules
  async shouldSendNotification(learnerId, riskLevel, lastLoginHours) {
    // Get last notification time from database
    const lastNotification = await this.getLastNotification(learnerId, riskLevel);
    
    if (!lastNotification) {
      return true; // No previous notification, send it
    }

    const hoursSinceLastNotification = (Date.now() - lastNotification.sentAt) / (1000 * 60 * 60);

    // Notification frequency rules
    const rules = {
      high: {
        immediate: 1,    // 1 hour for immediate resend
        noLogin24h: 24,  // 24 hours if no login
        noLogin48h: 12   // Every 12 hours if no login for 48h+
      },
      medium: {
        standard: 24,    // 24 hours standard
        noLogin48h: 48   // 48 hours if no login for 2+ days
      },
      low: {
        standard: 72     // 72 hours for motivational messages
      }
    };

    switch (riskLevel) {
      case 'high':
        if (lastLoginHours > 48) {
          return hoursSinceLastNotification >= rules.high.noLogin48h;
        } else if (lastLoginHours > 24) {
          return hoursSinceLastNotification >= rules.high.noLogin24h;
        } else {
          return hoursSinceLastNotification >= rules.high.immediate;
        }
      
      case 'medium':
        if (lastLoginHours > 48) {
          return hoursSinceLastNotification >= rules.medium.noLogin48h;
        } else {
          return hoursSinceLastNotification >= rules.medium.standard;
        }
      
      case 'low':
        return hoursSinceLastNotification >= rules.low.standard;
      
      default:
        return false;
    }
  }

  // Placeholder email service
  async sendEmail({ to, subject, template, data }) {
    try {
      // Simulate email sending
      console.log(`📧 Email sent to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: ${template}`);
      console.log(`Data:`, data);
      
      // In real implementation, use nodemailer or email service
      return { 
        success: true, 
        messageId: `email_${Date.now()}`,
        provider: 'email-service' 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Placeholder SMS service
  async sendSMS({ to, message }) {
    try {
      // Simulate SMS sending
      console.log(`📱 SMS sent to ${to}: ${message}`);
      
      // In real implementation, use Twilio, AWS SNS, etc.
      return { 
        success: true, 
        messageId: `sms_${Date.now()}`,
        provider: 'sms-service' 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // In-app notification service
  async sendInAppNotification({ userId, learnerId, type, title, message, priority, actionRequired = false, data = {}, riskLevel }) {
    try {
      // Create notification record in database
      const notification = new Notification({
        userId,
        learnerId,
        type,
        title,
        message,
        priority,
        riskLevel,
        actionRequired,
        data,
        channels: {
          inApp: {
            sent: true,
            sentAt: new Date()
          }
        },
        status: 'sent'
      });

      await notification.save();
      
      console.log(`🔔 In-app notification sent to user ${userId}:`, {
        title,
        message,
        priority,
        type
      });
      
      return { 
        success: true, 
        notificationId: notification._id,
        notification 
      };
    } catch (error) {
      console.error('Error saving in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  getHoursSinceLastLogin(lastLogin) {
    if (!lastLogin) return 999; // Very high number if never logged in
    return (Date.now() - new Date(lastLogin)) / (1000 * 60 * 60);
  }

  formatLastLogin(hours) {
    if (hours < 1) return 'Less than an hour ago';
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  getNextMilestone(learner) {
    // Calculate next achievement milestone
    const totalProgress = learner.enrollments.reduce((sum, e) => sum + e.progress, 0);
    const avgProgress = totalProgress / learner.enrollments.length;
    
    if (avgProgress < 25) return 'Complete 25% of your courses';
    if (avgProgress < 50) return 'Reach 50% course completion';
    if (avgProgress < 75) return 'Achieve 75% progress milestone';
    return 'Complete all enrolled courses';
  }

  async getLastNotification(learnerId, riskLevel) {
    try {
      return await Notification.getLastNotificationByRisk(learnerId, riskLevel);
    } catch (error) {
      console.error('Error getting last notification:', error);
      return null;
    }
  }

  async recordNotification(learnerId, riskLevel, result) {
    try {
      // The notification is already saved in sendInAppNotification
      // This is for additional logging/tracking
      console.log(`📝 Recorded notification for learner ${learnerId}, risk: ${riskLevel}`, result);
    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }

  // Batch process all learners for risk notifications
  async processAllRiskNotifications() {
    try {
      const learners = await Learner.find({}).populate('userId');
      let processed = 0;
      let sent = 0;

      for (const learner of learners) {
        try {
          // Calculate current risk level
          const avgRiskScore = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length;
          
          let riskLevel = 'low';
          if (avgRiskScore >= 0.7) riskLevel = 'high';
          else if (avgRiskScore >= 0.4) riskLevel = 'medium';

          const result = await this.sendRiskBasedNotification(learner._id, riskLevel, avgRiskScore);
          
          if (result.success) {
            sent++;
          }
          processed++;
        } catch (error) {
          console.error(`Error processing learner ${learner._id}:`, error);
        }
      }

      return {
        success: true,
        processed,
        sent,
        message: `Processed ${processed} learners, sent ${sent} notifications`
      };
    } catch (error) {
      console.error('Error in batch notification processing:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
