const express = require('express');
const axios = require('axios');
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');

const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = 'http://localhost:8000';

// @route   GET /api/courses/enrolled
// @desc    Get enrolled courses for authenticated user
// @access  Private
router.get('/enrolled', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const learner = await Learner.findOne({ userId: req.user._id }).populate('enrollments.courseId');
    
    if (!learner) {
      return res.json({
        success: true,
        data: []
      });
    }

    const enrolledCourses = learner.enrollments.map(enrollment => {
      const course = enrollment.courseId.toObject();
      
      // Calculate actual progress based on completed modules
      const totalModules = course.modules ? course.modules.length : 0;
      // Filter out any invalid completed modules
      const validCompletedModules = enrollment.completedModules ? 
        enrollment.completedModules.filter(cm => cm && cm.moduleId) : [];
      const completedModulesCount = validCompletedModules.length;
      const actualProgress = totalModules > 0 ? (completedModulesCount / totalModules) : 0;
      
      return {
        ...course,
        isEnrolled: true,
        progress: actualProgress,
        status: enrollment.status || 'active',
        enrolledAt: enrollment.enrolledAt
      };
    });

    res.json({
      success: true,
      data: enrolledCourses
    });
  } catch (error) {
    console.error('Enrolled courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses'
    });
  }
});

// @route   GET /api/courses/available
// @desc    Get available courses (not enrolled) for authenticated user
// @access  Private
router.get('/available', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const learner = await Learner.findOne({ userId: req.user._id });
    let enrolledCourseIds = [];
    
    if (learner) {
      enrolledCourseIds = learner.enrollments.map(e => e.courseId.toString());
    }

    const availableCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      isActive: true
    }).select('-__v');

    const coursesWithEnrollment = availableCourses.map(course => ({
      ...course.toObject(),
      isEnrolled: false,
      progress: 0,
      status: 'not_enrolled'
    }));

    res.json({
      success: true,
      data: coursesWithEnrollment
    });
  } catch (error) {
    console.error('Available courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses'
    });
  }
});

// @route   GET /api/courses
// @desc    Get all courses with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      sortBy = 'popular', 
      search,
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { 'stats.avgRating': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'alphabetical':
        sortOptions = { title: 1 };
        break;
      case 'popular':
      default:
        sortOptions = { 'stats.totalEnrolled': -1 };
        break;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const courses = await Course.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    // If user is authenticated, check enrollment status
    let coursesWithEnrollment = courses;
    if (req.user) {
      const learner = await Learner.findOne({ userId: req.user._id });
      if (learner) {
        coursesWithEnrollment = courses.map(course => {
          const enrollment = learner.enrollments.find(
            e => e.courseId.toString() === course._id.toString()
          );
          
          let actualProgress = 0;
          if (enrollment) {
            // Calculate actual progress based on completed modules
            const totalModules = course.modules ? course.modules.length : 0;
            // Filter out any invalid completed modules
            const validCompletedModules = enrollment.completedModules ? 
              enrollment.completedModules.filter(cm => cm && cm.moduleId) : [];
            const completedModulesCount = validCompletedModules.length;
            actualProgress = totalModules > 0 ? (completedModulesCount / totalModules) : 0;
          }
          
          return {
            ...course.toObject(),
            isEnrolled: !!enrollment,
            progress: actualProgress,
            status: enrollment?.status || 'not_enrolled'
          };
        });
      }
    }

    res.json({
      success: true,
      data: coursesWithEnrollment,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses'
    });
  }
});

// @route   GET /api/courses/categories
// @desc    Get all course categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let courseWithEnrollment = course.toObject();
    
    // If user is authenticated, check enrollment status
    if (req.user) {
      const learner = await Learner.findOne({ userId: req.user._id });
      if (learner) {
        const enrollment = learner.enrollments.find(
          e => e.courseId.toString() === course._id.toString()
        );
        courseWithEnrollment.isEnrolled = !!enrollment;
        courseWithEnrollment.progress = enrollment?.progress || 0;
        courseWithEnrollment.status = enrollment?.status || 'not_enrolled';
        courseWithEnrollment.enrollmentDate = enrollment?.enrollDate;
        courseWithEnrollment.lastActivity = enrollment?.lastActivity;
        courseWithEnrollment.completedModules = enrollment?.completedModules || [];
      }
    }

    res.json({
      success: true,
      data: courseWithEnrollment
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course'
    });
  }
});

