// src/services/notificationsApi.js
import axios from 'axios';

const API_BASE_URL =  'http://localhost:8003/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const notificationsApi = {
  // Get user notifications with pagination
  async getNotifications(params = {}) {
    try {
      const response = await apiClient.get('/notifications/', { params });
      return {
        notifications: response.data.results || response.data,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          totalPages: Math.ceil(response.data.count / (params.page_size || 20)),
          currentPage: params.page || 1,
          hasNext: !!response.data.next,
          hasPrevious: !!response.data.previous,
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await apiClient.get('/notifications/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  },

  // Mark single notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllNotificationsRead() {
    try {
      const response = await apiClient.post('/notifications/read-all/');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification (if supported by backend)
  // Delete notification (with optional service token)
async deleteNotification(notificationId) {
  const headers = {
      'Content-Type': 'application/json',
    };

    // Use service token if provided
 
      headers.Authorization = `Bearer secure-service-token-123`;

      // fallback to user token
   

    const response = await apiClient.delete(
      `/notifications/${notificationId}/delete/`,
      { headers }
    );
    console.log(headers)
    return response.data;
 
}
,

  // Create notification (for admin/service use)
  async createNotification(notificationData) {
    try {
      const response = await apiClient.post('/notifications/create/', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
};

// WebSocket connection for real-time notifications
export class NotificationWebSocket {
  constructor(onNotification, onConnectionChange) {
    this.ws = null;
    this.onNotification = onNotification;
    this.onConnectionChange = onConnectionChange;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
  }

  connect() {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    const wsUrl = `ws://localhost:8003/ws/notifications/?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to notification WebSocket');
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            this.onNotification?.(data.data);
          } else if (data.type === 'connection_established') {
            console.log('Notification WebSocket connection established');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('Notification WebSocket connection closed:', event.code);
        this.onConnectionChange?.(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect notification WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, this.reconnectInterval);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  markNotificationRead(notificationId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }
  }

  markAllNotificationsRead() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'mark_all_read'
      }));
    }
  }
}