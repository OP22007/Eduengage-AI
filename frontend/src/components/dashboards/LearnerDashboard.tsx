'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { learnerAPI } from '@/lib/api'
import MLInsights from '@/components/MLInsights'
import { 
  TrendingUp, 
  Book, 
  Clock, 
  Target,
  Award,
  Users,
  Calendar,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap,
  Star,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react'
import { formatPercentage, formatDuration, cn } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  profile: {
    name: string
    email: string
    joinDate: string
  }
  engagement: {
    totalHours: number
    streakDays: number
    lastLogin: string
    avgSessionTime: number
    completionRate: number
    weeklyGoalHours: number
  }
  enrollments: Array<{
    courseId: {
      title: string
      difficulty: string
      thumbnail?: string
    }
    progress: number
    status: string
    riskScore: number
    lastActivity: string
  }>
  stats: {
    totalCourses: number
    activeCourses: number
    completedCourses: number
    averageProgress: number
  }
  personalizedRecommendations?: {
    recommendations?: {
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
      smart_insights?: {
        learning_style: string
        improvement_areas: string[]
        success_predictions: string[]
        weekly_goals: string[]
      }
    }
  }
  peerComparison?: {
    totalHours: {
      userValue: number
      percentile: number
      average: number
      ranking: string
    }
    streakDays: {
      userValue: number
      percentile: number
      average: number
      ranking: string
    }
    completionRate: {
      userValue: number
      percentile: number
      average: number
      ranking: string
    }
    completedCourses: {
      userValue: number
      percentile: number
      average: number
      ranking: string
    }
  }
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'courses', label: 'My Courses', icon: Book },
  { id: 'ai-insights', label: 'AI Coach', icon: Brain },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'progress', label: 'Analytics', icon: Activity }
]

