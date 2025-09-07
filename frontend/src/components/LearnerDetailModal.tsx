'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { adminAPI } from '@/lib/api'
import { 
  X, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar,
  BookOpen,
  Activity,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Users,
  Zap
} from 'lucide-react'
import { formatPercentage, cn } from '@/lib/utils'

interface LearnerDetailModalProps {
  learner: any
  isOpen: boolean
  onClose: () => void
  onSendIntervention: (learner: any, type: string, message: string) => void
}

export default function LearnerDetailModal({ 
  learner, 
  isOpen, 
  onClose, 
  onSendIntervention 
}: LearnerDetailModalProps) {
  const [aiInsights, setAIInsights] = useState<any>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && learner) {
      fetchAIInsights()
    }
  }, [isOpen, learner])

  const fetchAIInsights = async () => {
    try {
      setIsLoadingInsights(true)
      setInsightsError(null)
      const response = await adminAPI.getInterventionSuggestions(learner._id)
      
      // Validate the response structure
      const data = response.data.data
      if (data) {
        console.log('AI Insights received:', data) // Debug log
        
        // Ensure intervention_suggestions is an array
        if (data.intervention_suggestions && !Array.isArray(data.intervention_suggestions)) {
          console.warn('intervention_suggestions is not an array, converting to empty array')
          data.intervention_suggestions = []
        }
        setAIInsights(data)
      } else {
        setAIInsights(null)
        setInsightsError('No AI insights available')
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      setInsightsError('Failed to load AI insights. Please try again.')
      setAIInsights(null)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  if (!isOpen || !learner) return null

  const avgRiskScore = learner.enrollments.length > 0 ? 
    learner.enrollments.reduce((sum: number, e: any) => sum + (e.riskScore || 0), 0) / learner.enrollments.length : 0
  
  const activeCourses = learner.enrollments.filter((e: any) => e.status === 'active').length
  const completedCourses = learner.enrollments.filter((e: any) => e.status === 'completed').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {learner.userId?.profile?.name?.charAt(0) || 'L'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {learner.userId?.profile?.name || 'Unknown Learner'}
              </h2>
              <p className="text-gray-600">{learner.userId?.email}</p>
              <Badge 
                variant={avgRiskScore >= 0.7 ? 'destructive' : avgRiskScore >= 0.4 ? 'secondary' : 'default'}
                className="mt-1"
              >
                {avgRiskScore >= 0.7 ? 'High Risk' : avgRiskScore >= 0.4 ? 'Medium Risk' : 'Low Risk'}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-700 font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="progress" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-700 font-medium"
              >
                Progress
              </TabsTrigger>
              <TabsTrigger 
                value="ai-insights" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-700 font-medium"
              >
                AI Insights
              </TabsTrigger>
              <TabsTrigger 
                value="intervention" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-700 font-medium"
              >
                Intervention
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Risk Score</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatPercentage(avgRiskScore)}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Learning Streak</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {learner.engagement?.streakDays || 0}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Hours</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(learner.engagement?.totalHours || 0)}h
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercentage(learner.engagement?.completionRate || 0)}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Average Session Time</span>
                        <span className="font-bold text-gray-900">
                          {Math.round(learner.engagement?.avgSessionTime || 0)} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Last Login</span>
                        <span className="font-bold text-gray-900">
                          {learner.engagement?.lastLogin 
                            ? new Date(learner.engagement.lastLogin).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Join Date</span>
                        <span className="font-bold text-gray-900">
                          {learner.userId?.profile?.joinDate
                            ? new Date(learner.userId.profile.joinDate).toLocaleDateString()
                            : 'Unknown'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Active Courses</span>
                        <span className="font-bold text-gray-900">{activeCourses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Completed Courses</span>
                        <span className="font-bold text-gray-900">{completedCourses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Weekly Goal Hours</span>
                        <span className="font-bold text-gray-900">
                          {learner.engagement?.weeklyGoalHours || 0}h
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Progress</CardTitle>
                  <CardDescription>
                    Detailed progress tracking for all enrolled courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learner.enrollments.map((enrollment: any, index: number) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {enrollment.courseId?.title || 'Unknown Course'}
                            </h4>
                            <p className="text-sm text-gray-800 font-medium">
                              {enrollment.courseId?.category} • {enrollment.courseId?.difficulty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatPercentage(enrollment.progress)}
                            </p>
                            <Badge variant={
                              enrollment.status === 'completed' ? 'default' :
                              enrollment.status === 'active' ? 'secondary' :
                              'destructive'
                            }>
                              {enrollment.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                enrollment.progress >= 0.8 ? 'bg-green-500' :
                                enrollment.progress >= 0.5 ? 'bg-blue-500' :
                                'bg-orange-500'
                              )}
                              style={{ width: `${enrollment.progress * 100}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-800 font-medium">
                              Risk Score: <span className="font-bold text-gray-900">{formatPercentage(enrollment.riskScore || 0)}</span>
                            </span>
                            <span className="text-gray-800 font-medium">
                              Last Activity: <span className="font-bold text-gray-900">{enrollment.lastActivity 
                                ? new Date(enrollment.lastActivity).toLocaleDateString()
                                : 'Never'
                              }</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI-Powered Insights
                
                  </CardTitle>
                  <CardDescription>
                    Advanced analytics and recommendations for this learner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInsights ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-gray-600">Generating AI insights...</span>
                    </div>
                  ) : aiInsights ? (
                    <div className="space-y-6">
                      {/* Risk Assessment */}
                      {aiInsights.risk_assessment && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Risk Assessment
                          </h4>
                          <p className="text-sm text-red-800 mb-2">
                            Risk Level: <strong>{aiInsights.risk_assessment.risk_level}</strong>
                          </p>
                          <p className="text-sm text-red-700">
                            {aiInsights.risk_assessment.explanation}
                          </p>
                        </div>
                      )}

                      {/* Intervention Suggestions */}
                      {aiInsights.intervention_suggestions && Array.isArray(aiInsights.intervention_suggestions) && aiInsights.intervention_suggestions.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Recommended Interventions
                          </h4>
                          {aiInsights.intervention_suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-blue-900 mb-1">
                                    {suggestion.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </h5>
                                  <p className="text-sm text-blue-800 mb-2">
                                    {suggestion.message}
                                  </p>
                                  <p className="text-xs text-blue-700">
                                    <strong>Why:</strong> {suggestion.reasoning}
                                  </p>
                                </div>
                                <Badge variant={
                                  suggestion.priority === 'high' ? 'destructive' :
                                  suggestion.priority === 'medium' ? 'secondary' : 'default'
                                }>
                                  {suggestion.priority}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : aiInsights && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Intervention Suggestions
                          </h4>
                          <p className="text-sm text-gray-600">
                            No specific intervention suggestions available at this time. 
                            You can use the Intervention tab to send a custom message.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : insightsError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-600 mb-4">{insightsError}</p>
                      <Button 
                        onClick={fetchAIInsights} 
                        className="flex items-center gap-2"
                        disabled={isLoadingInsights}
                      >
                        <Zap className="h-4 w-4" />
                        {isLoadingInsights ? 'Generating...' : 'Try Again'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No AI insights available yet</p>
                      <Button 
                        onClick={fetchAIInsights} 
                        className="flex items-center gap-2"
                        disabled={isLoadingInsights}
                      >
                        <Zap className="h-4 w-4" />
                        {isLoadingInsights ? 'Generating...' : 'Generate AI Insights'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Intervention Tab */}
            <TabsContent value="intervention" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Send Intervention
                  </CardTitle>
                  <CardDescription>
                    Send a personalized message or intervention to help this learner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-900 block mb-2">Intervention Type</label>
                      <select className="w-full mt-1 p-3 border border-gray-300 rounded-md font-medium text-gray-900 bg-white" id="intervention-type">
                        <option value="personalized_nudge">Personalized Nudge</option>
                        <option value="motivational_message">Motivational Message</option>
                        <option value="study_reminder">Study Reminder</option>
                        <option value="resource_recommendation">Resource Recommendation</option>
                        <option value="check_in">Check-in Request</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-bold text-gray-900 block mb-2">Message</label>
                      <textarea
                        id="intervention-message"
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md font-medium text-gray-900 bg-white"
                        rows={5}
                        placeholder="Enter your personalized message here..."
                        defaultValue={
                          avgRiskScore >= 0.7 
                            ? `Hi ${learner.userId?.profile?.name?.split(' ')[0]}, I noticed you might be facing some challenges with your current courses. Would you like to schedule a quick 15-minute check-in to discuss how I can better support your learning goals?`
                            : `Hi ${learner.userId?.profile?.name?.split(' ')[0]}, great job on your learning progress! I have some personalized recommendations that might help you accelerate your learning even further. Let's connect soon!`
                        }
                      />
                    </div>

                    {/* Quick Message Templates */}
                    <div>
                      <label className="text-sm font-bold text-gray-900 mb-3 block">Quick Templates</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-medium text-gray-800 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const textarea = document.getElementById('intervention-message') as HTMLTextAreaElement
                            textarea.value = `Hi ${learner.userId?.profile?.name?.split(' ')[0]}, I noticed you haven't been active lately. Is there anything I can help you with to get back on track?`
                          }}
                        >
                          Re-engagement
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-medium text-gray-800 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const textarea = document.getElementById('intervention-message') as HTMLTextAreaElement
                            textarea.value = `Great progress ${learner.userId?.profile?.name?.split(' ')[0]}! Here are some additional resources that might interest you based on your learning patterns.`
                          }}
                        >
                          Encouragement
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-medium text-gray-800 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const textarea = document.getElementById('intervention-message') as HTMLTextAreaElement
                            textarea.value = `Hi ${learner.userId?.profile?.name?.split(' ')[0]}, would you like to schedule a study session? I have some tips that could help with your current courses.`
                          }}
                        >
                          Study Support
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-medium text-gray-800 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const textarea = document.getElementById('intervention-message') as HTMLTextAreaElement
                            textarea.value = `${learner.userId?.profile?.name?.split(' ')[0]}, I'd love to hear about your learning experience so far. What's working well and what could be improved?`
                          }}
                        >
                          Feedback Request
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => {
                          const type = (document.getElementById('intervention-type') as HTMLSelectElement)?.value || 'personalized_nudge'
                          const message = (document.getElementById('intervention-message') as HTMLTextAreaElement)?.value || ''
                          onSendIntervention(learner, type, message)
                          onClose()
                        }}
                        className="flex-1 font-bold text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Send Intervention
                      </Button>
                      <Button variant="outline" onClick={onClose} className="font-bold text-gray-900 border-gray-300 hover:bg-gray-50">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
