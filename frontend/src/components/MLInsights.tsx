'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { analyticsAPI, adminAPI } from '@/lib/api'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Zap,
  Target,
  RefreshCw,
  BarChart3,
  Users,
  Clock
} from 'lucide-react'

interface MLPrediction {
  risk_score: number
  risk_level: string
  confidence: number
  factors?: {
    engagement_score: number
    progress_trend: number
    activity_consistency: number
    [key: string]: any
  }
}

interface MLStatus {
  status: string
  model_loaded: boolean
  features_count: number
  model_info?: {
    accuracy: number
    model_type: string
    training_samples: number
  }
}

interface MLInsightsProps {
  learnerId?: string
  showBatchPredictions?: boolean
  className?: string
}

export default function MLInsights({ learnerId, showBatchPredictions = false, className = '' }: MLInsightsProps) {
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null)
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)
  const [batchPredictions, setBatchPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMLStatus()
    if (learnerId) {
      fetchPrediction()
    } else if (showBatchPredictions) {
      fetchBatchPredictions()
    }
  }, [learnerId, showBatchPredictions])

  const fetchMLStatus = async () => {
    try {
      const response = await analyticsAPI.getMlStatus()
      setMlStatus(response.data.data)
    } catch (err: any) {
      console.error('Failed to fetch ML status:', err)
    }
  }

  const fetchPrediction = async () => {
    if (!learnerId) return
    
    setIsLoading(true)
    try {
      const response = await adminAPI.getMlPrediction(learnerId)
      setPrediction(response.data.data.prediction)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get ML prediction')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBatchPredictions = async () => {
    setIsLoading(true)
    try {
      // Get sample learner IDs for batch prediction
      const response = await analyticsAPI.predictBatch(['sample1', 'sample2', 'sample3'])
      setBatchPredictions(response.data.data.predictions || [])
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get batch predictions')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.7) return 'text-red-600 bg-red-100'
    if (riskScore >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskIcon = (riskScore: number) => {
    if (riskScore >= 0.7) return AlertTriangle
    if (riskScore >= 0.4) return TrendingUp
    return CheckCircle
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ML Service Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Model Status</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMLStatus}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mlStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${mlStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {mlStatus.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{mlStatus.features_count}</p>
                <p className="text-xs text-gray-500">Features</p>
              </div>
              {mlStatus.model_info && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {(mlStatus.model_info.accuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {mlStatus.model_info.training_samples}
                    </p>
                    <p className="text-xs text-gray-500">Training Samples</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Checking ML service...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Learner Prediction */}
      {learnerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>AI Risk Assessment</span>
            </CardTitle>
            <CardDescription>
              Real-time risk prediction using 42 behavioral features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchPrediction} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : prediction ? (
              <div className="space-y-6">
                {/* Risk Score Display */}
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getRiskColor(prediction.risk_score)}`}>
                    {(() => {
                      const Icon = getRiskIcon(prediction.risk_score)
                      return <Icon className="h-5 w-5" />
                    })()}
                    <span className="font-semibold">
                      {prediction.risk_level} Risk ({(prediction.risk_score * 100).toFixed(1)}%)
                    </span>
                  </div>
                  {prediction.confidence && (
                    <p className="text-sm text-gray-500 mt-2">
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>

                {/* Risk Factors */}
                {prediction.factors && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(prediction.factors.engagement_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(prediction.factors.progress_trend * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Progress Trend</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(prediction.factors.activity_consistency * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Consistency</div>
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">AI Recommendations</span>
                  </div>
                  <div className="space-y-1 text-sm text-blue-800">
                    {prediction.risk_score >= 0.7 ? (
                      <>
                        <p>• Send immediate intervention - high dropout risk detected</p>
                        <p>• Schedule one-on-one support session</p>
                        <p>• Provide personalized learning path adjustments</p>
                      </>
                    ) : prediction.risk_score >= 0.4 ? (
                      <>
                        <p>• Monitor closely for engagement drop</p>
                        <p>• Send encouraging check-in message</p>
                        <p>• Suggest additional practice materials</p>
                      </>
                    ) : (
                      <>
                        <p>• Learner is on track - maintain current engagement</p>
                        <p>• Consider offering advanced challenges</p>
                        <p>• Use as peer mentor for struggling learners</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No prediction data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Batch Predictions Summary */}
      {showBatchPredictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span>Batch Risk Analysis</span>
            </CardTitle>
            <CardDescription>
              AI-powered risk assessment for multiple learners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : batchPredictions.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {batchPredictions.filter(p => p.risk_score >= 0.7).length}
                    </div>
                    <div className="text-sm text-red-600">High Risk</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {batchPredictions.filter(p => p.risk_score >= 0.4 && p.risk_score < 0.7).length}
                    </div>
                    <div className="text-sm text-yellow-600">Medium Risk</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {batchPredictions.filter(p => p.risk_score < 0.4).length}
                    </div>
                    <div className="text-sm text-green-600">Low Risk</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button onClick={fetchBatchPredictions} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Predictions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No batch prediction data available</p>
                <Button onClick={fetchBatchPredictions} className="mt-4">
                  Generate Batch Predictions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
