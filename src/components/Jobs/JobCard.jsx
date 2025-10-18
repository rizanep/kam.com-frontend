import React, { useState } from 'react';
import { 
  MapPin, Clock, DollarSign, Star, Bookmark, BookmarkCheck, 
  User, Eye, Users, Calendar, CheckCircle, AlertTriangle, Building,
  MessageCircle
} from 'lucide-react';

const API_BASE_URL = 'https://kamcomuser.duckdns.org';

const JobCard = ({ 
  job, 
  onJobClick, 
  onSave, 
  onApply, 
  onClientClick,
  onMessageClient, // New prop for messaging functionality
  showActions = true,
  currentUserId = null,
  userRole = null,
}) => {
  const [isSaved, setIsSaved] = useState(job.is_saved);
  const [saving, setSaving] = useState(false);
  const isJobOwner =  job.client_info?.id == currentUserId;

  const showApplyButton = showActions && onApply && !isJobOwner && userRole?.includes('freelancer');
  const showMessageButton = showActions && onMessageClient && !isJobOwner && userRole && userRole.includes('freelancer');

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saving) return;
    
    setSaving(true);
    try {
      await onSave(job.id, !isSaved);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClientClick = (e) => {
    e.stopPropagation();
    if (onClientClick && job.client_info?.id) {
      onClientClick(job.client_info.id);
    }
  };
  console.log(job.client_info)
  const handleMessageClient = (e) => {
    e.stopPropagation();
    if (onMessageClient && job.client_info?.id) {
      onMessageClient(job.client_info.id, job.client_info);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just posted';
  };

  const calculateDeadlineUrgency = () => {
    if (!job.deadline) return null;
    
    const deadlineDate = new Date(job.deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { status: 'expired', days: diffDays };
    if (diffDays <= 3) return { status: 'urgent', days: diffDays };
    if (diffDays <= 7) return { status: 'soon', days: diffDays };
    return { status: 'normal', days: diffDays };
  };
console.log(job)
  const deadlineInfo = calculateDeadlineUrgency();
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer relative group"
      onClick={() => onJobClick && onJobClick(job.id)}
    >
      {/* Header Section with Title and Save Button */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2 transition-colors pr-2">
            {job.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Action buttons - Save and Message */}
        <div className="flex flex-col gap-2">
          {/* Save Button */}
          {showActions && !isJobOwner && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title={isSaved ? 'Remove bookmark' : 'Save job'}
            >
              {isSaved ? (
                <BookmarkCheck size={20} className="text-blue-600" />
              ) : (
                <Bookmark size={20} className="text-gray-400 hover:text-blue-600" />
              )}
            </button>
          )}

          {/* Message Client Button */}
          {showMessageButton && (
            <button
              onClick={handleMessageClient}
              className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-lg transition-colors group/message"
              title="Message client"
            >
              <MessageCircle size={20} className="text-gray-400 group-hover/message:text-blue-600 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {job.is_featured && (
          <span className="px-2 sm:px-3 py-1 text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full font-semibold shadow-sm">
            Featured
          </span>
        )}
        {job.is_urgent && (
          <span className="px-2 sm:px-3 py-1 text-xs bg-gradient-to-r from-red-100 to-red-200 text-red-800 rounded-full font-semibold shadow-sm">
            Urgent
          </span>
        )}
        <span className={`text-xs px-2 sm:px-3 py-1 rounded-full font-semibold ${
          job.job_type === 'hourly' ? 'bg-green-100 text-green-700 border border-green-200' :
          job.job_type === 'milestone' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {job.job_type === 'hourly' ? 'Hourly' : 
           job.job_type === 'milestone' ? 'Milestone' : 'Fixed'}
        </span>
      </div>
      
      {/* Job Details */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1 sm:gap-1.5 font-semibold">
          <DollarSign size={14} className="text-green-600" />
          <span className="text-gray-900">
            {job.job_type === 'milestone' && job.milestones?.length > 0
              ? `$${job.milestones.reduce((total, m) => total + parseFloat(m.amount || 0), 0).toLocaleString()} (${job.milestones.length} milestones)`
              : job.budget_display
            }
          </span>
        </span>
        <span className="flex items-center gap-1 sm:gap-1.5">
          <Clock size={14} className="text-gray-400" />
          {job.time_posted || formatTimeAgo(job.created_at)}
        </span>
        <span className="flex items-center gap-1 sm:gap-1.5">
          <MapPin size={14} className={job.remote_allowed ? 'text-blue-500' : 'text-gray-400'} />
          {job.remote_allowed ? (
            <span className="text-blue-600 font-medium">Remote</span>
          ) : (
            job.location || 'N/A'
          )}
        </span>
      </div>

      {/* Deadline Warning */}
      {deadlineInfo && (
        <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 px-2 py-1 rounded-md w-fit ${
          deadlineInfo.status === 'expired' ? 'bg-red-50 text-red-700' :
          deadlineInfo.status === 'urgent' ? 'bg-orange-50 text-orange-700' :
          deadlineInfo.status === 'soon' ? 'bg-yellow-50 text-yellow-700' :
          'bg-gray-50 text-gray-600'
        }`}>
          {deadlineInfo.status === 'expired' ? (
            <>
              <AlertTriangle size={12} />
              Deadline passed
            </>
          ) : deadlineInfo.status === 'urgent' ? (
            <>
              <AlertTriangle size={12} />
              {deadlineInfo.days} day{deadlineInfo.days !== 1 ? 's' : ''} left
            </>
          ) : (
            <>
              <Calendar size={12} />
              {deadlineInfo.days} days left
            </>
          )}
        </div>
      )}
      
      {/* Client Info */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
          onClick={handleClientClick}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            {job.client_info?.profile_picture ? (
             <img 
              src={`${API_BASE_URL}/${job.client_info?.profile_picture}`} 
              alt={job.client_info.username}
              className="w-full h-full rounded-full object-cover"
            />
            ) : (
              <User size={18} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                {job.client_info?.first_name && job.client_info?.last_name 
                  ? `${job.client_info.first_name} ${job.client_info.last_name}`
                  : job.client_info?.username || 'Anonymous'
                }
              </p>
              {job.client_info?.is_verified && (
                <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {job.client_info?.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-yellow-400 fill-current" />
                  <span className="font-medium">{job.client_info.rating.toFixed(1)}</span>
                </div>
              )}
              <span className="font-medium text-green-600">
                ${job.client_info?.total_spent?.toLocaleString() || 0}
              </span>
              <span className="text-gray-400">•</span>
              <span>{job.client_info?.jobs_posted || 0} jobs</span>
            </div>
          </div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills?.slice(0, 5).map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
            >
              {skill.name}
            </span>
          ))}
          {job.skills?.length > 5 && (
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-full font-medium">
              +{job.skills.length - 5}
            </span>
          )}
        </div>
      </div>
      
      {/* Footer - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={13} />
            <span className="font-medium">{job.applications_count}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye size={13} />
            <span className="font-medium">{job.views_count}</span>
          </span>
          {job.estimated_duration && (
            <span className="hidden sm:flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium">
              <Clock size={13} />
              {job.estimated_duration.replace('_', ' ')}
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Message Button in Footer (Alternative placement) */}
          {showMessageButton && (
            <button 
              onClick={handleMessageClient}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Message Client
            </button>
          )}

          {showApplyButton && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onApply(job);
              }}
              disabled={deadlineInfo?.status === 'expired'}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                deadlineInfo?.status === 'expired'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {deadlineInfo?.status === 'expired' ? 'Expired' : 'Apply Now'}
            </button>
          )}

          {isJobOwner && showActions && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Manage Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;