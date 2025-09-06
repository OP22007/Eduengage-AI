'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Mail, MessageSquare, CheckCircle } from 'lucide-react';

interface PopupMessage {
  id: string;
  type: 'email' | 'sms' | 'success' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

interface NotificationPopupProps {
  messages: PopupMessage[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  messages,
  onClose,
  position = 'top-right'
}) => {
  const [visibleMessages, setVisibleMessages] = useState<PopupMessage[]>([]);

  useEffect(() => {
    setVisibleMessages(messages);

    // Auto-close messages with duration
    messages.forEach(message => {
      if (message.duration && message.duration > 0) {
        setTimeout(() => {
          onClose(message.id);
        }, message.duration);
      }
    });
  }, [messages, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'border-blue-200 bg-blue-50';
      case 'sms':
        return 'border-green-200 bg-green-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm w-full`}>
      {visibleMessages.map((message) => (
        <Card
          key={message.id}
          className={`${getBorderColor(message.type)} shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {message.title}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      {message.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto hover:bg-gray-200"
                    onClick={() => onClose(message.id)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>

                {message.actions && message.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={action.variant || 'outline'}
                        onClick={action.action}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Channel badges */}
                <div className="flex gap-1 mt-2">
                  {message.type === 'email' && (
                    <Badge variant="outline" className="text-xs">
                      📧 Email
                    </Badge>
                  )}
                  {message.type === 'sms' && (
                    <Badge variant="outline" className="text-xs">
                      📱 SMS
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Hook for managing popup messages
export const useNotificationPopup = () => {
  const [messages, setMessages] = useState<PopupMessage[]>([]);

  const addMessage = (message: Omit<PopupMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newMessage = { ...message, id };
    setMessages(prev => [...prev, newMessage]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const clearAll = () => {
    setMessages([]);
  };

  // Convenience methods for common message types
  const showEmailSent = (recipient: string) => {
    return addMessage({
      type: 'email',
      title: 'Email Sent Successfully',
      message: `Email notification sent to ${recipient}`,
      duration: 4000
    });
  };

  const showSMSSent = (recipient: string) => {
    return addMessage({
      type: 'sms',
      title: 'SMS Sent Successfully', 
      message: `SMS notification sent to ${recipient}`,
      duration: 4000
    });
  };

  const showInterventionSent = (interventionType: string, channels: string[]) => {
    const channelText = channels.join(' and ');
    return addMessage({
      type: 'success',
      title: 'Intervention Sent',
      message: `${interventionType} intervention sent via ${channelText}`,
      duration: 5000
    });
  };

  const showError = (error: string) => {
    return addMessage({
      type: 'error',
      title: 'Error',
      message: error,
      duration: 6000
    });
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearAll,
    showEmailSent,
    showSMSSent,
    showInterventionSent,
    showError
  };
};

export default NotificationPopup;
