const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    this.initializeGemini();
  }

  async initializeGemini() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      this.isInitialized = true;
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
    }
  }

  async analyzeLearnerRisk(learnerData) {
    if (!this.isInitialized) {
      return this.getFallbackRiskScore(learnerData);
    }

    try {
      const { learner, user, activities } = learnerData;
      
      const prompt = `
Analyze learner engagement data and provide risk score (0-1, where 1 is highest dropout risk):

LEARNER PROFILE:
- Name: ${user.profile?.name || 'Unknown'}
- Join Date: ${user.profile?.joinDate || 'Unknown'}
- Total Learning Hours: ${learner.engagementData?.totalHours || 0}
- Learning Streak: ${learner.engagementData?.streakDays || 0} days
- Last Login: ${learner.engagementData?.lastLogin || 'Unknown'}
- Completion Rate: ${(learner.engagementData?.completionRate || 0) * 100}%

ENROLLMENT DATA:
- Total Courses: ${learner.enrollments?.length || 0}
- Active Courses: ${learner.enrollments?.filter(e => e.status === 'active').length || 0}
- Completed Courses: ${learner.enrollments?.filter(e => e.status === 'completed').length || 0}
- At-Risk Courses: ${learner.enrollments?.filter(e => e.status === 'at-risk').length || 0}

RECENT ACTIVITY:
- Total Activities: ${activities?.length || 0}
- Recent Activities (last 7 days): ${this.getRecentActivitiesCount(activities)}
- Activity Types: ${this.getActivityTypes(activities)}

Please analyze this data and respond with a JSON object containing:
{
  "risk_score": (number between 0-1),
  "risk_level": ("low", "medium", or "high"),
  "risk_factors": [array of specific risk factors identified],
  "recommendations": [array of specific actionable recommendations],
  "explanation": "detailed explanation of the risk assessment",
  "confidence": (number between 0-1 indicating confidence in assessment)
}

Focus on patterns like:
- Declining engagement trends
- Long periods of inactivity
- Low completion rates
- Inconsistent learning patterns
- Course difficulty vs learner progress
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          data: {
            ...analysis,
            model_status: 'gemini_ai',
            timestamp: new Date().toISOString()
          }
        };
      } else {
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Gemini risk analysis failed:', error.message);
      return this.getFallbackRiskScore(learnerData);
    }
  }

  async generatePersonalizedRecommendations(learnerData) {
    if (!this.isInitialized) {
      return this.getFallbackRecommendations(learnerData);
    }

    try {
      const { learner, user, activities } = learnerData;
      
      const prompt = `
Generate comprehensive personalized learning recommendations for this learner:

LEARNER PROFILE:
- Name: ${user.profile?.name || 'Unknown'}
- Learning Hours: ${learner.engagementData?.totalHours || 0}
- Streak: ${learner.engagementData?.streakDays || 0} days
- Preferred Study Time: ${learner.engagementData?.preferredStudyTime || 'evening'}
- Weekly Goal: ${learner.engagementData?.weeklyGoalHours || 10} hours

RECENT ACTIVITIES:
${activities.slice(0, 5).map(activity => `- ${activity.type}: ${activity.description} (Score: ${activity.score || 'N/A'})`).join('\n')}

Provide comprehensive recommendations in this EXACT JSON format:
{
  "study_schedule": {
    "optimal_time": "specific time recommendation",
    "session_duration": "recommended duration",
    "frequency": "how often to study"
  },
  "learning_path": [
    {
      "action": "specific actionable step",
      "priority": "high/medium/low",
      "reason": "explanation why this matters"
    }
  ],
  "motivation": {
    "strength": "their key learning strength",
    "encouragement": "personalized motivational message"
  },
  "resources": [
    {
      "type": "resource type",
      "title": "resource name",
      "description": "why this resource helps"
    }
  ],
  "smart_insights": {
    "learning_style": "detailed analysis of their learning style and preferences",
    "improvement_areas": ["specific area to improve", "another area"],
    "success_predictions": ["positive prediction about their learning journey", "another prediction"],
    "weekly_goals": ["specific goal for this week", "another weekly goal"]
  }
}

Be specific, actionable, and encouraging. Focus on their unique learning patterns and provide practical advice they can implement immediately.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          success: true,
          data: {
            recommendations: JSON.parse(jsonMatch[0])
          }
        };
      } else {
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Gemini recommendations failed:', error.message);
      return this.getFallbackRecommendations(learnerData);
    }
  }

  async generateAdminInsights(platformData) {
    if (!this.isInitialized) {
      return this.getFallbackAdminInsights(platformData);
    }

    try {
      const prompt = `
Provide admin insights on platform performance based on this data:

PLATFORM METRICS:
- Total Learners: ${platformData.totalLearners || 0}
- Active Learners Today: ${platformData.activeToday || 0}
- Total Courses: ${platformData.totalCourses || 0}
- Total Activities: ${platformData.totalActivities || 0}

RISK DISTRIBUTION:
- High Risk: ${platformData.highRisk || 0} learners
- Medium Risk: ${platformData.mediumRisk || 0} learners
- Low Risk: ${platformData.lowRisk || 0} learners

ENGAGEMENT TRENDS:
- Weekly Activity Growth: ${platformData.weeklyGrowth || 0}%
- Average Session Time: ${platformData.avgSessionTime || 0} minutes
- Course Completion Rate: ${platformData.completionRate || 0}%

Generate strategic insights in JSON format:
{
  "overall_health": {
    "score": (0-100),
    "status": "excellent/good/concerning/critical",
    "summary": "brief platform health summary"
  },
  "key_insights": [
    {
      "category": "engagement/retention/growth/quality",
      "insight": "specific insight",
      "impact": "high/medium/low",
      "action_required": "recommended action"
    }
  ],
  "intervention_priorities": [
    {
      "priority": "immediate/high/medium/low",
      "focus_area": "specific area to focus on",
      "expected_impact": "what improvement to expect",
      "suggested_action": "concrete action to take"
    }
  ],
  "success_indicators": [
    "positive trends or achievements to highlight"
  ],
  "recommendations": [
    {
      "timeframe": "immediate/short-term/long-term",
      "action": "specific recommendation",
      "rationale": "why this is important"
    }
  ]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          success: true,
          data: JSON.parse(jsonMatch[0])
        };
      } else {
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Gemini admin insights failed:', error.message);
      return this.getFallbackAdminInsights(platformData);
    }
  }

  async generateInterventionSuggestions(learnerData, riskLevel) {
    if (!this.isInitialized) {
      return this.getFallbackInterventions(riskLevel);
    }

    try {
      const prompt = `
Suggest specific interventions for an at-risk learner:

RISK LEVEL: ${riskLevel}
LEARNER CONTEXT:
- Learning Hours: ${learnerData.learner?.engagementData?.totalHours || 0}
- Streak: ${learnerData.learner?.engagementData?.streakDays || 0} days
- Last Activity: ${learnerData.learner?.engagementData?.lastLogin || 'Unknown'}
- Active Courses: ${learnerData.learner?.enrollments?.filter(e => e.status === 'active').length || 0}

Generate intervention suggestions in JSON format:
{
  "immediate_actions": [
    {
      "type": "email/notification/call/peer_connection",
      "title": "intervention title",
      "message": "specific message to send",
      "timing": "when to send (e.g., within 2 hours)"
    }
  ],
  "follow_up_actions": [
    {
      "type": "intervention type",
      "title": "follow-up title",
      "message": "follow-up message",
      "timing": "when to follow up"
    }
  ],
  "success_metrics": [
    "how to measure if intervention worked"
  ],
  "escalation_plan": {
    "trigger": "when to escalate",
    "action": "what to do if initial intervention fails"
  }
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          success: true,
          data: JSON.parse(jsonMatch[0])
        };
      } else {
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Gemini intervention suggestions failed:', error.message);
      return this.getFallbackInterventions(riskLevel);
    }
  }

  // Helper methods
  getRecentActivitiesCount(activities) {
    if (!activities) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return activities.filter(a => new Date(a.timestamp) > sevenDaysAgo).length;
  }

  getActivityTypes(activities) {
    if (!activities || activities.length === 0) return 'None';
    const types = [...new Set(activities.map(a => a.type))];
    return types.join(', ');
  }

  getActivityLevel(activities) {
    const recentCount = this.getRecentActivitiesCount(activities);
    if (recentCount >= 10) return 'High';
    if (recentCount >= 5) return 'Medium';
    if (recentCount >= 1) return 'Low';
    return 'Inactive';
  }

  // Fallback methods when Gemini is unavailable
  getFallbackRiskScore(learnerData) {
    const { learner, activities } = learnerData;
    let riskScore = 0;

    // Basic heuristic calculation
    const daysSinceLogin = Math.floor((new Date() - new Date(learner.engagementData?.lastLogin || new Date())) / (1000 * 60 * 60 * 24));
    if (daysSinceLogin > 14) riskScore += 0.4;
    else if (daysSinceLogin > 7) riskScore += 0.2;

    const completionRate = learner.engagementData?.completionRate || 0;
    if (completionRate < 0.3) riskScore += 0.3;
    else if (completionRate < 0.6) riskScore += 0.15;

    const recentActivities = this.getRecentActivitiesCount(activities);
    if (recentActivities === 0) riskScore += 0.3;
    else if (recentActivities < 3) riskScore += 0.15;

    riskScore = Math.min(riskScore, 1.0);
    const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';

    return {
      success: false,
      data: {
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: ['Heuristic calculation - Gemini unavailable'],
        recommendations: ['Complete next module', 'Maintain learning streak'],
        explanation: 'Risk calculated using basic heuristics due to AI service unavailability',
        confidence: 0.6,
        model_status: 'fallback_heuristic'
      }
    };
  }

  getFallbackRecommendations(learnerData) {
    return {
      success: false,
      data: {
        recommendations: {
          study_schedule: {
            optimal_time: 'evening',
            session_duration: '45 minutes',
            frequency: 'daily'
          },
          learning_path: [
            {
              action: 'Complete next module in active course',
              priority: 'high',
              reason: 'Maintain learning momentum'
            }
          ],
          motivation: {
            strength: 'Consistent learner',
            encouragement: 'Keep up the great work!'
          },
          resources: [
            {
              type: 'guide',
              title: 'Study Tips',
              description: 'Effective learning strategies'
            }
          ],
          smart_insights: {
            learning_style: 'You appear to be a structured learner who benefits from regular study sessions',
            improvement_areas: ['Time management', 'Active recall techniques'],
            success_predictions: ['With consistent effort, you\'ll master your current topics within 2 weeks'],
            weekly_goals: ['Complete 3 modules this week', 'Practice daily for 45 minutes']
          }
        }
      }
    };
  }

  getFallbackAdminInsights(platformData) {
    return {
      success: false,
      data: {
        overall_health: {
          score: 75,
          status: 'good',
          summary: 'Platform operating normally'
        },
        key_insights: [
          {
            category: 'engagement',
            insight: 'Standard engagement patterns observed',
            impact: 'medium',
            action_required: 'Continue monitoring'
          }
        ],
        intervention_priorities: [],
        success_indicators: [],
        recommendations: []
      }
    };
  }

  getFallbackInterventions(riskLevel) {
    const interventions = {
      high: {
        immediate_actions: [
          {
            type: 'email',
            title: 'Re-engagement Support',
            message: 'We noticed you might need some support. Let\'s get back on track together!',
            timing: 'within 2 hours'
          }
        ]
      },
      medium: {
        immediate_actions: [
          {
            type: 'notification',
            title: 'Learning Check-in',
            message: 'How is your learning journey going? Complete your next module to stay on track.',
            timing: 'within 24 hours'
          }
        ]
      },
      low: {
        immediate_actions: [
          {
            type: 'notification',
            title: 'Keep it up!',
            message: 'Great progress! Continue with your next learning milestone.',
            timing: 'next study session'
          }
        ]
      }
    };

    return {
      success: false,
      data: interventions[riskLevel] || interventions.medium
    };
  }

  async isHealthy() {
    return this.isInitialized;
  }
}

module.exports = new GeminiService();
