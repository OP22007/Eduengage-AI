'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { analyticsAPI, learnerAPI } from '@/lib/api'
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb,
  Target,
  Star,
  Clock,
  BookOpen,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIInsights {
  personalizedRecommendations?: {
    study_schedule: {
      optimal_time: string
      session_duration: string
      frequency: string
    }
    learning_path: Array<{
      action: string
      priority: string
      reason: string
    }>
    motivation: {
      strength: string
      encouragement: string
    }
    resources: Array<{
      type: string
      title: string
      description: string
    }>
    smart_insights: {
      learning_style: string
      improvement_areas: string[]
      success_predictions: string[]
      weekly_goals: string[]
    }
  }
}

interface MLInsightsProps {
  userId?: string
  className?: string
}

export default function MLInsights({ userId, className }: MLInsightsProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAIInsights()
    // Set up a longer interval to prevent frequent data changes
    const interval = setInterval(fetchAIInsights, 300000) // 5 minutes
    return () => clearInterval(interval)
  }, [userId])

  const fetchAIInsights = async () => {
    try {
      setRefreshing(loading ? false : true)
      if (!loading) setRefreshing(true)
      
      const recommendationsResponse = await learnerAPI.getAIRecommendations()
      
      if (recommendationsResponse.data.success) {
        setInsights({
          personalizedRecommendations: recommendationsResponse.data.data.recommendations.recommendations || recommendationsResponse.data.data.recommendations
        })
        setError('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch AI insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>AI Learning Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Learning Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchAIInsights} className="mt-3" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Smart Learning Insights */}
      {insights?.personalizedRecommendations?.smart_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Smart Learning Insights</span>
              
              {refreshing && (
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your learning patterns and personalized insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Learning Style */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div>
                  <h4 className="font-medium text-blue-900">Your Learning Style</h4>
                  <p className="text-sm text-blue-700">{insights.personalizedRecommendations.smart_insights.learning_style}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* Success Predictions */}
              {insights.personalizedRecommendations.smart_insights.success_predictions && insights.personalizedRecommendations.smart_insights.success_predictions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Success Predictions
                  </h4>
                  <div className="space-y-2">
                    {insights.personalizedRecommendations.smart_insights.success_predictions.map((prediction, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-green-800">{prediction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Goals */}
              {insights.personalizedRecommendations.smart_insights.weekly_goals && insights.personalizedRecommendations.smart_insights.weekly_goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-orange-500" />
                    This Week's Goals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {insights.personalizedRecommendations.smart_insights.weekly_goals.map((goal, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="text-sm text-orange-800">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {insights.personalizedRecommendations.smart_insights.improvement_areas && insights.personalizedRecommendations.smart_insights.improvement_areas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Growth Opportunities
                  </h4>
                  <div className="space-y-2">
                    {insights.personalizedRecommendations.smart_insights.improvement_areas.map((area, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-yellow-800">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {insights?.personalizedRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Personalized Recommendations</span>
            </CardTitle>
            <CardDescription>
              AI-generated suggestions tailored to your learning style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Study Schedule */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  Optimal Study Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">BEST TIME</p>
                    <p className="text-sm text-blue-900">
                      {insights.personalizedRecommendations.study_schedule?.optimal_time || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium">SESSION LENGTH</p>
                    <p className="text-sm text-green-900">
                      {insights.personalizedRecommendations.study_schedule?.session_duration || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">FREQUENCY</p>
                    <p className="text-sm text-purple-900">
                      {insights.personalizedRecommendations.study_schedule?.frequency || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Learning Path */}
              {insights.personalizedRecommendations.learning_path && insights.personalizedRecommendations.learning_path.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-green-500" />
                    Next Steps
                  </h4>
                  <div className="space-y-3">
                    {insights.personalizedRecommendations.learning_path.map((step, index) => (
                      <div key={index} className={cn(
                        "p-3 rounded-lg border",
                        getPriorityColor(step.priority)
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{step.action || 'Action not specified'}</p>
                            <p className="text-xs text-gray-600 mt-1">{step.reason || 'No reason provided'}</p>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            (step.priority || '').toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                            (step.priority || '').toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          )}>
                            {step.priority || 'normal'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivation */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Your Learning Strength
                </h4>
                <p className="text-sm text-purple-800 mb-2">
                  <strong>{insights.personalizedRecommendations.motivation?.strength || 'Keep going!'}</strong>
                </p>
                <p className="text-sm text-purple-700">
                  {insights.personalizedRecommendations.motivation?.encouragement || 'You\'re doing great! Keep up the excellent work.'}
                </p>
              </div>

              {/* Resources */}
              {insights.personalizedRecommendations.resources && insights.personalizedRecommendations.resources.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                    Recommended Resources
                  </h4>
                  <div className="space-y-2">
                    {insights.personalizedRecommendations.resources.map((resource, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{resource.title || 'Resource'}</p>
                            <p className="text-xs text-gray-600 mt-1">{resource.description || 'No description available'}</p>
                            <span className="inline-block text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mt-2">
                              {resource.type || 'Resource'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!insights?.personalizedRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Learning Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No AI insights available yet</p>
              <p className="text-sm text-gray-500">Complete more activities to get personalized recommendations</p>
              <Button onClick={fetchAIInsights} className="mt-3" size="sm">
                Get Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
