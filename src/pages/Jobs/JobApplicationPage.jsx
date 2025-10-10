// src/components/Jobs/JobApplicationPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, DollarSign, Clock, FileText, Upload, X, 
  Send, AlertCircle, CheckCircle, User, Star,
  Download, Briefcase, Calendar
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { jobsApi } from '../../services/jobsApi';
import { bidsApiService } from '../../services/bidsApi';

const JobApplicationPage = ({ job, jobId, onBack, onSuccess }) => {
  const { user } = useJobs();
  const [jobData, setJobData] = useState(job);
  const [loading, setLoading] = useState(!job);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    proposal: '',
    amount: '',
    hourly_rate: '',
    estimated_hours: '',
    estimated_delivery: '',
    bid_type: 'fixed',
    questions: [],
    milestones: []
  });

  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!job && jobId) {
      loadJobData();
    } else if (job) {
      initializeFormData(job);
    }
  }, [job, jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.getJob(jobId);
      setJobData(data);
      initializeFormData(data);
    } catch (err) {
      setError('Failed to load job details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (jobData) => {
    const bidType = jobData.job_type || 'fixed';
    
    setFormData(prev => ({
      ...prev,
      bid_type: bidType,
      amount: bidType === 'fixed' ? (jobData.budget_min || '').toString() : '',
      hourly_rate: bidType === 'hourly' ? (jobData.hourly_rate_min || '').toString() : '',
      estimated_hours: bidType === 'hourly' ? '40' : '',
      estimated_delivery: '14'
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'text/plain'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError(`File "${file.name}" has an invalid type. Please upload PDF, DOC, DOCX, JPG, PNG, GIF, or TXT files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, {
      title: '',
      description: '',
      amount: '',
      estimated_delivery_days: '',
      order: prev.length + 1
    }]);
  };

  const updateMilestone = (index, field, value) => {
    setMilestones(prev => prev.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const removeMilestone = (index) => {
    setMilestones(prev => prev.filter((_, i) => i !== index)
      .map((milestone, i) => ({ ...milestone, order: i + 1 })));
  };

  const validateForm = () => {
    if (!formData.proposal.trim()) {
      setError('Proposal is required and must be at least 50 characters');
      return false;
    }

    if (formData.proposal.trim().length < 50) {
      setError('Proposal must be at least 50 characters long');
      return false;
    }
    
    if (formData.bid_type === 'fixed') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid bid amount');
        return false;
      }
    } else if (formData.bid_type === 'hourly') {
      if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
        setError('Please enter a valid hourly rate');
        return false;
      }
      if (!formData.estimated_hours || parseInt(formData.estimated_hours) <= 0) {
        setError('Please enter valid estimated hours');
        return false;
      }
    } else if (formData.bid_type === 'milestone') {
      if (milestones.length === 0) {
        setError('Please add at least one milestone');
        return false;
      }
      
      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
      const bidAmount = parseFloat(formData.amount || 0);
      
      if (Math.abs(totalMilestoneAmount - bidAmount) > 0.01) {
        setError('Total milestone amount must equal the bid amount');
        return false;
      }
    }
    
    if (!formData.estimated_delivery || parseInt(formData.estimated_delivery) <= 0) {
      setError('Please enter a valid delivery time');
      return false;
    }

    // Validate against job constraints
    const amount = parseFloat(formData.amount || formData.hourly_rate);
    if (jobData.job_type === 'hourly') {
      if (jobData.hourly_rate_max && amount > jobData.hourly_rate_max) {
        setError(`Hourly rate cannot exceed $${jobData.hourly_rate_max}`);
        return false;
      }
    } else {
      if (jobData.budget_max && amount > jobData.budget_max) {
        setError(`Bid amount cannot exceed $${jobData.budget_max}`);
        return false;
      }
    }
    
    return true;
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
      console.error('Error downloading file:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare bid data
      const bidData = {
        job_id: jobData.id,
        bid_type: formData.bid_type,
        proposal: formData.proposal.trim(),
        estimated_delivery: parseInt(formData.estimated_delivery),
        currency: 'USD'
      };

      // Add type-specific data
      if (formData.bid_type === 'fixed') {
        bidData.amount = parseFloat(formData.amount);
      } else if (formData.bid_type === 'hourly') {
        bidData.hourly_rate = parseFloat(formData.hourly_rate);
        bidData.estimated_hours = parseInt(formData.estimated_hours);
      } else if (formData.bid_type === 'milestone') {
        bidData.amount = parseFloat(formData.amount);
        bidData.milestones = milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: parseFloat(m.amount),
          estimated_delivery_days: parseInt(m.estimated_delivery_days),
          order: m.order
        }));
      }

      // Add questions if any
      if (formData.questions && formData.questions.length > 0) {
        bidData.questions = formData.questions;
      }

      // Create the bid
      const createdBid = await bidsApiService.createBid(bidData);
      
      // Upload attachments if any
      if (attachments.length > 0) {
        const attachmentFormData = new FormData();
        attachments.forEach((file, index) => {
          attachmentFormData.append('file', file);
          attachmentFormData.append('description', `Attachment ${index + 1}`);
          attachmentFormData.append('file_type', 'document');
        });

        try {
          await bidsApiService.uploadBidAttachment(createdBid.id, attachmentFormData);
        } catch (attachmentError) {
          console.error('Failed to upload attachments:', attachmentError);
          // Don't fail the whole submission for attachment errors
        }
      }
      
      setSuccess('Application submitted successfully! You can track its status in your dashboard.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to submit application';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're trying to apply for doesn't exist.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Job Details
        </button>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Job Summary</h3>
            <h4 className="font-medium text-gray-900 mb-2">{jobData.title}</h4>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                {jobData.budget_display}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {jobData.estimated_duration?.replace('_', ' ') || 'Not specified'}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                {jobData.job_type?.charAt(0).toUpperCase() + jobData.job_type?.slice(1)} project
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} />
                {jobData.applications_count || 0} proposals
              </div>
              {jobData.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Deadline: {new Date(jobData.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {/* Client Info */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Client</h5>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {jobData.client_info?.profile_picture ? (
                    <img 
                      src={jobData.client_info.profile_picture} 
                      alt={jobData.client_info.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {jobData.client_info?.first_name} {jobData.client_info?.last_name}
                  </p>
                  {jobData.client_info?.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">
                        {jobData.client_info.rating}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {jobData.client_info?.jobs_posted || 0} jobs posted
                  </p>
                </div>
              </div>
            </div>
            
            {/* Required Skills */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Required Skills</h5>
              <div className="flex flex-wrap gap-1">
                {jobData.skills?.slice(0, 6).map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Job Attachments */}
            {jobData.attachments && jobData.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Job Attachments</h5>
                <div className="space-y-2">
                  {jobData.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {attachment.filename}
                        </p>
                        {attachment.description && (
                          <p className="text-xs text-gray-500">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          downloadAttachment(attachment.file_url, attachment.filename)
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Proposal</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bid Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposal Type
                </label>
                <div className="flex gap-4">
                  {['fixed', 'hourly', 'milestone'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        value={type}
                        checked={formData.bid_type === type}
                        onChange={(e) => handleInputChange('bid_type', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type === 'fixed' ? 'Fixed Price' : 
                         type === 'hourly' ? 'Hourly Rate' : 'Milestone Based'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Proposal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposal *
                </label>
                <textarea
                  value={formData.proposal}
                  onChange={(e) => handleInputChange('proposal', e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe why you're the perfect fit for this job. Include your approach, relevant experience, and what makes you stand out..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.proposal.length}/5000 characters (minimum 50)
                </p>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                {formData.bid_type === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Project Cost ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1500"
                      min="1"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Budget range: ${jobData.budget_min || 0} - ${jobData.budget_max || 'No limit'}
                    </p>
                  </div>
                )}

                {formData.bid_type === 'hourly' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate ($) *
                      </label>
                      <input
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="75"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours *
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="40"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.bid_type === 'milestone' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Total Project Cost ($) *
                      </label>
                    </div>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1500"
                      min="1"
                      step="0.01"
                      required
                    />
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Milestones</h4>
                        <button
                          type="button"
                          onClick={addMilestone}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Add Milestone
                        </button>
                      </div>
                      
                      {milestones.map((milestone, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium">Milestone {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <input
                                type="text"
                                placeholder="Milestone title"
                                value={milestone.title}
                                onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Amount ($)"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0.01"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <textarea
                              placeholder="Milestone description"
                              value={milestone.description}
                              onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows="2"
                              required
                            />
                          </div>
                          
                          <div className="mt-2">
                            <input
                              type="number"
                              placeholder="Delivery time (days)"
                              value={milestone.estimated_delivery_days}
                              onChange={(e) => updateMilestone(index, 'estimated_delivery_days', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      ))}
                      
                      {milestones.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Total milestone amount: ${milestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Time (days) *
                </label>
                <input
                  type="number"
                  value={formData.estimated_delivery}
                  onChange={(e) => handleInputChange('estimated_delivery', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="14"
                  min="1"
                  required
                />
                {jobData.deadline && (
                  <p className="text-xs text-gray-500 mt-1">
                    Project deadline: {new Date(jobData.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio/Attachments (Optional)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload size={32} className="mx-autoat text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Drop files here or click to browse</p>
                  <p className="text-xs text-gray-500">Support: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max: 10MB each, 5 files total)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="mt-4 inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.proposal || formData.proposal.length < 50}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;