import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Trash2, Eye, Users, DollarSign, Calendar, 
  MapPin, Clock, Star, CheckCircle, AlertTriangle, Building,
  BarChart3, MessageSquare, Settings, Play, Pause, Square,
  FileText, Download, X, Upload, Send, User, Plus
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { jobsApi } from '../../services/jobsApi';

const ClientJobDetailPage = ({ jobId, onBack, onEdit }) => {
  const { updateJob, deleteJob, categories, skills } = useJobs();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  
  // Stats and analytics
  const [jobStats, setJobStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('details');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      loadJobStats();
      loadApplications();
      loadMessages();
    }
  }, [jobId]);

  // Initialize edit form when job is loaded
  useEffect(() => {
    if (job) {
      setEditFormData({
        title: job.title || '',
        description: job.description || '',
        category: job.category?.id || '',
        skills: job.skills?.map(skill => skill.id) || [],
        job_type: job.job_type || 'fixed',
        experience_level: job.experience_level || 'any',
        estimated_duration: job.estimated_duration || '',
        budget_min: job.budget_min || '',
        budget_max: job.budget_max || '',
        hourly_rate_min: job.hourly_rate_min || '',
        hourly_rate_max: job.hourly_rate_max || '',
        remote_allowed: job.remote_allowed || false,
        location: job.location || '',
        is_urgent: job.is_urgent || false,
        deadline: job.deadline ? job.deadline.split('T')[0] : '',
        milestones: job.milestones || [],
      });
    }
  }, [job]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await jobsApi.getJob(jobId);
      setJob(data);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError('Failed to load job details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadJobStats = async () => {
    try {
      if (!jobsApi.getJobStats) return;
      const stats = await jobsApi.getJobStats(jobId);
      setJobStats(stats);
    } catch (err) {
      console.error('Error loading job stats:', err);
    }
  };

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      if (!jobsApi.getJobApplications) return;
      const apps = await jobsApi.getJobApplications(jobId);
      setApplications(apps.results || apps || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      if (!jobsApi.getJobMessages) return;
      const msgs = await jobsApi.getJobMessages(jobId);
      setMessages(msgs.results || msgs || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSkillToEdit = (skillId) => {
    if (!editFormData.skills.includes(skillId)) {
      setEditFormData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skillId] 
      }));
    }
    setSkillInput('');
  };

  const removeSkillFromEdit = (skillId) => {
    setEditFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(id => id !== skillId) 
    }));
  };

  const addMilestone = () => {
    const newMilestone = {
      title: '',
      description: '',
      amount: '',
      due_date: '',
      order: editFormData.milestones.length + 1
    };
    setEditFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const updateMilestone = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const removeMilestone = (index) => {
    setEditFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
        .map((milestone, i) => ({ ...milestone, order: i + 1 }))
    }));
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (editFormData.title.trim().length < 10) {
      errors.title = 'Title must be at least 10 characters';
    }
    
    if (!editFormData.description?.trim()) {
      errors.description = 'Description is required';
    } else if (editFormData.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    
    if (!editFormData.category) {
      errors.category = 'Category is required';
    }

    // Budget validation
    if (editFormData.job_type === 'hourly') {
      if (!editFormData.hourly_rate_min) {
        errors.hourly_rate_min = 'Min hourly rate is required';
      }
      if (!editFormData.hourly_rate_max) {
        errors.hourly_rate_max = 'Max hourly rate is required';
      }
      if (parseFloat(editFormData.hourly_rate_min) >= parseFloat(editFormData.hourly_rate_max)) {
        errors.hourly_rate_max = 'Max rate must be higher than min rate';
      }
    } else if (editFormData.job_type === 'milestone') {
      if (editFormData.milestones.length === 0) {
        errors.milestones = 'At least one milestone is required';
      } else {
        editFormData.milestones.forEach((milestone, index) => {
          if (!milestone.title?.trim()) {
            errors[`milestone_${index}_title`] = 'Milestone title is required';
          }
          if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
            errors[`milestone_${index}_amount`] = 'Milestone amount is required';
          }
        });
      }
    } else {
      if (!editFormData.budget_min) {
        errors.budget_min = 'Min budget is required';
      }
      if (!editFormData.budget_max) {
        errors.budget_max = 'Max budget is required';
      }
      if (parseFloat(editFormData.budget_min) >= parseFloat(editFormData.budget_max)) {
        errors.budget_max = 'Max budget must be higher than min budget';
      }
    }

    if (!editFormData.remote_allowed && !editFormData.location?.trim()) {
      errors.location = 'Location is required when remote work is not allowed';
    }

    if (editFormData.deadline) {
      const deadlineDate = new Date(editFormData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        errors.deadline = 'Deadline must be in the future';
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    try {
      setUpdating(true);
      const updateData = {
        ...editFormData,
        skill_ids: editFormData.skills,
        budget_min: editFormData.budget_min ? parseFloat(editFormData.budget_min) : null,
        budget_max: editFormData.budget_max ? parseFloat(editFormData.budget_max) : null,
        hourly_rate_min: editFormData.hourly_rate_min ? parseFloat(editFormData.hourly_rate_min) : null,
        hourly_rate_max: editFormData.hourly_rate_max ? parseFloat(editFormData.hourly_rate_max) : null,
        milestones: editFormData.milestones.map(milestone => ({
          ...milestone,
          amount: parseFloat(milestone.amount)
        }))
      };

      const updatedJob = await updateJob(jobId, updateData);
      setJob(updatedJob);
      setIsEditing(false);
      setMessage('Job updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update job: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
    // Reset form data to original job data
    if (job) {
      setEditFormData({
        title: job.title || '',
        description: job.description || '',
        category: job.category?.id || '',
        skills: job.skills?.map(skill => skill.id) || [],
        job_type: job.job_type || 'fixed',
        experience_level: job.experience_level || 'any',
        estimated_duration: job.estimated_duration || '',
        budget_min: job.budget_min || '',
        budget_max: job.budget_max || '',
        hourly_rate_min: job.hourly_rate_min || '',
        hourly_rate_max: job.hourly_rate_max || '',
        remote_allowed: job.remote_allowed || false,
        location: job.location || '',
        is_urgent: job.is_urgent || false,
        deadline: job.deadline ? job.deadline.split('T')[0] : '',
        milestones: job.milestones || [],
      });
    }
  };

  const getSelectedSkillsForEdit = () => {
    return skills.filter(skill => editFormData.skills.includes(skill.id));
  };

  const updateJobStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await jobsApi.updateJobStatus(jobId, newStatus);
      await loadJobDetails(); // Refresh job data
      setMessage(`Job status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUpdating(true);
      await deleteJob(jobId);
      setMessage('Job deleted successfully');
      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      if (!jobsApi.sendJobMessage) return;
      await jobsApi.sendJobMessage(jobId, { message: newMessage });
      setNewMessage('');
      await loadMessages();
      setMessage('Message sent successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusActions = () => {
    if (!job) return [];
    
    const actions = [];
    
    switch (job.status) {
      case 'draft':
        actions.push(
          <button
            key="publish"
            onClick={() => updateJobStatus('published')}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Play size={16} />
            Publish
          </button>
        );
        break;
      case 'published':
        actions.push(
          <button
            key="pause"
            onClick={() => updateJobStatus('paused')}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <Pause size={16} />
            Pause
          </button>
        );
        break;
      case 'paused':
        actions.push(
          <button
            key="resume"
            onClick={() => updateJobStatus('published')}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Play size={16} />
            Resume
          </button>
        );
        break;
      case 'in_progress':
        actions.push(
          <button
            key="complete"
            onClick={() => updateJobStatus('completed')}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <CheckCircle size={16} />
            Mark Complete
          </button>
        );
        break;
    }

    if (['draft', 'published', 'paused'].includes(job.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => updateJobStatus('cancelled')}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <Square size={16} />
          Cancel
        </button>
      );
    }

    return actions;
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

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} />
            Back to My Jobs
          </button>
          
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Job</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadJobDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} />
            Back to My Jobs
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Job not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={20} />
            Back to My Jobs
          </button>
          
          <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={updating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  isEditing 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Edit size={16} />
                {isEditing ? 'Cancel Edit' : 'Edit Job'}
              </button>
           
            
            {['draft', 'cancelled'].includes(job.status) && (
              <button
                onClick={handleDeleteJob}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Job Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(job.status)}`}>
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} />
                  {job.budget_display}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  {job.views_count || 0} views
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  {job.applications_count || 0} applications
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isEditing && getStatusActions()}
            
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            )}
            
            {!isEditing && (
              <>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
                
                <button
                  onClick={() => setActiveTab('applications')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Users size={16} />
                  Applications ({applications.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          {!isEditing && (
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8 pt-6">
                {[
                  { key: 'details', label: 'Job Details', icon: FileText },
                  { key: 'applications', label: `Applications (${applications.length})`, icon: Users },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { key: 'messages', label: 'Messages', icon: MessageSquare },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          <div className="p-8">
            {/* Job Details Tab / Edit Form */}
            {(activeTab === 'details' || isEditing) && (
              <div className="space-y-8">
                {isEditing ? (
                  // Edit Form
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Job Details</h3>
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => handleEditInputChange('title', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editErrors.title ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Full Stack Web Developer for E-commerce Platform"
                        />
                        {editErrors.title && <p className="text-red-500 text-sm mt-1">{editErrors.title}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Description *
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => handleEditInputChange('description', e.target.value)}
                          rows={6}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editErrors.description ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Describe your project requirements, goals, and expectations..."
                        />
                        {editErrors.description && <p className="text-red-500 text-sm mt-1">{editErrors.description}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                          </label>
                          <select
                            value={editFormData.category}
                            onChange={(e) => handleEditInputChange('category', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editErrors.category ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          {editErrors.category && <p className="text-red-500 text-sm mt-1">{editErrors.category}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Experience Level
                          </label>
                          <select
                            value={editFormData.experience_level}
                            onChange={(e) => handleEditInputChange('experience_level', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="any">Any Level</option>
                            <option value="entry">Entry Level</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Required Skills
                        </label>
                        <div className="space-y-3">
                          <div className="flex">
                            <input
                              type="text"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              placeholder="Search skills..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {skillInput && (
                            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                              {skills
                                .filter(skill => 
                                  skill.name.toLowerCase().includes(skillInput.toLowerCase()) &&
                                  !editFormData.skills.includes(skill.id)
                                )
                                .slice(0, 5)
                                .map(skill => (
                                  <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => addSkillToEdit(skill.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    {skill.name}
                                  </button>
                                ))}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {getSelectedSkillsForEdit().map(skill => (
                              <span
                                key={skill.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {skill.name}
                                <button
                                  type="button"
                                  onClick={() => removeSkillFromEdit(skill.id)}
                                  className="ml-2 hover:text-blue-900"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Budget & Timeline</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Job Type *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { value: 'fixed', label: 'Fixed Price', desc: 'Pay a fixed amount for the entire project' },
                            { value: 'hourly', label: 'Hourly Rate', desc: 'Pay based on hours worked' },
                            { value: 'milestone', label: 'Milestone Based', desc: 'Pay in phases as milestones are completed' }
                          ].map(type => (
                            <div
                              key={type.value}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                editFormData.job_type === type.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => handleEditInputChange('job_type', type.value)}
                            >
                              <div className="flex items-center mb-2">
                                <input
                                  type="radio"
                                  name="job_type"
                                  value={type.value}
                                  checked={editFormData.job_type === type.value}
                                  onChange={() => handleEditInputChange('job_type', type.value)}
                                  className="mr-2"
                                />
                                <span className="font-medium">{type.label}</span>
                              </div>
                              <p className="text-sm text-gray-600">{type.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budget Fields */}
                      {editFormData.job_type === 'hourly' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Hourly Rate ($) *
                            </label>
                            <input
                              type="number"
                              value={editFormData.hourly_rate_min}
                              onChange={(e) => handleEditInputChange('hourly_rate_min', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                editErrors.hourly_rate_min ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="25"
                              min="1"
                              step="0.01"
                            />
                            {editErrors.hourly_rate_min && <p className="text-red-500 text-sm mt-1">{editErrors.hourly_rate_min}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Hourly Rate ($) *
                            </label>
                            <input
                              type="number"
                              value={editFormData.hourly_rate_max}
                              onChange={(e) => handleEditInputChange('hourly_rate_max', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                editErrors.hourly_rate_max ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="75"
                              min="1"
                              step="0.01"
                            />
                            {editErrors.hourly_rate_max && <p className="text-red-500 text-sm mt-1">{editErrors.hourly_rate_max}</p>}
                          </div>
                        </div>
                      ) : editFormData.job_type === 'milestone' ? (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Project Milestones *
                            </label>
                            <button
                              type="button"
                              onClick={addMilestone}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <Plus size={16} />
                              Add Milestone
                            </button>
                          </div>
                          
                          {editFormData.milestones.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <p className="text-gray-500 mb-2">No milestones added yet</p>
                              <button
                                type="button"
                                onClick={addMilestone}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                              >
                                Add First Milestone
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {editFormData.milestones.map((milestone, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-gray-900">Milestone {milestone.order}</h4>
                                    <button
                                      type="button"
                                      onClick={() => removeMilestone(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                      </label>
                                      <input
                                        type="text"
                                        value={milestone.title}
                                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          editErrors[`milestone_${index}_title`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g. Initial Design"
                                      />
                                      {editErrors[`milestone_${index}_title`] && (
                                        <p className="text-red-500 text-xs mt-1">{editErrors[`milestone_${index}_title`]}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount ($) *
                                      </label>
                                      <input
                                        type="number"
                                        value={milestone.amount}
                                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          editErrors[`milestone_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="500"
                                        min="1"
                                        step="0.01"
                                      />
                                      {editErrors[`milestone_${index}_amount`] && (
                                        <p className="text-red-500 text-xs mt-1">{editErrors[`milestone_${index}_amount`]}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Description
                                    </label>
                                    <textarea
                                      value={milestone.description}
                                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows={2}
                                      placeholder="Describe what will be delivered in this milestone..."
                                    />
                                  </div>
                                  
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Due Date
                                    </label>
                                    <input
                                      type="date"
                                      value={milestone.due_date}
                                      onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      min={new Date().toISOString().split('T')[0]}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {editErrors.milestones && <p className="text-red-500 text-sm mt-2">{editErrors.milestones}</p>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Budget ($) *
                            </label>
                            <input
                              type="number"
                              value={editFormData.budget_min}
                              onChange={(e) => handleEditInputChange('budget_min', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                editErrors.budget_min ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="500"
                              min="1"
                              step="0.01"
                            />
                            {editErrors.budget_min && <p className="text-red-500 text-sm mt-1">{editErrors.budget_min}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Budget ($) *
                            </label>
                            <input
                              type="number"
                              value={editFormData.budget_max}
                              onChange={(e) => handleEditInputChange('budget_max', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                editErrors.budget_max ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="2000"
                              min="1"
                              step="0.01"
                            />
                            {editErrors.budget_max && <p className="text-red-500 text-sm mt-1">{editErrors.budget_max}</p>}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Duration
                          </label>
                          <select
                            value={editFormData.estimated_duration}
                            onChange={(e) => handleEditInputChange('estimated_duration', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Duration</option>
                            <option value="less_than_week">Less than a week</option>
                            <option value="1_to_4_weeks">1 to 4 weeks</option>
                            <option value="1_to_3_months">1 to 3 months</option>
                            <option value="3_to_6_months">3 to 6 months</option>
                            <option value="more_than_6_months">More than 6 months</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deadline (Optional)
                          </label>
                          <input
                            type="date"
                            value={editFormData.deadline}
                            onChange={(e) => handleEditInputChange('deadline', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editErrors.deadline ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {editErrors.deadline && <p className="text-red-500 text-sm mt-1">{editErrors.deadline}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Location & Preferences */}
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Location & Preferences</h4>
                      
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="remote_allowed"
                          checked={editFormData.remote_allowed}
                          onChange={(e) => handleEditInputChange('remote_allowed', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="remote_allowed" className="ml-2 text-sm font-medium text-gray-700">
                          Remote work allowed
                        </label>
                      </div>
                      
                      {!editFormData.remote_allowed && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                          </label>
                          <input
                            type="text"
                            value={editFormData.location}
                            onChange={(e) => handleEditInputChange('location', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editErrors.location ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g. San Francisco, CA"
                          />
                          {editErrors.location && <p className="text-red-500 text-sm mt-1">{editErrors.location}</p>}
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_urgent"
                          checked={editFormData.is_urgent}
                          onChange={(e) => handleEditInputChange('is_urgent', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_urgent" className="ml-2 text-sm font-medium text-gray-700">
                          Mark as urgent
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Read-only view
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{job.category?.name || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Job Type:</span>
                            <span className="font-medium capitalize">{job.job_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Experience Level:</span>
                            <span className="font-medium capitalize">{job.experience_level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">
                              {job.estimated_duration?.replace('_', ' ') || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Remote:</span>
                            <span className="font-medium">{job.remote_allowed ? 'Yes' : 'No'}</span>
                          </div>
                          {!job.remote_allowed && job.location && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="font-medium">{job.location}</span>
                            </div>
                          )}
                          {job.deadline && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Deadline:</span>
                              <span className="font-medium">{new Date(job.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skills?.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                            >
                              {skill.name}
                            </span>
                          )) || <span className="text-gray-500">No skills specified</span>}
                        </div>
                      </div>
                    </div>

                    {/* Milestones */}
                    {job.milestones && job.milestones.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
                        <div className="space-y-4">
                          {job.milestones.map((milestone, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                                <span className="text-lg font-bold text-green-600">
                                  ${milestone.amount}
                                </span>
                              </div>
                              {milestone.description && (
                                <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                              )}
                              {milestone.due_date && (
                                <p className="text-xs text-gray-500">
                                  Due: {new Date(milestone.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {job.attachments && job.attachments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                        <div className="space-y-2">
                          {job.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                                {attachment.description && (
                                  <p className="text-xs text-gray-500">{attachment.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => window.open(attachment.file, '_blank')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && !isEditing && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Applications ({applications.length})
                  </h3>
                  {applications.length > 0 && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Download All CVs
                    </button>
                  )}
                </div>

                {applicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600">
                      Applications will appear here once freelancers start applying to your job.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {application.freelancer?.profile_picture ? (
                                <img
                                  src={application.freelancer.profile_picture}
                                  alt={application.freelancer.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User size={24} className="text-gray-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {application.freelancer?.first_name} {application.freelancer?.last_name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {application.freelancer?.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    <span>{application.freelancer.rating}</span>
                                  </div>
                                )}
                                <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ${application.bid_amount}
                            </p>
                            <p className="text-sm text-gray-500">
                              {application.delivery_time} days
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Cover Letter</h5>
                          <p className="text-gray-700 text-sm">{application.cover_letter}</p>
                        </div>
                        
                        {application.attachments && application.attachments.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 mb-2">Attachments</h5>
                            <div className="flex flex-wrap gap-2">
                              {application.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                  {attachment.filename}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            Accept
                          </button>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                            Decline
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                            Message
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && !isEditing && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <Eye className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Views</p>
                          <p className="text-2xl font-bold text-blue-900">{job.views_count || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Applications</p>
                          <p className="text-2xl font-bold text-green-900">{job.applications_count || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Response Rate</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {job.views_count ? Math.round((job.applications_count / job.views_count) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Days Active</p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {Math.ceil((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Trends</h3>
                    <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
                      <p className="text-gray-500">Chart placeholder - Implement with your preferred charting library</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">View Sources</h3>
                    <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
                      <p className="text-gray-500">Chart placeholder - Traffic sources data</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metric
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Industry Average
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Views per Day
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.views_count ? Math.round(job.views_count / Math.max(1, Math.ceil((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24)))) : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Applications per View
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.views_count ? ((job.applications_count / job.views_count) * 100).toFixed(1) : 0}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.5%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Average Bid Amount
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${applications.length ? Math.round(applications.reduce((sum, app) => sum + (app.bid_amount || 0), 0) / applications.length) : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,250</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && !isEditing && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                  <span className="text-sm text-gray-500">{messages.length} messages</span>
                </div>

                {messagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No messages yet</p>
                          <p className="text-sm text-gray-400">Messages from applicants will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="flex gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={16} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {message.sender?.first_name} {message.sender?.last_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(message.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{message.content}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      >
                                        {attachment.filename}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message here..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send size={16} />
                            Send
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Upload size={16} />
                            Attach
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientJobDetailPage;