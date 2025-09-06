const axios = require('axios');

class MLService {
  constructor(mlServiceUrl = 'http://localhost:8000') {
    this.mlServiceUrl = mlServiceUrl;
  }

  async isHealthy() {
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
      const response = await axios.post(`${this.mlServiceUrl}/predict`, learnerData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('ML prediction failed:', error.message);
      
      // Fallback to heuristic risk calculation
      return {
        success: false,
        data: this.calculateFallbackRisk(learnerData),
        fallback: true
      };
    }
  }

  async batchPredict(learnersData) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/batch_predict`, {
        learners: learnersData
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        success: true,
        data: response.data.predictions
      };
    } catch (error) {
      console.error('ML batch prediction failed:', error.message);
      
      // Fallback to individual predictions
      const predictions = learnersData.map(data => this.calculateFallbackRisk(data));
      return {
        success: false,
        data: predictions,
        fallback: true
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
