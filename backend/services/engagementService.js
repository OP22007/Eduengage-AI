// Service to calculate and update engagement metrics for learners
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');

class EngagementService {
  
  /**
   * Update engagement metrics for a specific learner
   * @param {string} learnerId - The learner's ID
   * @returns {Promise<Object>} Updated metrics
   */
  static async updateLearnerMetrics(learnerId) {
    try {
      const learner = await Learner.findById(learnerId).populate('enrollments.courseId');
      if (!learner) {
        throw new Error('Learner not found');
      }

      // Get all activities for this learner
      const activities = await Activity.find({ learnerId }).sort({ timestamp: 1 });

      // Calculate total hours from activities
      const totalSeconds = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
      const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
      
      // Calculate average session time (in minutes)
      const validSessions = activities.filter(a => a.duration && a.duration > 0);
      const avgSessionTime = validSessions.length > 0 
        ? Math.round((validSessions.reduce((sum, a) => sum + a.duration, 0) / validSessions.length) / 60)
        : 0;

      // Calculate completion rate
      let completionRate = 0;
      if (learner.enrollments && learner.enrollments.length > 0) {
        const totalProgress = learner.enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
        completionRate = Math.round((totalProgress / learner.enrollments.length) * 100) / 100;
      }

      // Calculate learning streak
      const streakData = this.calculateStreak(activities);
      
      // Calculate XP and level
      const totalXP = activities.length * 10 + Math.floor(totalHours * 50);
      const level = Math.floor(totalXP / 1000) + 1;

      // Get last activity timestamp
      const lastActivity = activities.length > 0 ? activities[activities.length - 1].timestamp : new Date();

      // Update learner with calculated metrics
      const updateData = {
        'engagementData.totalHours': totalHours,
        'engagementData.streakDays': streakData.currentStreak,
        'engagementData.avgSessionTime': avgSessionTime,
        'engagementData.completionRate': completionRate,
        'engagementData.lastLogin': lastActivity,
        'learningStreak': streakData.currentStreak,
        'longestStreak': streakData.longestStreak,
        'totalXP': totalXP,
        'level': level
      };

      await Learner.findByIdAndUpdate(learnerId, updateData);

      return {
        success: true,
        metrics: {
          totalHours,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          avgSessionTime,
          completionRate,
          totalXP,
          level,
          lastActivity
        }
      };

    } catch (error) {
      console.error('Error updating learner metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate learning streak from activities
   * @param {Array} activities - Array of activity objects
   * @returns {Object} Streak data
   */
  static calculateStreak(activities) {
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (activities.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group activities by date
    const activityDates = [];
    const dateSet = new Set();
    
    activities.forEach(activity => {
      const dateStr = activity.timestamp.toISOString().split('T')[0];
      if (!dateSet.has(dateStr)) {
        dateSet.add(dateStr);
        activityDates.push(new Date(dateStr));
      }
    });
    
    activityDates.sort((a, b) => a - b);
    
    if (activityDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Calculate current streak (from today backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if user was active today or yesterday
    const lastActivityDate = activityDates[activityDates.length - 1];
    if (lastActivityDate.getTime() === today.getTime() || lastActivityDate.getTime() === yesterday.getTime()) {
      // Calculate current streak backwards from last activity
      let streakDate = new Date(lastActivityDate);
      currentStreak = 1;
      
      for (let i = activityDates.length - 2; i >= 0; i--) {
        const prevDate = new Date(streakDate);
        prevDate.setDate(prevDate.getDate() - 1);
        
        if (activityDates[i].getTime() === prevDate.getTime()) {
          currentStreak++;
          streakDate = activityDates[i];
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    let tempStreak = 1;
    longestStreak = 1;
    
    for (let i = 1; i < activityDates.length; i++) {
      const currentDate = activityDates[i];
      const prevDate = activityDates[i - 1];
      const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Update enrollment progress and recalculate completion rate
   * @param {string} learnerId - The learner's ID
   * @param {string} courseId - The course ID
   * @param {number} progress - New progress value (0-1)
   */
  static async updateCourseProgress(learnerId, courseId, progress) {
    try {
      // Update the specific enrollment progress
      await Learner.findOneAndUpdate(
        { _id: learnerId, 'enrollments.courseId': courseId },
        { $set: { 'enrollments.$.progress': progress } }
      );

      // Recalculate overall completion rate
      const learner = await Learner.findById(learnerId);
      if (learner && learner.enrollments.length > 0) {
        const totalProgress = learner.enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
        const completionRate = Math.round((totalProgress / learner.enrollments.length) * 100) / 100;
        
        await Learner.findByIdAndUpdate(learnerId, {
          'engagementData.completionRate': completionRate
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating course progress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add activity and update metrics in real-time
   * @param {Object} activityData - Activity data
   */
  static async addActivityAndUpdateMetrics(activityData) {
    try {
      // Create the activity
      const activity = new Activity(activityData);
      await activity.save();

      // Update learner metrics
      await this.updateLearnerMetrics(activityData.learnerId);

      return { success: true, activity };
    } catch (error) {
      console.error('Error adding activity and updating metrics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EngagementService;
