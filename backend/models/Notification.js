const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  },
  type: {
    type: String,
    enum: ['high-risk-alert', 'learning-support', 'motivation', 'assignment-due', 'achievement', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: false
  },
  channels: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      messageId: { type: String },
      error: { type: String }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      messageId: { type: String },
      error: { type: String }
    },
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      readAt: { type: Date },
      error: { type: String }
    }
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  readAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
  },
  // Tracking for notification frequency rules
  lastNotificationOfType: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  scheduledFor: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ learnerId: 1, riskLevel: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ priority: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

// Methods
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.markAsClicked = function() {
  this.clickedAt = new Date();
  return this.save();
};

notificationSchema.methods.dismiss = function() {
  this.dismissedAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadForUser = function(userId) {
  return this.find({
    userId,
    readAt: null,
    status: { $in: ['sent', 'delivered'] }
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.getLastNotificationByRisk = function(learnerId, riskLevel) {
  return this.findOne({
    learnerId,
    riskLevel,
    status: 'sent'
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.getNotificationStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          priority: '$priority'
        },
        count: { $sum: 1 },
        read: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } },
        clicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
