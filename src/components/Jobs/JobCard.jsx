import React, { useState } from 'react';
import { 
  MapPin, Clock, DollarSign, Star, Bookmark, BookmarkCheck, 
  User, Eye, Users, Calendar, CheckCircle
} from 'lucide-react';

const JobCard = ({ job, onJobClick, onSave, onApply, showActions = true }) => {
  const [isSaved, setIsSaved] = useState(job.is_saved);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
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

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300 cursor-pointer"
      onClick={() => onJobClick && onJobClick(job.id)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
              {job.title}
            </h3>
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
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {job.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1 font-medium">
              <DollarSign size={14} />
              {job.budget_display}
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
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
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
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
              {job.client_info?.first_name} {job.client_info?.last_name}
              {job.client_info?.is_verified && (
                <CheckCircle size={14} className="text-blue-600" />
              )}
            </p>
            {job.client_info?.rating && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">
                  {job.client_info.rating} • ${job.client_info.total_spent?.toLocaleString() || 0} spent
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-1 justify-end">
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
            {job.applications_count} proposals
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {job.views_count} views
          </span>
          {job.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {showActions && onApply && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onApply(job);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
