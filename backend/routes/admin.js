const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Learner = require('../models/Learner');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const Intervention = require('../models/Intervention');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(authorize('admin', 'instructor'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin/Instructor only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const totalLearners = await Learner.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalActivities = await Activity.countDocuments();

    // Get risk distribution
    const riskDistribution = await Learner.aggregate([
      { $unwind: '$enrollments' },
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$enrollments.riskScore', 0.8] }, 'high',
              { $cond: [{ $gte: ['$enrollments.riskScore', 0.6] }, 'medium', 'low'] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activities
    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('learnerId', 'userId')
      .populate('courseId', 'title');

    // Get at-risk learners
    const atRiskLearners = await Learner.find({
      'enrollments.riskScore': { $gte: 0.6 }
    })
      .populate('userId', 'profile.name email')
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
      recentActivities,
      atRiskLearners,
      engagementTrend
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

module.exports = router;