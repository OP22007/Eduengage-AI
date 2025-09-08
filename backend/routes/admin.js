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

    // Debug logging
    console.log('Admin learners request:', {
      page,
      limit,
      riskLevel,
      status,
      search,
      sortBy,
      sortOrder
    });

    const skip = (page - 1) * limit;
    let pipeline = [];

    // Initial match stage for basic filtering
    let matchStage = {};

    // Search filter - match on user name or email
    if (search && search.trim()) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      });
      
      pipeline.push({
        $match: {
          $or: [
            { 'user.profile.name': { $regex: search.trim(), $options: 'i' } },
            { 'user.email': { $regex: search.trim(), $options: 'i' } }
          ]
        }
      });
    }

    // Status filter - filter enrollments by status
    if (status && status !== 'all') {
      matchStage['enrollments.status'] = status;
    }

    // Risk level filter - calculate average risk score and filter
    if (riskLevel && riskLevel !== 'all') {
      pipeline.push({
        $addFields: {
          avgRiskScore: {
            $cond: {
              if: { $gt: [{ $size: '$enrollments' }, 0] },
              then: { $avg: '$enrollments.riskScore' },
              else: 0
            }
          }
        }
      });

      let riskFilter = {};
      if (riskLevel === 'high') {
        riskFilter = { avgRiskScore: { $gte: 0.7 } };
      } else if (riskLevel === 'medium') {
        riskFilter = { avgRiskScore: { $gte: 0.4, $lt: 0.7 } };
      } else if (riskLevel === 'low') {
        riskFilter = { avgRiskScore: { $lt: 0.4 } };
      }

      pipeline.push({ $match: riskFilter });
    }

    // Add the basic match stage if there are enrollment filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.unshift({ $match: matchStage });
    }

    // Add sorting
    let sortStage = {};
    if (sortBy === 'riskScore') {
      // Sort by average risk score
      if (!riskLevel || riskLevel === 'all') {
        pipeline.push({
          $addFields: {
            avgRiskScore: {
              $cond: {
                if: { $gt: [{ $size: '$enrollments' }, 0] },
                then: { $avg: '$enrollments.riskScore' },
                else: 0
              }
            }
          }
        });
      }
      sortStage = { avgRiskScore: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'lastActivity') {
      // We'll add this field later in the pipeline, so we'll sort after the lookup
      sortStage = { actualLastActivity: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'progress') {
      pipeline.push({
        $addFields: {
          avgProgress: {
            $cond: {
              if: { $gt: [{ $size: '$enrollments' }, 0] },
              then: { $avg: '$enrollments.progress' },
              else: 0
            }
          }
        }
      });
      sortStage = { avgProgress: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'completionRate') {
      sortStage = { 'engagementData.completionRate': sortOrder === 'desc' ? -1 : 1 };
    } else {
      sortStage = { createdAt: -1 };
    }

    // Add sorting stage only if it's not lastActivity (we'll sort that later)
    if (sortBy !== 'lastActivity') {
      pipeline.push({ $sort: sortStage });
    }

    // Count total documents for pagination (before adding lookup stages for performance)
    let countPipeline;
    if (sortBy === 'lastActivity') {
      // For lastActivity, we need to include the lookup in count pipeline
      countPipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'learnerId',
            as: 'recentActivities',
            pipeline: [
              { $sort: { timestamp: -1 } },
              { $limit: 1 },
              { $project: { timestamp: 1 } }
            ]
          }
        },
        {
          $addFields: {
            actualLastActivity: {
              $cond: {
                if: { $gt: [{ $size: '$recentActivities' }, 0] },
                then: { $arrayElemAt: ['$recentActivities.timestamp', 0] },
                else: '$engagementData.lastLogin'
              }
            }
          }
        },
        { $sort: sortStage },
        { $count: "total" }
      ];
    } else {
      countPipeline = [...pipeline, { $count: "total" }];
    }
    const countResult = await Learner.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Add population stages and calculate real last activity
    pipeline.push({
      $lookup: {
        from: 'activities',
        localField: '_id',
        foreignField: 'learnerId',
        as: 'recentActivities',
        pipeline: [
          { $sort: { timestamp: -1 } },
          { $limit: 1 },
          { $project: { timestamp: 1 } }
        ]
      }
    });

    // Calculate actual last activity
    pipeline.push({
      $addFields: {
        actualLastActivity: {
          $cond: {
            if: { $gt: [{ $size: '$recentActivities' }, 0] },
            then: { $arrayElemAt: ['$recentActivities.timestamp', 0] },
            else: '$engagementData.lastLogin'
          }
        }
      }
    });

    // Add sorting for lastActivity case
    if (sortBy === 'lastActivity') {
      pipeline.push({ $sort: sortStage });
    }

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId',
        pipeline: [
          {
            $project: {
              'profile.name': 1,
              'profile.joinDate': 1,
              'email': 1
            }
          }
        ]
      }
    });

    pipeline.push({
      $unwind: {
        path: '$userId',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'courses',
        localField: 'enrollments.courseId',
        foreignField: '_id',
        as: 'courseDetails'
      }
    });

    // Map course details to enrollments
    pipeline.push({
      $addFields: {
        enrollments: {
          $map: {
            input: '$enrollments',
            as: 'enrollment',
            in: {
              $mergeObjects: [
                '$$enrollment',
                {
                  courseId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$courseDetails',
                          cond: { $eq: ['$$this._id', '$$enrollment.courseId'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    });

    // Remove the temporary courseDetails field
    pipeline.push({
      $project: {
        courseDetails: 0
      }
    });

    console.log('Pipeline stages:', pipeline.length);
    const learners = await Learner.aggregate(pipeline);

    console.log(`Found ${learners.length} learners, total: ${total}`);

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

    // Create intervention record
    const intervention = new Intervention({
      learnerId,
      type,
      trigger,
      content,
      status: scheduling?.immediate ? 'sent' : 'pending',
      scheduling: {
        ...scheduling,
        scheduledFor: scheduling?.scheduledFor || new Date()
      }
    });

    await intervention.save();

    // Get learner and user details for notification
    const Learner = require('../models/Learner');
    const learner = await Learner.findById(learnerId).populate('userId');
    
    if (learner && learner.userId) {
      // Import notification service
      const notificationService = require('../services/notificationService');
      
      // Create in-app notification for the learner
      await notificationService.sendInAppNotification({
        userId: learner.userId._id,
        learnerId: learnerId,
        type: 'learning-support',
        title: content.subject || 'Message from Instructor',
        message: content.message || content.body || 'You have received a personalized message from your instructor.',
        priority: 'high',
        actionRequired: true,
        data: {
          interventionId: intervention._id,
          interventionType: type,
          sentBy: req.user._id,
          sentByRole: req.user.role || 'admin',
          scheduledFor: scheduling?.scheduledFor
        }
      });

      // Also trigger risk-based notifications if applicable
      try {
        // Calculate learner's current risk level
        const activeEnrollments = learner.enrollments.filter(e => e.status === 'active');
        if (activeEnrollments.length > 0) {
          const avgRiskScore = activeEnrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / activeEnrollments.length;
          const riskLevel = avgRiskScore > 0.7 ? 'high' : avgRiskScore > 0.4 ? 'medium' : 'low';
          
          // Send risk-based notification (email/SMS based on risk level)
          await notificationService.sendRiskBasedNotification(learnerId, riskLevel, avgRiskScore);
        }
      } catch (riskError) {
        console.error('Error sending risk-based notification:', riskError);
        // Don't fail the intervention if risk notification fails
      }
    }

    res.json({
      success: true,
      message: 'Intervention sent successfully and notification created',
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

// @route   GET /api/admin/interventions
// @desc    Get all interventions with filters and pagination
// @access  Private (Admin only)
router.get('/interventions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'learners',
          localField: 'learnerId',
          foreignField: '_id',
          as: 'learner'
        }
      },
      {
        $unwind: '$learner'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'learner.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          'learnerId._id': '$learner._id',
          'learnerId.userId': {
            _id: '$user._id',
            email: '$user.email',
            profile: '$user.profile'
          }
        }
      }
    ];

    // Add search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.profile.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'content.subject': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add main filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Add sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sort });

    // Execute aggregation with pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Intervention.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const interventions = await Intervention.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        interventions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching interventions'
    });
  }
});

// @route   GET /api/admin/interventions/stats
// @desc    Get intervention statistics
// @access  Private (Admin only)
router.get('/interventions/stats', async (req, res) => {
  try {
    const stats = await Intervention.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          responded: {
            $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      responded: 0,
      failed: 0
    };

    // Calculate success metrics
    const successful = result.delivered + result.responded;
    const responseRate = result.total > 0 ? (result.responded / result.total) * 100 : 0;
    
    // Calculate average response time (placeholder - would need actual response timestamps)
    const avgResponseTime = 2.5; // hours (placeholder)

    res.json({
      success: true,
      data: {
        ...result,
        successful,
        responseRate: Math.round(responseRate * 100) / 100,
        avgResponseTime
      }
    });
  } catch (error) {
    console.error('Error fetching intervention stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching intervention statistics'
    });
  }
});

// @route   DELETE /api/admin/interventions/:id
// @desc    Delete an intervention
// @access  Private (Admin only)
router.delete('/interventions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findById(id);
    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    // Only allow deletion of pending interventions
    if (intervention.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete interventions that have already been sent'
      });
    }

    await Intervention.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Intervention deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting intervention'
    });
  }
});