export default function LearnerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsProgress, setInsightsProgress] = useState(0)
  const [insightsSuccess, setInsightsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      }
      const response = await learnerAPI.getDashboard()
      setDashboardData(response.data.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const refreshAIInsights = async () => {
    try {
      setIsLoadingInsights(true)
      setInsightsProgress(0)
      setInsightsSuccess(false)
      
      // Simulate progress during AI processing
      const progressInterval = setInterval(() => {
        setInsightsProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 15
          }
          return prev
        })
      }, 800)

      // Call AI recommendations API
      const response = await learnerAPI.getAIRecommendations()
      
      clearInterval(progressInterval)
      setInsightsProgress(100)
      
      // Update the dashboard data with new AI insights
      if (response.data.success && dashboardData) {
        setDashboardData({
          ...dashboardData,
          personalizedRecommendations: response.data.data
        })
        
        // Show success message
        setInsightsSuccess(true)
        setTimeout(() => {
          setInsightsSuccess(false)
        }, 3000)
      }
      
      // Reset progress after a brief moment
      setTimeout(() => {
        setInsightsProgress(0)
      }, 1000)
      
    } catch (err: any) {
      console.error('Failed to refresh AI insights:', err)
      setError('Failed to refresh AI insights')
    } finally {
      setIsLoadingInsights(false)
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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
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

  const { profile, engagement, enrollments, stats } = dashboardData

  const kpiCards = [
    {
      title: 'Total Learning Hours',
      value: `${Math.round(engagement.totalHours)}h`,
      description: `${engagement.avgSessionTime.toFixed(0)}min avg session`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Learning Streak',
      value: `${engagement.streakDays} days`,
      description: 'Keep it up!',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+3 days',
      changeType: 'positive'
    },
    {
      title: 'Course Progress',
      value: formatPercentage(stats.averageProgress),
      description: `${stats.activeCourses} active courses`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Completion Rate',
      value: formatPercentage(engagement.completionRate),
      description: `${stats.completedCourses} completed`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+15%',
      changeType: 'positive'
    },
  ]

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {card.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {card.description}
                    </p>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      card.changeType === 'positive' 
                        ? 'text-green-700 bg-green-100' 
                        : 'text-red-700 bg-red-100'
                    )}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-xl ml-4", card.bgColor)}>
                  <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Your latest learning sessions and achievements</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollments.slice(0, 3).map((enrollment, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={cn(
                  "p-3 rounded-lg",
                  enrollment.progress >= 0.8 ? 'bg-green-100' :
                  enrollment.progress >= 0.5 ? 'bg-blue-100' : 'bg-orange-100'
                )}>
                  <Book className={cn(
                    "h-5 w-5",
                    enrollment.progress >= 0.8 ? 'text-green-600' :
                    enrollment.progress >= 0.5 ? 'text-blue-600' : 'text-orange-600'
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {enrollment.courseId?.title || 'Unknown Course'}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          enrollment.progress >= 0.8 ? 'bg-green-500' :
                          enrollment.progress >= 0.5 ? 'bg-blue-500' : 'bg-orange-500'
                        )}
                        style={{ width: `${enrollment.progress * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatPercentage(enrollment.progress)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Last activity: {new Date(enrollment.lastActivity).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump back into your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/courses">
              <Button className="h-20 flex flex-col items-center justify-center space-y-2 w-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <PlayCircle className="h-6 w-6" />
                <span className="text-sm">Resume Learning</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200">
              <Award className="h-6 w-6 text-orange-600" />
              <span className="text-sm">Achievements</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200">
              <Users className="h-6 w-6 text-green-600" />
              <span className="text-sm">Study Groups</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-sm">Schedule Study</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCoursesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600">Track your progress across all enrolled courses</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {stats.activeCourses} active • {stats.completedCourses} completed
          </span>
          <Button size="sm">
            <Book className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
        </div>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrollments.map((enrollment, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {enrollment.courseId?.title || 'Unknown Course'}
                  </CardTitle>
                  {enrollment.riskScore > 0.6 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      At Risk
                    </span>
                  )}
                </div>
                <CardDescription>
                  Difficulty: {enrollment.courseId?.difficulty || 'Medium'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPercentage(enrollment.progress)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={cn(
                          "h-3 rounded-full transition-all duration-300",
                          enrollment.progress >= 0.8 ? 'bg-green-500' :
                          enrollment.progress >= 0.5 ? 'bg-blue-500' : 'bg-orange-500'
                        )}
                        style={{ width: `${enrollment.progress * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs px-3 py-1 rounded-full font-medium",
                      enrollment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : enrollment.status === 'at-risk'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    )}>
                      {enrollment.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Last: {new Date(enrollment.lastActivity).toLocaleDateString()}
                    </span>
                  </div>

                  <Button className="w-full" size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses enrolled yet</h3>
          <p className="text-gray-600 mb-6">Start your learning journey by exploring our course catalog</p>
          <Link href="/courses">
            <Button size="lg">
              <Book className="h-5 w-5 mr-2" />
              Browse Courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  )

  const renderAIInsightsTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">AI Learning Coach</h2>
          <Button 
            onClick={refreshAIInsights}
            disabled={isLoadingInsights}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isLoadingInsights ? 'Refreshing...' : 'Refresh Insights'}
          </Button>
        </div>
        <p className="text-gray-600">Personalized insights to optimize your learning</p>
        
        {/* Success message */}
        {insightsSuccess && (
          <div className="mt-4 max-w-md mx-auto p-3 bg-green-100 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              AI insights refreshed successfully!
            </p>
          </div>
        )}
        
        {/* Progress indicator */}
        {isLoadingInsights && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${insightsProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {insightsProgress < 30 ? 'Analyzing your learning patterns...' :
               insightsProgress < 60 ? 'Generating personalized recommendations...' :
               insightsProgress < 90 ? 'Optimizing study schedule...' :
               'Finalizing insights...'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Insights */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Smart Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingInsights ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : dashboardData.personalizedRecommendations?.recommendations?.smart_insights ? (
              <>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Your Learning Style
                  </h4>
                  <p className="text-sm text-blue-800">
                    {dashboardData.personalizedRecommendations.recommendations.smart_insights.learning_style}
                  </p>
                </div>

                {dashboardData.personalizedRecommendations.recommendations.smart_insights.weekly_goals?.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      This Week's Goals
                    </h4>
                    <div className="space-y-2">
                      {dashboardData.personalizedRecommendations.recommendations.smart_insights.weekly_goals.slice(0, 3).map((goal, index) => (
                        <div key={index} className="flex items-center text-sm text-green-800">
                          <CheckCircle className="h-4 w-4 mr-3 text-green-600" />
                          {goal}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dashboardData.personalizedRecommendations.recommendations.smart_insights.success_predictions?.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Success Prediction
                    </h4>
                    <p className="text-sm text-purple-800">
                      {dashboardData.personalizedRecommendations.recommendations.smart_insights.success_predictions[0]}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">AI insights are being generated...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingInsights ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-100">
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardData.personalizedRecommendations?.recommendations?.learning_path?.slice(0, 3).map((step, index) => (
              <div key={index} className={cn(
                "p-4 rounded-lg border-l-4",
                step.priority === 'high' 
                  ? 'border-l-red-400 bg-red-50' 
                  : step.priority === 'medium'
                  ? 'border-l-yellow-400 bg-yellow-50'
                  : 'border-l-blue-400 bg-blue-50'
              )}>
                <div className="flex items-start space-x-3">
                  <span className={cn(
                    "inline-block text-xs px-2 py-1 rounded-full font-medium",
                    step.priority === 'high' ? 'bg-red-200 text-red-800' :
                    step.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  )}>
                    {step.priority}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{step.action}</h4>
                    <p className="text-sm text-gray-600">{step.reason}</p>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Personalized recommendations coming soon...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Study Schedule */}
      {isLoadingInsights ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Optimal Study Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-100 rounded-lg animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mx-auto"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : dashboardData.personalizedRecommendations?.recommendations?.study_schedule && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Optimal Study Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Best Time</h4>
                <p className="text-sm text-gray-600">
                  {dashboardData.personalizedRecommendations.recommendations.study_schedule.optimal_time}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Session Length</h4>
                <p className="text-sm text-gray-600">
                  {dashboardData.personalizedRecommendations.recommendations.study_schedule.session_duration}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Frequency</h4>
                <p className="text-sm text-gray-600">
                  {dashboardData.personalizedRecommendations.recommendations.study_schedule.frequency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full ML Insights */}
      {isLoadingInsights ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Advanced AI Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 mb-2">Generating advanced AI insights...</p>
              <p className="text-sm text-gray-500">This comprehensive analysis takes a moment</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <MLInsights />
      )}
    </div>
  )

  const renderCommunityTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
          <Users className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Insights</h2>
        <p className="text-gray-600">See how you compare with fellow learners</p>
      </div>

      {/* Peer Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Learning Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(dashboardData.peerComparison?.totalHours.userValue || engagement.totalHours)}h
                </p>
                <p className="text-sm text-gray-600">vs {Math.round(dashboardData.peerComparison?.totalHours.average || engagement.totalHours * 0.8)}h avg</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="h-3 bg-blue-500 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(dashboardData.peerComparison?.totalHours.percentile || 75, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Top {100 - (dashboardData.peerComparison?.totalHours.percentile || 75)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span>Consistency</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.peerComparison?.streakDays.userValue || engagement.streakDays} days
                </p>
                <p className="text-sm text-gray-600">vs {Math.round(dashboardData.peerComparison?.streakDays.average || engagement.streakDays * 0.6)} avg</p>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-3">
                <div 
                  className="h-3 bg-yellow-500 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(dashboardData.peerComparison?.streakDays.percentile || 85, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  Top {100 - (dashboardData.peerComparison?.streakDays.percentile || 85)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Award className="h-5 w-5 text-green-600" />
              <span>Completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatPercentage(dashboardData.peerComparison?.completionRate.userValue || engagement.completionRate)}
                </p>
                <p className="text-sm text-gray-600">vs {formatPercentage(dashboardData.peerComparison?.completionRate.average || engagement.completionRate * 0.75)} avg</p>
              </div>
              <div className="w-full bg-green-200 rounded-full h-3">
                <div 
                  className="h-3 bg-green-500 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(dashboardData.peerComparison?.completionRate.percentile || 70, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Top {100 - (dashboardData.peerComparison?.completionRate.percentile || 70)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Insights */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Community Insights</span>
          </CardTitle>
          <CardDescription>Learn from your peer community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Your Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-900">Learning Hours</span>
                  <span className="text-sm font-medium text-blue-700">
                    {dashboardData.peerComparison?.totalHours.ranking === 'above_average' ? '🎉 Above Average' : '📈 Room to Grow'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-yellow-900">Consistency</span>
                  <span className="text-sm font-medium text-yellow-700">
                    {dashboardData.peerComparison?.streakDays.ranking === 'above_average' ? '🔥 Excellent' : '⚡ Building Up'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-900">Completion Rate</span>
                  <span className="text-sm font-medium text-green-700">
                    {dashboardData.peerComparison?.completionRate.ranking === 'above_average' ? '🏆 Outstanding' : '🎯 Improving'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Community Trends</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• You're outperforming {dashboardData.peerComparison?.totalHours.percentile || 75}% of learners in your cohort</p>
                <p>• Most successful peers study during {dashboardData.personalizedRecommendations?.recommendations?.study_schedule?.optimal_time || 'afternoon'} hours</p>
                <p>• Top performers maintain {Math.round((dashboardData.peerComparison?.streakDays.average || 15) * 1.5)}+ day streaks consistently</p>
                <p>• Average completion rate in your group is {formatPercentage(dashboardData.peerComparison?.completionRate.average || 0.65)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Groups */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Join Study Groups</CardTitle>
          <CardDescription>Connect with learners studying similar topics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm">JavaScript Learners</span>
              <span className="text-xs text-gray-500">24 members</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6 text-green-600" />
              <span className="text-sm">Data Science Hub</span>
              <span className="text-xs text-gray-500">18 members</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm">UI/UX Designers</span>
              <span className="text-xs text-gray-500">31 members</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Analytics</h2>
          <p className="text-gray-600">Detailed insights into your learning patterns and progress</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Learning Streak Visualization */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Learning Streak Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-green-900">{engagement.streakDays} Days</h3>
                    <p className="text-green-700">Current Streak</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 text-sm">Best Streak</p>
                    <p className="text-lg font-semibold text-green-900">{Math.max(engagement.streakDays, 15)} days</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-green-800">
                    <span>Progress to next milestone</span>
                    <span>{Math.ceil((30 - engagement.streakDays) / 30 * 100)}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${(engagement.streakDays / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-700">
                    {30 - engagement.streakDays} days to reach 30-day milestone! 🏆
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Weekly Average</h4>
                <p className="text-2xl font-bold text-blue-600">{Math.round(engagement.streakDays / 7 * 5)} days</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Study Sessions</h4>
                <p className="text-2xl font-bold text-purple-600">{Math.round(engagement.totalHours / (engagement.avgSessionTime / 60))}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Time Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Learning Time</span>
                <span className="font-medium">{Math.round(engagement.totalHours)}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Session</span>
                <span className="font-medium">{engagement.avgSessionTime.toFixed(0)} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions This Week</span>
                <span className="font-medium">{Math.round(engagement.streakDays * 0.8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Goal Progress</span>
                <span className="font-medium">{formatPercentage(engagement.totalHours / engagement.weeklyGoalHours)}</span>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Weekly Goal</h4>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="h-3 bg-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((engagement.totalHours / engagement.weeklyGoalHours) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {engagement.totalHours.toFixed(1)}h / {engagement.weeklyGoalHours}h weekly goal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium">{formatPercentage(engagement.completionRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full" 
                    style={{ width: `${engagement.completionRate * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Average Progress</span>
                  <span className="font-medium">{formatPercentage(stats.averageProgress)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${stats.averageProgress * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Course Statistics</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completedCourses}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeCourses}</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{stats.totalCourses}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Areas */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span>Areas for Improvement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.personalizedRecommendations?.recommendations?.smart_insights?.improvement_areas?.map((area, index) => (
              <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">{area}</h4>
                <p className="text-sm text-yellow-800">
                  Focus on this area to accelerate your learning progress
                </p>
              </div>
            )) || (
              <>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Session Consistency</h4>
                  <p className="text-sm text-yellow-800">
                    Try to maintain regular daily study sessions for better retention
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">Course Completion</h4>
                  <p className="text-sm text-orange-800">
                    Focus on completing started courses before beginning new ones
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Practice Sessions</h4>
                  <p className="text-sm text-purple-800">
                    Increase hands-on practice to reinforce theoretical learning
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your personalized learning dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <TrendingUp className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last login</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(engagement.lastLogin).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'courses' && renderCoursesTab()}
        {activeTab === 'ai-insights' && renderAIInsightsTab()}
        {activeTab === 'community' && renderCommunityTab()}
        {activeTab === 'progress' && renderAnalyticsTab()}
      </div>
    </div>
  )
}