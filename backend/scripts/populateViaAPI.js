const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Demo accounts with their tokens
const demoAccounts = [
  { email: 'learner1@demo.com', password: 'password' },
  { email: 'learner2@demo.com', password: 'password' },
  { email: 'learner3@demo.com', password: 'password' },
  { email: 'instructor1@demo.com', password: 'password' },
  { email: 'admin1@demo.com', password: 'password' }
];

// Function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    return response.data.data.token;
  } catch (error) {
    console.error(`Failed to login ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Function to get courses
async function getCourses() {
  try {
    const response = await axios.get(`${API_BASE}/courses`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get courses:', error.response?.data?.message || error.message);
    return [];
  }
}

// Function to enroll in course
async function enrollInCourse(token, courseId) {
  try {
    const response = await axios.post(`${API_BASE}/courses/${courseId}/enroll`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to enroll in course ${courseId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Function to update progress
async function updateProgress(token, courseId, progress, moduleId = null) {
  try {
    const data = { progress };
    if (moduleId) {
      data.moduleId = moduleId;
      data.completed = true;
    }
    
    const response = await axios.post(`${API_BASE}/courses/${courseId}/progress`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update progress for course ${courseId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Function to get course details including modules
async function getCourseDetails(token, courseId) {
  try {
    const response = await axios.get(`${API_BASE}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to get course details ${courseId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function populateRandomEnrollments() {
  try {
    console.log('Starting random enrollment population via API...');

    // Get all courses first
    const courses = await getCourses();
    if (courses.length === 0) {
      console.error('No courses found!');
      return;
    }

    console.log(`Found ${courses.length} courses`);

    // Process only learner accounts
    const learnerAccounts = demoAccounts.filter(acc => acc.email.includes('learner'));
    
    for (const account of learnerAccounts) {
      console.log(`\nProcessing ${account.email}...`);
      
      // Login to get token
      const token = await login(account.email, account.password);
      if (!token) {
        console.log(`Skipping ${account.email} - login failed`);
        continue;
      }

      // Randomly select 1-3 courses to enroll in
      const numEnrollments = Math.floor(Math.random() * 3) + 1;
      const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numEnrollments);

      for (const course of selectedCourses) {
        console.log(`  Enrolling in: ${course.title}`);
        
        // Enroll in course
        const enrollment = await enrollInCourse(token, course._id);
        if (!enrollment) {
          console.log(`    Failed to enroll in ${course.title}`);
          continue;
        }

        // Get course details to know about modules
        const courseDetails = await getCourseDetails(token, course._id);
        if (!courseDetails || !courseDetails.modules) {
          console.log(`    No modules found for ${course.title}`);
          continue;
        }

        const modules = courseDetails.modules;
        const totalModules = modules.length;
        
        if (totalModules === 0) {
          console.log(`    No modules in ${course.title}`);
          continue;
        }

        // Generate random progress (0-100%)
        const progressPercentage = Math.floor(Math.random() * 101);
        console.log(`    Setting progress to ${progressPercentage}%`);

        // Calculate how many modules should be completed
        const completedModuleCount = Math.floor((progressPercentage / 100) * totalModules);

        // Update progress by completing modules one by one
        for (let i = 0; i < completedModuleCount; i++) {
          if (modules[i]) {
            await updateProgress(token, course._id, ((i + 1) / totalModules) * 100, modules[i]._id);
            console.log(`    Completed module ${i + 1}/${totalModules}: ${modules[i].title}`);
          }
        }

        // Set final progress if different from module-based progress
        if (progressPercentage !== (completedModuleCount / totalModules) * 100) {
          await updateProgress(token, course._id, progressPercentage);
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n✅ Random enrollment population completed!');

    // Verify enrollments
    console.log('\n📊 Enrollment Summary:');
    for (const account of learnerAccounts) {
      const token = await login(account.email, account.password);
      if (token) {
        try {
          const response = await axios.get(`${API_BASE}/courses/enrolled`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const enrolledCourses = response.data.data;
          
          console.log(`\n${account.email} (${enrolledCourses.length} enrollments):`);
          for (const course of enrolledCourses) {
            console.log(`  - ${course.title}: ${course.progress}% (${course.status})`);
          }
        } catch (error) {
          console.log(`Failed to get enrollments for ${account.email}`);
        }
      }
    }

  } catch (error) {
    console.error('Error populating enrollments:', error);
  }
}

// Run the script
populateRandomEnrollments();
