const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  modules: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    duration: Number, // in hours
    order: {
      type: Number,
      required: true
    },
    content: {
      videos: [{
        title: String,
        url: String,
        duration: Number // in minutes
      }],
      readings: [{
        title: String,
        content: String,
        estimatedTime: Number // in minutes
      }],
      quizzes: [{
        title: String,
        questions: Number,
        passingScore: Number
      }],
      assignments: [{
        title: String,
        description: String,
        dueDate: Date,
        maxScore: Number
      }]
    }
  }],
  instructor: {
    name: String,
    email: String,
    bio: String,
    avatar: String
  },
  stats: {
    totalEnrolled: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  launchDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ 'stats.completionRate': -1 });
courseSchema.index({ 'stats.avgRating': -1 });

module.exports = mongoose.model('Course', courseSchema);
