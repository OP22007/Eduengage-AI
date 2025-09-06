const axios = require('axios');
const geminiService = require('./geminiService');

class MLService {
  constructor(mlServiceUrl = 'http://localhost:8000') {
    this.mlServiceUrl = mlServiceUrl;
  }

  async isHealthy() {
    // Check Gemini service health first
    const geminiHealthy = await geminiService.isHealthy();
    if (geminiHealthy) {
      return true;
    }

    // Fallback to original ML service
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, { timeout: 5000 });
      return response.data.status === 'ok';
    } catch (error) {
      console.error('ML Service health check failed:', error.message);
      return false;
    }
  }

  async predictRisk(learnerData) {
    try {
      // Use Gemini service for risk prediction
      const geminiResult = await geminiService.analyzeLearnerRisk(learnerData);
      
      if (geminiResult.success) {
        return {
          success: true,
          data: {
            risk_score: geminiResult.data.risk_score,
            risk_class: geminiResult.data.risk_score > 0.5 ? 1 : 0,
            risk_level: geminiResult.data.risk_level,
            risk_factors: geminiResult.data.risk_factors,
            recommendations: geminiResult.data.recommendations,
            explanation: geminiResult.data.explanation,
            confidence: geminiResult.data.confidence,
            model_status: geminiResult.data.model_status,
            ai_powered: true
          }
        };
      }

      // Fallback to original ML service
      const response = await axios.post(`${this.mlServiceUrl}/predict`, learnerData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('AI prediction failed:', error.message);
      
      // Ultimate fallback to heuristic calculation
      return {
        success: false,
        data: this.calculateFallbackRisk(learnerData),
        fallback: true
      };
    }
  }

  async batchPredict(learnersData) {
    try {
      // Use Gemini for batch predictions
      const predictions = await Promise.all(
        learnersData.map(async (learnerData) => {
          const result = await geminiService.analyzeLearnerRisk(learnerData);
          return result.success ? result.data : this.calculateFallbackRisk(learnerData);
        })
      );
      
      return {
        success: true,
        data: predictions
      };
    } catch (error) {
      console.error('Batch prediction failed:', error.message);
      
      // Fallback to individual predictions
      const predictions = learnersData.map(data => this.calculateFallbackRisk(data));
      return {
        success: false,
        data: predictions,
        fallback: true
      };
    }
  }

  async getPersonalizedRecommendations(learnerData) {
    try {
      const result = await geminiService.generatePersonalizedRecommendations(learnerData);
      return result;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error.message);
      return {
        success: false,
        data: {
          study_schedule: { optimal_time: 'evening', session_duration: '45 minutes', frequency: 'daily' },
          learning_path: [{ action: 'Complete next module', priority: 'high', reason: 'Maintain momentum' }],
          motivation: { strength: 'Consistent learner', encouragement: 'Keep going!' },
          resources: []
        }
      };
    }
  }

  async getAdminInsights(platformData) {
    try {
      const result = await geminiService.generateAdminInsights(platformData);
      return result;
    } catch (error) {
      console.error('Failed to get admin insights:', error.message);
      return {
        success: false,
        data: {
          overall_health: { score: 75, status: 'good', summary: 'Platform operating normally' },
          key_insights: [],
          intervention_priorities: [],
          recommendations: []
        }
      };
    }
  }

  async getInterventionSuggestions(learnerData, riskLevel) {
    try {
      const result = await geminiService.generateInterventionSuggestions(learnerData, riskLevel);
      return result;
    } catch (error) {
      console.error('Failed to get intervention suggestions:', error.message);
      return {
        success: false,
        data: {
          immediate_actions: [],
          follow_up_actions: [],
          success_metrics: [],
          escalation_plan: {}
        }
      };
    }
  }

  calculateFallbackRisk(learnerData) {
    const { learner, user, activities } = learnerData;
    
    let riskScore = 0;
    const now = new Date();
    
    // Check last login
    const lastLogin = new Date(learner.engagementData?.lastLogin || now);
    const daysSinceLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin > 14) riskScore += 0.3;
    else if (daysSinceLogin > 7) riskScore += 0.15;
    
    // Check progress
    const enrollments = learner.enrollments || [];
    if (enrollments.length > 0) {
      const avgProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length;
      if (avgProgress < 0.2) riskScore += 0.25;
      else if (avgProgress < 0.5) riskScore += 0.1;
      
      // Check for at-risk courses
      const atRiskCourses = enrollments.filter(e => e.status === 'at-risk').length;
      if (atRiskCourses > 0) riskScore += 0.25;
    }
    
    // Check recent activities
    const recentActivities = activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      const daysAgo = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
      return daysAgo <= 7;
    }).length;
    
    if (recentActivities === 0) riskScore += 0.2;
    else if (recentActivities < 3) riskScore += 0.1;
    
    // Check streak
    const streakDays = learner.engagementData?.streakDays || 0;
    if (streakDays === 0) riskScore += 0.15;
    
    riskScore = Math.min(riskScore, 1.0);
    
    const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';
    
    return {
      risk_score: riskScore,
      risk_class: riskScore > 0.5 ? 1 : 0,
      risk_level: riskLevel,
      model_status: 'fallback_heuristic'
    };
  }

  async getModelInfo() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/model_info`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error.message);
      return { model_loaded: false, error: error.message };
    }
  }
}

module.exports = MLService;
