// recruitment-ai-system/frontend/src/components/NotificationBanner.js

import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, Briefcase, FileText, Users } from 'lucide-react';

const NotificationBanner = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation
  }, [onClose]);

  useEffect(() => {
    // Auto-hide notification after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_job':
        return <Briefcase className="w-5 h-5" />;
      case 'new_application':
        return <FileText className="w-5 h-5" />;
      case 'job_match':
        return <Users className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_job':
        return 'bg-blue-500';
      case 'new_application':
        return 'bg-green-500';
      case 'job_match':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!notification || !isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className={`h-1 ${getNotificationColor(notification.type)}`}></div>
        
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(notification.type)} text-white`}>
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {notification.message}
              </p>
              
              {/* Additional info based on notification type */}
              {notification.matchScore && (
                <div className="text-xs text-gray-500">
                  Match Score: {notification.matchScore}%
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;