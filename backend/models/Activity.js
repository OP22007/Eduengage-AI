const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  type: {
    type: String,
    enum: [
      'video_watch',
      'quiz_attempt',
      'forum_post',
      'assignment_submit',
      'reading_complete',
      'login',
      'logout',
      'module_complete',
      'course_enroll',
      'peer_interaction'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  metadata: {
    // For video activities
    videoProgress: {
      type: Number,
      min: 0,
      max: 1
    },
    videoId: String,
    
    // For quiz activities
    quizScore: {
      type: Number,
      min: 0,
      max: 100
    },
    quizId: String,
    attemptNumber: Number,
    
    // For forum activities
    postId: String,
    threadId: String,
    
    // For assignment activities
    assignmentId: String,
    submissionScore: Number,
    
    // General metadata
    moduleId: mongoose.Schema.Types.ObjectId,
    sessionId: String,
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    browser: String,
    location: {
      country: String,
      timezone: String
    }
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
activitySchema.index({ learnerId: 1, timestamp: -1 });
activitySchema.index({ courseId: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });
activitySchema.index({ learnerId: 1, courseId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
