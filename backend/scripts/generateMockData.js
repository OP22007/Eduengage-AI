require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Learner = require('../models/Learner');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const Intervention = require('../models/Intervention');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for data generation');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate Courses
const generateCourses = async () => {
  console.log('📚 Generating courses...');
  
  const courses = [
    {
      title: 'Full Stack Web Development',
      description: 'Master modern web development with React, Node.js, and MongoDB',
      duration: 120,
      difficulty: 'intermediate',
      category: 'Web Development',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      modules: [
        { title: 'HTML & CSS Fundamentals', duration: 15, order: 1 },
        { title: 'JavaScript Essentials', duration: 20, order: 2 },
        { title: 'React Framework', duration: 25, order: 3 },
        { title: 'Node.js Backend', duration: 20, order: 4 },
        { title: 'Database Design', duration: 15, order: 5 },
        { title: 'Deployment & DevOps', duration: 25, order: 6 }
      ],
      instructor: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        bio: 'Senior Full Stack Developer with 8+ years experience',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c'
      },
      stats: {
        totalEnrolled: faker.number.int({ min: 800, max: 1200 }),
        completionRate: faker.number.float({ min: 0.45, max: 0.75 }),
        avgRating: faker.number.float({ min: 4.2, max: 4.8 }),
        totalRatings: faker.number.int({ min: 200, max: 500 })
      }
    },
    {
      title: 'Data Science with Python',
      description: 'Learn data analysis, machine learning, and data visualization',
      duration: 100,
      difficulty: 'advanced',
      category: 'Data Science',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      modules: [
        { title: 'Python Fundamentals', duration: 18, order: 1 },
        { title: 'NumPy & Pandas', duration: 22, order: 2 },
        { title: 'Data Visualization', duration: 20, order: 3 },
        { title: 'Machine Learning', duration: 25, order: 4 },
        { title: 'Deep Learning', duration: 15, order: 5 }
      ],
      instructor: {
        name: 'Dr. Michael Chen',
        email: 'michael@example.com',
        bio: 'PhD in Computer Science, ML Research Scientist',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
      },
      stats: {
        totalEnrolled: faker.number.int({ min: 600, max: 900 }),
        completionRate: faker.number.float({ min: 0.35, max: 0.65 }),
        avgRating: faker.number.float({ min: 4.0, max: 4.7 }),
        totalRatings: faker.number.int({ min: 150, max: 400 })
      }
    },
    {
      title: 'Digital Marketing Mastery',
      description: 'Complete guide to modern digital marketing strategies',
      duration: 80,
      difficulty: 'beginner',
      category: 'Marketing',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      modules: [
        { title: 'Marketing Fundamentals', duration: 12, order: 1 },
        { title: 'Social Media Marketing', duration: 18, order: 2 },
        { title: 'Content Marketing', duration: 15, order: 3 },
        { title: 'SEO & SEM', duration: 20, order: 4 },
        { title: 'Analytics & ROI', duration: 15, order: 5 }
      ],
      instructor: {
        name: 'Emma Rodriguez',
        email: 'emma@example.com',
        bio: 'Digital Marketing Expert, Former Google Marketing Lead',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
      },
      stats: {
        totalEnrolled: faker.number.int({ min: 1000, max: 1500 }),
        completionRate: faker.number.float({ min: 0.55, max: 0.85 }),
        avgRating: faker.number.float({ min: 4.3, max: 4.9 }),
        totalRatings: faker.number.int({ min: 300, max: 700 })
      }
    },
    {
      title: 'UI/UX Design Fundamentals',
      description: 'Learn user-centered design principles and modern design tools',
      duration: 90,
      difficulty: 'intermediate',
      category: 'Design',
      thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e',
      modules: [
        { title: 'Design Thinking', duration: 15, order: 1 },
        { title: 'User Research', duration: 18, order: 2 },
        { title: 'Wireframing & Prototyping', duration: 20, order: 3 },
        { title: 'Visual Design', duration: 22, order: 4 },
        { title: 'Usability Testing', duration: 15, order: 5 }
      ],
      instructor: {
        name: 'Alex Kim',
        email: 'alex@example.com',
        bio: 'Senior UX Designer at top tech companies',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
      },
      stats: {
        totalEnrolled: faker.number.int({ min: 700, max: 1000 }),
        completionRate: faker.number.float({ min: 0.50, max: 0.80 }),
        avgRating: faker.number.float({ min: 4.1, max: 4.6 }),
        totalRatings: faker.number.int({ min: 180, max: 450 })
      }
    },
    {
      title: 'Cloud Computing with AWS',
      description: 'Master Amazon Web Services and cloud architecture',
      duration: 110,
      difficulty: 'advanced',
      category: 'Cloud Computing',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      modules: [
        { title: 'AWS Fundamentals', duration: 20, order: 1 },
        { title: 'EC2 & Storage', duration: 22, order: 2 },
        { title: 'Networking & Security', duration: 25, order: 3 },
        { title: 'Database Services', duration: 18, order: 4 },
        { title: 'DevOps & Automation', duration: 25, order: 5 }
      ],
      instructor: {
        name: 'David Thompson',
        email: 'david@example.com',
        bio: 'AWS Certified Solutions Architect, Cloud Infrastructure Expert',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
      },
      stats: {
        totalEnrolled: faker.number.int({ min: 500, max: 800 }),
        completionRate: faker.number.float({ min: 0.40, max: 0.70 }),
        avgRating: faker.number.float({ min: 4.2, max: 4.7 }),
        totalRatings: faker.number.int({ min: 120, max: 350 })
      }
    }
  ];

  return await Course.insertMany(courses);
};

