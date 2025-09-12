const API_BASE_URL = 'http://localhost:8001/api/jobs';
const USERS_API_URL = 'http://localhost:8000/api/auth';

const getAuthToken = () => localStorage.getItem('access_token');

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
    }

    return method === 'DELETE' ? true : await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export  const jobsApi = {
  // Public job browsing
  getJobs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${API_BASE_URL}/${queryString ? `?${queryString}` : ''}`);
  },
  
  getJob: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/`),
  getCategories: () => apiCall(`${API_BASE_URL}/categories/`),
  getSkills: () => apiCall(`${API_BASE_URL}/skills/`),

  // Client operations
  getMyJobs: () => apiCall(`${API_BASE_URL}/client/jobs/`),
  createJob: (data) => apiCall(`${API_BASE_URL}/client/jobs/create/`, 'POST', data),
  updateJob: (jobId, data) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'PATCH', data),
  deleteJob: (jobId) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'DELETE'),
  updateJobStatus: (jobId, status) => apiCall(`${API_BASE_URL}/client/jobs/${jobId}/status/`, 'PATCH', { status }),
  getClientStats: () => apiCall(`${API_BASE_URL}/client/stats/`),

  // Freelancer operations
  getSavedJobs: () => apiCall(`${API_BASE_URL}/saved-jobs/`),
  saveJob: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/save/`, 'POST'),
  unsaveJob: (jobId) => apiCall(`${API_BASE_URL}/${jobId}/unsave/`, 'DELETE'),

  // File uploads
  uploadJobAttachment: async (jobId, file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    return apiCall(`${API_BASE_URL}/client/jobs/${jobId}/attachments/`, 'POST', formData, true);
  },

  deleteJobAttachment: (jobId, attachmentId) => 
    apiCall(`${API_BASE_URL}/client/jobs/${jobId}/attachments/${attachmentId}/`, 'DELETE'),
};
