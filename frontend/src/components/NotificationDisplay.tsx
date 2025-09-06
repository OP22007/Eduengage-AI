'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { notificationsAPI } from '../lib/api';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error' | 'ai' | 'achievement' | 'admin-intervention';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  riskLevel?: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  metadata?: any;
  channels?: string[];
}

interface NotificationDisplayProps {
  showCount?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({
  showCount = 10,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await notificationsAPI.getNotifications({
        page: 1,
        limit: showCount,
        unreadOnly: false
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications.slice(0, showCount));
        setUnreadCount(response.data.data.unreadCount);
      } else {
        setError(response.data.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError('Network error fetching notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Track notification click
  const trackClick = async (notificationId: string) => {
    try {
      await notificationsAPI.trackClick(notificationId);
    } catch (err) {
      console.error('Error tracking notification click:', err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.dismiss(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Toggle expanded view
  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Get notification icon based on type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'success':
      case 'achievement':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'ai':
        return '🤖';
      case 'admin-intervention':
        return '👨‍🏫';
      default:
        return 'ℹ️';
    }
  };

  // Get notification color based on priority and type
  const getNotificationColor = (notification: Notification) => {
    if (notification.priority === 'high' || notification.riskLevel === 'high') {
      return 'border-red-200 bg-red-50';
    }
    if (notification.priority === 'medium' || notification.riskLevel === 'medium') {
      return 'border-yellow-200 bg-yellow-50';
    }
    if (notification.type === 'success' || notification.type === 'achievement') {
      return 'border-green-200 bg-green-50';
    }
    return 'border-blue-200 bg-blue-50';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    await trackClick(notification.id);
    toggleExpanded(notification.id);
  };

  useEffect(() => {
    fetchNotifications();

    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, showCount]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="text-red-700">
          <p className="font-medium">Error loading notifications</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchNotifications}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            <p>No notifications available</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                getNotificationColor(notification)
              } ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {notification.priority && (
                        <Badge
                          variant={notification.priority === 'high' ? 'destructive' : 
                                 notification.priority === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedNotifications.has(notification.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {notification.channels && notification.channels.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">Sent via: </span>
                          {notification.channels.map((channel, index) => (
                            <Badge key={channel} variant="outline" className="text-xs ml-1">
                              {channel}
                              {channel === 'email' && ' 📧'}
                              {channel === 'sms' && ' 📱'}
                              {channel === 'in-app' && ' 🔔'}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {notification.actionRequired && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Refresh button */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationDisplay;
