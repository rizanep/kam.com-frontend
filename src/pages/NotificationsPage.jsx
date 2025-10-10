import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Eye, Trash2, Check, CheckCheck, Search, Calendar, 
  User, MessageSquare, Briefcase, DollarSign, AlertCircle, 
  CheckCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, Settings,
  Archive, X, Filter
} from 'lucide-react';
import { notificationsApi, NotificationWebSocket } from '../services/notificationsApi';
import { toast } from "sonner"
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    today: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Search and View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'unread', 'read'
  

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });
  
  // Selection for bulk actions
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'single', 'bulk', 'all_read'
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // WebSocket connection
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      
      setNotifications(prev => [notification, ...prev]);
      setNotificationStats(prev => ({
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        today: prev.today + 1
      }));
      
      // Show toast notification
      toast.info(
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.notification_type_name)}
          </div>
          <div>
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-xs text-gray-600 mt-1">
              {notification.message.length > 60 
                ? notification.message.substring(0, 60) + '...' 
                : notification.message
              }
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
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
          tag: notification.id
        });
        
        browserNotif.onclick = () => {
          if (notification.action_url) {
            window.open(notification.action_url, '_blank');
          }
          browserNotif.close();
        };
      }
    };

    wsRef.current = new NotificationWebSocket(handleNewNotification, setWsConnected);
    wsRef.current.connect();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadNotificationStats();
    }
  }, [currentPage, sortBy, searchQuery, viewMode, user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: 20,
        ...(searchQuery && { search: searchQuery }),
        ordering: sortBy === 'newest' ? '-created_at' : 'created_at'
      };

      const response = await notificationsApi.getNotifications(params);
      setNotifications(response.notifications);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setMessage('Error loading notifications. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await notificationsApi.getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markNotificationRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setNotificationStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1
      }));

      // Also send via WebSocket
      if (wsRef.current) {
        wsRef.current.markNotificationRead(notificationId);
      }

      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error marking notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllNotificationsRead();
      
      // Update local state
      const unreadCount = notifications.filter(n => n.status !== 'read').length;
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          status: 'read', 
          read_at: notif.read_at || new Date().toISOString() 
        }))
      );
      
      setNotificationStats(prev => ({
        ...prev,
        unread: 0,
        read: prev.total
      }));

      // Also send via WebSocket
      if (wsRef.current) {
        wsRef.current.markAllNotificationsRead();
      }

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error marking all notifications as read');
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationsApi.markNotificationRead(id)
      );
      
      await Promise.all(promises);
      
      // Update local state
      const unreadSelected = notifications.filter(n => 
        selectedNotifications.has(n.id) && n.status !== 'read'
      ).length;

      setNotifications(prev => 
        prev.map(notif => 
          selectedNotifications.has(notif.id)
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setNotificationStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - unreadSelected),
        read: prev.read + unreadSelected
      }));

      setSelectedNotifications(new Set());
      setSelectAll(false);
      toast.success(`${selectedNotifications.size} notifications marked as read`);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Error marking selected notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      
      // Remove from local state
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      setNotificationStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: deletedNotif?.status !== 'read' ? Math.max(0, prev.unread - 1) : prev.unread,
        read: deletedNotif?.status === 'read' ? Math.max(0, prev.read - 1) : prev.read
      }));

      toast.success('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error deleting notification');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationsApi.deleteNotification(id)
      );
      
      await Promise.all(promises);
      
      // Update local state
      const deletedNotifs = notifications.filter(n => selectedNotifications.has(n.id));
      const deletedUnread = deletedNotifs.filter(n => n.status !== 'read').length;
      const deletedRead = deletedNotifs.filter(n => n.status === 'read').length;

      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.has(notif.id))
      );
      
      setNotificationStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - selectedNotifications.size),
        unread: Math.max(0, prev.unread - deletedUnread),
        read: Math.max(0, prev.read - deletedRead)
      }));

      setSelectedNotifications(new Set());
      setSelectAll(false);
      setShowDeleteModal(false);
      toast.success(`${selectedNotifications.size} notifications deleted`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Error deleting selected notifications');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const readNotifications = notifications.filter(n => n.status === 'read');
      const promises = readNotifications.map(notif =>
        notificationsApi.deleteNotification(notif.id)
      );
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.status !== 'read'));
      
      setNotificationStats(prev => ({
        ...prev,
        total: prev.unread,
        read: 0
      }));

      setShowDeleteModal(false);
      toast.success(`${readNotifications.length} read notifications deleted`);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('Error deleting read notifications');
    }
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
    setSelectAll(newSelected.size === filteredNotifications.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications(new Set());
      setSelectAll(false);
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
      setSelectAll(true);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (notification.status !== 'read') {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid_created':
      case 'bid_accepted':
      case 'bid_rejected':
        return <DollarSign size={20} className="text-green-600" />;
      case 'job_published':
      case 'job_application':
        return <Briefcase size={20} className="text-blue-600" />;
      case 'new_message':
      case 'message_reply':
        return <MessageSquare size={20} className="text-purple-600" />;
      case 'payment_received':
        return <DollarSign size={20} className="text-green-600" />;
      case 'system_maintenance':
        return <Settings size={20} className="text-gray-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read': return 'bg-gray-100 text-gray-600';
      case 'delivered': return 'bg-blue-100 text-blue-600';
      case 'sent': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter notifications based on view mode and search
  const filteredNotifications = notifications.filter(notification => {
    // Search filter
    const matchesSearch = !searchQuery || 
      notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchQuery.toLowerCase());

    // View mode filter
    if (viewMode === 'unread') {
      return matchesSearch && notification.status !== 'read';
    } else if (viewMode === 'read') {
      return matchesSearch && notification.status === 'read';
    }
    
    return matchesSearch;
  });
  // Separate unread and read notifications
  const unreadNotifications = filteredNotifications.filter(n => n.status !== 'read');
  const readNotifications = filteredNotifications.filter(n => n.status === 'read');
  // Show loading if user not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please log in to view notifications...</p>
        </div>
      </div>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {wsConnected && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </div>
              )}
              {!wsConnected && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Offline
                </div>
              )}
            </div>
            <p className="text-gray-600">Stay updated with your latest activities</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadNotifications()}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Refresh notifications"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={handleMarkAllAsRead}
              disabled={notificationStats.unread === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>

            <button
              onClick={() => {
                setDeleteType('all_read');
                setShowDeleteModal(true);
              }}
              disabled={notificationStats.read === 0}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Read
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message.includes('Error') || message.includes('Failed') ? 
              <AlertCircle size={20} className="mr-2" /> : 
              <CheckCircle size={20} className="mr-2" />
            }
            {message}
          </div>
        )}

        {/* Stats Cards */}
        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.total_notifications
 || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.unread_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Read</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.read_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.today || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search, Sort and View Mode */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Tabs */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {[
                { key: 'all', label: 'All', count: filteredNotifications.length },
                { key: 'unread', label: 'Unread', count: unreadNotifications.length },
                { key: 'read', label: 'Read', count: readNotifications.length }
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === mode.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {mode.label} ({mode.count})
                </button>
              ))}
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedNotifications.size} notification{selectedNotifications.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => {
                    setDeleteType('bulk');
                    setShowDeleteModal(true);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedNotifications(new Set());
                    setSelectAll(false);
                  }}
                  className="text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-6">
          {/* Show separated sections only when viewing all notifications */}
          {viewMode === 'all' ? (
            <>
              {/* Unread Notifications Section */}
              {filteredNotifications.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="text-green-600" size={20} />
                        All Notifications ({filteredNotifications.length})
                      </h3>
                    </div>
                  </div>
                  <NotificationsList 
                    notifications={filteredNotifications}
                    selectedNotifications={selectedNotifications}
                    onSelectNotification={handleSelectNotification}
                    onNotificationClick={handleNotificationClick}
                    onMarkAsRead={handleMarkAsRead}
                    onDeleteNotification={handleDeleteNotification}
                    getNotificationIcon={getNotificationIcon}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    formatTimeAgo={formatTimeAgo}
                  />
                </div>
              )}

              {/* Empty state for all view */}
              {unreadNotifications.length === 0 && readNotifications.length === 0 && (
                <EmptyNotificationsState searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              )}
            </>
          ) : (
            /* Single section view for unread or read only */
            <div className="bg-white rounded-lg border border-gray-200">
              {filteredNotifications.length > 0 ? (
                <>
                  {/* Header with select all */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">
                          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {pagination.totalPages}
                      </div>
                    </div>
                  </div>
                  <NotificationsList 
                    notifications={filteredNotifications}
                    selectedNotifications={selectedNotifications}
                    onSelectNotification={handleSelectNotification}
                    onNotificationClick={handleNotificationClick}
                    onMarkAsRead={handleMarkAsRead}
                    onDeleteNotification={handleDeleteNotification}
                    getNotificationIcon={getNotificationIcon}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    formatTimeAgo={formatTimeAgo}
                  />
                </>
              ) : (
                <EmptyNotificationsState searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrevious}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, pagination.count)} of {pagination.count}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              if (deleteType === 'bulk') {
                handleBulkDelete();
              } else if (deleteType === 'all_read') {
                handleDeleteAllRead();
              } else if (deleteType === 'single') {
                handleDeleteNotification(deleteTarget);
                setShowDeleteModal(false);
              }
            }}
            deleteType={deleteType}
            selectedCount={selectedNotifications.size}
            readCount={notificationStats.read}
          />
        )}
      </div>
    </div>
  );
};

