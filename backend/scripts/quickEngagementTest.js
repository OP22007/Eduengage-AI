// Quick test script to update engagement metrics for a few learners
require('dotenv').config();
const mongoose = require('mongoose');
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');

async function quickTest() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first 5 learners for testing (without populate to avoid schema issues)
    const learners = await Learner.find({}).limit(5);
    console.log(`Testing with ${learners.length} learners`);

    for (const learner of learners) {
      console.log(`\n📈 Processing learner: ${learner._id}`);
      
      // Get activities for this learner
      const activities = await Activity.find({ learnerId: learner._id });
      console.log(`  Found ${activities.length} activities`);

      if (activities.length > 0) {
        // Calculate total hours
        const totalSeconds = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
        const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
        
        // Simple completion rate calculation
        let completionRate = 0;
        if (learner.enrollments && learner.enrollments.length > 0) {
          const totalProgress = learner.enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
          completionRate = Math.round((totalProgress / learner.enrollments.length) * 100) / 100;
        }

        // Simple streak calculation (just count unique days)
        const uniqueDays = new Set();
        activities.forEach(activity => {
          const dateStr = activity.timestamp.toISOString().split('T')[0];
          uniqueDays.add(dateStr);
        });
        const streakDays = uniqueDays.size;

        // Update learner
        await Learner.findByIdAndUpdate(learner._id, {
          'engagementData.totalHours': totalHours,
          'engagementData.streakDays': streakDays,
          'engagementData.completionRate': completionRate,
          'learningStreak': streakDays,
          'longestStreak': streakDays,
          'totalXP': activities.length * 10 + Math.floor(totalHours * 50),
          'level': Math.floor((activities.length * 10 + Math.floor(totalHours * 50)) / 1000) + 1
        });

        console.log(`  ✅ Updated: ${totalHours}h, ${streakDays} days, ${(completionRate * 100).toFixed(1)}% completion`);
      } else {
        console.log(`  ⚠️ No activities found`);
      }
    }

    console.log('\n✅ Quick test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected');
  }
}

quickTest();
