const BIDS_API_URL = 'http://65.2.30.155:32675/api/bids';
const JOBS_API_URL = 'https://kamcomuser.duckdns.org:30443/api/jobs';

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
     if (response.status === 403) {
          
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

export const bidsApiService = {
  // ============= FREELANCER ENDPOINTS =============
  
  // Create a new bid
  createBid: (bidData) => {
    return apiCall(`${BIDS_API_URL}/freelancer/bids/create/`, 'POST', bidData);
  },

  // Get freelancer's own bids
  getFreelancerBids: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/freelancer/bids/${queryString ? `?${queryString}` : ''}`);
  },

  // Update a bid
  updateBid: (bidId, bidData) => {
    return apiCall(`${BIDS_API_URL}/freelancer/bids/${bidId}/update/`, 'PATCH', bidData);
  },

  // Withdraw a bid
  withdrawBid: (bidId) => {
    return apiCall(`${BIDS_API_URL}/freelancer/bids/${bidId}/withdraw/`, 'PATCH');
  },

  // Get freelancer dashboard
  getFreelancerDashboard: () => {
    return apiCall(`${BIDS_API_URL}/freelancer/dashboard/`);
  },

  // ============= CLIENT ENDPOINTS =============

  // Get bids for a job
  getJobBids: (jobId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/jobs/${jobId}/bids/${queryString ? `?${queryString}` : ''}`);
  },

  // Get client dashboard
  getClientDashboard: () => {
    return apiCall(`${BIDS_API_URL}/client/dashboard/`);
  },

  // Update bid status (accept/reject)
  updateBidStatus: (bidId, statusData) => {
    return apiCall(`${BIDS_API_URL}/client/bids/${bidId}/status/`, 'PATCH', statusData);
  },

  // Accept a bid
  acceptBid: (bidId) => {
    return apiCall(`${BIDS_API_URL}/client/bids/${bidId}/status/`, 'PATCH', { status: 'accepted' });
  },

  // Reject a bid
  rejectBid: (bidId, reason = '') => {
    return apiCall(`${BIDS_API_URL}/client/bids/${bidId}/status/`, 'PATCH', { 
      status: 'rejected', 
      rejection_reason: reason 
    });
  },

  // ============= COMMON ENDPOINTS =============

  // Get bid details
  getBidDetails: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/`);
  },

  // Get bid statistics
  getBidStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/statistics/${queryString ? `?${queryString}` : ''}`);
  },

  // Health check
  healthCheck: () => {
    return apiCall(`${BIDS_API_URL}/health/`);
  },

  // Get job bid summary
  getJobBidSummary: (jobId) => {
    return apiCall(`${BIDS_API_URL}/jobs/${jobId}/summary/`);
  },

  // ============= BID HISTORY & TRACKING =============

  // Get bid history
  getBidHistory: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/history/`);
  },

  // Get my bid history (freelancer)
  getMyBidHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/freelancer/history/${queryString ? `?${queryString}` : ''}`);
  },

  // ============= MESSAGING =============

  // Get bid messages/communications
  getBidMessages: (bidId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/${bidId}/messages/${queryString ? `?${queryString}` : ''}`);
  },

  // Send message for a bid
  sendBidMessage: (bidId, messageData) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/messages/`, 'POST', messageData);
  },

  // Mark bid messages as read
  markBidMessagesRead: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/messages/mark-read/`, 'POST');
  },

  // ============= MILESTONE MANAGEMENT =============

  // Get bid milestones
  getBidMilestones: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/milestones/`);
  },

  // Create bid milestone
  createBidMilestone: (bidId, milestoneData) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/milestones/`, 'POST', milestoneData);
  },

  // Update bid milestone
  updateBidMilestone: (bidId, milestoneId, milestoneData) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/milestones/${milestoneId}/`, 'PATCH', milestoneData);
  },

  // Delete bid milestone
  deleteBidMilestone: (bidId, milestoneId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/milestones/${milestoneId}/`, 'DELETE');
  },

  // Complete milestone
  completeMilestone: (bidId, milestoneId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/milestones/${milestoneId}/complete/`, 'POST');
  },

  // ============= ATTACHMENT MANAGEMENT =============

  // Upload bid attachment
  uploadBidAttachment: async (bidId, file, description = '') => {
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
      const response = await fetch(`${BIDS_API_URL}/freelancer/bids/${bidId}/attachments/`, {
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
  },

  // Get bid attachments
  getBidAttachments: (bidId) => {
    return apiCall(`${BIDS_API_URL}/freelancer/bids/${bidId}/attachments/`);
  },

  // Delete bid attachment
  deleteBidAttachment: (bidId, attachmentId) => {
    return apiCall(`${BIDS_API_URL}/freelancer/bids/${bidId}/attachments/${attachmentId}/`, 'DELETE');
  },

  // Download bid attachment
  downloadBidAttachment: (bidId, attachmentId) => {
    const token = getAuthToken();
    const url = `${BIDS_API_URL}/freelancer/bids/${bidId}/attachments/${attachmentId}/download/`;
    
    // For downloads, we'll open in new tab or trigger download
    window.open(`${url}?token=${token}`, '_blank');
  },

  // ============= BULK OPERATIONS =============

  // Bulk update multiple bids
  bulkUpdateBids: (bidIds, updateData) => {
    return apiCall(`${BIDS_API_URL}/bulk-update/`, 'PATCH', {
      bid_ids: bidIds,
      ...updateData
    });
  },

  // Bulk withdraw bids
  bulkWithdrawBids: (bidIds) => {
    return apiCall(`${BIDS_API_URL}/bulk-withdraw/`, 'POST', { bid_ids: bidIds });
  },

  // Bulk accept bids (for clients)
  bulkAcceptBids: (bidIds) => {
    return apiCall(`${BIDS_API_URL}/bulk-accept/`, 'POST', { bid_ids: bidIds });
  },

  // ============= SEARCH & FILTERING =============

  // Search bids
  searchBids: (searchQuery, filters = {}) => {
    const params = { search: searchQuery, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/search/?${queryString}`);
  },

  // Filter bids by status
  getBidsByStatus: (status, params = {}) => {
    const allParams = { status, ...params };
    const queryString = new URLSearchParams(allParams).toString();
    return apiCall(`${BIDS_API_URL}/filter/${queryString ? `?${queryString}` : ''}`);
  },

  // Get trending bids
  getTrendingBids: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/trending/${queryString ? `?${queryString}` : ''}`);
  },

  // ============= ANALYTICS & REPORTS =============

  // Get bid analytics
  getBidAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/analytics/${queryString ? `?${queryString}` : ''}`);
  },

  // Get freelancer performance analytics
  getFreelancerAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/freelancer/analytics/${queryString ? `?${queryString}` : ''}`);
  },

  // Get client hiring analytics
  getClientAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/client/analytics/${queryString ? `?${queryString}` : ''}`);
  },

  // Generate bid report
  generateBidReport: (reportType, params = {}) => {
    return apiCall(`${BIDS_API_URL}/reports/${reportType}/`, 'POST', params);
  },

  // ============= NOTIFICATIONS =============

  // Get bid notifications
  getBidNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/notifications/${queryString ? `?${queryString}` : ''}`);
  },

  // Mark bid notification as read
  markBidNotificationRead: (notificationId) => {
    return apiCall(`${BIDS_API_URL}/notifications/${notificationId}/mark-read/`, 'POST');
  },

  // Mark all bid notifications as read
  markAllBidNotificationsRead: () => {
    return apiCall(`${BIDS_API_URL}/notifications/mark-all-read/`, 'POST');
  },

  // ============= REVIEWS & RATINGS =============

  // Get bid reviews
  getBidReviews: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/reviews/`);
  },

  // Create bid review
  createBidReview: (bidId, reviewData) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/reviews/`, 'POST', reviewData);
  },

  // Update bid review
  updateBidReview: (reviewId, reviewData) => {
    return apiCall(`${BIDS_API_URL}/reviews/${reviewId}/`, 'PATCH', reviewData);
  },

  // Delete bid review
  deleteBidReview: (reviewId) => {
    return apiCall(`${BIDS_API_URL}/reviews/${reviewId}/`, 'DELETE');
  },

  // ============= FAVORITES & BOOKMARKS =============

  // Save/bookmark a bid (for clients)
  saveBid: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/save/`, 'POST');
  },

  // Unsave/unbookmark a bid
  unsaveBid: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/unsave/`, 'DELETE');
  },

  // Get saved bids
  getSavedBids: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/saved/${queryString ? `?${queryString}` : ''}`);
  },

  // ============= ADVANCED FEATURES =============

  // Report a bid
  reportBid: (bidId, reason) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/report/`, 'POST', { reason });
  },

  // Get related bids
  getRelatedBids: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/related/`);
  },

  // Get recommended bids (for clients)
  getRecommendedBids: (jobId = null) => {
    const url = jobId ? 
      `${BIDS_API_URL}/recommended/?job_id=${jobId}` : 
      `${BIDS_API_URL}/recommended/`;
    return apiCall(url);
  },

  // Compare bids
  compareBids: (bidIds) => {
    return apiCall(`${BIDS_API_URL}/compare/`, 'POST', { bid_ids: bidIds });
  },

  // ============= TEMPLATES & PROPOSALS =============

  // Get bid templates
  getBidTemplates: () => {
    return apiCall(`${BIDS_API_URL}/templates/`);
  },

  // Create bid template
  createBidTemplate: (templateData) => {
    return apiCall(`${BIDS_API_URL}/templates/`, 'POST', templateData);
  },

  // Update bid template
  updateBidTemplate: (templateId, templateData) => {
    return apiCall(`${BIDS_API_URL}/templates/${templateId}/`, 'PATCH', templateData);
  },

  // Delete bid template
  deleteBidTemplate: (templateId) => {
    return apiCall(`${BIDS_API_URL}/templates/${templateId}/`, 'DELETE');
  },

  // Use template for bid
  useBidTemplate: (templateId, jobId) => {
    return apiCall(`${BIDS_API_URL}/templates/${templateId}/use/`, 'POST', { job_id: jobId });
  },

  // ============= ADMIN OPERATIONS =============

  // Admin: Get all bids
  adminGetAllBids: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/admin/bids/${queryString ? `?${queryString}` : ''}`);
  },

  // Admin: Update bid status
  adminUpdateBidStatus: (bidId, status, reason = '') => {
    return apiCall(`${BIDS_API_URL}/admin/bids/${bidId}/status/`, 'PATCH', { 
      status, 
      admin_reason: reason 
    });
  },

  // Admin: Delete bid
  adminDeleteBid: (bidId) => {
    return apiCall(`${BIDS_API_URL}/admin/bids/${bidId}/`, 'DELETE');
  },

  // Admin: Get bid reports
  adminGetBidReports: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/admin/reports/${queryString ? `?${queryString}` : ''}`);
  },

  // Admin: Resolve bid report
  adminResolveBidReport: (reportId, resolution) => {
    return apiCall(`${BIDS_API_URL}/admin/reports/${reportId}/resolve/`, 'POST', { resolution });
  },

  // ============= EXPORT & IMPORT =============

  // Export bids data
  exportBids: (format = 'csv', filters = {}) => {
    const params = { format, ...filters };
    const queryString = new URLSearchParams(params).toString();
    const token = getAuthToken();
    
    // For exports, we'll trigger download
    window.open(`${BIDS_API_URL}/export/?${queryString}&token=${token}`, '_blank');
  },

  // Import bids data
  importBids: async (file, importType = 'bids') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('import_type', importType);
    
    return apiCall(`${BIDS_API_URL}/import/`, 'POST', formData, true);
  },

  // ============= REAL-TIME UPDATES =============

  // Get bid activity feed
  getBidActivityFeed: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${BIDS_API_URL}/activity/${queryString ? `?${queryString}` : ''}`);
  },

  // Subscribe to bid updates (WebSocket endpoint info)
  getBidWebSocketInfo: (bidId) => {
    return apiCall(`${BIDS_API_URL}/${bidId}/websocket-info/`);
  },

  // ============= UTILITY FUNCTIONS =============

  // Validate bid data before submission
  validateBidData: (bidData) => {
    return apiCall(`${BIDS_API_URL}/validate/`, 'POST', bidData);
  },

  // Get bid submission guidelines
  getBidGuidelines: () => {
    return apiCall(`${BIDS_API_URL}/guidelines/`);
  },

  // Calculate bid fees
  calculateBidFees: (amount, jobType = 'fixed') => {
    return apiCall(`${BIDS_API_URL}/calculate-fees/`, 'POST', { amount, job_type: jobType });
  },

  // Get bid statistics summary
  getBidStatsSummary: (period = 'month') => {
    return apiCall(`${BIDS_API_URL}/stats-summary/?period=${period}`);
  }
};