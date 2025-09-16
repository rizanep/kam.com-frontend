import React, { useState, useEffect } from 'react';
import { 
  Plus, Eye, Users, DollarSign, Calendar, FileText, BarChart3, 
  Edit, Trash2, AlertCircle, CheckCircle, Search, Filter
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { jobsApi } from '../../services/jobsApi';

const MyJobsPage = ({ onJobClick, onPostJob }) => {
  // Add safety checks for useJobs hook
  const jobsContext = useJobs();
  
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

  const { myJobs = [], loading = false, loadMyJobs, deleteJob } = jobsContext;
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [jobStats, setJobStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // Add error handling for loadMyJobs
    if (loadMyJobs && typeof loadMyJobs === 'function') {
      loadMyJobs().catch(error => {
        console.error('Error loading my jobs:', error);
        setMessage('Error loading jobs. Please try again.');
        setTimeout(() => setMessage(''), 5000);
      });
    }
    
    loadJobStats();
  }, [loadMyJobs]);

  const loadJobStats = async () => {
    if (!jobsApi || !jobsApi.getClientStats) {
      console.warn('getClientStats method not available');
      return;
    }

    setStatsLoading(true);
    try {
      const stats = await jobsApi.getClientStats();
      setJobStats(stats || {});
    } catch (error) {
      console.error('Error loading job stats:', error);
      // Don't show error message for stats, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    if (!jobsApi || !jobsApi.updateJobStatus) {
      setMessage('Update job status feature is not available');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await jobsApi.updateJobStatus(jobId, newStatus);
      setMessage(`Job status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh the list if loadMyJobs is available
      if (loadMyJobs && typeof loadMyJobs === 'function') {
        await loadMyJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      setMessage('Error updating job status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!deleteJob || typeof deleteJob !== 'function') {
      setMessage('Delete job feature is not available');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      try {
        await deleteJob(jobId);
        setMessage('Job deleted successfully');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting job:', error);
        setMessage('Error deleting job');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const filteredJobs = myJobs.filter(job => {
    if (!job) return false;
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusActions = (job) => {
    const actions = [];
    
    switch (job.status) {
      case 'draft':
        actions.push(
          <button
            key="publish"
            onClick={() => updateJobStatus(job.id, 'published')}
            className="text-sm text-green-600 hover:text-green-800"
          >
            Publish
          </button>
        );
        break;
      case 'published':
        actions.push(
          <button
            key="pause"
            onClick={() => updateJobStatus(job.id, 'paused')}
            className="text-sm text-yellow-600 hover:text-yellow-800"
          >
            Pause
          </button>
        );
        break;
      case 'paused':
        actions.push(
          <button
            key="resume"
            onClick={() => updateJobStatus(job.id, 'published')}
            className="text-sm text-green-600 hover:text-green-800"
          >
            Resume
          </button>
        );
        break;
      case 'in_progress':
        actions.push(
          <button
            key="complete"
            onClick={() => updateJobStatus(job.id, 'completed')}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Mark Complete
          </button>
        );
        break;
    }

    if (['draft', 'published', 'paused'].includes(job.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => updateJobStatus(job.id, 'cancelled')}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Cancel
        </button>
      );
    }

    return actions;
  };

  const handleJobClick = (jobId) => {
  if (onJobClick && typeof onJobClick === 'function') {
    onJobClick(jobId); // This will now call handleClientJobClick from JobsMainPage
  } else {
    // Fallback navigation with client management parameter
    window.location.href = `/jobs?jobId=${jobId}&clientManage=true`;
  }
};

  const handlePostJob = () => {
    if (onPostJob && typeof onPostJob === 'function') {
      onPostJob();
    } else {
      // Fallback navigation
      window.location.href = '/freelancer/post-jobs';
    }
  };

  if (loading && myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600">Manage your posted jobs and track applications</p>
          </div>
          <button
            onClick={handlePostJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Post New Job
          </button>
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
        {!statsLoading && Object.keys(jobStats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.total_jobs || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.total_applications || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${jobStats.total_spent || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.active_jobs || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Jobs' },
                { key: 'published', label: 'Published' },
                { key: 'draft', label: 'Draft' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' },
                { key: 'paused', label: 'Paused' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No jobs posted yet' : `No ${statusFilter.replace('_', ' ')} jobs`}
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' 
                  ? 'Start by posting your first job to find talented freelancers.'
                  : `You don't have any ${statusFilter.replace('_', ' ')} jobs at the moment.`
                }
              </p>
              {statusFilter === 'all' && (
                <button
                  onClick={handlePostJob}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Post Your First Job
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleJobClick(job.id)}
                        >
                          {job.title}
                        </h3>
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status?.replace('_', ' ').toUpperCase()}
                        </span>
                        {job.is_urgent && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                            Urgent
                          </span>
                        )}
                        {job.is_featured && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {job.budget_display || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {job.views_count || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {job.applications_count || 0} proposals
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar size={14} />
                            Deadline: {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills?.slice(0, 4).map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {job.skills?.length > 4 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {getStatusActions(job)}
                        
                        {job.applications_count > 0 && (
                          <button
                            onClick={() => handleJobClick(job.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Applications ({job.applications_count})
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Menu */}
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleJobClick(job.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="View Analytics"
                      >
                        <BarChart3 size={16} className="text-gray-600" />
                      </button>

                      {job.status === 'draft' && (
                        <button 
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Edit Job"
                        >
                          <Edit size={16} className="text-gray-600" />
                        </button>
                      )}

                      {['draft', 'cancelled'].includes(job.status) && (
                        <button 
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          className="p-2 hover:bg-red-100 rounded-lg"
                          title="Delete Job"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar for In Progress Jobs */}
                  {job.status === 'in_progress' && job.milestones && job.milestones.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Project Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {job.completed_milestones || 0} / {job.milestones.length} milestones
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((job.completed_milestones || 0) / job.milestones.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination can be added here if needed */}
      </div>
    </div>
  );
};

export default MyJobsPage;