const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');

const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = 'http://localhost:8000';

// All analytics routes require authentication
router.use(auth);

// @route   GET /api/analytics/overview
// @desc    Get platform overview analytics
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    // Get total counts
    const totalLearners = await Learner.countDocuments();
    const totalActivities = await Activity.countDocuments();
    
    // Get learners with risk assessment
    const learners = await Learner.find({}).limit(100);
    
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    
    // Calculate risk distribution from existing data
    for (const learner of learners) {
      const enrollments = learner.enrollments || [];
      const atRiskCourses = enrollments.filter(e => e.status === 'at-risk').length;
      const avgRiskScore = enrollments.length > 0 ? 
        enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / enrollments.length : 0;
      
      if (atRiskCourses > 0 || avgRiskScore > 0.6) {
        highRiskCount++;
      } else if (avgRiskScore > 0.3) {
        mediumRiskCount++;
      } else {
        lowRiskCount++;
      }
    }
    
    // Get recent activity trends
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentActivities = await Activity.countDocuments({
      timestamp: { $gte: last7Days }
    });
    
    // Get engagement metrics
    const engagementStats = await Learner.aggregate([
      {
        $group: {
          _id: null,
          avgTotalHours: { $avg: '$engagementData.totalHours' },
          avgStreakDays: { $avg: '$engagementData.streakDays' },
          avgCompletionRate: { $avg: '$engagementData.completionRate' }
        }
      }
    ]);
    
    const stats = engagementStats[0] || {};
    
    res.json({
      success: true,
      data: {
        overview: {
          totalLearners,
          totalActivities,
          recentActivities,
          avgEngagementHours: Math.round(stats.avgTotalHours || 0),
          avgStreakDays: Math.round(stats.avgStreakDays || 0),
          avgCompletionRate: Math.round((stats.avgCompletionRate || 0) * 100)
        },
        riskDistribution: {
          highRisk: highRiskCount,
          mediumRisk: mediumRiskCount,
          lowRisk: lowRiskCount,
          total: learners.length
        },
        trends: {
          weeklyActivityGrowth: 12.5, // Placeholder
          engagementRate: 78.3, // Placeholder
          retentionRate: 85.2 // Placeholder
        }
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// @route   POST /api/analytics/predict-risk
// @desc    Get ML risk prediction for a learner (accepts userId or learnerId)
// @access  Private
router.post('/predict-risk', async (req, res) => {
  try {
    let { learner_id, user_id } = req.body;
    
    // If user_id is provided instead of learner_id, find the learner
    if (user_id && !learner_id) {
      const learner = await Learner.findOne({ userId: user_id });
      if (!learner) {
        return res.status(404).json({
          success: false,
          message: 'No learner found for this user'
        });
      }
      learner_id = learner._id.toString();
    }
    
    // If no learner_id by now, try using current user
    if (!learner_id) {
      const learner = await Learner.findOne({ userId: req.user._id });
      if (!learner) {
        return res.status(404).json({
          success: false,
          message: 'No learner found for current user'
        });
      }
      learner_id = learner._id.toString();
    }
    
    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      learner_id
    });
    
    res.json({
      success: true,
      data: mlResponse.data
    });
    
  } catch (error) {
    console.error('ML prediction error:', error);
    
    if (error.response) {
      // ML service returned an error
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'ML service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error connecting to ML service'
    });
  }
});

// @route   GET /api/analytics/predict-risk/me
// @desc    Get ML risk prediction for current user
// @access  Private
router.get('/predict-risk/me', async (req, res) => {
  try {
    // Find learner for current user
    const learner = await Learner.findOne({ userId: req.user._id });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'No learner profile found for current user'
      });
    }
    
    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      learner_id: learner._id.toString()
    });
    
    res.json({
      success: true,
      data: {
        ...mlResponse.data,
        learner_name: learner.name,
        user_id: req.user._id
      }
    });
    
  } catch (error) {
    console.error('ML prediction error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'ML service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error connecting to ML service'
    });
  }
});

// @route   POST /api/analytics/predict-batch
// @desc    Get ML risk predictions for multiple learners
// @access  Private
router.post('/predict-batch', async (req, res) => {
  try {
    const { learner_ids } = req.body;
    
    if (!learner_ids || !Array.isArray(learner_ids)) {
      return res.status(400).json({
        success: false,
        message: 'learner_ids array is required'
      });
    }
    
    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict_batch`, {
      learner_ids
    });
    
    res.json({
      success: true,
      data: mlResponse.data
    });
    
  } catch (error) {
    console.error('ML batch prediction error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'ML service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error connecting to ML service'
    });
  }
});

// @route   GET /api/analytics/learner/:id/analysis
// @desc    Get detailed learner analysis from ML service
// @access  Private
router.get('/learner/:id/analysis', async (req, res) => {
  try {
    const learnerId = req.params.id;
    
    // Call ML service for detailed analysis
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/analyze_learner/${learnerId}`);
    
    res.json({
      success: true,
      data: mlResponse.data
    });
    
  } catch (error) {
    console.error('ML analysis error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'ML service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error connecting to ML service'
    });
  }
});

// @route   GET /api/analytics/learner-id
// @desc    Get learner ID for current user
// @access  Private
router.get('/learner-id', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id });
    
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'No learner profile found for current user'
      });
    }
    
    res.json({
      success: true,
      data: {
        user_id: req.user._id,
        learner_id: learner._id,
        learner_name: learner.name,
        enrollments_count: learner.enrollments?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching learner ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/ml-status
// @desc    Check ML service status
// @access  Private
router.get('/ml-status', async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/health`);
    
    res.json({
      success: true,
      data: {
        mlServiceStatus: 'healthy',
        ...mlResponse.data
      }
    });
    
  } catch (error) {
    console.error('ML service health check error:', error);
    
    res.json({
      success: false,
      data: {
        mlServiceStatus: 'unavailable',
        error: error.message
      }
    });
  }
});

module.exports = router;
