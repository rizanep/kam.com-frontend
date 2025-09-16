import React, { useState } from 'react';
import { 
  MapPin, Clock, DollarSign, Star, Bookmark, BookmarkCheck, 
  User, Eye, Users, Calendar, CheckCircle, AlertTriangle, Building
} from 'lucide-react';

const JobCard = ({ job, onJobClick, onSave, onApply, showActions = true }) => {
  const [isSaved, setIsSaved] = useState(job.is_saved);
  const [saving, setSaving] = useState(false);

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

  const deadlineInfo = calculateDeadlineUrgency();

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300 cursor-pointer relative"
      onClick={() => onJobClick && onJobClick(job.id)}
    >
      {/* Urgent/Featured Badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {job.is_featured && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
            Featured
          </span>
        )}
        {job.is_urgent && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
            Urgent
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-16">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-2">
            {job.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {job.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1 font-medium">
              <DollarSign size={14} />
              <span className="text-gray-900">{job.budget_display}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {job.time_posted || formatTimeAgo(job.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {job.remote_allowed ? 'Remote' : job.location}
            </span>
          </div>

          {/* Deadline Warning */}
          {deadlineInfo && (
            <div className={`flex items-center gap-1 text-xs mb-3 ${
              deadlineInfo.status === 'expired' ? 'text-red-600' :
              deadlineInfo.status === 'urgent' ? 'text-orange-600' :
              deadlineInfo.status === 'soon' ? 'text-yellow-600' :
              'text-gray-500'
            }`}>
              {deadlineInfo.status === 'expired' ? (
                <>
                  <AlertTriangle size={14} />
                  Deadline passed
                </>
              ) : deadlineInfo.status === 'urgent' ? (
                <>
                  <AlertTriangle size={14} />
                  {deadlineInfo.days} day{deadlineInfo.days !== 1 ? 's' : ''} left
                </>
              ) : (
                <>
                  <Calendar size={14} />
                  {deadlineInfo.days} days left
                </>
              )}
            </div>
          )}
        </div>
        
        {showActions && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaved ? (
              <BookmarkCheck size={20} className="text-blue-600" />
            ) : (
              <Bookmark size={20} className="text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      {/* Client Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {job.client_info?.profile_picture ? (
              <img 
                src={job.client_info.profile_picture} 
                alt={job.client_info.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User size={18} className="text-gray-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {job.client_info?.first_name} {job.client_info?.last_name}
              </p>
              {job.client_info?.is_verified && (
                <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
              )}
              {job.client_info?.company_name && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Building size={12} />
                  <span className="text-xs truncate">{job.client_info.company_name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {job.client_info?.rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-current" />
                  <span>{job.client_info.rating}</span>
                </div>
              )}
              <span>${job.client_info?.total_spent?.toLocaleString() || 0} spent</span>
              <span>{job.client_info?.jobs_posted || 0} jobs</span>
            </div>
          </div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-1 justify-end max-w-xs">
          {job.skills?.slice(0, 3).map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium"
            >
              {skill.name}
            </span>
          ))}
          {job.skills?.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {job.applications_count} proposal{job.applications_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {job.views_count} view{job.views_count !== 1 ? 's' : ''}
          </span>
          {job.estimated_duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {job.estimated_duration.replace('_', ' ')}
            </span>
          )}
        </div>
        
        {showActions && onApply && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onApply(job);
            }}
            disabled={deadlineInfo?.status === 'expired'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              deadlineInfo?.status === 'expired'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {deadlineInfo?.status === 'expired' ? 'Expired' : 'Apply Now'}
          </button>
        )}
      </div>

      {/* Job Type Indicator */}
      <div className="absolute bottom-2 left-4">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          job.job_type === 'hourly' ? 'bg-green-100 text-green-700' :
          job.job_type === 'milestone' ? 'bg-purple-100 text-purple-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {job.job_type === 'hourly' ? 'Hourly' : 
           job.job_type === 'milestone' ? 'Milestone' : 'Fixed Price'}
        </span>
      </div>
    </div>
  );
};

export default JobCard;