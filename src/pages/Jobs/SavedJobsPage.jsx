import React, { useState, useEffect } from 'react';
import { Bookmark, Search, AlertCircle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import JobCard from '../../components/Jobs/JobCard';

const SavedJobsPage = ({ onJobClick, onJobApply }) => {
  const { savedJobs, loading, loadSavedJobs, unsaveJob } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [sortBy, setSortBy] = useState('saved_date');

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await unsaveJob(jobId);
      setMessage('Job removed from saved');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error removing job from saved');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = async (jobId, shouldSave) => {
    // Since this is the saved jobs page, we only handle unsaving
    if (!shouldSave) {
      await handleUnsave(jobId);
    }
  };

  const filteredJobs = savedJobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills?.some(skill => skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'saved_date':
        return new Date(b.saved_at || b.created_at) - new Date(a.saved_at || a.created_at);
      case 'created_date':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'budget_high':
        return (b.budget_max || 0) - (a.budget_max || 0);
      case 'budget_low':
        return (a.budget_min || 0) - (b.budget_min || 0);
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      default:
        return 0;
    }
  });

  if (loading && savedJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600">Your bookmarked job opportunities</p>
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

        {/* Search and Sort Controls */}
        {savedJobs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search saved jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="saved_date">Date Saved</option>
                  <option value="created_date">Date Posted</option>
                  <option value="budget_high">Budget (High to Low)</option>
                  <option value="budget_low">Budget (Low to High)</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredJobs.length} of {savedJobs.length} saved jobs
                {searchQuery && (
                  <span> matching "<strong>{searchQuery}</strong>"</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Bookmark size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
              <p className="text-gray-600 mb-4">Jobs you save will appear here for easy access.</p>
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse Jobs
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching jobs found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search terms.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {sortedJobs.map((job) => (
                <div key={job.id} className="relative">
                  <JobCard
                    job={{ ...job, is_saved: true }}
                    onJobClick={onJobClick}
                    onSave={handleSave}
                    onApply={onJobApply}
                  />
                  
                  {/* Saved Date Indicator */}
                  {job.saved_at && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Saved {new Date(job.saved_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* Deadline Warning */}
                  {job.deadline && (
                    (() => {
                      const deadlineDate = new Date(job.deadline);
                      const today = new Date();
                      const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                      
                      if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
                        return (
                          <div className="absolute bottom-2 right-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Calendar size={12} />
                            {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} left
                          </div>
                        );
                      } else if (daysUntilDeadline <= 0) {
                        return (
                          <div className="absolute bottom-2 right-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Calendar size={12} />
                            Deadline passed
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>
              ))}

              {/* Quick Actions Footer */}
              <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">High Budget Jobs</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sortedJobs.filter(job => (job.budget_max || 0) > 5000).length} jobs over $5,000
                    </p>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Urgent Deadlines</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sortedJobs.filter(job => {
                        if (!job.deadline) return false;
                        const daysUntil = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysUntil <= 7 && daysUntil > 0;
                      }).length} jobs due within a week
                    </p>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Bookmark className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Recently Saved</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sortedJobs.filter(job => {
                        if (!job.saved_at) return false;
                        const daysSaved = Math.ceil((new Date() - new Date(job.saved_at)) / (1000 * 60 * 60 * 24));
                        return daysSaved <= 7;
                      }).length} jobs saved this week
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedJobsPage;