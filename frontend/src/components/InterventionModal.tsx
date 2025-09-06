'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { adminAPI } from '@/lib/api'
import { 
  Brain, 
  MessageSquare, 
  Clock, 
  Target, 
  Send,
  Sparkles,
  User,
  Mail,
  Calendar
} from 'lucide-react'

interface InterventionModalProps {
  learner: {
    _id: string
    userId: {
      profile: { name: string }
      email: string
    }
    enrollments: Array<{
      riskScore: number
      courseId: { title: string }
      status: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
  onNotificationSent?: (type: 'email' | 'sms', recipient: string, interventionType: string) => void
}

export default function InterventionModal({ learner, onClose, onSuccess, onNotificationSent }: InterventionModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [interventionData, setInterventionData] = useState({
    type: 'personalized_nudge',
    subject: '',
    content: '',
    scheduling: {
      immediate: true,
      scheduledFor: new Date().toISOString().slice(0, 16)
    }
  })

  const highestRisk = Math.max(...learner.enrollments.map(e => e.riskScore))
  const riskyCourse = learner.enrollments.find(e => e.riskScore === highestRisk)

  const generateAIContent = async () => {
    setIsGenerating(true)
    
    // Simulate AI content generation based on learner data
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const aiContent = {
      subject: `🎯 Don't lose momentum in ${riskyCourse?.courseId.title}!`,
      content: `Hi ${learner.userId.profile.name.split(' ')[0]},

I noticed you haven't been as active in "${riskyCourse?.courseId.title}" lately. You've made great progress so far, and I'd hate to see you lose momentum!

🌟 Here's what I suggest:
• Set aside just 15 minutes today to review your last completed module
• Try the interactive exercises in Module ${Math.floor(Math.random() * 5) + 1} - they're engaging and build on what you already know
• Join our study group session this Thursday at 2 PM for peer support

💪 Remember why you started: You're building valuable skills that will advance your career. Every small step counts!

Ready to jump back in? Click here to continue where you left off: [Continue Learning]

Best regards,
Your AI Learning Coach 🤖

P.S. You're just ${Math.round((1 - (riskyCourse?.riskScore || 0)) * 100)}% away from being back on track!`
    }
    
    setInterventionData(prev => ({
      ...prev,
      subject: aiContent.subject,
      content: aiContent.content
    }))
    
    setIsGenerating(false)
  }

  const sendIntervention = async () => {
    setIsSending(true)
    
    try {
      const response = await adminAPI.createIntervention({
        learnerId: learner._id,
        type: interventionData.type,
        trigger: 'manual_admin',
        content: {
          subject: interventionData.subject,
          message: interventionData.content,
          actionButton: {
            text: 'Continue Learning',
            url: '/dashboard'
          }
        },
        scheduling: interventionData.scheduling
      })
      
      // Determine risk level for notification channels
      const avgRiskScore = learner.enrollments.reduce((sum, e) => sum + e.riskScore, 0) / learner.enrollments.length
      const riskLevel = avgRiskScore > 0.7 ? 'high' : avgRiskScore > 0.4 ? 'medium' : 'low'
      
      // Simulate sending notifications based on risk level
      if (onNotificationSent) {
        // High risk: Email + SMS + In-app
        if (riskLevel === 'high') {
          onNotificationSent('email', learner.userId.email, interventionData.type)
          setTimeout(() => onNotificationSent?.('sms', 'phone number', interventionData.type), 500)
        } 
        // Medium risk: Email + In-app
        else if (riskLevel === 'medium') {
          onNotificationSent('email', learner.userId.email, interventionData.type)
        }
        // Low risk: Just in-app (handled by server)
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error sending intervention:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <span>AI-Powered Intervention</span>
            </CardTitle>
            <CardDescription className="text-purple-100">
              Create personalized intervention for {learner.userId.profile.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Learner Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {learner.userId.profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{learner.userId.profile.name}</h3>
                  <p className="text-sm text-gray-600">{learner.userId.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      {Math.round(highestRisk * 100)}% Risk Score
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {learner.enrollments.length} Courses
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generator */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-purple-900 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Content Generator</span>
                </h4>
                <Button
                  onClick={generateAIContent}
                  disabled={isGenerating}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Content
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-purple-800">
                Our AI will analyze the learner's behavior, progress, and risk factors to create a personalized intervention message.
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Subject Line</span>
              </label>
              <Input
                value={interventionData.subject}
                onChange={(e) => setInterventionData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject..."
                className="w-full"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Message Content</span>
              </label>
              <Textarea
                value={interventionData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterventionData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter intervention message..."
                rows={12}
                className="w-full resize-none"
              />
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Scheduling</span>
              </label>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="immediate"
                    checked={interventionData.scheduling.immediate}
                    onChange={() => setInterventionData(prev => ({
                      ...prev,
                      scheduling: { ...prev.scheduling, immediate: true }
                    }))}
                    className="text-blue-600"
                  />
                  <label htmlFor="immediate" className="text-sm text-gray-700">Send immediately</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="scheduled"
                    checked={!interventionData.scheduling.immediate}
                    onChange={() => setInterventionData(prev => ({
                      ...prev,
                      scheduling: { ...prev.scheduling, immediate: false }
                    }))}
                    className="text-blue-600"
                  />
                  <label htmlFor="scheduled" className="text-sm text-gray-700">Schedule for later</label>
                </div>
              </div>

              {!interventionData.scheduling.immediate && (
                <input
                  type="datetime-local"
                  value={interventionData.scheduling.scheduledFor}
                  onChange={(e) => setInterventionData(prev => ({
                    ...prev,
                    scheduling: { ...prev.scheduling, scheduledFor: e.target.value }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={sendIntervention}
                disabled={isSending || !interventionData.subject || !interventionData.content}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Intervention
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
