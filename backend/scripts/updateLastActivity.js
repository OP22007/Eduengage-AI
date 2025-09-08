// Migration script to update all learners with their actual last activity
require('dotenv').config();
const mongoose = require('mongoose');
const Learner = require('../models/Learner');
const Activity = require('../models/Activity');

async function updateLearnersLastActivity() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Fetching all learners...');
    const learners = await Learner.find({});
    console.log(`Found ${learners.length} learners`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const learner of learners) {
      try {
        console.log(`Processing learner: ${learner._id}`);
        
        // Find the most recent activity for this learner
        const lastActivity = await Activity.findOne({
          learnerId: learner._id
        }).sort({ timestamp: -1 });

        if (lastActivity) {
          // Update the engagementData.lastLogin with the actual last activity
          await Learner.findByIdAndUpdate(learner._id, {
            'engagementData.lastLogin': lastActivity.timestamp
          });
          
          console.log(`✅ Updated learner ${learner._id} with last activity: ${lastActivity.timestamp}`);
          updatedCount++;
        } else {
          console.log(`⚠️ No activities found for learner ${learner._id}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing learner ${learner._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Updated: ${updatedCount} learners`);
    console.log(`⚠️ Skipped: ${skippedCount} learners`);
    console.log('🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the migration
updateLearnersLastActivity();
