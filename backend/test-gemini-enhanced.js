const geminiService = require('./services/geminiService');

// Mock learner data for testing
const mockLearnerData = {
  learner: {
    engagementData: {
      totalHours: 25,
      streakDays: 7,
      preferredStudyTime: 'morning',
      weeklyGoalHours: 15
    },
    enrollments: [
      { status: 'active', progress: 0.6 },
      { status: 'active', progress: 0.3 }
    ]
  },
  user: {
    profile: {
      name: 'John Doe'
    }
  },
  activities: [
    { type: 'video_watch', description: 'JavaScript Fundamentals', score: 85 },
    { type: 'quiz', description: 'React Components Quiz', score: 92 },
    { type: 'assignment', description: 'Build a Todo App', score: 78 }
  ]
};

async function testEnhancedRecommendations() {
  console.log('🚀 Testing Enhanced Gemini Recommendations...');
  
  try {
    console.log('📊 Generating recommendations with smart insights...');
    const result = await geminiService.generatePersonalizedRecommendations(mockLearnerData);
    
    console.log('✅ Result:', JSON.stringify(result, null, 2));
    
    // Validate the structure
    if (result.data?.recommendations?.smart_insights) {
      console.log('🎯 Smart insights structure validated!');
      console.log('- Learning Style:', result.data.recommendations.smart_insights.learning_style);
      console.log('- Improvement Areas:', result.data.recommendations.smart_insights.improvement_areas);
      console.log('- Success Predictions:', result.data.recommendations.smart_insights.success_predictions);
      console.log('- Weekly Goals:', result.data.recommendations.smart_insights.weekly_goals);
    } else {
      console.log('⚠️ Using fallback recommendations (Gemini API not available)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedRecommendations();