// Generate Demo Users and Learners
const generateUsers = async (courses) => {
  console.log('👥 Generating users and learners...');
  
  const users = [];
  const learners = [];

  // Hash the demo password
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const learnerPassword = await bcrypt.hash('learner123', 10);

  // Create demo admin user
  const adminUser = new User({
    email: 'admin@demo.com',
    password: hashedPassword,
    role: 'admin',
    profile: {
      name: 'Admin Demo User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    }
  });
  users.push(adminUser);

  // Create demo instructor user
  const instructorUser = new User({
    email: 'instructor@demo.com',
    password: hashedPassword,
    role: 'instructor',
    profile: {
      name: 'Instructor Demo User',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    }
  });
  users.push(instructorUser);

  // Create demo learner users with different risk profiles
  const demoLearners = [
    {
      email: 'learner1@demo.com',
      name: 'High Risk Learner',
      type: 'high-risk',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c'
    },
    {
      email: 'learner2@demo.com',
      name: 'Successful Learner',
      type: 'successful',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    },
    {
      email: 'learner3@demo.com',
      name: 'New Learner',
      type: 'new',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    }
  ];

  // Generate demo learners
  for (const demoLearner of demoLearners) {
    const user = new User({
      email: demoLearner.email,
      password: learnerPassword,
      role: 'learner',
      profile: {
        name: demoLearner.name,
        avatar: demoLearner.avatar,
        joinDate: faker.date.past({ months: 6 }),
        timezone: 'UTC+05:30'
      }
    });
    users.push(user);
  }

  // Generate regular learners
  for (let i = 0; i < 500; i++) {
    const user = new User({
      email: faker.internet.email(),
      password: learnerPassword,
      role: 'learner',
      profile: {
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        joinDate: faker.date.past({ years: 2 }),
        timezone: faker.helpers.arrayElement(['UTC+05:30', 'UTC-05:00', 'UTC+00:00', 'UTC+08:00', 'UTC-08:00'])
      }
    });
    users.push(user);
  }

  const savedUsers = await User.insertMany(users);
  console.log(`✅ Created ${savedUsers.length} users`);

  // Create learner profiles for all learner users
  const learnerUsers = savedUsers.filter(user => user.role === 'learner');
  
  for (const user of learnerUsers) {
    const enrollments = [];
    const numEnrollments = faker.number.int({ min: 1, max: 4 });
    
    // Select random courses for enrollment
    const selectedCourses = faker.helpers.arrayElements(courses, numEnrollments);
    
    for (const course of selectedCourses) {
      const enrollDate = faker.date.between({ 
        from: user.profile.joinDate, 
        to: new Date() 
      });
      
      let progress, riskScore, status;
      
      // Determine learner type based on email for demo users
      if (user.email === 'learner1@demo.com') {
        // High-risk learner
        progress = faker.number.float({ min: 0.1, max: 0.4 });
        riskScore = faker.number.float({ min: 0.7, max: 0.95 });
        status = 'at-risk';
      } else if (user.email === 'learner2@demo.com') {
        // Successful learner
        progress = faker.number.float({ min: 0.6, max: 1.0 });
        riskScore = faker.number.float({ min: 0.1, max: 0.4 });
        status = progress >= 1.0 ? 'completed' : 'active';
      } else if (user.email === 'learner3@demo.com') {
        // New learner
        progress = faker.number.float({ min: 0.05, max: 0.3 });
        riskScore = faker.number.float({ min: 0.3, max: 0.6 });
        status = 'active';
      } else {
        // Regular learners with realistic distribution
        const rand = Math.random();
        if (rand < 0.1) {
          // 10% high risk
          progress = faker.number.float({ min: 0.05, max: 0.4 });
          riskScore = faker.number.float({ min: 0.7, max: 0.95 });
          status = 'at-risk';
        } else if (rand < 0.3) {
          // 20% medium risk
          progress = faker.number.float({ min: 0.3, max: 0.7 });
          riskScore = faker.number.float({ min: 0.5, max: 0.8 });
          status = 'active';
        } else {
          // 70% low risk
          progress = faker.number.float({ min: 0.5, max: 1.0 });
          riskScore = faker.number.float({ min: 0.1, max: 0.6 });
          status = progress >= 0.95 ? 'completed' : 'active';
        }
      }

      enrollments.push({
        courseId: course._id,
        enrollDate,
        progress,
        lastActivity: faker.date.recent({ days: 30 }),
        status,
        riskScore,
        completedModules: []
      });
    }

    const learner = new Learner({
      userId: user._id,
      enrollments,
      engagementData: {
        totalHours: faker.number.float({ min: 5, max: 150 }),
        streakDays: faker.number.int({ min: 0, max: 30 }),
        lastLogin: faker.date.recent({ days: 7 }),
        avgSessionTime: faker.number.float({ min: 15, max: 120 }),
        completionRate: faker.number.float({ min: 0.3, max: 0.9 }),
        weeklyGoalHours: faker.number.int({ min: 5, max: 20 }),
        preferredStudyTime: faker.helpers.arrayElement(['morning', 'afternoon', 'evening', 'night'])
      },
      achievements: [],
      preferences: {
        notifications: {
          email: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          sms: faker.datatype.boolean()
        },
        reminderFrequency: faker.helpers.arrayElement(['daily', 'weekly', 'bi-weekly', 'none'])
      }
    });

    learners.push(learner);
  }

  await Learner.insertMany(learners);
  console.log(`✅ Created ${learners.length} learner profiles`);

  return { users: savedUsers, learners };
};

// Generate Activities
const generateActivities = async (learners, courses) => {
  console.log('📊 Generating learning activities...');
  
  const activities = [];
  const activityTypes = [
    'video_watch', 'quiz_attempt', 'reading_complete', 
    'assignment_submit', 'forum_post', 'login', 
    'module_complete', 'peer_interaction'
  ];

  for (const learner of learners) {
    const numActivities = faker.number.int({ min: 10, max: 200 });
    
    for (let i = 0; i < numActivities; i++) {
      const enrollment = faker.helpers.arrayElement(learner.enrollments);
      const course = courses.find(c => c._id.toString() === enrollment.courseId.toString());
      
      const activity = new Activity({
        learnerId: learner._id,
        courseId: course._id,
        type: faker.helpers.arrayElement(activityTypes),
        timestamp: faker.date.between({ 
          from: enrollment.enrollDate, 
          to: new Date() 
        }),
        duration: faker.number.int({ min: 300, max: 7200 }), // 5 minutes to 2 hours
        metadata: {
          sessionId: faker.string.uuid(),
          device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
          browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
          videoProgress: faker.number.float({ min: 0.1, max: 1.0 }),
          quizScore: faker.number.int({ min: 40, max: 100 }),
          moduleId: faker.helpers.arrayElement(course.modules)?.moduleId
        },
        engagementScore: faker.number.int({ min: 20, max: 100 })
      });
      
      activities.push(activity);
    }
  }

  await Activity.insertMany(activities);
  console.log(`✅ Created ${activities.length} learning activities`);
  
  return activities;
};

// Generate Interventions
const generateInterventions = async (learners) => {
  console.log('🎯 Generating interventions...');
  
  const interventions = [];
  const interventionTypes = [
    'email_nudge', 'in_app_notification', 'study_reminder',
    'motivational_message', 'peer_connection', 'instructor_outreach'
  ];
  
  const triggers = [
    'risk_score_high', 'inactivity_detected', 'declining_performance',
    'low_engagement', 'missed_deadline'
  ];

  // Generate interventions for at-risk learners
  const atRiskLearners = learners.filter(learner => 
    learner.enrollments.some(e => e.riskScore > 0.6)
  );

  for (const learner of atRiskLearners) {
    const numInterventions = faker.number.int({ min: 1, max: 5 });
    
    for (let i = 0; i < numInterventions; i++) {
      const intervention = new Intervention({
        learnerId: learner._id,
        type: faker.helpers.arrayElement(interventionTypes),
        trigger: faker.helpers.arrayElement(triggers),
        content: {
          subject: 'We miss you in your learning journey!',
          message: faker.lorem.sentences(2),
          actionButton: {
            text: 'Continue Learning',
            url: '/dashboard'
          }
        },
        delivery: {
          sentAt: faker.date.recent({ days: 30 }),
          channel: faker.helpers.arrayElement(['email', 'in_app', 'push']),
          opened: faker.datatype.boolean(),
          clicked: faker.datatype.boolean()
        },
        effectiveness: {
          status: faker.helpers.arrayElement(['pending', 'successful', 'neutral', 'negative']),
          engagementIncrease: faker.number.float({ min: -0.2, max: 0.5 }),
          riskScoreChange: faker.number.float({ min: -0.3, max: 0.1 })
        },
        scheduling: {
          priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
          retryCount: faker.number.int({ min: 0, max: 3 })
        }
      });
      
      interventions.push(intervention);
    }
  }

  await Intervention.insertMany(interventions);
  console.log(`✅ Created ${interventions.length} interventions`);
  
  return interventions;
};

// Main function
const generateMockData = async () => {
  try {
    console.log('🚀 Starting mock data generation...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Learner.deleteMany({}),
      Course.deleteMany({}),
      Activity.deleteMany({}),
      Intervention.deleteMany({})
    ]);
    
    // Generate new data
    const courses = await generateCourses();
    const { users, learners } = await generateUsers(courses);
    const activities = await generateActivities(learners, courses);
    const interventions = await generateInterventions(learners);
    
    // Summary
    console.log('\n🎉 Mock data generation completed!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🎓 Learners: ${learners.length}`);
    console.log(`   📚 Courses: ${courses.length}`);
    console.log(`   📊 Activities: ${activities.length}`);
    console.log(`   🎯 Interventions: ${interventions.length}`);
    
    console.log('\n🔐 Demo Accounts:');
    console.log('   Admin: admin@demo.com / admin123');
    console.log('   Instructor: instructor@demo.com / instructor123');
    console.log('   High-Risk Learner: learner1@demo.com / learner123');
    console.log('   Successful Learner: learner2@demo.com / learner123');
    console.log('   New Learner: learner3@demo.com / learner123');
    
    mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  generateMockData();
}

module.exports = { generateMockData };