// @route   GET /api/courses/:id/modules
// @desc    Get course modules for enrolled students
// @access  Private
router.get('/:id/modules', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled
    const learner = await Learner.findOne({ userId: req.user._id });
    if (!learner) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to access course modules'
      });
    }

    const enrollment = learner.enrollments.find(
      e => e.courseId.toString() === course._id.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to access course modules'
      });
    }

    // Return course modules with progress info
    const modulesWithProgress = course.modules.map(module => {
      const completedModule = enrollment.completedModules?.find(
        cm => cm && cm.moduleId && cm.moduleId.toString() === module._id.toString()
      );
      
      return {
        ...module.toObject(),
        isCompleted: !!completedModule,
        completedAt: completedModule?.completedAt,
        score: completedModule?.score
      };
    });

    // Calculate actual progress based on completed modules
    const completedCount = modulesWithProgress.filter(m => m.isCompleted).length;
    const totalModules = modulesWithProgress.length;
    const actualProgress = totalModules > 0 ? completedCount / totalModules : 0;

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          instructor: course.instructor
        },
        modules: modulesWithProgress,
        progress: actualProgress,
        status: enrollment.status || 'active',
        completedModules: enrollment.completedModules || []
      }
    });
  } catch (error) {
    console.error('Course modules fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course modules'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private (Learner only)
router.post('/:id/enroll', auth, authorize('learner'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let learner = await Learner.findOne({ userId: req.user._id });
    
    // Create learner profile if it doesn't exist
    if (!learner) {
      learner = new Learner({
        userId: req.user._id,
        enrollments: [],
        engagementData: {
          totalHours: 0,
          streakDays: 0,
          lastLogin: new Date(),
          avgSessionTime: 0,
          completionRate: 0,
          weeklyGoalHours: 10,
          preferredStudyTime: 'evening'
        },
        achievements: [],
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          reminderFrequency: 'weekly'
        }
      });
    }

    // Check if already enrolled
    const existingEnrollment = learner.enrollments.find(
      e => e.courseId.toString() === course._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Add enrollment
    learner.enrollments.push({
      courseId: course._id,
      enrollDate: new Date(),
      progress: 0,
      lastActivity: new Date(),
      status: 'active',
      riskScore: 0.3, // Initial risk score
      completedModules: []
    });

    await learner.save();

    // Update course stats
    await Course.findByIdAndUpdate(course._id, {
      $inc: { 'stats.totalEnrolled': 1 }
    });

    // Log enrollment activity
    const activity = new Activity({
      learnerId: learner._id,
      courseId: course._id,
      type: 'course_enroll',
      timestamp: new Date(),
      metadata: {
        sessionId: `enroll_${Date.now()}`,
        courseName: course.title
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        courseId: course._id,
        enrollment: learner.enrollments[learner.enrollments.length - 1]
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
});

// @route   POST /api/courses/:id/progress
// @desc    Update course progress
// @access  Private (Learner only)
router.post('/:id/progress', auth, authorize('learner'), async (req, res) => {
  try {
    const { moduleId, progress, completed } = req.body;

    const learner = await Learner.findOne({ userId: req.user._id });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    const enrollment = learner.enrollments.find(
      e => e.courseId.toString() === req.params.id
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get course to calculate progress properly
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Add completed module if provided and not already completed
    if (moduleId && completed) {
      const alreadyCompleted = enrollment.completedModules.find(
        cm => cm && cm.moduleId && cm.moduleId.toString() === moduleId
      );
      
      if (!alreadyCompleted) {
        enrollment.completedModules.push({
          moduleId: moduleId,
          completedAt: new Date(),
          score: 100 // Default score, could be passed in the request
        });
      }
    }

    // Calculate progress based on completed modules (as decimal 0-1)
    const totalModules = course.modules.length;
    // Filter out any invalid completed modules
    const validCompletedModules = enrollment.completedModules.filter(cm => cm && cm.moduleId);
    const completedModulesCount = validCompletedModules.length;
    const calculatedProgress = totalModules > 0 ? (completedModulesCount / totalModules) : 0;

    // Update progress - use calculated progress or provided progress, whichever is higher
    // Convert percentage input to decimal if needed
    let progressDecimal = calculatedProgress;
    if (progress !== undefined) {
      // If progress is greater than 1, assume it's a percentage and convert to decimal
      const inputProgress = progress > 1 ? progress / 100 : progress;
      progressDecimal = Math.max(enrollment.progress, inputProgress, calculatedProgress);
    }
    
    enrollment.progress = Math.min(progressDecimal, 1); // Ensure it doesn't exceed 1

    // Update last activity
    enrollment.lastActivity = new Date();

    // Update status based on progress
    if (enrollment.progress >= 1.0) {
      enrollment.status = 'completed';
    } else if (enrollment.progress > 0) {
      enrollment.status = 'active';
    }

    await learner.save();

    // Get ML risk assessment
    let riskAssessment = null;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        learner_id: learner._id.toString(),
        course_id: req.params.id,
        current_progress: enrollment.progress
      });
      
      if (mlResponse.data && mlResponse.data.risk_score !== undefined) {
        enrollment.riskScore = mlResponse.data.risk_score;
        await learner.save();
        riskAssessment = mlResponse.data;
      }
    } catch (mlError) {
      console.error('ML risk assessment failed:', mlError.message);
      // Continue without ML data
    }

    // Log progress activity
    const activity = new Activity({
      learnerId: learner._id,
      courseId: req.params.id,
      type: completed ? 'module_complete' : 'video_watch',
      timestamp: new Date(),
      metadata: {
        moduleId,
        progress: enrollment.progress,
        completed
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        enrollment,
        riskAssessment
      }
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
});

// @route   GET /api/courses/:id/modules
// @desc    Get course modules with progress
// @access  Private (Learner only)
router.get('/:id/modules', auth, authorize('learner'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const learner = await Learner.findOne({ userId: req.user._id });
    const enrollment = learner?.enrollments.find(
      e => e.courseId.toString() === course._id.toString()
    );

    // Add completion status to modules
    const modulesWithProgress = course.modules.map(module => ({
      ...module.toObject(),
      isCompleted: enrollment?.completedModules.includes(module.moduleId.toString()) || false
    }));

    res.json({
      success: true,
      data: modulesWithProgress
    });
  } catch (error) {
    console.error('Modules fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course modules'
    });
  }
});

module.exports = router;
