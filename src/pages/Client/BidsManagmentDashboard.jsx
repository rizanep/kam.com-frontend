// src/components/Client/BidsManagementDashboard.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Users, TrendingUp, Clock, DollarSign, Star, Eye,
  CheckCircle, XCircle, MessageSquare, Filter, Search,
  Download, ExternalLink, Calendar, Award, MoreVertical,
  User, Mail, Phone, MapPin, Send, AlertCircle
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { bidsApiService } from '../../services/bidsApi';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';

const BidsManagementDashboard = () => {
  // Use the same job context as MyJobsPage
  const jobsContext = useJobs();
  const { user } = useContext(AuthContext);
  
  // Check if context is available
  if (!jobsContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Context Error</h3>
          <p className="text-gray-600">Jobs context is not available. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const { myJobs = [], loading: jobsLoading = false, loadMyJobs } = jobsContext;
  
  // Local state for bids management
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobBids, setJobBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [bidFilters, setBidFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const modalRef = useRef(null);

  // Load jobs on component mount (same as MyJobsPage)
  useEffect(() => {
    if (user && (user.account_types?.includes('client') || user.user_type === 'client')) {
      if (loadMyJobs && typeof loadMyJobs === 'function') {
        loadMyJobs().catch(error => {
          console.error('Error loading jobs:', error);
          setError('Error loading jobs. Please try again.');
          toast.error('Failed to load your jobs');
        });
      }
    } else {
      setError('Access denied. Only clients can view proposal management.');
      toast.error('Access denied. Only clients can access this page.');
    }
  }, [user, loadMyJobs]);

  // Load bids when job is selected or filters change
  useEffect(() => {
    if (selectedJob) {
      loadJobBids(selectedJob.id);
    }
  }, [bidFilters, selectedJob]);

  // Auto-select first job with bids when jobs are loaded
  useEffect(() => {
    if (myJobs && myJobs.length > 0 && !selectedJob) {
      // Find first job with applications/bids
      const jobWithBids = myJobs.find(job => (job.applications_count || 0) > 0);
      if (jobWithBids) {
        setSelectedJob(jobWithBids);
      } else if (myJobs.length > 0) {
        // If no job has bids, select the first job
        setSelectedJob(myJobs[0]);
      }
    }
  }, [myJobs, selectedJob]);

  const loadJobBids = async (jobId) => {
    try {
      setLoadingBids(true);
      setError('');
      
      const params = {
        ordering: bidFilters.sortOrder === 'desc' ? `-${bidFilters.sortBy}` : bidFilters.sortBy,
      };

      if (bidFilters.status !== 'all') {
        params.status = bidFilters.status;
      }

      if (bidFilters.search) {
        params.search = bidFilters.search;
      }

      const response = await bidsApiService.getJobBids(jobId, params);
      setJobBids(response.results || response || []);
    } catch (err) {
      console.error('Failed to load job bids:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load bids';
      setError(errorMessage);
      toast.error(errorMessage);
      setJobBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setJobBids([]);
    console.log('Selected job:', job);
  };

  const handleBidStatusUpdate = async (bidId, status, feedback = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [bidId]: status }));
      
      await bidsApiService.updateBidStatus(bidId, { 
        status, 
        feedback: feedback || rejectionReason 
      });
      
      const successMessage = `Proposal ${status === 'accepted' ? 'accepted' : 'declined'} successfully`;
      toast.success(successMessage);
      
      // Reload bids for current job
      if (selectedJob) {
        loadJobBids(selectedJob.id);
      }
      
      // Reload jobs to update counts
      if (loadMyJobs && typeof loadMyJobs === 'function') {
        loadMyJobs();
      }
      
      // Close modals
      setShowRejectModal(false);
      setRejectionReason('');
      
    } catch (err) {
      console.error('Failed to update bid status:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to update bid status';
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [bidId]: null }));
    }
  };

  const handleAcceptBid = (bidId) => {
    if (window.confirm('Are you sure you want to accept this proposal? This action will reject all other pending proposals for this job.')) {
      handleBidStatusUpdate(bidId, 'accepted');
    }
  };

  const handleRejectBid = (bid) => {
    setSelectedBid(bid);
    setShowRejectModal(true);
  };

  const handleViewBidDetails = async (bid) => {
    try {
      setActionLoading(prev => ({ ...prev, [bid.id]: 'loading' }));
      const bidDetails = await bidsApiService.getBidDetails(bid.id);
      setSelectedBid(bidDetails);
      setShowBidDetails(true);
    } catch (err) {
      console.error('Failed to load bid details:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load bid details';
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [bid.id]: null }));
    }
  };

  const handleExportBids = () => {
    if (selectedJob) {
      try {
        bidsApiService.exportBids('csv', { job_id: selectedJob.id });
        toast.success('Export started successfully');
      } catch (err) {
        toast.error('Failed to export bids');
      }
    }
  };

  const handleMessageFreelancer = (bid) => {
    console.log('Message freelancer:', bid.freelancer_profile?.username);
    toast.info('Messaging feature coming soon');
  };

  // Helper functions
  const getQualityScoreColor = (score) => {
    const numScore = Number(score) || 0;
    if (numScore >= 8) return 'text-green-600';
    if (numScore >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get jobs with applications (similar to MyJobsPage filtering)
  const jobsWithApplications = myJobs.filter(job => 
    job.status !== 'draft' && job.status !== 'cancelled'
  );
  console.log(jobsWithApplications)
  // Calculate job stats from myJobs data
  const calculateJobStats = (job) => {
    return {
      total_bids: job.applications_count || 0,
      new_bids: 0, // This would need to come from the API or calculated differently
      average_bid: 0, // This would need to come from bid data
      quality_score: 0, // This would need to come from bid data
    };
  };

  // Authorization checks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access proposal management.</p>
        </div>
      </div>
    );
  }

  if (!user.account_types?.includes('client') && user.user_type !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only clients can access proposal management.</p>
        </div>
      </div>
    );
  }

  // FreelancerCard component
  const FreelancerCard = ({ bid }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {bid.freelancer_profile?.profile_picture_url ? (
              <img 
                src={bid.freelancer_profile.profile_picture_url} 
                alt={bid.freelancer_profile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User size={20} className="text-gray-600" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {bid.freelancer_profile?.first_name} {bid.freelancer_profile?.last_name}
            </h4>
            <p className="text-sm text-gray-600">{bid.freelancer_profile?.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {bid.freelancer_profile?.average_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    {bid.freelancer_profile.average_rating.toFixed(1)}
                  </span>
                </div>
              )}
              {bid.freelancer_profile?.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <CheckCircle size={12} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {bid.bid_type === 'hourly' 
              ? `${formatCurrency(bid.hourly_rate)}/hr`
              : formatCurrency(bid.total_amount)
            }
          </p>
          <p className="text-sm text-gray-600">
            {bid.estimated_delivery} days delivery
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Proposal</p>
        <p className="text-gray-600 text-sm line-clamp-3">{bid.proposal}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {bid.freelancer_profile?.acceptance_rate || 0}%
          </p>
          <p className="text-xs text-gray-600">Success Rate</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {bid.freelancer_profile?.total_bids || 0}
          </p>
          <p className="text-xs text-gray-600">Total Bids</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {bid.freelancer_profile?.completed_projects || 0}
          </p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
      </div>

      {bid.milestones_count > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">
            {bid.milestones_count} Milestones Proposed
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={14} />
          <span>Applied {formatDate(bid.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          {bid.status === 'pending' && (
            <>
              <button
                onClick={() => handleMessageFreelancer(bid)}
                className="px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 text-sm flex items-center gap-1"
              >
                <MessageSquare size={14} />
                Message
              </button>
              <button
                onClick={() => handleRejectBid(bid)}
                disabled={actionLoading[bid.id] === 'rejected'}
                className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm disabled:opacity-50"
              >
                {actionLoading[bid.id] === 'rejected' ? 'Declining...' : 'Decline'}
              </button>
              <button
                onClick={() => handleAcceptBid(bid.id)}
                disabled={actionLoading[bid.id] === 'accepted'}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {actionLoading[bid.id] === 'accepted' ? 'Accepting...' : 'Accept'}
              </button>
            </>
          )}
          
          {bid.status === 'accepted' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              <CheckCircle size={14} />
              Accepted
            </span>
          )}
          
          {bid.status === 'rejected' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
              <XCircle size={14} />
              Declined
            </span>
          )}

          <button
            onClick={() => handleViewBidDetails(bid)}
            disabled={actionLoading[bid.id] === 'loading'}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {actionLoading[bid.id] === 'loading' ? 'Loading...' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );

  // Modals (simplified versions)
  const BidDetailsModal = () => {
    if (!showBidDetails || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" ref={modalRef}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Proposal from {selectedBid.freelancer_profile?.first_name} {selectedBid.freelancer_profile?.last_name}
              </h2>
              <button
                onClick={() => setShowBidDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Proposal</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedBid.proposal}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBidDetails(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RejectModal = () => {
    if (!showRejectModal || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Decline Proposal</h3>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to decline this proposal from {selectedBid.freelancer_profile?.first_name} {selectedBid.freelancer_profile?.last_name}?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback to help the freelancer improve..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBidStatusUpdate(selectedBid.id, 'rejected')}
                disabled={actionLoading[selectedBid.id] === 'rejected'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading[selectedBid.id] === 'rejected' ? 'Declining...' : 'Decline Proposal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (jobsLoading && myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Proposal Management</h1>
          <p className="text-gray-600 mt-2">Review and manage proposals for your projects</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List - Similar to MyJobsPage */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Projects ({jobsWithApplications.length})
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {jobsWithApplications.map((job) => {
                const jobStats = calculateJobStats(job);
                return (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedJob?.id === job.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {job.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Proposals:</span>
                        <span className="font-medium">{job.applications_count || 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium capitalize ${
                          job.status === 'published' ? 'text-green-600' :
                          job.status === 'in_progress' ? 'text-blue-600' :
                          job.status === 'completed' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {job.status?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{job.budget_display || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Posted:</span>
                        <span className="font-medium">{formatDate(job.created_at)}</span>
                      </div>
                    </div>

                    {job.applications_count > 0 && (
                      <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {job.applications_count} proposal{job.applications_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}

              {jobsWithApplications.length === 0 && (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No published projects yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bids Details */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Proposals for: {selectedJob.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {jobBids.length} total proposals
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleExportBids}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button 
                      onClick={() => window.open(`/jobs/${selectedJob.id}`, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink size={16} />
                      View Job
                    </button>
                  </div>
                </div>

                {/* Filters for Bids */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search proposals..."
                          value={bidFilters.search}
                          onChange={(e) => setBidFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <select 
                      value={bidFilters.status}
                      onChange={(e) => setBidFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select 
                      value={`${bidFilters.sortBy}-${bidFilters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setBidFilters(prev => ({ ...prev, sortBy, sortOrder }));
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at-desc">Sort by Latest</option>
                      <option value="total_amount-asc">Sort by Price (Low to High)</option>
                      <option value="total_amount-desc">Sort by Price (High to Low)</option>
                      <option value="freelancer_profile__average_rating-desc">Sort by Rating</option>
                      <option value="estimated_delivery-asc">Sort by Delivery Time</option>
                    </select>
                  </div>
                </div>

                {/* Proposals List */}
                <div className="space-y-6">
                  {loadingBids ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading proposals...</p>
                    </div>
                  ) : jobBids.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No proposals found</h3>
                      <p className="text-gray-600">
                        {bidFilters.search || bidFilters.status !== 'all' 
                          ? 'Try adjusting your filters to see more results'
                          : 'No proposals have been received for this job yet.'
                        }
                      </p>
                    </div>
                  ) : (
                    jobBids.map((bid) => (
                      <FreelancerCard key={bid.id} bid={bid} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Select a Project
                </h3>
                <p className="text-gray-600">
                  Choose a project from the left to view and manage proposals
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <BidDetailsModal />
      <RejectModal />
    </div>
  );
};

export default BidsManagementDashboard;