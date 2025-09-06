'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { learnerAPI } from '@/lib/api'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Star,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskAssessment {
  risk_score: number
  risk_level: string
  risk_factors: string[]
  recommendations: string[]
  explanation: string
  confidence: number
  model_status: string
}

interface AIRecommendations {
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
}

export default function GeminiInsights() {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAIInsights()
  }, [])

  const fetchAIInsights = async () => {
    try {
      setIsLoading(true)
      const [riskResponse, recommendationsResponse] = await Promise.all([
        learnerAPI.getRiskAssessment(),
        learnerAPI.getAIRecommendations()
      ])

      if (riskResponse.data.success) {
        setRiskAssessment(riskResponse.data.data.risk_assessment)
      }

      if (recommendationsResponse.data.success) {
        setRecommendations(recommendationsResponse.data.data.recommendations)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch AI insights')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medium': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Target className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchAIInsights} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Risk Assessment Card */}
      {riskAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Learning Risk Assessment</span>
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your learning patterns and dropout risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Risk Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRiskIcon(riskAssessment.risk_level)}
                  <div>
                    <p className="font-medium">Risk Level</p>
                    <p className="text-sm text-gray-500">
                      {Math.round(riskAssessment.risk_score * 100)}% dropout risk
                    </p>
                  </div>
                </div>
                <Badge className={getRiskLevelColor(riskAssessment.risk_level)}>
                  {riskAssessment.risk_level.toUpperCase()}
                </Badge>
              </div>

              {/* Risk Explanation */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>AI Explanation:</strong> {riskAssessment.explanation}
                </p>
              </div>

              {/* Risk Factors */}
              {riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Risk Factors:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.risk_factors.map((factor, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Recommendations */}
              {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Immediate Actions:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence Score */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>AI Confidence: {Math.round(riskAssessment.confidence * 100)}%</span>
                
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Personalized Learning Plan</span>
            </CardTitle>
            <CardDescription>
              AI-generated recommendations tailored to your learning style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Motivation Section */}
              {recommendations.motivation && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">Your Learning Strength</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{recommendations.motivation.strength}</p>
                  <p className="text-sm text-blue-800 font-medium">{recommendations.motivation.encouragement}</p>
                </div>
              )}

              {/* Study Schedule */}
              {recommendations.study_schedule && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Optimal Study Schedule</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Best Time</p>
                      <p className="font-medium">{recommendations.study_schedule.optimal_time}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Session Length</p>
                      <p className="font-medium">{recommendations.study_schedule.session_duration}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Frequency</p>
                      <p className="font-medium">{recommendations.study_schedule.frequency}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Path */}
              {recommendations.learning_path && recommendations.learning_path.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Next Steps</span>
                  </h4>
                  <div className="space-y-3">
                    {recommendations.learning_path.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          getPriorityColor(step.priority)
                        )}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{step.action}</p>
                          <p className="text-xs text-gray-600 mt-1">{step.reason}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {step.priority} priority
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {recommendations.resources && recommendations.resources.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Recommended Resources</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.resources.map((resource, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">{resource.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{resource.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
