require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const sampleCourses = [
  {
    title: "Introduction to JavaScript",
    description: "Learn the fundamentals of JavaScript programming language. This course covers variables, functions, objects, and modern ES6+ features.",
    category: "Programming",
    difficulty: "beginner",
    duration: 40,
    instructor: {
      name: "Sarah Johnson",
      email: "sarah@upgrad.com",
      bio: "Senior Full Stack Developer with 8+ years of experience",
      avatar: "/avatars/sarah.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Getting Started with JavaScript",
        description: "Introduction to JavaScript syntax and basic concepts",
        duration: 2,
        order: 1,
        content: {
          videos: [
            { title: "What is JavaScript?", url: "/videos/js-intro.mp4", duration: 15 },
            { title: "Setting up Development Environment", url: "/videos/setup.mp4", duration: 20 }
          ],
          readings: [
            { title: "JavaScript History", content: "A brief history of JavaScript...", estimatedTime: 10 }
          ],
          quizzes: [
            { title: "Basic Concepts Quiz", questions: 5, passingScore: 80 }
          ]
        }
      },
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Variables and Data Types",
        description: "Understanding variables, data types, and operators",
        duration: 3,
        order: 2,
        content: {
          videos: [
            { title: "Variables in JavaScript", url: "/videos/variables.mp4", duration: 25 },
            { title: "Data Types Explained", url: "/videos/datatypes.mp4", duration: 30 }
          ],
          assignments: [
            { title: "Variable Practice", description: "Create variables of different types", maxScore: 100 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 1250,
      avgRating: 4.7,
      totalRatings: 340,
      completionRate: 0.78
    },
    featured: true
  },
  {
    title: "React.js for Beginners",
    description: "Master React.js and build modern web applications. Learn components, state management, and hooks.",
    category: "Web Development",
    difficulty: "intermediate",
    duration: 60,
    instructor: {
      name: "Mike Chen",
      email: "mike@upgrad.com",
      bio: "React specialist and Frontend Architect",
      avatar: "/avatars/mike.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "React Fundamentals",
        description: "Understanding React components and JSX",
        duration: 4,
        order: 1,
        content: {
          videos: [
            { title: "What is React?", url: "/videos/react-intro.mp4", duration: 20 },
            { title: "Components and JSX", url: "/videos/jsx.mp4", duration: 35 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 890,
      avgRating: 4.8,
      totalRatings: 245,
      completionRate: 0.82
    },
    featured: true
  },
  {
    title: "Python Data Science Bootcamp",
    description: "Comprehensive data science course using Python. Learn pandas, NumPy, matplotlib, and machine learning basics.",
    category: "Data Science",
    difficulty: "intermediate",
    duration: 80,
    instructor: {
      name: "Dr. Emily Rodriguez",
      email: "emily@upgrad.com",
      bio: "Data Scientist with PhD in Statistics",
      avatar: "/avatars/emily.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Python for Data Science",
        description: "Setting up Python environment and basic libraries",
        duration: 5,
        order: 1,
        content: {
          videos: [
            { title: "Python Environment Setup", url: "/videos/python-setup.mp4", duration: 25 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 756,
      avgRating: 4.9,
      totalRatings: 189,
      completionRate: 0.71
    },
    featured: true
  },
  {
    title: "Mobile App Development with Flutter",
    description: "Build cross-platform mobile apps using Flutter and Dart. Learn widgets, state management, and app deployment.",
    category: "Mobile Development",
    difficulty: "intermediate",
    duration: 70,
    instructor: {
      name: "Alex Kumar",
      email: "alex@upgrad.com",
      bio: "Mobile Development Expert and Flutter GDE",
      avatar: "/avatars/alex.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Flutter Basics",
        description: "Introduction to Flutter framework and Dart language",
        duration: 4,
        order: 1,
        content: {
          videos: [
            { title: "What is Flutter?", url: "/videos/flutter-intro.mp4", duration: 30 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 432,
      avgRating: 4.6,
      totalRatings: 97,
      completionRate: 0.68
    }
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Introduction to machine learning concepts, algorithms, and practical implementation using Python and scikit-learn.",
    category: "AI/ML",
    difficulty: "advanced",
    duration: 100,
    instructor: {
      name: "Prof. David Thompson",
      email: "david@upgrad.com",
      bio: "ML Researcher and Professor at Stanford",
      avatar: "/avatars/david.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Introduction to ML",
        description: "Understanding machine learning concepts and types",
        duration: 6,
        order: 1,
        content: {
          videos: [
            { title: "What is Machine Learning?", url: "/videos/ml-intro.mp4", duration: 40 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 623,
      avgRating: 4.8,
      totalRatings: 156,
      completionRate: 0.59
    },
    featured: true
  },
  {
    title: "UI/UX Design Principles",
    description: "Learn design thinking, user research, wireframing, and prototyping. Create beautiful and functional user interfaces.",
    category: "Design",
    difficulty: "beginner",
    duration: 45,
    instructor: {
      name: "Lisa Wang",
      email: "lisa@upgrad.com",
      bio: "Senior UX Designer at Google",
      avatar: "/avatars/lisa.jpg"
    },
    modules: [
      {
        moduleId: new mongoose.Types.ObjectId(),
        title: "Design Thinking",
        description: "Understanding user-centered design principles",
        duration: 3,
        order: 1,
        content: {
          videos: [
            { title: "Introduction to Design Thinking", url: "/videos/design-thinking.mp4", duration: 35 }
          ]
        }
      }
    ],
    stats: {
      totalEnrolled: 845,
      avgRating: 4.7,
      totalRatings: 221,
      completionRate: 0.74
    }
  }
];

async function populateCourses() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('🗑️ Cleared existing courses');

    // Insert sample courses
    const courses = await Course.insertMany(sampleCourses);
    console.log(`✅ Added ${courses.length} courses to database`);

    console.log('\n📚 Courses added:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (${course.category})`);
    });

    console.log('\n🎉 Course population completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating courses:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  populateCourses();
}
