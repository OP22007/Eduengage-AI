const mongoose = require('mongoose');

const dailyRiskTrackingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  totalLearners: {
    type: Number,
    required: true
  },
  riskDistribution: {
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 }
  },
  averageRiskScore: {
    type: Number,
    default: 0
  },
  riskTrends: {
    dailyChange: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 }
    },
    weeklyChange: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 }
    }
  },
  geminiAnalysis: {
    riskFactors: [String],
    recommendations: [String],
    actionItems: [String],
    confidence: { type: Number, default: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
dailyRiskTrackingSchema.index({ date: -1 });
dailyRiskTrackingSchema.index({ 'riskDistribution.high': -1 });

module.exports = mongoose.model('DailyRiskTracking', dailyRiskTrackingSchema);
