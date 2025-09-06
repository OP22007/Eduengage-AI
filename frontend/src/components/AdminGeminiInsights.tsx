'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminAPI } from '@/lib/api'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Zap,
  Activity,
  Users,
  BookOpen,
  Clock,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminInsights {
  platform_metrics: {
    totalLearners: number
    activeToday: number
    totalCourses: number
    totalActivities: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
    weeklyGrowth: number
    avgSessionTime: number
    completionRate: number
  }
  ai_insights: {
    overall_health: {
      score: number
      status: string
      summary: string
    }
    key_insights: Array<{
      category: string
      insight: string
      impact: string
      action_required: string
    }>
    intervention_priorities: Array<{
      priority: string
      focus_area: string
      expected_impact: string
      suggested_action: string
    }>
    success_indicators: string[]
    recommendations: Array<{
      timeframe: string
      action: string
      rationale: string
    }>
  }
}

export default function AdminGeminiInsights() {
  const [insights, setInsights] = useState<AdminInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...')
      const testUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/dashboard`
      console.log('Testing with URL:', testUrl)
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Test response status:', response.status)
      const data = await response.json()
      console.log('Test response data:', data)
      
      if (response.ok) {
        alert('API connection successful! The backend is responding.')
      } else {
        alert(`API connection failed: ${data.message || response.statusText}`)
      }
    } catch (err) {
      console.error('API test failed:', err)
      alert(`API test failed: ${err}`)
    }
  }

  useEffect(() => {
    fetchGeminiInsights()
  }, [])

  const fetchGeminiInsights = async () => {
    try {
      setIsLoading(true)
      setError('') // Clear previous errors
      setLoadingProgress(0)
      
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }
      
      console.log('Fetching Gemini insights from backend...')
      console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'None')
      
      // Simulate progress during the long AI request
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 2000)
      
      const response = await adminAPI.getGeminiInsights()
      
      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      console.log('Gemini insights response:', response.data)
      
      if (response.data.success && response.data.data) {
        setInsights(response.data.data)
        console.log('Successfully loaded Gemini insights')
      } else {
        console.warn('Invalid response structure:', response.data)
        throw new Error('Invalid response structure from server')
      }
    } catch (err: any) {
      console.error('Gemini insights fetch error:', err)
      
      // More detailed error handling
      if (err.response) {
        // Server responded with error status
        console.error('Server error response:', err.response.data)
        const errorMessage = err.response.data?.message || err.response.statusText || 'Unknown server error'
        setError(`Server error (${err.response.status}): ${errorMessage}`)
      } else if (err.request) {
        // Network error
        console.error('Network error:', err.request)
        setError('Network error: Unable to connect to server. Please check if the backend is running.')
      } else if (err.code === 'ECONNABORTED') {
        // Timeout error
        setError('Request timeout: The AI analysis is taking longer than expected. This may be due to high server load or Gemini API latency. Please try again.')
      } else {
        // Other error
        console.error('Error details:', err.message)
        setError(err.message || 'Failed to fetch Gemini insights')
      }
    } finally {
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concerning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generating AI Insights
              </h3>
              <p className="text-gray-600 mb-4">
                Gemini AI is analyzing your platform data. This may take up to 2 minutes...
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">
                  {loadingProgress < 30 ? 'Collecting platform metrics...' :
                   loadingProgress < 60 ? 'Analyzing learner patterns...' :
                   loadingProgress < 90 ? 'Generating strategic insights...' :
                   'Finalizing recommendations...'}
                </p>
                <p className="text-xs">
                  Progress: {Math.round(loadingProgress)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    const isTimeoutError = error.includes('timeout') || error.includes('ECONNABORTED')
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {isTimeoutError ? 'AI Analysis Timeout' : 'Failed to fetch Gemini insights'}
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            
            {isTimeoutError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-yellow-900 mb-1">
                      Why did this timeout?
                    </h4>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• Gemini AI analysis can take 30-120 seconds</li>
                      <li>• Large datasets require more processing time</li>
                      <li>• High API traffic may cause delays</li>
                      <li>• Your GEMINI_API_KEY might have rate limits</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-500 mb-4">
              <p>Debug info:</p>
              <p>• Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}</p>
              <p>• Endpoint: /api/admin/gemini-insights</p>
              <p>• Timeout: 120 seconds</p>
            </div>
            <div className="flex space-x-2 justify-center">
              <Button onClick={fetchGeminiInsights} className="bg-red-600 hover:bg-red-700">
                {isTimeoutError ? 'Try Again (2min timeout)' : 'Retry'}
              </Button>
              <Button 
                variant="outline" 
                onClick={testApiConnection}
              >
                Test API
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Show fallback data
                  setInsights({
                    platform_metrics: {
                      totalLearners: 150,
                      activeToday: 45,
                      totalCourses: 12,
                      totalActivities: 2847,
                      highRisk: 8,
                      mediumRisk: 23,
                      lowRisk: 119,
                      weeklyGrowth: 12.5,
                      avgSessionTime: 42,
                      completionRate: 0.73
                    },
                    ai_insights: {
                      overall_health: {
                        score: 78,
                        status: 'good',
                        summary: 'Platform showing healthy engagement patterns with room for improvement in retention'
                      },
                      key_insights: [
                        {
                          category: 'engagement',
                          insight: 'Peak learning hours are 10-11 AM and 7-9 PM',
                          impact: 'medium',
                          action_required: 'Schedule content releases during peak hours'
                        }
                      ],
                      intervention_priorities: [
                        {
                          priority: 'high',
                          focus_area: 'At-risk learner retention',
                          expected_impact: '15% reduction in dropout rate',
                          suggested_action: 'Implement personalized nudges'
                        }
                      ],
                      success_indicators: [
                        'Weekly growth rate of 12.5% exceeds target',
                        'Course completion rate stable at 73%'
                      ],
                      recommendations: [
                        {
                          timeframe: 'immediate',
                          action: 'Send intervention to 8 high-risk learners',
                          rationale: 'Early intervention shows 85% success rate'
                        }
                      ]
                    }
                  })
                  setError('')
                }}
              >
                Use Demo Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Platform Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Platform Health Analysis</span>
            </CardTitle>
          <CardDescription>
            AI-powered analysis of overall platform performance and health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Health Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Overall Health Score</h4>
                <p className="text-sm text-gray-600">{insights.ai_insights.overall_health.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {insights.ai_insights.overall_health.score}/100
                </div>
                <Badge className={getHealthColor(insights.ai_insights.overall_health.status)}>
                  {insights.ai_insights.overall_health.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">TOTAL LEARNERS</span>
                </div>
                <p className="text-xl font-bold text-blue-900">{insights.platform_metrics.totalLearners}</p>
                <p className="text-xs text-blue-700">{insights.platform_metrics.activeToday} active today</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">GROWTH</span>
                </div>
                <p className="text-xl font-bold text-green-900">+{insights.platform_metrics.weeklyGrowth.toFixed(1)}%</p>
                <p className="text-xs text-green-700">weekly activity</p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-900">AT RISK</span>
                </div>
                <p className="text-xl font-bold text-orange-900">{insights.platform_metrics.highRisk}</p>
                <p className="text-xs text-orange-700">high-risk learners</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">COMPLETION</span>
                </div>
                <p className="text-xl font-bold text-purple-900">{(insights.platform_metrics.completionRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-purple-700">course completion</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>AI Strategic Insights</span>
            </CardTitle>
            <CardDescription>
              Data-driven insights and trend analysis from Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.ai_insights.key_insights.map((insight, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getImpactColor(insight.impact).replace('text-', 'bg-')
                      )}></div>
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      getImpactColor(insight.impact)
                    )}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 mb-1">{insight.insight}</p>
                  <p className="text-xs text-gray-600">{insight.action_required}</p>
                </div>
              ))}

              {/* Success Indicators */}
              {insights.ai_insights.success_indicators.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success Indicators</span>
                  </h4>
                  <ul className="space-y-1">
                    {insights.ai_insights.success_indicators.map((indicator, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intervention Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-red-600" />
              <span>Intervention Priorities</span>
            </CardTitle>
            <CardDescription>
              AI-recommended actions to improve platform performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.ai_insights.intervention_priorities.map((intervention, index) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border-l-4",
                  getPriorityColor(intervention.priority)
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{intervention.focus_area}</h4>
                    <Badge variant="outline" className="text-xs">
                      {intervention.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{intervention.suggested_action}</p>
                  <p className="text-xs text-gray-600">
                    Expected impact: {intervention.expected_impact}
                  </p>
                </div>
              ))}

              {/* Strategic Recommendations */}
              {insights.ai_insights.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Strategic Recommendations</span>
                  </h4>
                  <div className="space-y-3">
                    {insights.ai_insights.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <Badge variant="outline" className="text-xs">
                            {rec.timeframe}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm text-blue-900 mb-1">{rec.action}</p>
                        <p className="text-xs text-blue-700">{rec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