// Notifications List Component
const NotificationsList = ({ 
  notifications, 
  selectedNotifications, 
  onSelectNotification, 
  onNotificationClick, 
  onMarkAsRead, 
  onDeleteNotification,
  getNotificationIcon,
  getPriorityColor,
  getStatusColor,
  formatTimeAgo
}) => (
  <div className="divide-y divide-gray-200">
    {notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
          notification.status === 'read' ? 'opacity-75' : ''
        } ${getPriorityColor(notification.priority)}`}
        onClick={() => onNotificationClick(notification)}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selectedNotifications.has(notification.id)}
            onChange={(e) => {
              e.stopPropagation();
              onSelectNotification(notification.id);
            }}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />

          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.notification_type_name)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-medium ${
                    notification.status === 'read' ? 'text-gray-700' : 'text-gray-900'
                  }`}>
                    {notification.title}
                  </h3>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                    {notification.status}
                  </span>

                  {/* Priority Badge */}
                  {notification.priority === 'urgent' && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Urgent
                    </span>
                  )}
                  {notification.priority === 'high' && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      High
                    </span>
                  )}
                </div>

                <p className={`text-sm mb-2 ${
                  notification.status === 'read' ? 'text-gray-600' : 'text-gray-700'
                }`}>
                  {notification.message}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimeAgo(notification.created_at)}
                  </span>
                  
                  {notification.data?.sender_name && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {notification.data.sender_name}
                    </span>
                  )}

                  {notification.read_at && (
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      Read {formatTimeAgo(notification.read_at)}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                {notification.action_url && notification.action_text && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNotificationClick(notification);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {notification.action_text}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {notification.status !== 'read' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Additional Data Display */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {notification.data.job_title && (
                    <div>
                      <span className="font-medium text-gray-700">Job:</span>
                      <span className="text-gray-600 ml-1">{notification.data.job_title}</span>
                    </div>
                  )}
                  {notification.data.bid_amount && (
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="text-gray-600 ml-1">${notification.data.bid_amount}</span>
                    </div>
                  )}
                  {notification.data.project_name && (
                    <div>
                      <span className="font-medium text-gray-700">Project:</span>
                      <span className="text-gray-600 ml-1">{notification.data.project_name}</span>
                    </div>
                  )}
                  {notification.data.conversation_id && (
                    <div>
                      <span className="font-medium text-gray-700">Conversation:</span>
                      <span className="text-gray-600 ml-1">#{notification.data.conversation_id.slice(-6)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty State Component
const EmptyNotificationsState = ({ searchQuery, setSearchQuery }) => (
  <div className="p-12 text-center">
    <Bell size={48} className="text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
    <p className="text-gray-600">
      {searchQuery
        ? 'No notifications match your search query.'
        : 'You don\'t have any notifications yet.'}
    </p>
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="mt-4 text-blue-600 hover:text-blue-800"
      >
        Clear search
      </button>
    )}
  </div>
);

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, deleteType, selectedCount, readCount }) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (deleteType) {
      case 'bulk':
        return {
          title: 'Delete Selected Notifications',
          message: `Are you sure you want to delete ${selectedCount} selected notification${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
          confirmText: 'Delete Selected',
          confirmClass: 'bg-red-600 hover:bg-red-700'
        };
      case 'all_read':
        return {
          title: 'Clear All Read Notifications',
          message: `Are you sure you want to delete all ${readCount} read notifications? This action cannot be undone.`,
          confirmText: 'Clear All Read',
          confirmClass: 'bg-red-600 hover:bg-red-700'
        };
      case 'single':
        return {
          title: 'Delete Notification',
          message: 'Are you sure you want to delete this notification? This action cannot be undone.',
          confirmText: 'Delete',
          confirmClass: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure?',
          confirmText: 'Confirm',
          confirmClass: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const { title, message, confirmText, confirmClass } = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-medium rounded-lg ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
                    