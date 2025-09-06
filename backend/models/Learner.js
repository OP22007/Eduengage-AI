const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollments: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrollDate: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'at-risk', 'dropped', 'completed'],
      default: 'active'
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    completedModules: [{
      moduleId: mongoose.Schema.Types.ObjectId,
      completedAt: Date,
      score: Number
    }]
  }],
  engagementData: {
    totalHours: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    avgSessionTime: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    weeklyGoalHours: {
      type: Number,
      default: 10
    },
    preferredStudyTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'evening'
    }
  },
  achievements: [{
    id: String,
    unlocked: { type: Boolean, default: false },
    progress: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 1 }
    },
    unlockedAt: Date,
    updatedAt: { type: Date, default: Date.now }
  }],
  badges: [{
    id: String,
    courseId: mongoose.Schema.Types.ObjectId,
    unlocked: { type: Boolean, default: false },
    unlockedAt: Date
  }],
  learningStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalXP: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'none'],
      default: 'daily'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
learnerSchema.index({ userId: 1 });
learnerSchema.index({ 'enrollments.courseId': 1 });
learnerSchema.index({ 'enrollments.status': 1 });
learnerSchema.index({ 'enrollments.riskScore': -1 });
learnerSchema.index({ 'engagementData.lastLogin': -1 });

module.exports = mongoose.model('Learner', learnerSchema);
