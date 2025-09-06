const geminiService = require('./services/geminiService');

// Mock learner data
const mockLearnerData = {
  learner: {
    engagementData: {
      totalHours: 25,
      streakDays: 7,
      preferredStudyTime: 'morning',
      weeklyGoalHours: 15
    }
  },
  user: {
    profile: {
      name: 'Test User'
    }
  },
  activities: []
};

async function testRecommendations() {
  console.log('🧪 Testing Gemini recommendations...');
  
  try {
    const result = await geminiService.generatePersonalizedRecommendations(mockLearnerData);
    
    console.log('📊 Full result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🎯 Study schedule:');
    console.log(result.data?.recommendations?.study_schedule);
    
    console.log('\n💪 Motivation:');
    console.log(result.data?.recommendations?.motivation);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRecommendations();
