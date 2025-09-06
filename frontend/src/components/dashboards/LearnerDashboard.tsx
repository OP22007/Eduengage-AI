'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { learnerAPI } from '@/lib/api'
import ProgressChart from '@/components/charts/ProgressChart'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress with Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>Course Progress Analytics</span>
            </CardTitle>
            <CardDescription>
              Visual progress tracking and risk assessment for all your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                <ProgressChart 
                  data={enrollments.filter(enrollment => enrollment.courseId).map(enrollment => ({
                    courseTitle: enrollment.courseId.title || 'Unknown Course',
                    progress: enrollment.progress,
                    riskScore: enrollment.riskScore,
                    status: enrollment.status
                  }))}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {enrollments.filter(enrollment => enrollment.courseId).slice(0, 3).map((enrollment, index) => (
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

                {enrollments.length > 3 && (
                  <Button variant="outline" className="w-full">
                    View All Courses ({enrollments.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No courses enrolled yet</p>
                <Button className="mt-4">Browse Courses</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Learning Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Learning Coach</span>
            </CardTitle>
            <CardDescription>
              Personalized recommendations and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Learning Streak */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">Learning Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{engagement.streakDays} days</p>
                <p className="text-xs text-gray-600">Keep it going! You're doing great!</p>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span>Smart Recommendations</span>
                </h4>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">🎯 Focus Time</p>
                  <p className="text-xs text-green-800">
                    Best learning window: 10:00-11:30 AM based on your activity patterns
                  </p>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-900 mb-1">📚 Next Steps</p>
                  <p className="text-xs text-orange-800">
                    Complete "Introduction to ML" Module 4 to maintain momentum
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">💡 Study Tip</p>
                  <p className="text-xs text-blue-800">
                    Try the Pomodoro technique - 25min focus sessions work best for you
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button className="w-full h-10 text-sm" size="sm">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
                <Button variant="outline" className="w-full h-10 text-sm" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Study Time
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center space-y-2">
              <PlayCircle className="h-6 w-6" />
              <span>Resume Learning</span>
            </Button>
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
