const mongoose = require('mongoose');
const Learner = require('../models/Learner');

// MongoDB connection
mongoose.connect('mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad?retryWrites=true&w=majority&appName=BITSBids', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cleanCompletedModules = async () => {
  try {
    console.log('🔍 Finding learners with invalid completed modules...');
    
    const learners = await Learner.find({});
    let totalCleaned = 0;
    
    for (const learner of learners) {
      let hasChanges = false;
      
      for (const enrollment of learner.enrollments) {
        if (enrollment.completedModules && enrollment.completedModules.length > 0) {
          const originalLength = enrollment.completedModules.length;
          
          // Filter out invalid completed modules
          enrollment.completedModules = enrollment.completedModules.filter(cm => 
            cm && cm.moduleId && cm.moduleId.toString
          );
          
          if (enrollment.completedModules.length !== originalLength) {
            hasChanges = true;
            const cleaned = originalLength - enrollment.completedModules.length;
            totalCleaned += cleaned;
            console.log(`📝 Learner ${learner._id}: Cleaned ${cleaned} invalid completed modules`);
          }
        }
      }
      
      if (hasChanges) {
        await learner.save();
      }
    }
    
    console.log(`✅ Cleanup complete! Removed ${totalCleaned} invalid completed module entries.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error cleaning completed modules:', error);
    process.exit(1);
  }
};

cleanCompletedModules();
