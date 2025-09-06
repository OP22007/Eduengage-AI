const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Learner = require('../models/Learner');
const { auth } = require('../middleware/auth');

// Get user achievements and badges
router.get('/', auth, async (req, res) => {
  try {
    const userId = String(req.user._id);
    console.log('Fetching achievements for userId:', userId);
    // Find learner data
    const learner = await Learner.findOne({ userId }).populate('enrollments.courseId');
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    // Calculate user stats
    const completedCourses = learner.enrollments.filter(enrollment => 
      enrollment.status === 'completed'
    );
    
    // Use engagementData.totalHours instead of calculating from timeSpent
    const totalStudyTime = learner.engagementData.totalHours || 0;

    // Calculate learning streak (mock for now)
    const currentStreak = learner.learningStreak || 0;
    const longestStreak = learner.longestStreak || 0;

    // Generate achievements based on user progress
    const achievements = generateAchievements(learner, completedCourses);
    const badges = generateBadges(completedCourses);

    // Calculate total XP from learner's stored XP or from achievements
    const totalXP = learner.totalXP || achievements.filter(a => a.unlocked).reduce((total, a) => total + a.xpReward, 0);
    const level = learner.level || Math.floor(totalXP / 300) + 1;

    const userStats = {
      totalXP,
      level,
      completedCourses: completedCourses.length,
      totalStudyHours: Math.round(totalStudyTime), // totalHours is already in hours
      longestStreak,
      currentStreak,
      achievements: achievements.filter(a => a.unlocked).length,
      badges: badges.filter(b => b.unlocked).length
    };

    res.json({
      success: true,
      data: {
        userStats,
        achievements,
        badges
      }
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Update achievement progress
router.post('/update', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { achievementId, progress } = req.body;

    const learner = await Learner.findOne({ userId });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    // Update achievement progress in learner model
    if (!learner.achievements) {
      learner.achievements = [];
    }

    const existingAchievement = learner.achievements.find(a => a.id === achievementId);
    if (existingAchievement) {
      existingAchievement.progress = progress;
      existingAchievement.updatedAt = new Date();
    } else {
      learner.achievements.push({
        id: achievementId,
        progress,
        unlockedAt: null,
        updatedAt: new Date()
      });
    }

    await learner.save();

    res.json({
      success: true,
      message: 'Achievement progress updated'
    });

  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update achievement'
    });
  }
});

// Unlock achievement
router.post('/unlock/:achievementId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { achievementId } = req.params;

    const learner = await Learner.findOne({ userId });
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    if (!learner.achievements) {
      learner.achievements = [];
    }

    const existingAchievement = learner.achievements.find(a => a.id === achievementId);
    if (existingAchievement) {
      existingAchievement.unlocked = true;
      existingAchievement.unlockedAt = new Date();
    } else {
      learner.achievements.push({
        id: achievementId,
        unlocked: true,
        unlockedAt: new Date()
      });
    }

    await learner.save();

    res.json({
      success: true,
      message: 'Achievement unlocked!',
      data: {
        achievementId,
        unlockedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock achievement'
    });
  }
});

