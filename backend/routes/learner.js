const express = require('express');
const axios = require('axios');
const { auth, authorize } = require('../middleware/auth');
const Learner = require('../models/Learner');
const Course = require('../models/Course');
const Activity = require('../models/Activity');

const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = 'http://localhost:8000';

// All learner routes require authentication
router.use(auth);
router.use(authorize('learner'));

// @route   GET /api/learners/dashboard
// @desc    Get learner dashboard data with ML risk assessment
// @access  Private (Learner only)
router.get('/dashboard', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id })
      .populate('enrollments.courseId', 'title difficulty category thumbnail');

    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    // Get recent activities
    const recentActivities = await Activity.find({ learnerId: learner._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('courseId', 'title');

    // Get ML risk assessment
    let riskAssessment = null;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        learner_id: learner._id.toString()
      });
      riskAssessment = mlResponse.data;
    } catch (mlError) {
      console.error('ML risk assessment failed:', mlError.message);
      // Continue without ML data
    }

    // Calculate dashboard metrics
    const dashboardData = {
      profile: {
        name: req.user.profile.name,
        email: req.user.email,
        joinDate: req.user.profile.joinDate
      },
      engagement: learner.engagementData,
      enrollments: learner.enrollments,
      recentActivities,
      achievements: learner.achievements,
      riskAssessment, // Include ML risk assessment
      stats: {
        totalCourses: learner.enrollments.length,
        activeCourses: learner.enrollments.filter(e => e.status === 'active').length,
        completedCourses: learner.enrollments.filter(e => e.status === 'completed').length,
        averageProgress: learner.enrollments.reduce((acc, e) => acc + e.progress, 0) / learner.enrollments.length || 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// @route   GET /api/learners/progress
// @desc    Get detailed progress for all enrolled courses
// @access  Private (Learner only)
router.get('/progress', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id })
      .populate('enrollments.courseId');

    const progressData = learner.enrollments.map(enrollment => ({
      course: enrollment.courseId,
      progress: enrollment.progress,
      status: enrollment.status,
      riskScore: enrollment.riskScore,
      lastActivity: enrollment.lastActivity,
      completedModules: enrollment.completedModules
    }));

    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching progress data'
    });
  }
});

// @route   POST /api/learners/activity
// @desc    Log a learning activity
// @access  Private (Learner only)
router.post('/activity', async (req, res) => {
  try {
    const { courseId, type, duration, metadata } = req.body;

    const learner = await Learner.findOne({ userId: req.user._id });

    const activity = new Activity({
      learnerId: learner._id,
      courseId,
      type,
      duration,
      metadata,
      timestamp: new Date()
    });

    await activity.save();

    // Update learner engagement data
    const totalHours = learner.engagementData.totalHours + (duration / 3600);
    await Learner.findByIdAndUpdate(learner._id, {
      'engagementData.totalHours': totalHours,
      'engagementData.lastLogin': new Date()
    });

    res.json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error logging activity'
    });
  }
});

// @route   GET /api/learners/achievements
// @desc    Get learner achievements and progress
// @access  Private (Learner only)
router.get('/achievements', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id });
    
    res.json({
      success: true,
      data: {
        achievements: learner.achievements,
        engagement: learner.engagementData
      }
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching achievements'
    });
  }
});

module.exports = router;
