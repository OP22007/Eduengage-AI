'use client';
import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: {
    learnerId?: string;
    riskScore?: number;
    riskLevel?: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const formattedNotifications = data.data.notifications.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
          type: notif.type === 'ai' ? 'info' : notif.type // Convert ai type to info
        }));
        
        setNotifications(formattedNotifications);
        setUnreadCount(data.data.unreadCount);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Fallback to mock data if API fails
      setNotifications(getMockNotifications());
      setUnreadCount(3);
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    if (!user) return [];
    
    if (user.role === 'admin' || user.role === 'instructor') {
      return [
        {
          id: '1',
          type: 'warning',
          title: 'Student Needs Attention',
          message: 'Sarah Johnson has been inactive for 5 days and may need support',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false,
          metadata: {
            learnerId: '507f1f77bcf86cd799439011',
            riskScore: 0.87,
            riskLevel: 'high'
          }
        },
        {
          id: '2',
          type: 'info',
          title: 'Weekly Report Ready',
          message: 'Platform engagement report for this week is now available',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Medium-Risk Learner',
          message: 'Mike Chen may need additional support based on recent activity',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          read: false,
          metadata: {
            learnerId: '507f1f77bcf86cd799439012',
            riskScore: 0.72,
            riskLevel: 'medium'
          }
        },
        {
          id: '4',
          type: 'success',
          title: 'Student Progress',
          message: 'Alex Rodriguez completed their first course milestone',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true
        },
        {
          id: '5',
          type: 'info',
          title: 'Course Analysis',
          message: 'Module 3 in Data Science course has the highest dropout rate (23%)',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          read: true
        }
      ];
    } else {
      // Learner notifications
      return [
        {
          id: '1',
          type: 'success',
          title: 'Great Progress!',
          message: "You're 85% complete with your Data Science course. Keep it up!",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false
        },
        {
          id: '2',
          type: 'info',
          title: 'New Course Recommendation',
          message: 'Based on your progress, we recommend "Advanced Machine Learning"',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Study Reminder',
          message: 'Take the next step in your learning journey. Complete your next module today!',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          read: true
        }
      ];
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'system':
        return <User className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-100 bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-20 bg-white">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Risk metadata for admin/instructor */}
                      {notification.metadata?.riskScore && (user?.role === 'admin' || user?.role === 'instructor') && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Risk Level: {notification.metadata.riskLevel} 
                          {notification.metadata.riskScore && 
                            ` (${Math.round(notification.metadata.riskScore * 100)}%)`
                          }
                        </div>
                      )}

                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