// Generate achievements based on user progress
function generateAchievements(learner, completedCourses) {
  const achievements = [
    // Course completion achievements
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first course',
      category: 'course',
      type: 'bronze',
      unlocked: completedCourses.length >= 1,
      unlockedAt: completedCourses.length >= 1 ? (completedCourses[0].lastActivity || new Date()) : null,
      rarity: 'common',
      xpReward: 100
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Complete 5 courses',
      category: 'course',
      type: 'silver',
      unlocked: completedCourses.length >= 5,
      unlockedAt: completedCourses.length >= 5 ? (completedCourses[4].lastActivity || new Date()) : null,
      progress: completedCourses.length < 5 ? { current: completedCourses.length, total: 5 } : null,
      rarity: 'rare',
      xpReward: 250
    },
    {
      id: '3',
      title: 'Master Learner',
      description: 'Complete 10 courses',
      category: 'course',
      type: 'gold',
      unlocked: completedCourses.length >= 10,
      unlockedAt: completedCourses.length >= 10 ? (completedCourses[9].lastActivity || new Date()) : null,
      progress: completedCourses.length < 10 ? { current: completedCourses.length, total: 10 } : null,
      rarity: 'epic',
      xpReward: 500
    },
    
    // Learning achievements
    {
      id: '4',
      title: 'Perfect Score',
      description: 'Score 100% on any course assessment',
      category: 'learning',
      type: 'silver',
      unlocked: completedCourses.some(course => course.progress === 1), // Perfect completion
      unlockedAt: completedCourses.find(course => course.progress === 1)?.lastActivity || null,
      rarity: 'rare',
      xpReward: 300
    },
    {
      id: '5',
      title: 'Speed Demon',
      description: 'Complete a course in under 10 hours',
      category: 'learning',
      type: 'silver',
      unlocked: completedCourses.length > 0, // Simplify to any completion for now
      unlockedAt: completedCourses.length > 0 ? completedCourses[0].lastActivity : null,
      rarity: 'rare',
      xpReward: 200
    },
    
    // Streak achievements
    {
      id: '6',
      title: 'Consistent',
      description: 'Maintain a 7-day learning streak',
      category: 'streak',
      type: 'bronze',
      unlocked: (learner.longestStreak || 0) >= 7,
      unlockedAt: (learner.longestStreak || 0) >= 7 ? new Date() : null,
      progress: (learner.currentStreak || 0) < 7 ? { current: learner.currentStreak || 0, total: 7 } : null,
      rarity: 'common',
      xpReward: 150
    },
    {
      id: '7',
      title: 'Dedicated',
      description: 'Maintain a 30-day learning streak',
      category: 'streak',
      type: 'gold',
      unlocked: (learner.longestStreak || 0) >= 30,
      unlockedAt: (learner.longestStreak || 0) >= 30 ? new Date() : null,
      progress: (learner.currentStreak || 0) < 30 ? { current: learner.currentStreak || 0, total: 30 } : null,
      rarity: 'epic',
      xpReward: 600
    },
    
    // Special achievements
    {
      id: '8',
      title: 'Early Bird',
      description: 'Be among the first 100 users',
      category: 'special',
      type: 'legendary',
      unlocked: true, // Assume early user for demo
      unlockedAt: learner.createdAt,
      rarity: 'legendary',
      xpReward: 1000
    }
  ];

  return achievements;
}

// Generate badges based on completed courses
function generateBadges(completedCourses) {
  const courseBadges = [
    {
      id: '1',
      name: 'Web Developer',
      description: 'Completed Full Stack Web Development course',
      color: 'bg-blue-500 text-white',
      courseName: 'Full Stack Web Development'
    },
    {
      id: '2',
      name: 'Data Scientist',
      description: 'Completed Data Science Fundamentals course',
      color: 'bg-green-500 text-white',
      courseName: 'Data Science Fundamentals'
    },
    {
      id: '3',
      name: 'AI Expert',
      description: 'Completed Machine Learning course',
      color: 'bg-purple-500 text-white',
      courseName: 'Machine Learning Basics'
    },
    {
      id: '4',
      name: 'Innovation Leader',
      description: 'Complete the Innovation Management course',
      color: 'bg-yellow-500 text-white',
      courseName: 'Innovation Management'
    },
    {
      id: '5',
      name: 'Cloud Master',
      description: 'Complete the Cloud Computing course',
      color: 'bg-indigo-500 text-white',
      courseName: 'Cloud Computing Essentials'
    }
  ];

  // Check which badges are unlocked based on completed courses
  return courseBadges.map(badge => {
    const completedCourse = completedCourses.find(course => 
      course.courseId && course.courseId.title && 
      course.courseId.title.toLowerCase().includes(badge.courseName.toLowerCase().split(' ')[0])
    );
    
    return {
      ...badge,
      unlocked: !!completedCourse,
      unlockedAt: completedCourse ? (completedCourse.lastActivity || new Date()) : null,
      courseId: completedCourse ? completedCourse.courseId._id : null
    };
  });
}

module.exports = router;
