'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info, Zap, MessageSquare, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { notificationsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'ai'
  title: string
  message: string
  timestamp: Date
  read: boolean
  metadata?: {
    learnerId?: string
    riskScore?: number
    riskLevel?: string
  }
  actions?: Array<{
    label: string
    type: string
    data: any
  }>
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getNotifications()
      const notificationsData = response.data.data.notifications || []
      
      // Convert timestamp strings to Date objects
      const formattedNotifications = notificationsData.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }))
      
      setNotifications(formattedNotifications)
      setUnreadCount(response.data.data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Fallback to mock data in case of error
      setMockNotifications()
    } finally {
      setLoading(false)
    }
  }

  const setMockNotifications = () => {
    if (user?.role === 'admin' || user?.role === 'instructor') {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High-Risk Learner Alert',
          message: 'Sarah Johnson shows 85% dropout risk',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          metadata: { learnerId: 'mock-learner-1', riskScore: 0.85, riskLevel: 'high' },
          actions: [
            { label: 'Send Intervention', type: 'intervention', data: { learnerId: 'mock-learner-1' } },
            { label: 'View Profile', type: 'view', data: { learnerId: 'mock-learner-1' } }
          ]
        },
        {
          id: '2',
          type: 'ai',
          title: 'AI Insight',
          message: 'Detected pattern: Learners struggle most with Module 3',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false
        },
        {
          id: '3',
          type: 'success',
          title: 'Intervention Successful',
          message: 'John Doe re-engaged after automated nudge (was at 92% risk)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        },
        {
          id: '4',
          type: 'info',
          title: 'Weekly Report Ready',
          message: 'Platform engagement report for this week is now available',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true
        }
      ]
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } else {
      const learnerNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Great Progress!',
          message: "You're 75% complete with your Data Science course. Keep it up!",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false
        },
        {
          id: '2',
          type: 'info',
          title: 'New Module Available',
          message: 'Module 4: Advanced Machine Learning is now available',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        }
      ]
      setNotifications(learnerNotifications)
      setUnreadCount(learnerNotifications.filter(n => !n.read).length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleAction = async (action: { label: string; type: string; data: any }) => {
    if (action.type === 'intervention') {
      try {
        await notificationsAPI.sendIntervention({
          learnerId: action.data.learnerId,
          interventionType: 'automated_nudge',
          message: 'Automated intervention triggered due to high dropout risk'
        })
        alert('Intervention sent successfully!')
      } catch (error) {
        console.error('Error sending intervention:', error)
        alert('Failed to send intervention')
      }
    } else if (action.type === 'view') {
      // Navigate to learner profile or analytics
      console.log('Navigate to learner profile:', action.data.learnerId)
    }
  }
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
      case 'ai': return <Zap className="h-5 w-5 text-purple-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !notification.read ? "text-gray-900" : "text-gray-700"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 leading-5">
                        {notification.message}
                      </p>
                      
                      {/* Risk Score Badge */}
                      {notification.metadata?.riskScore && (
                        <div className="flex items-center mt-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            notification.metadata.riskLevel === 'high' && "bg-red-100 text-red-800",
                            notification.metadata.riskLevel === 'medium' && "bg-yellow-100 text-yellow-800",
                            notification.metadata.riskLevel === 'low' && "bg-green-100 text-green-800"
                          )}>
                            {Math.round(notification.metadata.riskScore * 100)}% Risk
                          </span>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex items-center space-x-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.type === 'intervention' ? 'default' : 'outline'}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAction(action)
                              }}
                              className="text-xs"
                            >
                              {action.type === 'intervention' && <MessageSquare className="h-3 w-3 mr-1" />}
                              {action.type === 'view' && <Eye className="h-3 w-3 mr-1" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
