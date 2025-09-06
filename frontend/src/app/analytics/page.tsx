'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { analyticsAPI } from '@/lib/api'
import { 
  Brain, TrendingUp, AlertTriangle, Users, Target, 
  CheckCircle2, XCircle, Clock, Sparkles, BarChart3,
  Activity, PieChart, LineChart, Shield
} from 'lucide-react'

interface MLInsights {
  overview: {
    totalLearners: number
    totalActivities: number
    recentActivities: number
    avgEngagementHours: number
    avgStreakDays: number
    avgCompletionRate: number
  }
  riskDistribution: {
    highRisk: number
    mediumRisk: number
    lowRisk: number
    total: number
  }
  trends: {
    weeklyActivityGrowth: number
    engagementRate: number
    retentionRate: number
  }
  mlServiceStatus?: {
    status: string
    model_loaded: boolean
    features_count: number
  }
}

interface RiskPrediction {
  learner_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  intervention_needed: boolean
  top_risk_factors?: Array<{
    factor: string
    value: number
    importance: number
  }>
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
    {children}
  </div>
)

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: { 
  title: string
  value: string | number
  icon: any
  trend?: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

const RiskDistributionChart = ({ distribution }: { distribution: any }) => {
  const total = distribution.total || 1
  const highPercentage = (distribution.highRisk / total) * 100
  const mediumPercentage = (distribution.mediumRisk / total) * 100
  const lowPercentage = (distribution.lowRisk / total) * 100

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PieChart className="h-5 w-5" />
        Risk Distribution
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{distribution.highRisk}</span>
            <span className="text-xs text-gray-500">({highPercentage.toFixed(1)}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{distribution.mediumRisk}</span>
            <span className="text-xs text-gray-500">({mediumPercentage.toFixed(1)}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{distribution.lowRisk}</span>
            <span className="text-xs text-gray-500">({lowPercentage.toFixed(1)}%)</span>
          </div>
        </div>
        
        {/* Visual bar chart */}
        <div className="mt-4">
          <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-red-500" 
              style={{ width: `${highPercentage}%` }}
            ></div>
            <div 
              className="bg-yellow-500" 
              style={{ width: `${mediumPercentage}%` }}
            ></div>
            <div 
              className="bg-green-500" 
              style={{ width: `${lowPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Card>
  )
}

const MLServiceStatus = ({ status }: { status?: any }) => {
  if (!status) return null

  const isHealthy = status.mlServiceStatus === 'healthy'

  return (
    <Card className={`border-l-4 ${isHealthy ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
            {isHealthy ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div>
            <h4 className="font-medium">ML Service Status</h4>
            <p className="text-sm text-gray-600">
              {isHealthy ? 'Operational' : 'Service Unavailable'}
            </p>
          </div>
        </div>
        
        {isHealthy && status.model_loaded && (
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">Model Loaded</p>
            <p className="text-xs text-gray-500">{status.features_count} features</p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth()
  const [insights, setInsights] = useState<MLInsights | null>(null)
  const [mlStatus, setMLStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    fetchAnalytics()
    fetchMLStatus()
  }, [isAuthenticated])

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getOverview()
      setInsights(response.data.data)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics data')
    }
  }

  const fetchMLStatus = async () => {
    try {
      const response = await analyticsAPI.getMLStatus()
      setMLStatus(response.data.data)
    } catch (err: any) {
      console.error('Error fetching ML status:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view analytics</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ML insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ML Analytics Dashboard</h1>
                <p className="text-gray-600">AI-powered insights and predictions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ML Service Status */}
        <div className="mb-8">
          <MLServiceStatus status={mlStatus} />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Learners"
            value={insights.overview.totalLearners.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Recent Activities"
            value={insights.overview.recentActivities.toLocaleString()}
            icon={Activity}
            trend={`+${insights.trends.weeklyActivityGrowth}%`}
            color="green"
          />
          <StatCard
            title="Avg Engagement"
            value={`${insights.overview.avgEngagementHours}h`}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Completion Rate"
            value={`${insights.overview.avgCompletionRate}%`}
            icon={Target}
            color="green"
          />
        </div>

        {/* Risk Distribution and Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskDistributionChart distribution={insights.riskDistribution} />
          
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Platform Trends
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Weekly Activity Growth</span>
                <span className="text-sm font-medium text-green-600">
                  +{insights.trends.weeklyActivityGrowth}%
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Engagement Rate</span>
                <span className="text-sm font-medium text-blue-600">
                  {insights.trends.engagementRate}%
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Retention Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {insights.trends.retentionRate}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Key Insights */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI-Powered Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Risk Assessment</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  {insights.riskDistribution.highRisk} learners need immediate intervention
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  {insights.riskDistribution.mediumRisk} learners showing warning signs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {insights.riskDistribution.lowRisk} learners on track
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Focus on high-risk learners with personalized support</li>
                <li>• Implement early warning systems for medium-risk learners</li>
                <li>• Maintain engagement for successful learners</li>
                <li>• Review course difficulty and pacing</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
