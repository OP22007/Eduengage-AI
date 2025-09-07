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
  Star
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

export default function LearnerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

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
    },
    {
      title: 'Learning Streak',
      value: `${engagement.streakDays} days`,
      description: 'Keep it up!',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Course Progress',
      value: formatPercentage(stats.averageProgress),
      description: `${stats.activeCourses} active courses`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Completion Rate',
      value: formatPercentage(engagement.completionRate),
      description: `${stats.completedCourses} completed`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your learning progress and insights
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Course Progress with AI Insights - Takes 3 columns */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>Course Progress & AI Insights</span>
            </CardTitle>
            <CardDescription>
              Visual progress tracking with AI-powered insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                {/* Course Progress Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {enrollments.filter(enrollment => enrollment.courseId).slice(0, 6).map((enrollment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {enrollment.courseId?.title || 'Unknown Course'}
                        </h4>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPercentage(enrollment.progress)}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            enrollment.progress >= 0.8 ? 'bg-green-500' :
                            enrollment.progress >= 0.5 ? 'bg-blue-500' :
                            'bg-orange-500'
                          )}
                          style={{ width: `${enrollment.progress * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded-full",
                          enrollment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : enrollment.status === 'at-risk'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        )}>
                          {enrollment.status}
                        </span>
                        {enrollment.riskScore > 0.6 && (
                          <span className="text-red-600 font-medium">
                            ⚠️ At Risk
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Insights Section - Enhanced & User-Friendly */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-purple-600" />
                    AI Learning Insights
                    
                  </h4>
                  
                  {/* Smart Study Recommendations */}
                  {dashboardData.personalizedRecommendations?.recommendations?.learning_path && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {dashboardData.personalizedRecommendations.recommendations.learning_path.slice(0, 2).map((step, index) => (
                        <div key={index} className={cn(
                          "p-4 rounded-lg border-l-4 bg-gradient-to-r",
                          step.priority === 'high' 
                            ? 'border-l-red-400 from-red-50 to-red-100' 
                            : step.priority === 'medium'
                            ? 'border-l-yellow-400 from-yellow-50 to-yellow-100'
                            : 'border-l-blue-400 from-blue-50 to-blue-100'
                        )}>
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              step.priority === 'high' ? 'bg-red-200' : 
                              step.priority === 'medium' ? 'bg-yellow-200' : 'bg-blue-200'
                            )}>
                              <Target className={cn(
                                "h-4 w-4",
                                step.priority === 'high' ? 'text-red-600' : 
                                step.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 mb-1">{step.action}</p>
                              <p className="text-xs text-gray-600">{step.reason}</p>
                              <span className={cn(
                                "inline-block text-xs px-2 py-1 rounded-full font-medium mt-2",
                                step.priority === 'high' ? 'bg-red-200 text-red-800' :
                                step.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              )}>
                                {step.priority} priority
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Motivational Insight */}
                  {dashboardData.personalizedRecommendations?.recommendations?.motivation && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-lg border border-purple-200 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <Star className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 mb-1">
                            Your Learning Strength: {dashboardData.personalizedRecommendations.recommendations.motivation.strength}
                          </p>
                          <p className="text-sm text-purple-800">
                            {dashboardData.personalizedRecommendations.recommendations.motivation.encouragement}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Peer Comparison Section */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    How You Compare with Peers
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Community Insights
                    </span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Learning Hours Comparison */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Learning Hours</span>
                        </div>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                          {dashboardData.peerComparison?.totalHours.percentile 
                            ? `Top ${100 - dashboardData.peerComparison.totalHours.percentile}%`
                            : 'Top 25%'
                          }
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800">
                            You: {Math.round(dashboardData.peerComparison?.totalHours.userValue || engagement.totalHours)}h
                          </span>
                          <span className="text-blue-600">
                            Avg: {Math.round(dashboardData.peerComparison?.totalHours.average || engagement.totalHours * 0.8)}h
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${Math.min(dashboardData.peerComparison?.totalHours.percentile || 75, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-700">
                          {dashboardData.peerComparison?.totalHours.ranking === 'above_average' 
                            ? `🎉 You're learning ${Math.round(((dashboardData.peerComparison.totalHours.userValue / dashboardData.peerComparison.totalHours.average) - 1) * 100)}% more than average!`
                            : '💪 Keep going to beat the average!'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Streak Comparison */}
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">Consistency</span>
                        </div>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                          {dashboardData.peerComparison?.streakDays.percentile 
                            ? `Top ${100 - dashboardData.peerComparison.streakDays.percentile}%`
                            : 'Top 15%'
                          }
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-800">
                            You: {dashboardData.peerComparison?.streakDays.userValue || engagement.streakDays} days
                          </span>
                          <span className="text-yellow-600">
                            Avg: {Math.round(dashboardData.peerComparison?.streakDays.average || engagement.streakDays * 0.6)} days
                          </span>
                        </div>
                        <div className="w-full bg-yellow-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-yellow-500 rounded-full" 
                            style={{ 
                              width: `${Math.min(dashboardData.peerComparison?.streakDays.percentile || 85, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-yellow-700">
                          {dashboardData.peerComparison?.streakDays.ranking === 'above_average' 
                            ? '🔥 Your consistency is inspiring!'
                            : '📈 Build your streak to climb higher!'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Completion Rate Comparison */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Completion</span>
                        </div>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                          {dashboardData.peerComparison?.completionRate.percentile 
                            ? `Top ${100 - dashboardData.peerComparison.completionRate.percentile}%`
                            : 'Top 30%'
                          }
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-800">
                            You: {formatPercentage(dashboardData.peerComparison?.completionRate.userValue || engagement.completionRate)}
                          </span>
                          <span className="text-green-600">
                            Avg: {formatPercentage(dashboardData.peerComparison?.completionRate.average || engagement.completionRate * 0.75)}
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ 
                              width: `${Math.min(dashboardData.peerComparison?.completionRate.percentile || 70, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-green-700">
                          {dashboardData.peerComparison?.completionRate.ranking === 'above_average' 
                            ? '🏆 Excellent follow-through!'
                            : '🎯 Focus on completing current courses!'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Peer Insights */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-200 rounded-lg">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-indigo-900 mb-2">Peer Learning Insights</h5>
                        <div className="text-xs text-indigo-800 space-y-1">
                          <p>
                            • You're outperforming {dashboardData.peerComparison?.totalHours.percentile || 75}% of learners in your cohort
                          </p>
                          <p>
                            • Most successful peers study during {dashboardData.personalizedRecommendations?.recommendations?.study_schedule?.optimal_time || 'afternoon'} hours (like you!)
                          </p>
                          <p>
                            • Top performers typically maintain {Math.round((dashboardData.peerComparison?.streakDays.average || 15) * 1.5)}+ day streaks
                          </p>
                          <p>
                            • {stats.completedCourses > (dashboardData.peerComparison?.completedCourses.average || 1) 
                              ? 'You\'re ahead with course completions!' 
                              : `Complete ${Math.ceil((dashboardData.peerComparison?.completedCourses.average || 2) - stats.completedCourses)} more course(s) to join the top 20%`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {enrollments.length > 6 && (
                  <Button variant="outline" className="w-full">
                    View All Courses ({enrollments.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No courses enrolled yet</p>
                <Link href="/courses">
                  <Button className="mt-4">Browse Courses</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Learning Assistant - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="text-purple-900">AI Learning Coach</span>
                
              </CardTitle>
              <CardDescription className="text-purple-700">
                Personalized recommendations and insights tailored to your learning style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Learning Streak - Enhanced */}
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-yellow-200 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Learning Streak</span>
                      <p className="text-2xl font-bold text-gray-900">{engagement.streakDays} days</p>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded-lg">
                    🔥 Amazing consistency! You're building a strong learning habit.
                  </p>
                </div>

                {/* Smart Insights */}
                {dashboardData.personalizedRecommendations?.recommendations?.smart_insights && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span>Smart Insights</span>
                    </h4>
                    
                    {/* Learning Style */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">🧠 Your Learning Style</p>
                      <p className="text-xs text-blue-800">
                        {dashboardData.personalizedRecommendations.recommendations.smart_insights.learning_style}
                      </p>
                    </div>

                    {/* Weekly Goals */}
                    {dashboardData.personalizedRecommendations.recommendations.smart_insights.weekly_goals && 
                     dashboardData.personalizedRecommendations.recommendations.smart_insights.weekly_goals.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-2">🎯 This Week's Goals</p>
                        <div className="space-y-1">
                          {dashboardData.personalizedRecommendations.recommendations.smart_insights.weekly_goals.slice(0, 2).map((goal, index) => (
                            <div key={index} className="flex items-center text-xs text-green-800">
                              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                              {goal}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success Predictions */}
                    {dashboardData.personalizedRecommendations.recommendations.smart_insights.success_predictions && 
                     dashboardData.personalizedRecommendations.recommendations.smart_insights.success_predictions.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-1">🚀 Success Prediction</p>
                        <p className="text-xs text-purple-800">
                          {dashboardData.personalizedRecommendations.recommendations.smart_insights.success_predictions[0]}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Traditional AI Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span>Smart Recommendations</span>
                  </h4>
                  
                  {dashboardData.personalizedRecommendations?.recommendations ? (
                    <div className="space-y-3">
                      {/* Study Schedule */}
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Optimal Study Time
                        </p>
                        <p className="text-xs text-green-800">
                          {dashboardData.personalizedRecommendations.recommendations.study_schedule?.optimal_time || 'evening'} for {dashboardData.personalizedRecommendations.recommendations.study_schedule?.session_duration || '45 minutes'}
                        </p>
                      </div>

                      {/* Top Priority Action */}
                      {dashboardData.personalizedRecommendations.recommendations.learning_path?.[0] && (
                        <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                          <p className="text-sm font-medium text-orange-900 mb-1 flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            Next Step
                          </p>
                          <p className="text-xs text-orange-800">
                            {dashboardData.personalizedRecommendations.recommendations.learning_path[0].action}
                          </p>
                        </div>
                      )}

                      {/* Motivation */}
                      {dashboardData.personalizedRecommendations.recommendations.motivation && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-1 flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            Your Strength
                          </p>
                          <p className="text-xs text-blue-800 mb-2">
                            {dashboardData.personalizedRecommendations.recommendations.motivation?.strength || 'Consistent learner'}
                          </p>
                          <p className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            💡 {dashboardData.personalizedRecommendations.recommendations.motivation?.encouragement || 'Keep up the great work!'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Fallback recommendations with enhanced design
                    <div className="space-y-3">
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Focus Time
                        </p>
                        <p className="text-xs text-green-800">
                          Best learning window: 10:00-11:30 AM based on your activity patterns
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-orange-900 mb-1 flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          Next Steps
                        </p>
                        <p className="text-xs text-orange-800">
                          Complete your next module to maintain momentum
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1 flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          Study Tip
                        </p>
                        <p className="text-xs text-blue-800">
                          Try the Pomodoro technique - 25min focus sessions work best for you
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-2">
                  <Button className="w-full h-10 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                  <Button variant="outline" className="w-full h-10 text-sm border-purple-200 text-purple-700 hover:bg-purple-50" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Study Time
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full AI Insights Component */}
          <MLInsights className="" />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump back into your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/courses">
              <Button className="h-16 flex flex-col items-center justify-center space-y-2 w-full">
                <PlayCircle className="h-6 w-6" />
                <span>Resume Learning</span>
              </Button>
            </Link>
            <Link href="/achievements">
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2 w-full">
                <Award className="h-6 w-6" />
                <span>Achievements</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>Study Groups</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Study</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
