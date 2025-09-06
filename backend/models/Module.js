const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 1
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  content: {
    type: String, // Could be video URL, text content, etc.
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'interactive'],
    default: 'text'
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'video', 'document']
    }
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }],
    passingScore: {
      type: Number,
      default: 70
    }
  }
}, {
  timestamps: true
});

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
