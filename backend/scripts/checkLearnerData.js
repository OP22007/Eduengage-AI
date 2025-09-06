const mongoose = require('mongoose');
const Learner = require('../models/Learner');

// MongoDB connection
mongoose.connect('mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad?retryWrites=true&w=majority&appName=BITSBids', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkLearnerData = async () => {
  try {
    console.log('🔍 Checking learner data for ML service...');
    
    // Get a sample learner
    const learner = await Learner.findOne({}).populate('userId');
    
    if (learner) {
      console.log('✅ Found sample learner:');
      console.log('   Learner ID:', learner._id.toString());
      console.log('   User ID:', learner.userId?._id || 'No user linked');
      console.log('   Enrollments:', learner.enrollments?.length || 0);
      console.log('   Engagement Data:', !!learner.engagementData);
      
      if (learner.enrollments?.length > 0) {
        const enrollment = learner.enrollments[0];
        console.log('   Sample Enrollment:');
        console.log('     Course ID:', enrollment.courseId);
        console.log('     Progress:', enrollment.progress);
        console.log('     Status:', enrollment.status);
        console.log('     Completed Modules:', enrollment.completedModules?.length || 0);
      }
      
      // Test the specific learner ID from verification
      const testLearner = await Learner.findById('68bc2a5d07d89502ea6182ea');
      console.log('✅ Test learner exists:', !!testLearner);
      
      if (testLearner) {
        console.log('   Test learner enrollments:', testLearner.enrollments?.length || 0);
        console.log('   Test learner user ID:', testLearner.userId || 'No user linked');
      }
    } else {
      console.log('❌ No learners found in database');
    }
    
    // Count total learners
    const count = await Learner.countDocuments();
    console.log('📊 Total learners in database:', count);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking learner data:', error);
    process.exit(1);
  }
};

checkLearnerData();
