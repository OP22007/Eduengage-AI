'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EngagementChart from '@/components/charts/EngagementChart'
import RiskDistributionChart from '@/components/charts/RiskDistributionChart'
import ProgressChart from '@/components/charts/ProgressChart'
import { adminAPI } from '@/lib/api'
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Zap,
  Download,
  Filter,
  Calendar,
  Activity,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  engagementAnalytics: Array<{
    _id: string
    count: number
    avgDuration: number
  }>
  coursePerformance: Array<{
    _id: string
    title: string
    category: string
    difficulty: string
    enrollmentCount: number
    avgCompletion: number
  }>
  interventionStats: Array<{
    _id: string
    count: number
  }>
  timeframe: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeframe])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await adminAPI.getAnalytics({ timeframe })
      setAnalyticsData(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
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
          <Button onClick={fetchAnalyticsData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const { engagementAnalytics, coursePerformance, interventionStats } = analyticsData || {}

  // Calculate key metrics
  const totalEngagement = engagementAnalytics?.reduce((sum, item) => sum + item.count, 0) || 0
  const avgEngagementDuration = engagementAnalytics && engagementAnalytics.length > 0 
    ? engagementAnalytics.reduce((sum, item) => sum + item.avgDuration, 0) / engagementAnalytics.length 
    : 0
  const totalInterventions = interventionStats?.reduce((sum, item) => sum + item.count, 0) || 0
  const successfulInterventions = interventionStats?.find(item => item._id === 'successful')?.count || 0

  const kpiCards = [
    {
      title: 'Total Engagements',
      value: totalEngagement.toLocaleString(),
      description: 'Learning interactions',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Avg. Session Time',
      value: `${Math.round(avgEngagementDuration / 60)}min`,
      description: 'Per learning session',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'AI Interventions',
      value: totalInterventions.toLocaleString(),
      description: `${Math.round((successfulInterventions / Math.max(totalInterventions, 1)) * 100)}% success rate`,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Course Completion',
      value: `${Math.round((coursePerformance && coursePerformance.length > 0 
        ? coursePerformance.reduce((sum, course) => sum + course.avgCompletion, 0) / coursePerformance.length 
        : 0) * 100)}%`,
      description: 'Average across all courses',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+5%',
      trendUp: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Brain className="h-7 w-7 text-purple-600" />
            <span>AI Analytics</span>
          </h1>
          <p className="text-gray-600">
            Deep insights and predictive analytics for learner engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Engagement Breakdown</span>
            </CardTitle>
            <CardDescription>
              Learning activity types and their frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart 
              data={engagementAnalytics?.map(item => ({
                name: item._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: item.count,
                color: item._id === 'video_watch' ? '#3b82f6' : 
                       item._id === 'quiz_attempt' ? '#10b981' : 
                       item._id === 'forum_post' ? '#f59e0b' : '#ef4444'
              })) || []}
            />
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Course Performance</span>
            </CardTitle>
            <CardDescription>
              Completion rates and enrollment data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart 
              data={coursePerformance?.slice(0, 5).map(course => ({
                courseTitle: course.title,
                progress: course.avgCompletion || 0,
                riskScore: 1 - (course.avgCompletion || 0), // Inverse for visualization
                status: course.avgCompletion > 0.8 ? 'excellent' : 
                        course.avgCompletion > 0.6 ? 'good' : 'needs-improvement'
              })) || []}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>AI-Powered Insights</span>
            </CardTitle>
            <CardDescription>
              Machine learning predictions and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Pattern Detection */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Pattern Detection</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-gray-700">Peak engagement time</span>
                    <span className="font-medium text-purple-600">10:00-11:30 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-gray-700">Dropout risk increases after</span>
                    <span className="font-medium text-red-600">7 days of inactivity</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-gray-700">Most effective intervention</span>
                    <span className="font-medium text-green-600">Personalized nudges</span>
                  </div>
                </div>
              </div>

              {/* Predictive Analytics */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Predictive Analytics</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-green-800">
                    <strong>Next Week Prediction:</strong> 23 learners at risk of dropping out
                  </p>
                  <p className="text-green-800">
                    <strong>Course Demand:</strong> Machine Learning course expected 40% increase
                  </p>
                  <p className="text-green-800">
                    <strong>Intervention Impact:</strong> 85% success rate for immediate nudges
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              AI-recommended actions based on current data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start h-auto p-4" variant="outline">
                <div className="text-left">
                  <div className="font-medium text-sm">Send Bulk Intervention</div>
                  <div className="text-xs text-gray-500">23 high-risk learners identified</div>
                </div>
              </Button>
              
              <Button className="w-full justify-start h-auto p-4" variant="outline">
                <div className="text-left">
                  <div className="font-medium text-sm">Optimize Course Module</div>
                  <div className="text-xs text-gray-500">Module 3 has 40% drop rate</div>
                </div>
              </Button>
              
              <Button className="w-full justify-start h-auto p-4" variant="outline">
                <div className="text-left">
                  <div className="font-medium text-sm">Schedule Study Groups</div>
                  <div className="text-xs text-gray-500">Peer learning shows 60% improvement</div>
                </div>
              </Button>
              
              <Button className="w-full justify-start h-auto p-4" variant="outline">
                <div className="text-left">
                  <div className="font-medium text-sm">Update Content</div>
                  <div className="text-xs text-gray-500">Video content performs 2x better</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Intervention Effectiveness</span>
          </CardTitle>
          <CardDescription>
            Success rates and impact of AI-driven interventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interventionStats?.map((stat, index) => {
              const percentage = (stat.count / Math.max(totalInterventions, 1)) * 100
              const colors = {
                'successful': { bg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-100' },
                'pending': { bg: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-100' },
                'failed': { bg: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-100' }
              }
              const color = colors[stat._id as keyof typeof colors] || colors.pending

              return (
                <div key={index} className={cn("p-4 rounded-lg border-2", color.bgLight)}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn("font-semibold capitalize", color.text)}>
                      {stat._id.replace('_', ' ')}
                    </h4>
                    <span className={cn("text-2xl font-bold", color.text)}>
                      {stat.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={cn("h-2 rounded-full transition-all duration-300", color.bg)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {percentage.toFixed(1)}% of total interventions
                  </p>
                </div>
              )
            }) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
