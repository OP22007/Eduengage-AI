'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MLInsights from '@/components/MLInsights'
import RealTimeMLMonitor from '@/components/RealTimeMLMonitor'
import { analyticsAPI } from '@/lib/api'
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'

interface MLAnalyticsData {
  overview: {
    totalPredictions: number
    highRiskLearners: number
    interventionsSent: number
    modelAccuracy: number
  }
  trends: {
    weeklyRiskTrend: number
    engagementImprovement: number
    retentionIncrease: number
  }
  modelPerformance: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }
}

export default function MLAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<MLAnalyticsData | null>(null)
  const [mlStatus, setMlStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalyticsData()
    fetchMLStatus()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const response = await analyticsAPI.getOverview()
      // Mock enhanced data for demonstration
      setAnalyticsData({
        overview: {
          totalPredictions: 1247,
          highRiskLearners: response.data.data.riskDistribution.highRisk || 23,
          interventionsSent: 89,
          modelAccuracy: 94.5
        },
        trends: {
          weeklyRiskTrend: -12.3,
          engagementImprovement: 18.7,
          retentionIncrease: 15.2
        },
        modelPerformance: {
          accuracy: 94.5,
          precision: 92.1,
          recall: 88.9,
          f1Score: 90.4
        }
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMLStatus = async () => {
    try {
      const response = await analyticsAPI.getMlStatus()
      setMlStatus(response.data.data)
    } catch (err: any) {
      console.error('Failed to fetch ML status:', err)
    }
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    fetchAnalyticsData()
    fetchMLStatus()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Total ML Predictions',
      value: analyticsData?.overview.totalPredictions.toLocaleString() || '0',
      description: 'Generated this month',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+34%',
    },
    {
      title: 'High-Risk Identified',
      value: analyticsData?.overview.highRiskLearners.toString() || '0',
      description: 'Require immediate attention',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: analyticsData?.trends.weeklyRiskTrend ? `${analyticsData.trends.weeklyRiskTrend}%` : '-12%',
    },
    {
      title: 'Interventions Sent',
      value: analyticsData?.overview.interventionsSent.toString() || '0',
      description: 'AI-triggered this week',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+23%',
    },
    {
      title: 'Model Accuracy',
      value: `${analyticsData?.overview.modelAccuracy || 94.5}%`,
      description: 'Current model performance',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+2.1%',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <span>AI Analytics Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Advanced machine learning insights and real-time risk predictions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Model Settings
          </Button>
        </div>
      </div>

      {/* ML Status Banner */}
      {mlStatus && (
        <Card className={`border-l-4 ${mlStatus.status === 'healthy' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${mlStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-semibold text-gray-900">
                    ML Service Status: {mlStatus.status === 'healthy' ? 'Online' : 'Offline'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Model loaded with {mlStatus.features_count} features • 
                    {mlStatus.model_info ? ` ${mlStatus.model_info.training_samples} training samples` : ' Ready for predictions'}
                  </p>
                </div>
              </div>
              {mlStatus.model_info && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(mlStatus.model_info.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Model Accuracy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className={`text-sm font-medium ${card.trend.startsWith('+') ? 'text-green-600' : card.trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                  {card.trend}
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

      {/* Main ML Components */}
      <div className="space-y-8">
        {/* ML Overview */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">ML Overview & Batch Predictions</h2>
          <MLInsights showBatchPredictions={true} />
        </section>

        {/* Real-time Predictions */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Real-time Predictions</h2>
          <RealTimeMLMonitor />
        </section>

        {/* Model Performance */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Model Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
                <CardDescription>
                  Key performance indicators for the AI risk prediction model
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.modelPerformance ? (
                  <div className="space-y-4">
                    {Object.entries(analyticsData.modelPerformance).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-12">
                            {value.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance metrics loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Impact Metrics</span>
                </CardTitle>
                <CardDescription>
                  Real-world impact of AI-powered interventions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {analyticsData?.trends.retentionIncrease || 15.2}%
                    </div>
                    <div className="text-sm text-green-700">Retention Increase</div>
                    <div className="text-xs text-green-600 mt-1">Since AI implementation</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {analyticsData?.trends.engagementImprovement || 18.7}%
                    </div>
                    <div className="text-sm text-blue-700">Engagement Improvement</div>
                    <div className="text-xs text-blue-600 mt-1">For at-risk learners</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">82%</div>
                    <div className="text-sm text-purple-700">Intervention Success Rate</div>
                    <div className="text-xs text-purple-600 mt-1">AI-triggered interventions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* AI Insights */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Insights & Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>AI-Generated Insights</span>
                </CardTitle>
                <CardDescription>
                  Automated discoveries and recommendations from the ML model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Critical Pattern Detected</span>
                  </div>
                  <p className="text-sm text-red-800 mb-3">
                    Learners who skip Module 3 have 78% higher dropout risk. Recommend mandatory checkpoint.
                  </p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Implement Recommendation
                  </Button>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Time-based Insight</span>
                  </div>
                  <p className="text-sm text-yellow-800 mb-3">
                    Peak dropout risk occurs on Wednesdays. Consider scheduling extra support sessions.
                  </p>
                  <Button size="sm" variant="outline">
                    Schedule Sessions
                  </Button>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Success Pattern</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Learners who complete assignments within 24 hours show 65% higher completion rates.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Recommended Actions</span>
                </CardTitle>
                <CardDescription>
                  Prioritized interventions based on AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    priority: 'High',
                    action: 'Send intervention to 12 learners in Data Science course',
                    impact: 'Prevent 8-10 potential dropouts',
                    colorClass: 'border-l-red-500 bg-red-50 text-red-800'
                  },
                  {
                    priority: 'Medium',
                    action: 'Adjust pacing for Machine Learning module',
                    impact: 'Improve 23% of struggling learners',
                    colorClass: 'border-l-yellow-500 bg-yellow-50 text-yellow-800'
                  },
                  {
                    priority: 'Low',
                    action: 'Create peer mentoring program',
                    impact: 'Boost overall engagement by 15%',
                    colorClass: 'border-l-green-500 bg-green-50 text-green-800'
                  }
                ].map((item, index) => (
                  <div key={index} className={`p-3 border-l-4 rounded-r-lg ${item.colorClass}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {item.priority} Priority
                      </span>
                      <Button size="sm" variant="outline">
                        Execute
                      </Button>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {item.action}
                    </p>
                    <p className="text-xs opacity-75">
                      Expected impact: {item.impact}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
