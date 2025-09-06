const Learner = require('../models/Learner');
const Activity = require('../models/Activity');
const DailyRiskTracking = require('../models/DailyRiskTracking');
const geminiService = require('./geminiService');

class RiskTrackingService {
  
  // Calculate individual learner risk score
  async calculateLearnerRiskScore(learnerId) {
    try {
      const learner = await Learner.findById(learnerId).populate('userId');
      if (!learner) {
        throw new Error('Learner not found');
      }

      // Get recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activities = await Activity.find({
        learnerId: learnerId,
        timestamp: { $gte: thirtyDaysAgo }
      }).sort({ timestamp: -1 });

      // Calculate basic metrics
      const metrics = this.calculateBasicMetrics(learner, activities);
      
      // Get Gemini AI risk analysis
      const geminiAnalysis = await geminiService.analyzeLearnerRisk({
        learner,
        user: learner.userId,
        activities
      });

      // Combine heuristic and AI analysis
      const finalRiskScore = this.combineRiskScores(metrics.heuristicScore, geminiAnalysis);
      
      return {
        learnerId,
        riskScore: finalRiskScore.score,
        riskLevel: finalRiskScore.level,
        factors: finalRiskScore.factors,
        recommendations: finalRiskScore.recommendations,
        confidence: finalRiskScore.confidence,
        metrics,
        lastCalculated: new Date()
      };
    } catch (error) {
      console.error('Error calculating learner risk score:', error);
      throw error;
    }
  }

  // Calculate basic heuristic metrics
  calculateBasicMetrics(learner, activities) {
    const now = new Date();
    let score = 0;
    const factors = [];

    // 1. Days since last login (40% weight)
    const lastLogin = learner.engagementData?.lastLogin || learner.userId?.profile?.joinDate;
    if (lastLogin) {
      const daysSinceLogin = Math.floor((now - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin > 14) {
        score += 0.4;
        factors.push(`No activity for ${daysSinceLogin} days`);
      } else if (daysSinceLogin > 7) {
        score += 0.2;
        factors.push(`Limited activity in last ${daysSinceLogin} days`);
      }
    }

    // 2. Completion rate (25% weight)
    const completionRate = learner.engagementData?.completionRate || 0;
    if (completionRate < 0.3) {
      score += 0.25;
      factors.push(`Low completion rate: ${Math.round(completionRate * 100)}%`);
    } else if (completionRate < 0.6) {
      score += 0.15;
      factors.push(`Below average completion rate: ${Math.round(completionRate * 100)}%`);
    }

    // 3. Recent activity frequency (20% weight)
    const recentActivities = activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return activityDate >= sevenDaysAgo;
    });

    if (recentActivities.length === 0) {
      score += 0.2;
      factors.push('No recent learning activity');
    } else if (recentActivities.length < 3) {
      score += 0.1;
      factors.push('Very low recent activity');
    }

    // 4. Learning streak (10% weight)
    const streakDays = learner.engagementData?.streakDays || 0;
    if (streakDays === 0) {
      score += 0.1;
      factors.push('No current learning streak');
    } else if (streakDays < 3) {
      score += 0.05;
    }

    // 5. Course engagement (5% weight)
    const activeCourses = learner.enrollments?.filter(e => e.status === 'active').length || 0;
    if (activeCourses === 0) {
      score += 0.05;
      factors.push('No active course enrollments');
    }

    return {
      heuristicScore: Math.min(score, 1.0),
      factors,
      completionRate,
      recentActivityCount: recentActivities.length,
      streakDays,
      activeCourses
    };
  }

  // Combine heuristic and AI scores
  combineRiskScores(heuristicScore, geminiAnalysis) {
    let finalScore = heuristicScore;
    let confidence = 0.7; // Base confidence for heuristic
    let factors = [];
    let recommendations = [];

    if (geminiAnalysis.success && geminiAnalysis.data) {
      const aiScore = geminiAnalysis.data.risk_score || heuristicScore;
      const aiConfidence = geminiAnalysis.data.confidence || 0.5;
      
      // Weighted average based on confidence levels
      if (aiConfidence > 0.7) {
        // High AI confidence - use 70% AI, 30% heuristic
        finalScore = (aiScore * 0.7) + (heuristicScore * 0.3);
        confidence = Math.max(aiConfidence, confidence);
      } else {
        // Low AI confidence - use 30% AI, 70% heuristic
        finalScore = (aiScore * 0.3) + (heuristicScore * 0.7);
      }

      factors = geminiAnalysis.data.risk_factors || [];
      recommendations = geminiAnalysis.data.recommendations || [];
    }

    // Determine risk level
    let level = 'low';
    if (finalScore >= 0.7) level = 'high';
    else if (finalScore >= 0.4) level = 'medium';

    return {
      score: Math.min(finalScore, 1.0),
      level,
      factors,
      recommendations,
      confidence
    };
  }

  // Update all learner risk scores
  async updateAllRiskScores() {
    try {
      console.log('Starting daily risk score update...');
      
      const learners = await Learner.find({}).populate('userId');
      const results = [];

      for (const learner of learners) {
        try {
          const riskData = await this.calculateLearnerRiskScore(learner._id);
          
          // Update learner's enrollments with new risk scores
          for (let enrollment of learner.enrollments) {
            enrollment.riskScore = riskData.riskScore;
            enrollment.lastRiskUpdate = new Date();
          }
          
          await learner.save();
          results.push(riskData);
          
          // Add delay to avoid overwhelming Gemini API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error updating risk for learner ${learner._id}:`, error);
          results.push({
            learnerId: learner._id,
            error: error.message,
            riskScore: 0.5 // Default fallback
          });
        }
      }

      console.log(`Updated risk scores for ${results.length} learners`);
      return results;
    } catch (error) {
      console.error('Error in updateAllRiskScores:', error);
      throw error;
    }
  }

  // Calculate and store daily risk distribution
  async calculateDailyRiskDistribution() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all learners with their current risk scores
      const learners = await Learner.find({});
      const totalLearners = learners.length;
      
      let high = 0, medium = 0, low = 0;
      let totalRiskScore = 0;
      
      for (const learner of learners) {
        if (learner.enrollments && learner.enrollments.length > 0) {
          // Calculate average risk score across all enrollments
          const avgRisk = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length;
          totalRiskScore += avgRisk;
          
          if (avgRisk >= 0.7) high++;
          else if (avgRisk >= 0.4) medium++;
          else low++;
        } else {
          low++; // No enrollments = low risk
        }
      }

      const averageRiskScore = totalLearners > 0 ? totalRiskScore / totalLearners : 0;
      
      // Calculate trends if previous data exists
      let dailyChange = { high: 0, medium: 0, low: 0 };
      let weeklyChange = { high: 0, medium: 0, low: 0 };
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const yesterdayData = await DailyRiskTracking.findOne({ date: yesterday });
      const weekAgoData = await DailyRiskTracking.findOne({ date: weekAgo });
      
      if (yesterdayData) {
        dailyChange = {
          high: high - yesterdayData.riskDistribution.high,
          medium: medium - yesterdayData.riskDistribution.medium,
          low: low - yesterdayData.riskDistribution.low
        };
      }
      
      if (weekAgoData) {
        weeklyChange = {
          high: high - weekAgoData.riskDistribution.high,
          medium: medium - weekAgoData.riskDistribution.medium,
          low: low - weekAgoData.riskDistribution.low
        };
      }

      // Get Gemini analysis for platform-wide risk trends
      const geminiAnalysis = await this.getGeminiRiskAnalysis({
        totalLearners,
        riskDistribution: { high, medium, low },
        averageRiskScore,
        dailyChange,
        weeklyChange
      });

      const trackingData = {
        date: today,
        totalLearners,
        riskDistribution: { high, medium, low },
        averageRiskScore,
        riskTrends: { dailyChange, weeklyChange },
        geminiAnalysis: geminiAnalysis.success ? {
          riskFactors: geminiAnalysis.data.risk_factors || [],
          recommendations: geminiAnalysis.data.recommendations || [],
          actionItems: geminiAnalysis.data.action_items || [],
          confidence: geminiAnalysis.data.confidence || 0.5
        } : {
          riskFactors: ['Gemini analysis unavailable'],
          recommendations: ['Monitor risk distribution manually'],
          actionItems: ['Check individual learner progress'],
          confidence: 0.3
        },
        lastUpdated: new Date()
      };

      // Use findOneAndUpdate with upsert to avoid duplicate key errors
      const result = await DailyRiskTracking.findOneAndUpdate(
        { date: today },
        { $set: trackingData },
        { 
          upsert: true, 
          new: true, 
          setDefaultsOnInsert: true 
        }
      );

      console.log(`Daily risk tracking ${result.isNew ? 'created' : 'updated'} for ${today.toDateString()}`);
      return result;
    } catch (error) {
      console.error('Error calculating daily risk distribution:', error);
      throw error;
    }
  }

  // Get Gemini analysis for platform-wide risk trends
  async getGeminiRiskAnalysis(data) {
    try {
      const prompt = `
Analyze platform-wide learner risk distribution and provide insights:

CURRENT METRICS:
- Total Learners: ${data.totalLearners}
- High Risk: ${data.riskDistribution.high} (${((data.riskDistribution.high / data.totalLearners) * 100).toFixed(1)}%)
- Medium Risk: ${data.riskDistribution.medium} (${((data.riskDistribution.medium / data.totalLearners) * 100).toFixed(1)}%)
- Low Risk: ${data.riskDistribution.low} (${((data.riskDistribution.low / data.totalLearners) * 100).toFixed(1)}%)
- Average Risk Score: ${data.averageRiskScore.toFixed(3)}

DAILY CHANGES:
- High Risk: ${data.dailyChange.high > 0 ? '+' : ''}${data.dailyChange.high}
- Medium Risk: ${data.dailyChange.medium > 0 ? '+' : ''}${data.dailyChange.medium}
- Low Risk: ${data.dailyChange.low > 0 ? '+' : ''}${data.dailyChange.low}

WEEKLY TRENDS:
- High Risk: ${data.weeklyChange.high > 0 ? '+' : ''}${data.weeklyChange.high}
- Medium Risk: ${data.weeklyChange.medium > 0 ? '+' : ''}${data.weeklyChange.medium}
- Low Risk: ${data.weeklyChange.low > 0 ? '+' : ''}${data.weeklyChange.low}

Provide analysis in JSON format:
{
  "risk_factors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "action_items": ["immediate action1", "action2"],
  "trend_analysis": "overall trend description",
  "priority_areas": ["area1", "area2"],
  "confidence": 0.8
}`;

      return await geminiService.model.generateContent(prompt)
        .then(result => {
          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return {
              success: true,
              data: JSON.parse(jsonMatch[0])
            };
          }
          throw new Error('Invalid JSON response');
        })
        .catch(error => {
          console.error('Gemini risk analysis failed:', error);
          return {
            success: false,
            data: {
              risk_factors: ['Analysis unavailable'],
              recommendations: ['Manual review recommended'],
              action_items: ['Check individual learners'],
              confidence: 0.3
            }
          };
        });
    } catch (error) {
      console.error('Error in Gemini risk analysis:', error);
      return { success: false, data: {} };
    }
  }

  // Get risk distribution history
  async getRiskDistributionHistory(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const history = await DailyRiskTracking.find({
        date: { $gte: startDate }
      }).sort({ date: 1 });

      return history;
    } catch (error) {
      console.error('Error getting risk distribution history:', error);
      throw error;
    }
  }

  // Initialize daily risk tracking (run this daily via cron job)
  async runDailyRiskUpdate() {
    try {
      console.log('Starting daily risk update process...');
      
      // Step 1: Update all individual learner risk scores
      await this.updateAllRiskScores();
      
      // Step 2: Calculate and store daily distribution
      await this.calculateDailyRiskDistribution();
      
      console.log('Daily risk update completed successfully');
      return { success: true, message: 'Daily risk update completed' };
    } catch (error) {
      console.error('Daily risk update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup old risk tracking data
  async cleanupOldRiskData(cutoffDate) {
    try {
      const result = await DailyRiskTracking.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      console.log(`Cleaned up ${result.deletedCount} old risk tracking records before ${cutoffDate.toISOString()}`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old risk data:', error);
      throw error;
    }
  }
}

module.exports = new RiskTrackingService();
