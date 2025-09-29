// src/context/NotificationContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { NotificationWebSocket } from '../services/notificationsApi';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const wsRef = useRef(null);

  // Initialize WebSocket connection when user logs in
  useEffect(() => {
    if (!user) {
      // Cleanup when user logs out
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      setIsConnected(false);
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    // Load initial unread count
    loadUnreadCount();

    // Setup WebSocket connection
    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      
      // Update state
      setUnreadCount(prev => prev + 1);
      setRecentNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      
      // Show toast notification with custom styling
      toast.info(
        <NotificationToast notification={notification} />,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: 'notification-toast',
          onClick: () => {
            if (notification.action_url) {
              window.open(notification.action_url, '_blank');
            }
          }
        }
      );
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        const browserNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `notification_${notification.id}`,
          requireInteraction: notification.priority === 'urgent'
        });
        
        browserNotif.onclick = () => {
          if (notification.action_url) {
            window.focus();
            window.open(notification.action_url, '_blank');
          }
          browserNotif.close();
        };

        // Auto close after 10 seconds unless it's urgent
        if (notification.priority !== 'urgent') {
          setTimeout(() => browserNotif.close(), 10000);
        }
      }
    };

    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
      if (connected) {
        console.log('Notification WebSocket connected');
        // Show connection restored toast if this is a reconnection
        if (wsRef.current && wsRef.current.reconnectAttempts > 0) {
          toast.success('Real-time notifications restored');
        }
      } else {
        console.log('Notification WebSocket disconnected');
        // Show disconnection warning
        
      }
    };

    // Create and connect WebSocket
    wsRef.current = new NotificationWebSocket(handleNewNotification, handleConnectionChange);
    wsRef.current.connect();

    // Request notification permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Desktop notifications enabled');
        }
      });
    }

    // Cleanup on unmount or user change
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:8003/api/notifications/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setUnreadCount(stats.unread || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
    setRecentNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read', read_at: new Date().toISOString() }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setRecentNotifications(prev => 
      prev.map(notif => ({ 
        ...notif, 
        status: 'read', 
        read_at: notif.read_at || new Date().toISOString() 
      }))
    );
  };

  const clearNotification = (notificationId) => {
    setRecentNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const contextValue = {
    unreadCount,
    isConnected,
    recentNotifications,
    markNotificationAsRead,
    markAllAsRead,
    clearNotification,
    refreshUnreadCount: loadUnreadCount,
    ws: wsRef.current
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom notification toast component
const NotificationToast = ({ notification }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid_created':
      case 'bid_accepted':
      case 'bid_rejected':
        return '💰';
      case 'job_published':
      case 'job_application':
        return '💼';
      case 'new_message':
      case 'message_reply':
        return '💬';
      case 'payment_received':
        return '💳';
      case 'system_maintenance':
        return '🔧';
      default:
        return '🔔';
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-4 border-gray-500 bg-gray-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${getPriorityStyles(notification.priority)}`}>
      <div className="flex-shrink-0 text-xl">
        {getNotificationIcon(notification.notification_type_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {notification.title}
          </h4>
          {notification.priority === 'urgent' && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded font-medium">
              Urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">
          {notification.message}
        </p>
        {notification.action_text && (
          <div className="mt-2">
            <span className="text-xs text-blue-600 font-medium">
              Click to {notification.action_text.toLowerCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationContext;