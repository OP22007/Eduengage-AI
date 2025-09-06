const mongoose = require('mongoose');
const Learner = require('../models/Learner');
const Course = require('../models/Course');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad?retryWrites=true&w=majority&appName=BITSBids';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyEnrollments() {
  try {
    console.log('Verifying enrollments and progress data...\n');

    const learners = await Learner.find().populate('enrollments.courseId', 'title modules');
    
    console.log(`Found ${learners.length} learners:\n`);

    for (const learner of learners) {
      console.log(`👤 Learner ID: ${learner.userId}`);
      console.log(`   Enrollments: ${learner.enrollments.length}`);
      
      for (const enrollment of learner.enrollments) {
        const course = enrollment.courseId;
        const progressPercent = Math.round(enrollment.progress * 100);
        const totalModules = course.modules.length;
        const completedModulesCount = enrollment.completedModules.length;
        
        console.log(`   📚 ${course.title}:`);
        console.log(`      Progress: ${progressPercent}% (${enrollment.progress.toFixed(3)} decimal)`);
        console.log(`      Modules: ${completedModulesCount}/${totalModules} completed`);
        console.log(`      Status: ${enrollment.status}`);
        console.log(`      Risk Score: ${enrollment.riskScore.toFixed(3)}`);
        
        if (enrollment.completedModules.length > 0) {
          console.log(`      Completed Modules:`);
          enrollment.completedModules.forEach((cm, index) => {
            console.log(`        ${index + 1}. Module ID: ${cm.moduleId} (Score: ${cm.score || 'N/A'})`);
          });
        }
        console.log('');
      }
      console.log('---\n');
    }

    // Summary statistics
    const totalEnrollments = learners.reduce((sum, learner) => sum + learner.enrollments.length, 0);
    const completedCourses = learners.reduce((sum, learner) => 
      sum + learner.enrollments.filter(e => e.status === 'completed').length, 0
    );
    const activeCourses = learners.reduce((sum, learner) => 
      sum + learner.enrollments.filter(e => e.status === 'active').length, 0
    );
    const atRiskCourses = learners.reduce((sum, learner) => 
      sum + learner.enrollments.filter(e => e.status === 'at-risk').length, 0
    );

    console.log('📊 Summary Statistics:');
    console.log(`Total Enrollments: ${totalEnrollments}`);
    console.log(`Completed Courses: ${completedCourses}`);
    console.log(`Active Courses: ${activeCourses}`);
    console.log(`At-Risk Courses: ${atRiskCourses}`);

  } catch (error) {
    console.error('Error verifying enrollments:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the verification
verifyEnrollments();
