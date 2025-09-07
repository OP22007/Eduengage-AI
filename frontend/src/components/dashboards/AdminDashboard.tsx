'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminAPI } from '@/lib/api'
import EngagementChart from '@/components/charts/EngagementChart'
import RiskDistributionChart from '@/components/charts/RiskDistributionChart'
import InterventionModal from '../InterventionModal'
import NotificationPopup, { useNotificationPopup } from '../NotificationPopup'
import AdminGeminiInsights from '@/components/AdminGeminiInsights'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  Target,
  MessageSquare,
  BarChart3,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Brain,
  Zap
} from 'lucide-react'
import { formatPercentage, calculateRiskLevel, cn } from '@/lib/utils'

interface AdminDashboardData {
  overview: {
    totalLearners: number
    totalCourses: number
    totalActivities: number
    activeToday: number
  }
  riskDistribution: Array<{
    _id: string
    count: number
  }>
  recentActivities: Array<{
    _id: string
    type: string
    timestamp: string
    learnerId: {
      userId: string
    }
    courseId: {
      title: string
    }
  }>
  atRiskLearners: Array<{
    _id: string
    userId: {
      profile: {
        name: string
      }
      email: string
    }
    enrollments: Array<{
      riskScore: number
      courseId: {
        title: string
      }
      status: string
    }>
  }>
  engagementTrend: Array<{
    _id: string
    totalActivities: number
    uniqueLearners: string[]
  }>
  aiInsights?: {
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

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingRisk, setIsUpdatingRisk] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedLearner, setSelectedLearner] = useState<any>(null)
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  
  // Notification popup hook
  const { 
    messages: popupMessages, 
    removeMessage, 
    showEmailSent, 
    showSMSSent, 
    showInterventionSent,
    showError: showPopupError
  } = useNotificationPopup()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setDashboardData(response.data.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRiskScores = async () => {
    try {
      setIsUpdatingRisk(true)
      setError('')
      setSuccessMessage('')
      
      const response = await adminAPI.updateRiskScores()
      
      if (response.data.success) {
        setSuccessMessage('Risk scores updated successfully!')
        // Refresh dashboard data after a short delay
        setTimeout(() => {
          fetchDashboardData()
          setSuccessMessage('')
        }, 2000)
      } else {
        throw new Error(response.data.message || 'Failed to update risk scores')
      }
    } catch (err: any) {
      console.error('Failed to update risk scores:', err)
      setError(err.response?.data?.message || 'Failed to update risk scores')
    } finally {
      setIsUpdatingRisk(false)
    }
  }

  const handleInterventionClick = (learner: any) => {
    setSelectedLearner(learner)
    setShowInterventionModal(true)
  }

  const handleNotificationSent = (type: 'email' | 'sms', recipient: string, interventionType: string) => {
    if (type === 'email') {
      showEmailSent(recipient)
    } else if (type === 'sms') {
      showSMSSent(recipient)
    }
  }

  const handleInterventionSuccess = () => {
    // Refresh dashboard data after successful intervention
    fetchDashboardData()
  }

  const sendBulkIntervention = async (priority: string) => {
    try {
      // This would call the intervention suggestions API
      console.log(`Sending bulk intervention for ${priority} priority learners`)
      // TODO: Implement bulk intervention API call
    } catch (error) {
      console.error('Failed to send bulk intervention:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  const { overview, riskDistribution, atRiskLearners, engagementTrend, aiInsights } = dashboardData

  // Calculate risk percentages
  const totalEnrollments = riskDistribution.reduce((sum, item) => sum + item.count, 0)
  const riskStats = {
    high: riskDistribution.find(item => item._id === 'high')?.count || 0,
    medium: riskDistribution.find(item => item._id === 'medium')?.count || 0,
    low: riskDistribution.find(item => item._id === 'low')?.count || 0,
  }

  const kpiCards = [
    {
      title: 'Total Learners',
      value: overview.totalLearners.toLocaleString(),
      description: `${overview.activeToday} active today`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Courses',
      value: overview.totalCourses.toLocaleString(),
      description: 'Across all categories',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'At-Risk Learners',
      value: riskStats.high.toLocaleString(),
      description: `${totalEnrollments > 0 ? ((riskStats.high / totalEnrollments) * 100).toFixed(1) : 0}% of total`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: '-8%',
      trendUp: false,
    },
    {
      title: 'Daily Activities',
      value: overview.totalActivities.toLocaleString(),
      description: 'Learning interactions',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+23%',
      trendUp: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor learner engagement and platform health
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Interventions
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
                <div className={cn(
                  "flex items-center space-x-1 text-sm font-medium",
                  card.trendUp ? "text-green-600" : "text-red-600"
                )}>
                  {card.trendUp ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{card.trend}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {card.value}
                </p>
                <p className="text-sm text-gray-500">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-red-500" />
                  <span>Risk Distribution</span>
                </CardTitle>
                <CardDescription>
                  AI-powered learner risk assessment across all courses
                </CardDescription>
              </div>
              <Button 
                onClick={handleUpdateRiskScores}
                disabled={isUpdatingRisk}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isUpdatingRisk ? 'Updating...' : 'Update Risk Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Chart */}
              {isUpdatingRisk ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Updating risk distribution...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : (
                <RiskDistributionChart 
                  data={[
                    { name: 'High Risk', value: riskStats.high, color: '#ef4444' },
                    { name: 'Medium Risk', value: riskStats.medium, color: '#f59e0b' },
                    { name: 'Low Risk', value: riskStats.low, color: '#10b981' }
                  ]}
                />
              )}

              {/* AI Insights */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">AI Insights</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• {riskStats.high} learners need immediate intervention</p>
                  <p>• Risk levels decreased by 8% this week</p>
                  <p>• Personalized nudges show 85% effectiveness</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Learners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>At-Risk Learners</span>
            </CardTitle>
            <CardDescription>
              Learners requiring immediate intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atRiskLearners.length > 0 ? (
                atRiskLearners.slice(0, 5).map((learner, index) => {
                  const highestRisk = Math.max(...learner.enrollments.map(e => e.riskScore))
                  const riskLevel = calculateRiskLevel(highestRisk)
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {learner.userId.profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {learner.userId.profile.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {learner.userId.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            riskLevel.bgColor,
                            riskLevel.color
                          )}>
                            {(highestRisk * 100).toFixed(0)}% risk
                          </span>
                          <span className="text-xs text-gray-500">
                            {learner.enrollments.length} course(s)
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <MessageSquare 
                            className="h-4 w-4" 
                            onClick={() => handleInterventionClick(learner)}
                          />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No at-risk learners found</p>
                  <p className="text-sm text-gray-500">Great job on learner engagement!</p>
                </div>
              )}
              
              {atRiskLearners.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All At-Risk Learners ({atRiskLearners.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trends & AI Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Engagement Trends</span>
            </CardTitle>
            <CardDescription>
              Real-time platform activity and learner engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementChart 
              data={engagementTrend.map(day => ({
                date: day._id,
                totalActivities: day.totalActivities,
                uniqueLearners: Array.isArray(day.uniqueLearners) 
                  ? day.uniqueLearners.length 
                  : day.uniqueLearners
              }))}
            />
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>AI Recommendations</span>
              {aiInsights && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Smart insights and suggested actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights ? (
                <>
                  {/* Platform Health Score */}
                  <div className={cn(
                    "p-3 rounded-lg border",
                    aiInsights.overall_health.status === 'excellent' ? 'bg-green-50 border-green-200' :
                    aiInsights.overall_health.status === 'good' ? 'bg-blue-50 border-blue-200' :
                    aiInsights.overall_health.status === 'concerning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Platform Health</span>
                      <span className="text-lg font-bold">{aiInsights.overall_health.score}/100</span>
                    </div>
                    <p className="text-xs text-gray-600">{aiInsights.overall_health.summary}</p>
                  </div>

                  {/* Intervention Priorities */}
                  {aiInsights.intervention_priorities.slice(0, 3).map((priority, index) => (
                    <div key={index} className={cn(
                      "p-3 rounded-lg border",
                      priority.priority === 'immediate' ? 'bg-red-50 border-red-200' :
                      priority.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                      priority.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    )}>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className={cn(
                          "h-4 w-4",
                          priority.priority === 'immediate' ? 'text-red-600' :
                          priority.priority === 'high' ? 'text-orange-600' :
                          priority.priority === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        )} />
                        <span className="text-sm font-medium capitalize">{priority.priority} Priority</span>
                      </div>
                      <p className="text-sm text-gray-800 mb-1">{priority.focus_area}</p>
                      <p className="text-xs text-gray-600 mb-2">{priority.expected_impact}</p>
                      <Button 
                        size="sm" 
                        className={cn(
                          priority.priority === 'immediate' ? 'bg-red-600 hover:bg-red-700' :
                          priority.priority === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                          'bg-blue-600 hover:bg-blue-700'
                        )}
                        onClick={() => sendBulkIntervention(priority.priority)}
                      >
                        {priority.suggested_action}
                      </Button>
                    </div>
                  ))}

                  {/* Key Insights */}
                  {aiInsights.key_insights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900 capitalize">{insight.category} Insight</span>
                      </div>
                      <p className="text-sm text-purple-800 mb-1">{insight.insight}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {insight.impact} impact
                        </span>
                        <Button size="sm" variant="outline">
                          {insight.action_required}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Success Indicators */}
                  {aiInsights.success_indicators.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Success Highlights</span>
                      </div>
                      <ul className="space-y-1">
                        {aiInsights.success_indicators.slice(0, 2).map((indicator, index) => (
                          <li key={index} className="text-xs text-green-800 flex items-start">
                            <span className="mr-2">✓</span>
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                // Fallback recommendations when AI insights are not available
                <>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">High Priority</span>
                    </div>
                    <p className="text-sm text-red-800">
                      Send intervention to {riskStats.high} at-risk learners
                    </p>
                    <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">
                      Execute Intervention
                    </Button>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">Insight</span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Course completion drops 40% after Module 3. Recommend adding checkpoint.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Details
                    </Button>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Opportunity</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Machine Learning course showing 15% higher engagement this week
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Analyze Pattern
                    </Button>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Success</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Intervention campaign achieved 82% re-engagement rate
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gemini AI Insights Section */}
      <div className="mt-8">
        <AdminGeminiInsights />
      </div>

      {/* Intervention Modal */}
      {showInterventionModal && selectedLearner && (
        <InterventionModal
          learner={selectedLearner}
          onClose={() => setShowInterventionModal(false)}
          onSuccess={handleInterventionSuccess}
          onNotificationSent={handleNotificationSent}
        />
      )}

      {/* Notification Popups */}
      <NotificationPopup
        messages={popupMessages}
        onClose={removeMessage}
        position="top-right"
      />
    </div>
  )
}