// @route   POST /api/admin/test-intervention
// @desc    Test intervention creation and notification flow
// @access  Private (Admin/Instructor only)
router.post('/test-intervention', async (req, res) => {
  try {
    const { learnerId } = req.body;
    
    if (!learnerId) {
      return res.status(400).json({
        success: false,
        message: 'Learner ID is required'
      });
    }

    // Get learner details
    const Learner = require('../models/Learner');
    const learner = await Learner.findById(learnerId).populate('userId');
    
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    // Create test intervention
    const intervention = new Intervention({
      learnerId,
      type: 'personalized_nudge',
      trigger: 'manual_admin',
      content: {
        subject: 'Test Intervention',
        message: 'This is a test intervention to verify the notification system is working properly.'
      },
      scheduling: {
        immediate: true,
        scheduledFor: new Date()
      }
    });

    await intervention.save();

    // Create notification
    const notificationService = require('../services/notificationService');
    const notificationResult = await notificationService.sendInAppNotification({
      userId: learner.userId._id,
      learnerId: learnerId,
      type: 'learning-support',
      title: 'Test Message from Instructor',
      message: 'This is a test intervention to verify the notification system is working properly.',
      priority: 'medium',
      actionRequired: true,
      data: {
        interventionId: intervention._id,
        interventionType: 'personalized_nudge',
        sentBy: req.user._id,
        sentByRole: req.user.role || 'admin',
        isTest: true
      }
    });

    res.json({
      success: true,
      message: 'Test intervention sent successfully',
      data: {
        intervention,
        notification: notificationResult
      }
    });
  } catch (error) {
    console.error('Test intervention error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating test intervention',
      error: error.message
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