const MyJobsPage = ({ onJobClick, onPostJob }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadMyJobs();
  }, []);

  const loadMyJobs = async () => {
    try {
      const data = await jobsApi.getMyJobs();
      setJobs(data.results || data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await jobsApi.updateJobStatus(jobId, newStatus);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            onClick={onPostJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Post New Job
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All Jobs' },
              { key: 'published', label: 'Published' },
              { key: 'draft', label: 'Draft' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' }
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

        {/* Jobs List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No jobs posted yet' : `No ${statusFilter} jobs`}
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' 
                  ? 'Start by posting your first job to find talented freelancers.'
                  : `You don't have any ${statusFilter} jobs at the moment.`
                }
              </p>
              {statusFilter === 'all' && (
                <button
                  onClick={onPostJob}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Post Your First Job
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-2"
                        onClick={() => onJobClick && onJobClick(job.id)}
                      >
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {job.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {job.applications_count} proposals
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {job.budget_display}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                        
                        {job.status === 'draft' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'published')}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Publish
                          </button>
                        )}
                        
                        {job.status === 'published' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'paused')}
                            className="text-sm text-yellow-600 hover:text-yellow-800"
                          >
                            Pause
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onJobClick && onJobClick(job.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <BarChart3 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 3. SAVED JOBS PAGE (src/pages/Jobs/SavedJobsPage.jsx) =====
const SavedJobsPage = ({ onJobClick, onJobApply }) => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const data = await jobsApi.getSavedJobs();
      setSavedJobs(data.results || data);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await jobsApi.unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-gray-600">Your bookmarked job opportunities</p>
        </div>

        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Bookmark size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
              <p className="text-gray-600">Jobs you save will appear here for easy access.</p>
            </div>
          ) : (
            savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onJobClick={onJobClick}
                onSave={(jobId, save) => !save && handleUnsave(jobId)}
                onApply={onJobApply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 4. COMPLETE FILE STRUCTURE GUIDE =====
/*
Complete File Structure for Jobs Frontend:

src/
├── components/
│   └── Jobs/
│       ├── JobCard.jsx (✓ Created above)
│       ├── JobFilters.jsx (✓ Created above)
│       ├── JobStats.jsx (For dashboard widgets)
│       └── JobSearchBar.jsx
├── pages/
│   └── Jobs/
│       ├── JobsPage.jsx (✓ Created above)
│       ├── JobDetailPage.jsx (✓ Created above)
│       ├── PostJobPage.jsx (✓ Created above)
│       ├── MyJobsPage.jsx (✓ Created above)
│       ├── SavedJobsPage.jsx (✓ Created above)
│       └── JobsMainPage.jsx (Router component)
├── services/
│   └── jobsApi.js (✓ Created above)
├── context/
│   └── JobContext.js (✓ Created above)
└── hooks/
    └── useJobs.js (Custom hook)

INTEGRATION STEPS:

1. Copy all components to their respective folders
2. Update your App.js to include JobProvider and routes
3. Update Navbar to include Jobs link
4. Add environment variables
5. Test with backend running on port 8001

FEATURES INCLUDED:
✅ Complete job browsing with search and filters
✅ Job posting with 3-step form
✅ Job management for clients
✅ Saved jobs for freelancers
✅ Job detail pages with full information
✅ Integration with your existing auth system
✅ Responsive design matching your current styling
✅ Error handling and loading states
✅ API integration with all backend endpoints
✅ File upload support
✅ Status management
✅ Real-time updates
*/

export { PostJobPage, MyJobsPage, SavedJobsPage };