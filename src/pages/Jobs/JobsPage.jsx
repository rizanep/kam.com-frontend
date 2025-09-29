import React, { useState, useEffect, useContext } from 'react';
import { Search, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import JobCard from '../../components/Jobs/JobCard';
import JobFilters from '../../components/Jobs/JobFilters';
import AuthContext from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const JobsPage = ({ onJobClick, onJobApply }) => {
  const {
    jobs,
    categories,
    loading,
    error,
    filters,
    searchQuery,
    pagination,
    dispatch,
    loadJobs,
    saveJob,
    unsaveJob,
    clearError
  } = useJobs();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadJobs({ ...filters, search: searchQuery, page: 1 });
  }, [filters, searchQuery]);
  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const handleSearch = () => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: localSearchQuery });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFiltersChange = (newFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  };

  const handleSave = async (jobId, shouldSave) => {
    try {
      if (shouldSave) {
        await saveJob(jobId);
        setMessage('Job saved successfully!');
      } else {
        await unsaveJob(jobId);
        setMessage('Job removed from saved');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving job. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadJobs({ ...filters, search: searchQuery, page });
    }
  };

  const clearAllFilters = () => {
    setLocalSearchQuery('');
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_FILTERS', payload: {} });
  };

  const getActiveFiltersCount = () => {
    return (
      Object.values(filters).filter(
        (value) => value && value !== '' && value !== false && value !== 'all'
      ).length + (searchQuery ? 1 : 0)
    );
  };

  // compute start/end counts dynamically
  const perPage = pagination.pageSize || jobs.length;
  const startIndex = (pagination.currentPage - 1) * perPage + 1;
  const endIndex = startIndex + jobs.length - 1;
const handleMessageClient = (clientId, clientInfo) => {
  // Navigate to messaging page with recipient information
  const params = new URLSearchParams({
    recipient: clientId,
    name: clientInfo?.first_name && clientInfo?.last_name 
      ? `${clientInfo.first_name} ${clientInfo.last_name}`
      : clientInfo?.username || 'Client',
    profilePicture: clientInfo?.profile_picture || '',
    messageType: 'job', // This will be a job-related conversation
    autoStart: 'true'
  });
  
  navigate(`/messages?${params.toString()}`);
};
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">
            Find your next opportunity from thousands of available jobs
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.includes('Error') || message.includes('Failed')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}
          >
            {message.includes('Error') || message.includes('Failed') ? (
              <AlertCircle size={20} className="mr-2" />
            ) : (
              <CheckCircle size={20} className="mr-2" />
            )}
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for jobs..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <JobFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            isLoading={loading}
          />

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {getActiveFiltersCount()} filter
                  {getActiveFiltersCount() !== 1 ? 's' : ''} applied
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              {pagination.totalJobs > 0 ? (
                <>
                  Showing {startIndex} - {endIndex} of {pagination.totalJobs} jobs
                  {searchQuery && (
                    <span>
                      {' '}
                      for "<strong>{searchQuery}</strong>"
                    </span>
                  )}
                </>
              ) : (
                'No jobs found'
              )}
            </p>
          </div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {loading && jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onJobClick={onJobClick}
                  onSave={handleSave}
                  onApply={onJobApply}
                  onMessageClient={handleMessageClient}
                  onClientClick={(clientId) => {
                    navigate(`/freelancer/profile/${clientId}`);
                  }}
                  currentUserId={user?.id} // Pass current user's ID
                  userRole={user.account_types} // Pass user role
                />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 bg-white rounded-lg border border-gray-200 px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevious || loading}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              page === pagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
