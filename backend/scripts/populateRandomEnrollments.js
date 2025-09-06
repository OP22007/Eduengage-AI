const mongoose = require('mongoose');
const Learner = require('../models/Learner');
const Course = require('../models/Course');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad?retryWrites=true&w=majority&appName=BITSBids';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function populateRandomEnrollments() {
  try {
    console.log('Starting random enrollment population...');

    // Get all learners and courses
    const learners = await Learner.find();
    const courses = await Course.find();

    console.log(`Found ${learners.length} learners and ${courses.length} courses`);

    for (const learner of learners) {
      console.log(`Processing learner: ${learner.userId}`);
      
      // Clear existing enrollments
      learner.enrollments = [];
      
      // Randomly enroll in 1-4 courses
      const numEnrollments = Math.floor(Math.random() * 4) + 1;
      const shuffledCourses = courses.sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numEnrollments);
      
      for (const course of selectedCourses) {
        const numModules = course.modules.length;
        
        // Generate random progress (0-1 as decimal)
        const progressDecimal = Math.random(); // 0.0 to 1.0
        const progressPercentage = Math.floor(progressDecimal * 100); // For display purposes
        
        // Calculate completed modules based on progress
        const completedModuleCount = Math.floor(progressDecimal * numModules);
        const completedModules = course.modules.slice(0, completedModuleCount).map(m => ({
          moduleId: m._id,
          completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random completion within last week
          score: Math.floor(Math.random() * 41) + 60 // Random score between 60-100
        }));
        
        // Determine status based on progress
        let status = 'active';
        if (progressDecimal >= 1.0) {
          status = 'completed';
        } else if (progressDecimal === 0) {
          status = 'active';
        } else if (progressDecimal < 0.3 && Math.random() < 0.2) {
          status = 'at-risk';
        }
        
        // Create enrollment with random dates
        const enrollDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
        const lastActivity = new Date(enrollDate.getTime() + Math.random() * (Date.now() - enrollDate.getTime()));
        
        const enrollment = {
          courseId: course._id,
          enrollDate: enrollDate, // Fix field name
          progress: progressDecimal, // Use decimal value (0-1)
          status: status,
          completedModules: completedModules,
          lastActivity: lastActivity,
          riskScore: Math.random() * 0.3 // Random risk score between 0-0.3 (low risk)
        };
        
        learner.enrollments.push(enrollment);
        console.log(`  Enrolled in ${course.title} with ${progressPercentage}% progress (${completedModuleCount}/${numModules} modules)`);
      }
      
      await learner.save();
    }

    console.log('Random enrollment population completed!');
    
    // Print summary
    const updatedLearners = await Learner.find().populate('enrollments.courseId', 'title');
    for (const learner of updatedLearners) {
      console.log(`\n${learner.userId} (${learner.enrollments.length} enrollments):`);
      for (const enrollment of learner.enrollments) {
        const progressPercentage = Math.floor(enrollment.progress * 100);
        console.log(`  - ${enrollment.courseId.title}: ${progressPercentage}% (${enrollment.status})`);
      }
    }

  } catch (error) {
    console.error('Error populating enrollments:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
populateRandomEnrollments();
