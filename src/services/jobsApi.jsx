const API_BASE_URL = 'http://localhost:8011/api/jobs';
const USERS_API_URL = 'http://localhost:8000/api/auth';

const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const apiCall = async (url, method = 'GET', data = null, isFormData = false) => {
  try {
    const headers = isFormData ? 
      { 'Authorization': `Bearer ${getAuthToken()}` } : 
      getAuthHeaders();

    const config = { method, headers };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // Continue with default error handling
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      } else if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      const errorMessage = errorData.detail || errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return method === 'DELETE' ? true : await response.json();
  } catch (err) {
    throw err;
  }
};

export const jobsApi = {
  // Public job browsing
  getJobs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${API_BASE_URL}/${queryString ? `?${queryString}` : ''}`);
  },
  
  getJob: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/`),
  getCategories: () => apiCall(`${API_BASE_URL}/categories/`),
  getSkills: () => apiCall(`${API_BASE_URL}/skills/`),

  // Search and filtering
  searchJobs: (searchQuery, filters = {}) => {
    const params = { search: searchQuery, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${API_BASE_URL}/search/?${queryString}`);
  },

  // Client operations
  getMyJobs: () => apiCall(`${API_BASE_URL}/client/jobs/`),
  
  createJob: (data) => {
    return apiCall(`${API_BASE_URL}/client/jobs/create/`, 'POST', data);
  },
  
  updateJob: (jobId, data) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'PATCH', data),
  deleteJob: (jobId) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'DELETE'),
  updateJobStatus: (jobId, status) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/status/`, 'PATCH', { status }),
  getClientStats: () => apiCall(`${API_BASE_URL}/client/stats/`),
  getJobApplications: (jobId) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/applications/`),
  
  // Freelancer operations
  getSavedJobs: () => apiCall(`${API_BASE_URL}/saved/`),
  saveJob: (jobId) => apiCall(`${API_BASE_URL}/save/${jobId}/`, 'POST'),
  unsaveJob: (jobId) => apiCall(`${API_BASE_URL}/unsave/${jobId}/`, 'DELETE'),
  applyToJob: (jobId, applicationData) => apiCall(`${API_BASE_URL}/${jobId}/apply/`, 'POST', applicationData),
  getMyApplications: () => apiCall(`${API_BASE_URL}/my-applications/`),
  getApplication: (applicationId) => apiCall(`${API_BASE_URL}/applications/${applicationId}/`),
  updateApplication: (applicationId, data) => apiCall(`${API_BASE_URL}/applications/${applicationId}/`, 'PATCH', data),
  withdrawApplication: (applicationId) => apiCall(`${API_BASE_URL}/applications/${applicationId}/withdraw/`, 'POST'),

  // File uploads
  // Fix the uploadJobAttachment function
uploadJobAttachment: async (jobId, file, description = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }
  
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/client/jobs/${jobId}/attachments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - browser will set it with boundary
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Failed to upload attachment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}


,

  deleteJobAttachment: (jobId, attachmentId) => 
    apiCall(`${API_BASE_URL}/client/jobs/${jobId}/attachments/${attachmentId}/`, 'DELETE'),

  uploadApplicationAttachment: async (applicationId, file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    return apiCall(`${API_BASE_URL}/applications/${applicationId}/attachments/`, 'POST', formData, true);
  },

  // Statistics and analytics
  getJobStats: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/stats/`),
  getDashboardStats: () => apiCall(`${API_BASE_URL}/dashboard/stats/`),

  // Notifications
  getNotifications: () => apiCall(`${API_BASE_URL}/notifications/`),
  markNotificationRead: (notificationId) => 
    apiCall(`${API_BASE_URL}/notifications/${notificationId}/mark-read/`, 'POST'),
  markAllNotificationsRead: () => 
    apiCall(`${API_BASE_URL}/notifications/mark-all-read/`, 'POST'),

  // Reviews and ratings
  getJobReviews: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/reviews/`),
  createReview: (jobId, reviewData) => 
    apiCall(`${API_BASE_URL}/${jobId}/reviews/`, 'POST', reviewData),
  updateReview: (reviewId, reviewData) => 
    apiCall(`${API_BASE_URL}/reviews/${reviewId}/`, 'PATCH', reviewData),

  // Messaging
  getJobMessages: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/messages/`),
  sendJobMessage: (jobId, messageData) => 
    apiCall(`${API_BASE_URL}/${jobId}/messages/`, 'POST', messageData),

  // Advanced features
  reportJob: (jobId, reason) => 
    apiCall(`${API_BASE_URL}/${jobId}/report/`, 'POST', { reason }),
  getRelatedJobs: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/related/`),
  getRecommendedJobs: () => apiCall(`${API_BASE_URL}/recommended/`),

  // Admin operations (if user has admin access)
  adminGetAllJobs: () => apiCall(`${API_BASE_URL}/admin/jobs/`),
  adminUpdateJobStatus: (jobId, status) => 
    apiCall(`${API_BASE_URL}/admin/jobs/${jobId}/status/`, 'PATCH', { status }),
  adminDeleteJob: (jobId) => apiCall(`${API_BASE_URL}/admin/jobs/${jobId}/`, 'DELETE'),
};