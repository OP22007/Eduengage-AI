const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Learner = require('../models/Learner');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const geminiService = require('../services/geminiService');
const mlService = require('../services/mlService');

const router = express.Router();

// All learner routes require authentication
router.use(auth);
router.use(authorize('learner'));

// @route   GET /api/learners/dashboard
// @desc    Get learner dashboard data with Gemini AI insights
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

    // Prepare data for AI analysis
    const learnerData = {
      learner,
      user: req.user,
      activities: recentActivities
    };

    // Get Gemini AI-powered risk assessment and personalized recommendations
    let aiInsights = null;
    let personalizedRecommendations = null;
    
    try {
      const [riskResult, recommendationsResult] = await Promise.all([
        geminiService.analyzeLearnerRisk(learnerData),
        geminiService.generatePersonalizedRecommendations(learnerData)
      ]);
      
      if (riskResult.success) {
        aiInsights = riskResult.data;
      }
      
      if (recommendationsResult.success) {
        personalizedRecommendations = recommendationsResult.data;
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError.message);
      // Continue without AI data
    }

    // Calculate peer comparison data
    let peerComparison = null;
    try {
      // Get aggregated stats from all learners (anonymized)
      const allLearners = await Learner.find({}, {
        'engagementData.totalHours': 1,
        'engagementData.streakDays': 1,
        'engagementData.completionRate': 1,
        'enrollments': 1
      });

      if (allLearners.length > 1) {
        const totalHours = allLearners.map(l => l.engagementData?.totalHours || 0);
        const streakDays = allLearners.map(l => l.engagementData?.streakDays || 0);
        const completionRates = allLearners.map(l => l.engagementData?.completionRate || 0);
        const completedCourses = allLearners.map(l => 
          l.enrollments?.filter(e => e.status === 'completed').length || 0
        );

        // Calculate percentiles
        const calculatePercentile = (value, array) => {
          const sorted = array.sort((a, b) => a - b);
          const below = sorted.filter(v => v < value).length;
          return Math.round((below / sorted.length) * 100);
        };

        const userTotalHours = learner.engagementData?.totalHours || 0;
        const userStreakDays = learner.engagementData?.streakDays || 0;
        const userCompletionRate = learner.engagementData?.completionRate || 0;
        const userCompletedCourses = learner.enrollments.filter(e => e.status === 'completed').length;

        peerComparison = {
          totalHours: {
            userValue: userTotalHours,
            percentile: calculatePercentile(userTotalHours, totalHours),
            average: totalHours.reduce((a, b) => a + b, 0) / totalHours.length,
            ranking: userTotalHours > totalHours.reduce((a, b) => a + b, 0) / totalHours.length ? 'above_average' : 'below_average'
          },
          streakDays: {
            userValue: userStreakDays,
            percentile: calculatePercentile(userStreakDays, streakDays),
            average: streakDays.reduce((a, b) => a + b, 0) / streakDays.length,
            ranking: userStreakDays > streakDays.reduce((a, b) => a + b, 0) / streakDays.length ? 'above_average' : 'below_average'
          },
          completionRate: {
            userValue: userCompletionRate,
            percentile: calculatePercentile(userCompletionRate, completionRates),
            average: completionRates.reduce((a, b) => a + b, 0) / completionRates.length,
            ranking: userCompletionRate > completionRates.reduce((a, b) => a + b, 0) / completionRates.length ? 'above_average' : 'below_average'
          },
          completedCourses: {
            userValue: userCompletedCourses,
            percentile: calculatePercentile(userCompletedCourses, completedCourses),
            average: completedCourses.reduce((a, b) => a + b, 0) / completedCourses.length,
            ranking: userCompletedCourses > completedCourses.reduce((a, b) => a + b, 0) / completedCourses.length ? 'above_average' : 'below_average'
          }
        };
      }
    } catch (peerError) {
      console.error('Peer comparison calculation failed:', peerError.message);
      // Continue without peer data
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
      personalizedRecommendations, // Gemini-powered recommendations
      peerComparison, // New peer comparison data
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
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    // Import engagement service
    const EngagementService = require('../services/engagementService');

    // Add activity and update metrics using the service
    const result = await EngagementService.addActivityAndUpdateMetrics({
      learnerId: learner._id,
      courseId,
      type,
      duration,
      metadata,
      timestamp: new Date()
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to log activity',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Activity logged and metrics updated successfully',
      data: result.activity
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

// @route   GET /api/learners/ai-recommendations
// @desc    Get Gemini AI personalized recommendations for learner
// @access  Private (Learner only)
router.get('/ai-recommendations', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    const activities = await Activity.find({ learnerId: learner._id })
      .sort({ timestamp: -1 })
      .limit(50);

    const learnerData = {
      learner,
      user: req.user,
      activities
    };

    const recommendations = await geminiService.generatePersonalizedRecommendations(learnerData);

    res.json({
      success: true,
      data: {
        recommendations: recommendations.data,
        generated_at: new Date().toISOString(),
        powered_by: 'gemini'
      }
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching AI recommendations'
    });
  }
});

// @route   GET /api/learners/risk-assessment
// @desc    Get Gemini AI risk assessment for learner
// @access  Private (Learner only)
router.get('/risk-assessment', async (req, res) => {
  try {
    const learner = await Learner.findOne({ userId: req.user._id });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    const activities = await Activity.find({ learnerId: learner._id })
      .sort({ timestamp: -1 })
      .limit(50);

    const learnerData = {
      learner,
      user: req.user,
      activities
    };

    const riskAssessment = await geminiService.analyzeLearnerRisk(learnerData);

    res.json({
      success: true,
      data: {
        risk_assessment: riskAssessment.data,
        generated_at: new Date().toISOString(),
        powered_by: 'gemini'
      }
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching risk assessment'
    });
  }
});

module.exports = router;
