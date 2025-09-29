import React, { useState, useEffect, useContext } from 'react';
import { 
  ArrowLeft, AlertCircle, Home, DollarSign, Clock, FileText, 
  Briefcase, Calendar, MapPin, User, Star, Download, 
  ChevronRight, Eye, Heart, Share2, Flag, X, CheckCircle,
  ExternalLink, Award, Shield, Zap, Users,
  AlertTriangle
} from 'lucide-react';
import { jobsApi } from '../../services/jobsApi';
import AuthContext from '../../context/AuthContext';

// Toast Component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border ${getToastStyles()} shadow-lg transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="ml-4 text-current opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, confirmVariant = 'primary' }) => {
  if (!isOpen) return null;

  const confirmButtonClass = confirmVariant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            {children}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const JobDetailPage = ({ jobId, onBack, onApply }) => {
  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isJobSaved, setIsJobSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const { user } = useContext(AuthContext);
  const userRole = user?.account_types;

  useEffect(() => {
    if (jobId) {
      loadJobDetail();
      loadRelatedJobs();
    }
  }, [jobId]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const loadJobDetail = async () => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      const jobData = await jobsApi.getJob(jobId);
      setJob(jobData);
      
      // Check if job is saved (if user is logged in and is a freelancer)
      if (user && Array.isArray(userRole) && userRole.includes('freelancer')) {
        try {
          const savedJobs = await jobsApi.getSavedJobs();
          setIsJobSaved(savedJobs.some(savedJob => savedJob.id === jobData.id));
        } catch (err) {
          console.error('Error checking saved jobs:', err);
        }
      }
    } catch (error) {
      console.error('Error loading job detail:', error);
      
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        setNotFound(true);
        setError('This job is no longer available or has been removed.');
      } else {
        setError(error.message || 'Failed to load job details. Please try again.');
        showToast(error.message || 'Failed to load job details', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedJobs = async () => {
    if (!jobId) return;
    
    try {
      const related = await jobsApi.getRelatedJobs(jobId);
      setRelatedJobs(related || []);
    } catch (error) {
      console.error('Error loading related jobs:', error);
      setRelatedJobs([]);
    }
  };

  const handleSaveJob = async () => {
    if (!user || !Array.isArray(userRole) || !userRole.includes('freelancer')) {
      showToast('Please log in as a freelancer to save jobs', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      if (isJobSaved) {
        await jobsApi.unsaveJob(jobId);
        setIsJobSaved(false);
        showToast('Job removed from saved jobs', 'success');
      } else {
        await jobsApi.saveJob(jobId);
        setIsJobSaved(true);
        showToast('Job saved successfully', 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to save job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportJob = async () => {
    if (!reportReason.trim()) {
      showToast('Please provide a reason for reporting', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await jobsApi.reportJob(jobId, reportReason);
      setShowReportModal(false);
      setReportReason('');
      showToast('Job reported successfully. We will review it shortly.', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to report job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description.slice(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Job link copied to clipboard', 'success');
    }
  };

  const handleClientProfileClick = () => {
    if (job?.client_info?.id) {
      window.open(`/freelancer/profile/${job.client_info.id}`, '_blank');
    }
  };

  const downloadAttachment = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      showToast('Failed to download attachment', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getJobTypeDisplay = (jobType) => {
    const types = {
      'fixed': 'Fixed Price',
      'hourly': 'Hourly Rate',
      'milestone': 'Milestone Based'
    };
    return types[jobType] || 'Fixed Price';
  };

  const getExperienceLevel = (level) => {
    const levels = {
      'entry': 'Entry Level',
      'intermediate': 'Intermediate',
      'expert': 'Expert'
    };
    return levels[level] || 'Not specified';
  };

  const handleBack = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/jobs';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle size={64} className="text-gray-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This job is no longer available. It may have been removed, expired, or filled by the client.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home size={20} className="mr-2" />
                Browse All Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Job</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={loadJobDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No job data available.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Job"
        confirmText="Submit Report"
        confirmVariant="danger"
        onConfirm={handleReportJob}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please let us know why you're reporting this job. We'll review it and take appropriate action.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue with this job..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
      </Modal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Jobs
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareJob}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share Job"
            >
              <Share2 size={16} className="mr-1" />
              Share
            </button>
            {user && Array.isArray(userRole) && userRole.includes('freelancer') && (
              <button
                onClick={handleSaveJob}
                disabled={actionLoading}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isJobSaved
                    ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title={isJobSaved ? 'Remove from saved' : 'Save job'}
              >
                <Heart size={16} className={`mr-1 ${isJobSaved ? 'fill-current' : ''}`} />
                {isJobSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Report Job"
            >
              <Flag size={16} className="mr-1" />
              Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Eye size={16} className="mr-1" />
                      {job.views_count || 0} views
                    </div>
                    <div className="flex items-center">
                      <FileText size={16} className="mr-1" />
                      {job.applications_count || 0} proposals
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      Posted {formatDate(job.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {job.budget_display}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getJobTypeDisplay(job.job_type)}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Budget</div>
                  <div className="text-xs text-gray-500">{job.budget_display}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Duration</div>
                  <div className="text-xs text-gray-500">
                    {job.estimated_duration?.replace('_', ' ') || 'Not specified'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Award size={16} className="text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Experience</div>
                  <div className="text-xs text-gray-500">
                    {getExperienceLevel(job.experience_level)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users size={16} className="text-orange-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Proposals</div>
                  <div className="text-xs text-gray-500">{job.applications_count || 0}</div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {/* Milestones Section */}
            {job.job_type === 'milestone' && job.milestones && job.milestones.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h2>
                <div className="space-y-4">
                  {job.milestones.map((milestone, index) => (
                    <div key={milestone.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">
                              Milestone {milestone.order || index + 1}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {milestone.title}
                          </h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(milestone.amount)}
                          </p>
                          {milestone.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {formatDate(milestone.due_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700">Total Project Budget:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(job.milestones.reduce((total, m) => total + parseFloat(m.amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Required */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Attachments */}
            {job.attachments && job.attachments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Attachments</h2>
                <div className="space-y-3">
                  {job.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded">
                          <FileText size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.filename}
                          </p>
                          {attachment.description && (
                            <p className="text-xs text-gray-500">
                              {attachment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAttachment(attachment.file_url, attachment.filename)}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Download size={14} className="mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {(() => {
                // Check for various barriers
                const isJobOwner = job.client_info?.id == user?.id;
                const isFreelancer = user && Array.isArray(userRole) && userRole.includes('freelancer');
                const isLoggedIn = !!user;
                
                // Check deadline
                const deadlineInfo = job.deadline ? (() => {
                  const deadlineDate = new Date(job.deadline);
                  const today = new Date();
                  const diffTime = deadlineDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays <= 0) return { status: 'expired', days: diffDays };
                  if (diffDays <= 3) return { status: 'urgent', days: diffDays };
                  if (diffDays <= 7) return { status: 'soon', days: diffDays };
                  return { status: 'normal', days: diffDays };
                })() : null;

                // Check job status
                const isJobClosed = job.status && ['closed', 'filled', 'paused', 'cancelled'].includes(job.status.toLowerCase());
                
                // Determine what to show
                if (!isLoggedIn) {
                  return (
                    <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-gray-700 text-sm mb-3">
                        Please log in to apply for this job.
                      </p>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Log In to Apply
                      </button>
                    </div>
                  );
                }

                if (isJobOwner) {
                  return (
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 text-sm mb-3">
                        This is your job posting. You can manage it from your dashboard.
                      </p>
                      <button
                        onClick={() => window.location.href = '/jobs?view=my-jobs'}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage Job
                      </button>
                    </div>
                  );
                }

                if (!isFreelancer) {
                  return (
                    <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-gray-700 text-sm">
                        You must be a freelancer to apply for this job. Please update your profile or log in with a freelancer account.
                      </p>
                    </div>
                  );
                }

                if (isJobClosed) {
                  return (
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-800 text-sm">
                        This job is {job.status.toLowerCase()} and no longer accepting applications.
                      </p>
                      <button
                        disabled
                        className="w-full mt-2 bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                      >
                        Job {job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()}
                      </button>
                    </div>
                  );
                }

                if (deadlineInfo?.status === 'expired') {
                  return (
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center text-red-800 mb-2">
                        <AlertTriangle size={16} className="mr-2" />
                        <span className="text-sm font-medium">Application Deadline Passed</span>
                      </div>
                      <p className="text-red-700 text-xs mb-3">
                        This job's deadline was {formatDate(job.deadline)}
                      </p>
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                      >
                        Applications Closed
                      </button>
                    </div>
                  );
                }

                // All checks passed - show apply button
                return (
                  <div>
                    <button
                      onClick={() => onApply(job)}
                      className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply for this Job
                    </button>
                    
                    {deadlineInfo && deadlineInfo.status !== 'normal' && (
                      <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${
                        deadlineInfo.status === 'urgent' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        <div className="flex items-center">
                          <AlertTriangle size={14} className="mr-2" />
                          <span>
                            {deadlineInfo.status === 'urgent' ? 'Urgent: ' : ''}
                            Only {deadlineInfo.days} day{deadlineInfo.days !== 1 ? 's' : ''} left to apply
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {job.deadline && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-800">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                      Application Deadline: {formatDate(job.deadline)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Client Information */}
            {job.client_info && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">About the Client</h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    {job.client_info.profile_picture ? (
                      <img 
                        src={`http://localhost:8000/${job.client_info.profile_picture}`} 
                        alt={job.client_info.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 truncate">
                      {job.client_info.first_name} {job.client_info.last_name}
                    </h4>
                    {job.client_info.rating && (
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={`${
                                i < Math.floor(job.client_info.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-1">
                          {job.client_info.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Jobs Posted:</span>
                    <span className="font-medium text-gray-900">
                      {job.client_info.jobs_posted || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member Since:</span>
                    <span className="font-medium text-gray-900">
                      {job.client_info.date_joined ? formatDate(job.client_info.date_joined) : 'N/A'}
                    </span>
                  </div>

                  {job.client_info.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-900">
                        {job.client_info.location}
                      </span>
                    </div>
                  )}

                  {job.client_info.verified && (
                    <div className="flex items-center text-green-600">
                      <Shield size={16} className="mr-1" />
                      <span className="text-sm font-medium">Verified Client</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClientProfileClick}
                  className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View Client Profile
                </button>
              </div>
            )}

            {/* Job Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-900">
                    {job.category?.name || 'Not specified'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Project Type:</span>
                  <span className="font-medium text-gray-900">
                    {getJobTypeDisplay(job.job_type)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Experience Level:</span>
                  <span className="font-medium text-gray-900">
                    {getExperienceLevel(job.experience_level)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {job.estimated_duration?.replace('_', ' ') || 'Not specified'}
                  </span>
                </div>

                {job.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-gray-900">{job.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Job ID:</span>
                  <span className="font-medium text-gray-900 text-xs">#{job.id}</span>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Proposals:</span>
                  <span className="font-medium text-gray-900">
                    {job.applications_count || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Views:</span>
                  <span className="font-medium text-gray-900">
                    {job.views_count || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(job.updated_at || job.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Jobs */}
        {relatedJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedJobs.slice(0, 3).map((relatedJob) => (
                <div key={relatedJob.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{relatedJob.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {relatedJob.description?.slice(0, 100)}...
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{relatedJob.budget_display}</span>
                    <span>{relatedJob.applications_count || 0} proposals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;