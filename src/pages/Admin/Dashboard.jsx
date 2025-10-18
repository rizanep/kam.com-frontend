import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  BarChart2,
  Settings,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  Plus,
  ChevronDown,
  FileText,
  Shield,
  Bell,
  Edit,
  Trash,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Star,
  Activity,
  Calendar,
  Mail,
} from 'lucide-react'

const API_BASE_URL = 'https://kamcomuser.duckdns.org/api/auth';

// Utility functions for safe data handling
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return Number(value);
};

const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
};

const safeArray = (value, defaultValue = []) => {
  if (!Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

const formatNumber = (value, defaultValue = 0) => {
  const num = safeNumber(value, defaultValue);
  return num.toLocaleString();
};

const formatPercentage = (value, decimals = 1) => {
  const num = safeNumber(value, 0);
  return num.toFixed(decimals);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // State for dashboard data with safe defaults
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    completedJobs: 0,
    revenue: 0,
    growthRate: 0,
    ticketsOpen: 0,
    pendingVerifications: 0,
    totalFreelancers: 0,
    totalClients: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    premiumUsers: 0,
    verificationRate: 0,
    usersByCountry: [],
  })

  // State for users management
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersFilter, setUsersFilter] = useState('')

  // State for modals and actions
  const [showUserModal, setShowUserModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])

  // API utility functions
  const getAuthToken = () => {
    try {
      return localStorage.getItem('access_token') || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: getAuthHeaders(),
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      if (method === 'DELETE') {
        return true;
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Fetch dashboard stats with safe data handling
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/admin/stats/');
      
      // Safely extract and convert data with defaults - matching new API response
      setStats({
        totalUsers: safeNumber(data?.total_users),
        activeJobs: 0, // Not available in new API
        completedJobs: 0, // Not available in new API
        revenue: 0, // Not available in new API
        growthRate: 0, // Not available in new API
        ticketsOpen: 0, // Not available in new API
        pendingVerifications: safeNumber(data?.total_users) - safeNumber(data?.verified_users),
        totalFreelancers: safeNumber(data?.total_freelancers),
        totalClients: safeNumber(data?.total_clients),
        totalAdmins: safeNumber(data?.total_admins),
        verifiedUsers: safeNumber(data?.verified_users),
        premiumUsers: safeNumber(data?.premium_users),
        verificationRate: safeNumber(data?.verification_rate),
        usersByCountry: safeArray(data?.users_by_country),
      });
    } catch (err) {
      setError('Failed to fetch dashboard stats: ' + err.message);
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users with pagination and filtering
  const fetchUsers = async (page = 1, search = '', userType = '') => {
    try {
      setUsersLoading(true);
      let url = `/admin/users/?page=${page}&page_size=10`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (userType) {
        url += `&account_type=${userType}`;
      }

      const data = await apiCall(url);
      
      // The new API returns paginated data directly
      setUsers(safeArray(data?.results));
      setUsersTotalPages(Math.ceil(safeNumber(data?.count) / 10));
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
      console.error('Users fetch error:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle view profile - redirect to user's profile page
  const handleViewProfile = (user) => {
    if (user?.id) {
      // Navigate to freelancer profile route if user has freelancer account type
      navigate(`/freelancer/profile/${user.id}`);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      await apiCall(`/admin/users/${userId}/toggle-status/`, 'POST');
      setSuccess('User status updated successfully');
      fetchUsers(usersPage, usersSearch, usersFilter);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user status: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Assign user to group
  const assignUserGroup = async (userId, groupName) => {
    if (!userId || !groupName) {
      setError('Invalid user ID or group name');
      return;
    }

    try {
      await apiCall('/admin/users/assign-group/', 'POST', {
        user_id: userId,
        group_name: groupName
      });
      setSuccess('User group assigned successfully');
      fetchUsers(usersPage, usersSearch, usersFilter);
      setShowGroupModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign user group: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(usersPage, usersSearch, usersFilter);
    }
  }, [activeTab, usersPage, usersSearch, usersFilter]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (activeTab === 'users') {
        setUsersPage(1);
        fetchUsers(1, usersSearch, usersFilter);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [usersSearch]);

  // Group Assignment Modal
  const GroupAssignmentModal = () => {
    const [selectedGroup, setSelectedGroup] = useState('');
    const groups = ['Admin', 'Freelancer', 'Client'];

    const handleSubmit = (e) => {
      e.preventDefault();
      if (selectedUser?.id && selectedGroup) {
        assignUserGroup(selectedUser.id, selectedGroup);
      }
    };

    if (!showGroupModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Assign User to Group</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <p className="text-sm text-gray-600">
                {safeString(selectedUser?.full_name)} ({safeString(selectedUser?.email)})
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                disabled={!selectedGroup}
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedUser(null);
                  setSelectedGroup('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // User Actions Dropdown
  const UserActionsDropdown = ({ user, onToggleStatus, onAssignGroup, onViewProfile }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!user?.id) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    onViewProfile(user);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    // Store user data and navigate based on user type
                    localStorage.setItem('selectedUserId', user.id);
                    localStorage.setItem('selectedUserData', JSON.stringify(user));
                    
                    // Navigate to appropriate dashboard based on primary account type
                    const primaryAccountType = user.account_types && user.account_types.length > 0 ? user.account_types[0] : null;
                    
                    if (primaryAccountType === 'client') {
                      navigate('/client/dashboard');
                    } else if (primaryAccountType === 'freelancer') {
                      navigate('/freelancer/dashboard');
                    } else if (primaryAccountType === 'admin') {
                      navigate('/admin/dashboard');
                    } else {
                      // Default fallback
                      navigate('/dashboard');
                    }
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  View Dashboard
                </button>
                <button
                  onClick={() => {
                    onAssignGroup(user);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Assign Group
                </button>
                <button
                  onClick={() => {
                    onToggleStatus(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                    user.is_active ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {user.is_active ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate User
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage platform users, jobs, and system settings
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'users') {
                  fetchUsers(usersPage, usersSearch, usersFilter);
                }
              }}
              className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <Plus className="h-5 w-5 mr-1" />
              New Announcement
            </button>
            <button className="relative p-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Admin Navigation */}
        <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'User Management' },
              { id: 'jobs', label: 'Jobs & Projects' },
              { id: 'reports', label: 'Reports & Analytics' },
              { id: 'settings', label: 'Platform Settings' },
              { id: 'support', label: 'Support' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatNumber(stats.totalUsers)}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <div className="flex flex-col space-y-1">
                    <div className="text-blue-600">
                      {formatNumber(stats.totalFreelancers)} Freelancers
                    </div>
                    <div className="text-green-600">
                      {formatNumber(stats.totalClients)} Clients
                    </div>
                    <div className="text-purple-600">
                      {formatNumber(stats.totalAdmins)} Admins
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="inline-flex p-3 rounded-lg bg-green-100 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verified Users</p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatNumber(stats.verifiedUsers)}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{formatPercentage(stats.verificationRate)}% verification rate</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="inline-flex p-3 rounded-lg bg-purple-100 text-purple-600">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Premium Users</p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatNumber(stats.premiumUsers)}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-purple-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>Revenue generating members</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="inline-flex p-3 rounded-lg bg-yellow-100 text-yellow-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatNumber(stats.pendingVerifications)}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-yellow-600">
                  <Shield className="h-4 w-4 mr-1" />
                  <span>Require attention</span>
                </div>
              </div>
            </div>

            {/* Users by Country */}
            {stats.usersByCountry && stats.usersByCountry.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Users by Country</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.usersByCountry.slice(0, 6).map((countryData, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">{safeString(countryData?.country, 'Unknown')}</span>
                        <span className="text-blue-600 font-semibold">{formatNumber(countryData?.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <p className="text-sm text-gray-600">View, edit, and manage user accounts</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <BarChart2 className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium">View Reports</span>
                    </div>
                    <p className="text-sm text-gray-600">Access analytics and reports</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <Settings className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium">Platform Settings</span>
                    </div>
                    <p className="text-sm text-gray-600">Configure platform settings</p>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
            </div>
            <div className="p-6">
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex-1 mb-4 md:mb-0 md:mr-4">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border-gray-300 rounded-md"
                      placeholder="Search users by name, email, or username"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={usersFilter}
                    onChange={(e) => setUsersFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <option value="">All Account Types</option>
                    <option value="freelancer">Freelancers</option>
                    <option value="client">Clients</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Types
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Groups
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profile Complete
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                          const safeUser = {
                            id: user?.id,
                            full_name: safeString(user?.full_name, 'Unknown User'),
                            email: safeString(user?.email, 'No email'),
                            account_types: safeArray(user?.account_types),
                            is_active: Boolean(user?.is_active),
                            is_verified: Boolean(user?.is_verified),
                            groups: safeArray(user?.groups),
                            profile_completion_percentage: safeNumber(user?.profile_completion_percentage),
                            last_activity: user?.last_activity
                          };

                          // Get primary account type for display
                          const primaryAccountType = safeUser.account_types.length > 0 ? safeUser.account_types[0] : 'unknown';

                          return (
                            <tr key={safeUser.id || Math.random()}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {safeUser.full_name}
                                    </div>
                                    <div className="text-sm text-gray-500">{safeUser.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {safeUser.account_types.length > 0 ? (
                                    safeUser.account_types.map((accountType, index) => (
                                      <span
                                        key={index}
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          accountType === 'freelancer' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : accountType === 'client'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-purple-100 text-purple-800'
                                        }`}
                                      >
                                        {accountType}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      No Type
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    safeUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {safeUser.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  {safeUser.is_verified && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {safeUser.groups.length > 0 ? (
                                    safeUser.groups.map((group, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                      >
                                        {safeString(group)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-400">No groups</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${safeUser.profile_completion_percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {safeUser.profile_completion_percentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {safeUser.last_activity ? 
                                  new Date(safeUser.last_activity).toLocaleDateString() : 
                                  'Never'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <UserActionsDropdown
                                  user={safeUser}
                                  onToggleStatus={toggleUserStatus}
                                  onAssignGroup={(user) => {
                                    setSelectedUser(user);
                                    setShowGroupModal(true);
                                  }}
                                  onViewProfile={handleViewProfile}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {usersTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-700">
                        Showing page {usersPage} of {usersTotalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                          disabled={usersPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setUsersPage(Math.min(usersTotalPages, usersPage + 1))}
                          disabled={usersPage === usersTotalPages}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Jobs & Projects Management
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Jobs Management</h3>
                <p className="text-gray-600">
                  Jobs management interface would be implemented here with backend integration.
                  Similar pattern to user management with API calls for jobs data.
                </p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Reports & Analytics
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
                    User Analytics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{formatNumber(stats.totalUsers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Freelancers:</span>
                      <span className="font-semibold">{formatNumber(stats.totalFreelancers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clients:</span>
                      <span className="font-semibold">{formatNumber(stats.totalClients)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Admins:</span>
                      <span className="font-semibold">{formatNumber(stats.totalAdmins)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Rate:</span>
                      <span className="font-semibold">{formatPercentage(stats.verificationRate)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Premium Members
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Premium Users:</span>
                      <span className="font-semibold">{formatNumber(stats.premiumUsers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-semibold">
                        {stats.totalUsers > 0 ? 
                          formatPercentage((stats.premiumUsers / stats.totalUsers) * 100) : 
                          '0'
                        }%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Verification Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <span className="font-semibold">{formatNumber(stats.verifiedUsers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-semibold">{formatNumber(stats.pendingVerifications)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Chart Placeholder */}
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Platform Activity Over Time
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>Chart visualization would be implemented here</p>
                    <p className="text-sm">Integration with charting library like Chart.js or Recharts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Platform Settings</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-600" />
                    General Settings
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Platform Fees & Commission Rates
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        User Registration Settings
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Email Notification Templates
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Payment Gateway Configuration
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Security Settings
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Admin Access Controls
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        User Verification Requirements
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Security Audit Logs
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Two-Factor Authentication
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    Communication Settings
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Email Templates
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        SMS Configuration
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Push Notification Settings
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Content Management
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Terms of Service
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Platform Guidelines
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Support Management</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    Active Tickets
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">24</div>
                  <p className="text-sm text-gray-600">Tickets awaiting response</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Resolved Today
                  </h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">18</div>
                  <p className="text-sm text-gray-600">Tickets resolved in the last 24h</p>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Support Ticket Management</h3>
                <p className="text-gray-600 mb-4">
                  Support ticket management interface would be implemented here.
                  This would include ticket viewing, assignment, and response functionality.
                </p>
                <div className="flex justify-center space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    View All Tickets
                  </button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                    Create Announcement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <GroupAssignmentModal />
      </div>
    </div>
  )
}

export default AdminDashboard