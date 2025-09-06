'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { analyticsAPI, adminAPI } from '@/lib/api'
import { 
  Search, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Users,
  Target,
  Clock,
  BarChart3
} from 'lucide-react'

interface LearnerPrediction {
  learnerId: string
  name: string
  email: string
  riskScore: number
  riskLevel: string
  confidence: number
  timestamp: string
}

export default function RealTimeMLMonitor() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLearner, setSelectedLearner] = useState<string>('')
  const [prediction, setPrediction] = useState<LearnerPrediction | null>(null)
  const [recentPredictions, setRecentPredictions] = useState<LearnerPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Sample learner IDs for demo (in real app, these would come from search)
  const sampleLearners = [
    { id: '64a123b45c789d012e345f67', name: 'John Doe', email: 'john.doe@example.com' },
    { id: '64a123b45c789d012e345f68', name: 'Jane Smith', email: 'jane.smith@example.com' },
    { id: '64a123b45c789d012e345f69', name: 'Mike Johnson', email: 'mike.johnson@example.com' },
  ]

  const handleGetPrediction = async (learnerId: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await adminAPI.getMlPrediction(learnerId)
      const { learner, prediction: pred } = response.data.data
      
      const newPrediction: LearnerPrediction = {
        learnerId: learner.id,
        name: learner.name,
        email: learner.email,
        riskScore: pred.risk_score,
        riskLevel: pred.risk_level || getRiskLevel(pred.risk_score),
        confidence: pred.confidence || 0.85,
        timestamp: new Date().toISOString()
      }
      
      setPrediction(newPrediction)
      
      // Add to recent predictions (keep last 5)
      setRecentPredictions(prev => {
        const updated = [newPrediction, ...prev.filter(p => p.learnerId !== learnerId)]
        return updated.slice(0, 5)
      })
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get prediction')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskLevel = (score: number): string => {
    if (score >= 0.7) return 'High'
    if (score >= 0.4) return 'Medium'
    return 'Low'
  }

  const getRiskColor = (score: number): string => {
    if (score >= 0.7) return 'text-red-600 bg-red-100'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskIcon = (score: number) => {
    if (score >= 0.7) return AlertTriangle
    if (score >= 0.4) return TrendingUp
    return CheckCircle
  }

  return (
    <div className="space-y-6">
      {/* Real-time Prediction Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Real-time ML Prediction</span>
          </CardTitle>
          <CardDescription>
            Get instant AI risk assessment for any learner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search/Select Learner */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search learner by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => selectedLearner && handleGetPrediction(selectedLearner)}
              disabled={!selectedLearner || isLoading}
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Predicting...' : 'Predict Risk'}
            </Button>
          </div>

          {/* Sample Learner Quick Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {sampleLearners.map((learner) => (
              <Button
                key={learner.id}
                variant={selectedLearner === learner.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLearner(learner.id)}
                className="justify-start text-left"
              >
                <div className="truncate">
                  <div className="font-medium">{learner.name}</div>
                  <div className="text-xs text-gray-500">{learner.email}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Current Prediction Result */}
          {prediction && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{prediction.name}</h4>
                  <p className="text-sm text-gray-600">{prediction.email}</p>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getRiskColor(prediction.riskScore)}`}>
                  {(() => {
                    const Icon = getRiskIcon(prediction.riskScore)
                    return <Icon className="h-4 w-4" />
                  })()}
                  <span className="font-medium">
                    {prediction.riskLevel} Risk ({(prediction.riskScore * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Confidence:</span>
                  <span className="ml-2 font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Generated:</span>
                  <span className="ml-2 font-medium">
                    {new Date(prediction.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Predictions History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Recent Predictions</span>
          </CardTitle>
          <CardDescription>
            Latest AI risk assessments performed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPredictions.length > 0 ? (
            <div className="space-y-3">
              {recentPredictions.map((pred, index) => (
                <div key={`${pred.learnerId}-${index}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {pred.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{pred.name}</p>
                        <p className="text-sm text-gray-500">{pred.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(pred.riskScore)}`}>
                      {pred.riskLevel} ({(pred.riskScore * 100).toFixed(0)}%)
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(pred.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No predictions generated yet</p>
              <p className="text-sm">Select a learner above to generate a prediction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
