const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  type: {
    type: String,
    enum: [
      'email_nudge',
      'in_app_notification',
      'peer_connection',
      'instructor_outreach',
      'study_reminder',
      'motivational_message',
      'resource_recommendation',
      'deadline_warning',
      'achievement_celebration',
      'progress_milestone',
      'personalized_nudge',
      'manual_intervention'
    ],
    required: true
  },
  trigger: {
    type: String,
    enum: [
      'risk_score_high',
      'risk_score_medium',
      'inactivity_detected',
      'declining_performance',
      'missed_deadline',
      'low_engagement',
      'goal_achievement',
      'streak_milestone',
      'peer_activity',
      'course_completion',
      'manual_admin',
      'manual_instructor'
    ],
    required: true
  },
  content: {
    subject: String,
    message: String,
    actionButton: {
      text: String,
      url: String
    },
    personalization: {
      learnerName: String,
      courseName: String,
      progress: Number,
      customData: mongoose.Schema.Types.Mixed
    }
  },
  delivery: {
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: Date,
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    channel: {
      type: String,
      enum: ['email', 'push', 'in_app', 'sms'],
      default: 'in_app'
    }
  },
  effectiveness: {
    status: {
      type: String,
      enum: ['pending', 'successful', 'neutral', 'negative', 'expired'],
      default: 'pending'
    },
    measuredAt: Date,
    engagementIncrease: Number, // percentage
    riskScoreChange: Number,
    notes: String
  },
  scheduling: {
    scheduledFor: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  }
}, {
  timestamps: true
});

// Indexes
interventionSchema.index({ learnerId: 1, createdAt: -1 });
interventionSchema.index({ type: 1, 'effectiveness.status': 1 });
interventionSchema.index({ trigger: 1, createdAt: -1 });
interventionSchema.index({ 'scheduling.scheduledFor': 1 });
interventionSchema.index({ 'delivery.sentAt': -1 });

module.exports = mongoose.model('Intervention', interventionSchema);
