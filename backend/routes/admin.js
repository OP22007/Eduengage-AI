const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Learner = require('../models/Learner');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const Intervention = require('../models/Intervention');
const DailyRiskTracking = require('../models/DailyRiskTracking');
const geminiService = require('../services/geminiService');
const riskTrackingService = require('../services/riskTrackingService');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(authorize('admin', 'instructor'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview with enhanced risk tracking
// @access  Private (Admin/Instructor only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const totalLearners = await Learner.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalActivities = await Activity.countDocuments();

    // Get enhanced risk distribution from daily tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let riskDistribution = [];
    let riskTrends = null;
    
    const todayRiskData = await DailyRiskTracking.findOne({ date: today });
    
    if (todayRiskData) {
      // Use stored daily risk data
      riskDistribution = [
        { _id: 'high', count: todayRiskData.riskDistribution.high },
        { _id: 'medium', count: todayRiskData.riskDistribution.medium },
        { _id: 'low', count: todayRiskData.riskDistribution.low }
      ];
      riskTrends = todayRiskData.riskTrends;
    } else {
      // Fallback to real-time calculation
      console.log('No daily risk data found, calculating real-time...');
      
      const learners = await Learner.find({});
      let high = 0, medium = 0, low = 0;
      
      for (const learner of learners) {
        if (learner.enrollments && learner.enrollments.length > 0) {
          const avgRisk = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length;
          if (avgRisk >= 0.7) high++;
          else if (avgRisk >= 0.4) medium++;
          else low++;
        } else {
          low++;
        }
      }
      
      riskDistribution = [
        { _id: 'high', count: high },
        { _id: 'medium', count: medium },
        { _id: 'low', count: low }
      ];
      
      // Trigger background calculation for tomorrow
      riskTrackingService.calculateDailyRiskDistribution().catch(console.error);
    }

    // Get recent activities
    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('learnerId', 'userId')
      .populate('courseId', 'title');

    // Get at-risk learners with enhanced data
    const atRiskLearners = await Learner.find({
      'enrollments.riskScore': { $gte: 0.6 }
    })
      .populate('userId', 'profile.name email')
      .sort({ 'enrollments.riskScore': -1 })
      .limit(10);

    // Calculate engagement trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const engagementTrend = await Activity.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalActivities: { $sum: 1 },
          uniqueLearners: { $addToSet: '$learnerId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get risk distribution history for trends
    const riskHistory = await riskTrackingService.getRiskDistributionHistory(7);

    const dashboardData = {
      overview: {
        totalLearners,
        totalCourses,
        totalActivities,
        activeToday: await Activity.countDocuments({
          timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      },
      riskDistribution,
      riskTrends,
      riskHistory: riskHistory.map(entry => ({
        date: entry.date,
        distribution: entry.riskDistribution,
        averageScore: entry.averageRiskScore
      })),
      recentActivities,
      atRiskLearners,
      engagementTrend,
      geminiInsights: todayRiskData?.geminiAnalysis || null
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin dashboard'
    });
  }
});

// @route   GET /api/admin/learners
// @desc    Get all learners with filters and pagination
// @access  Private (Admin/Instructor only)
router.get('/learners', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      riskLevel,
      status,
      search,
      sortBy = 'riskScore',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let matchStage = {};

    // Build filters
    if (riskLevel) {
      if (riskLevel === 'high') {
        matchStage['enrollments.riskScore'] = { $gte: 0.8 };
      } else if (riskLevel === 'medium') {
        matchStage['enrollments.riskScore'] = { $gte: 0.6, $lt: 0.8 };
      } else if (riskLevel === 'low') {
        matchStage['enrollments.riskScore'] = { $lt: 0.6 };
      }
    }

    if (status) {
      matchStage['enrollments.status'] = status;
    }

    const learners = await Learner.find(matchStage)
      .populate('userId', 'profile.name email profile.joinDate')
      .populate('enrollments.courseId', 'title difficulty category')
      .sort({ [`enrollments.${sortBy}`]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Learner.countDocuments(matchStage);

    res.json({
      success: true,
      data: {
        learners,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get learners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching learners'
    });
  }
});

// @route   POST /api/admin/intervention
// @desc    Trigger an intervention for a learner
// @access  Private (Admin/Instructor only)
router.post('/intervention', async (req, res) => {
  try {
    const { learnerId, type, trigger, content, scheduling } = req.body;

    const intervention = new Intervention({
      learnerId,
      type,
      trigger,
      content,
      scheduling: {
        ...scheduling,
        scheduledFor: scheduling?.scheduledFor || new Date()
      }
    });

    await intervention.save();

    // Here you would trigger the actual intervention
    // (email, notification, etc.)

    res.json({
      success: true,
      message: 'Intervention scheduled successfully',
      data: intervention
    });
  } catch (error) {
    console.error('Intervention error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating intervention'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin/Instructor only)
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let startDate = new Date();
    if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Engagement analytics
    const engagementAnalytics = await Activity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Course performance
    const coursePerformance = await Course.aggregate([
      {
        $lookup: {
          from: 'learners',
          localField: '_id',
          foreignField: 'enrollments.courseId',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          difficulty: 1,
          enrollmentCount: { $size: '$enrollments' },
          avgCompletion: { $avg: '$enrollments.enrollments.progress' }
        }
      }
    ]);

    // Intervention effectiveness
    const interventionStats = await Intervention.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$effectiveness.status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        engagementAnalytics,
        coursePerformance,
        interventionStats,
        timeframe
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// @route   GET /api/admin/gemini-insights
// @desc    Get Gemini AI insights for platform administration
// @access  Private (Admin/Instructor only)
router.get('/gemini-insights', async (req, res) => {
  try {
    // Get platform overview data
    const totalLearners = await Learner.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const activeToday = await Activity.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Get risk distribution
    const allLearners = await Learner.find({});
    let highRisk = 0, mediumRisk = 0, lowRisk = 0;
    
    for (const learner of allLearners) {
      const avgRiskScore = learner.enrollments.length > 0 ? 
        learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length : 0;
      
      if (avgRiskScore > 0.7) highRisk++;
      else if (avgRiskScore > 0.4) mediumRisk++;
      else lowRisk++;
    }

    // Calculate engagement metrics
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyActivities = await Activity.countDocuments({ timestamp: { $gte: last7Days } });
    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 14);
    const previousWeekActivities = await Activity.countDocuments({ 
      timestamp: { $gte: previousWeek, $lt: last7Days } 
    });
    
    const weeklyGrowth = previousWeekActivities > 0 ? 
      ((weeklyActivities - previousWeekActivities) / previousWeekActivities * 100) : 0;

    const platformData = {
      totalLearners,
      activeToday,
      totalCourses,
      totalActivities,
      highRisk,
      mediumRisk,
      lowRisk,
      weeklyGrowth,
      avgSessionTime: 45, // Placeholder - calculate from activities
      completionRate: 0.72 // Placeholder - calculate from enrollments
    };

    // Get Gemini AI insights
    const insights = await geminiService.generateAdminInsights(platformData);

    res.json({
      success: true,
      data: {
        platform_metrics: platformData,
        ai_insights: insights.data,
        insights_powered_by: 'gemini',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Gemini insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching AI insights'
    });
  }
});

// @route   POST /api/admin/intervention-suggestions
// @desc    Get Gemini AI intervention suggestions for specific learner
// @access  Private (Admin/Instructor only)
router.post('/intervention-suggestions', async (req, res) => {
  try {
    const { learnerId } = req.body;

    if (!learnerId) {
      return res.status(400).json({
        success: false,
        message: 'Learner ID is required'
      });
    }

    // Get learner data
    const learner = await Learner.findById(learnerId).populate('userId');
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    const activities = await Activity.find({ learnerId }).sort({ timestamp: -1 }).limit(50);

    const learnerData = {
      learner,
      user: learner.userId,
      activities
    };

    // Get risk assessment first
    const riskAssessment = await geminiService.analyzeLearnerRisk(learnerData);
    const riskLevel = riskAssessment.data?.risk_level || 'medium';

    // Get intervention suggestions
    const interventions = await geminiService.generateInterventionSuggestions(learnerData, riskLevel);

    res.json({
      success: true,
      data: {
        learner_id: learnerId,
        learner_name: learner.userId?.profile?.name || 'Unknown',
        risk_assessment: riskAssessment.data,
        intervention_suggestions: interventions.data,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Intervention suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating intervention suggestions'
    });
  }
});

// @route   POST /api/admin/update-risk-scores
// @desc    Manually trigger risk score update for all learners
// @access  Private (Admin only)
router.post('/update-risk-scores', async (req, res) => {
  try {
    const result = await riskTrackingService.runDailyRiskUpdate();
    
    res.json({
      success: true,
      message: 'Risk scores update initiated',
      data: result
    });
  } catch (error) {
    console.error('Risk score update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating risk scores'
    });
  }
});

// @route   GET /api/admin/risk-history
// @desc    Get risk distribution history
// @access  Private (Admin/Instructor only)
router.get('/risk-history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await riskTrackingService.getRiskDistributionHistory(parseInt(days));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Risk history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching risk history'
    });
  }
});

// @route   GET /api/admin/learner-risk/:learnerId
// @desc    Get detailed risk analysis for specific learner
// @access  Private (Admin/Instructor only)
router.get('/learner-risk/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params;
    const riskData = await riskTrackingService.calculateLearnerRiskScore(learnerId);
    
    res.json({
      success: true,
      data: riskData
    });
  } catch (error) {
    console.error('Learner risk analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error analyzing learner risk'
    });
  }
});

module.exports = router;