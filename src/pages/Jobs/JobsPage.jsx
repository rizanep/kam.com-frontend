import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import JobCard from '../../components/Jobs/JobCard';
import JobFilters from '../../components/Jobs/JobFilters';

const JobsPage = ({ onJobClick, onJobApply }) => {
  const { 
    jobs, 
    categories, 
    loading, 
    error, 
    filters, 
    searchQuery, 
    dispatch, 
    loadJobs, 
    saveJob, 
    unsaveJob 
  } = useJobs();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadJobs({ ...filters, search: searchQuery });
  }, [filters, searchQuery]);

  const handleSearch = () => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: localSearchQuery });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">Find your next opportunity from thousands of available jobs</p>
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

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for jobs..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        </div>

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
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onJobClick={onJobClick}
                onSave={handleSave}
                onApply={onJobApply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;