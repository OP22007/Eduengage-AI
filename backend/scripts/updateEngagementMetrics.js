// Script to calculate and update engagement metrics for all learners
require('dotenv').config();
const mongoose = require('mongoose');
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');
const Course = require('../models/Course'); // Add missing Course model

async function calculateEngagementMetrics() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Fetching all learners...');
    const learners = await Learner.find({});
    console.log(`Found ${learners.length} learners`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const learner of learners) {
      try {
        console.log(`\n📈 Processing learner: ${learner.userId} (${learner._id})`);
        
        // Get all activities for this learner
        const activities = await Activity.find({ learnerId: learner._id }).sort({ timestamp: 1 });
        console.log(`  Found ${activities.length} activities`);

        // Calculate total hours from activities
        const totalSeconds = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
        const totalHours = Math.round((totalSeconds / 3600) * 100) / 100; // Round to 2 decimal places
        
        // Calculate average session time
        const validSessions = activities.filter(a => a.duration && a.duration > 0);
        const avgSessionTime = validSessions.length > 0 
          ? Math.round((validSessions.reduce((sum, a) => sum + a.duration, 0) / validSessions.length) / 60) // Convert to minutes
          : 0;

        // Calculate completion rate
        let completionRate = 0;
        if (learner.enrollments && learner.enrollments.length > 0) {
          const totalProgress = learner.enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
          completionRate = Math.round((totalProgress / learner.enrollments.length) * 100) / 100;
        }

        // Calculate learning streak
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        if (activities.length > 0) {
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
          
          if (activityDates.length > 0) {
            // Check current streak (from today backwards)
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
            tempStreak = 1;
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
          }
        }

        // Calculate total XP (simple calculation based on activities)
        const totalXP = activities.length * 10 + Math.floor(totalHours * 50);
        
        // Calculate level based on XP
        const level = Math.floor(totalXP / 1000) + 1;

        // Get the most recent activity timestamp for lastLogin
        const lastActivity = activities.length > 0 ? activities[activities.length - 1].timestamp : learner.engagementData?.lastLogin || new Date();

        // Update learner with calculated metrics
        const updateData = {
          'engagementData.totalHours': totalHours,
          'engagementData.streakDays': currentStreak,
          'engagementData.avgSessionTime': avgSessionTime,
          'engagementData.completionRate': completionRate,
          'engagementData.lastLogin': lastActivity,
          'learningStreak': currentStreak,
          'longestStreak': longestStreak,
          'totalXP': totalXP,
          'level': level
        };

        await Learner.findByIdAndUpdate(learner._id, updateData);

        console.log(`  ✅ Updated metrics:`);
        console.log(`     Total Hours: ${totalHours}`);
        console.log(`     Streak Days: ${currentStreak}`);
        console.log(`     Longest Streak: ${longestStreak}`);
        console.log(`     Avg Session: ${avgSessionTime} min`);
        console.log(`     Completion Rate: ${(completionRate * 100).toFixed(1)}%`);
        console.log(`     Total XP: ${totalXP}`);
        console.log(`     Level: ${level}`);
        console.log(`     Last Activity: ${lastActivity.toISOString()}`);
        
        updatedCount++;

      } catch (error) {
        console.error(`  ❌ Error processing learner ${learner._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Engagement Metrics Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} learners`);
    console.log(`❌ Errors: ${errorCount} learners`);
    console.log('🎉 Engagement metrics calculation completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the calculation
calculateEngagementMetrics();
