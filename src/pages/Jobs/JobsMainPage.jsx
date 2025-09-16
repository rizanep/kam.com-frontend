import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import JobsPage from './JobsPage';
import JobDetailPage from './JobDetailPage';
import PostJobPage from './PostJobPage';
import MyJobsPage from './MyJobsPage';
import SavedJobsPage from './SavedJobsPage';
import JobApplicationPage from './JobApplicationPage';
import ClientJobDetailPage from './ClientJobDetailPage'; // Import the new component
import JobsLayout from '../../components/Jobs/JobsLayout';

const JobsMainPage = () => {
  const { user } = useAuth();
  const { clearError } = useJobs();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState('browse');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Check if user is a client
  const isClient = user?.account_types?.includes('client') || user?.user_type === 'client';

  // Handle URL query parameters and route changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const view = queryParams.get('view');
    const jobId = queryParams.get('jobId');
    const clientManage = queryParams.get('clientManage'); // New parameter for client management
    
    // Map URL views to component views
    const viewMapping = {
      'my-jobs': 'my-jobs',
      'saved': 'saved',
      'post': 'post-job',
      'browse': 'browse'
    };
    
    if (view && viewMapping[view]) {
      setCurrentView(viewMapping[view]);
    } else if (jobId) {
      // Check if this is client managing their own job
      if (clientManage === 'true' && isClient) {
        setCurrentView('client-job-detail');
      } else {
        setCurrentView('detail');
      }
      setSelectedJobId(jobId);
    } else {
      setCurrentView('browse');
    }
    
    // Clear any previous errors when component mounts or view changes
    clearError();
  }, [location.search, clearError, isClient]);

  const handleViewChange = (view, jobId = null, job = null, clientManage = false) => {
    setCurrentView(view);
    setSelectedJobId(jobId);
    setSelectedJob(job);
    
    // Update URL to reflect the current view
    const searchParams = new URLSearchParams();
    
    if (view === 'my-jobs') {
      searchParams.set('view', 'my-jobs');
    } else if (view === 'saved') {
      searchParams.set('view', 'saved');
    } else if (view === 'post-job') {
      searchParams.set('view', 'post');
    } else if ((view === 'detail' || view === 'client-job-detail') && jobId) {
      searchParams.set('jobId', jobId);
      if (clientManage) {
        searchParams.set('clientManage', 'true');
      }
    }
    
    const newSearch = searchParams.toString();
    const newPath = newSearch ? `/jobs?${newSearch}` : '/jobs';
    
    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: true });
    }
  };

  const handleJobClick = (jobId) => {
    handleViewChange('detail', jobId);
  };

  // New handler for client job management
  const handleClientJobClick = (jobId) => {
    handleViewChange('client-job-detail', jobId, null, true);
  };

  const handleJobApply = (job) => {
    setCurrentView('apply');
    setSelectedJob(job);
    setSelectedJobId(job.id);
  };

  const handleJobPosted = (newJob) => {
    handleViewChange('my-jobs');
    // The context will handle updating the job list
  };

  const handleJobEdit = (job) => {
    // For now, just go back to job detail
    // In the future, you could implement an edit mode
    console.log('Edit job:', job);
    // You could navigate to an edit page or enable edit mode
  };

  const handleBack = () => {
    // Determine where to go back based on current view
    switch (currentView) {
      case 'detail':
      case 'apply':
        handleViewChange('browse');
        break;
      case 'client-job-detail':
        handleViewChange('my-jobs');
        break;
      case 'post-job':
        handleViewChange(isClient ? 'my-jobs' : 'browse');
        break;
      default:
        handleViewChange('browse');
    }
    setSelectedJobId(null);
    setSelectedJob(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'browse':
        return (
          <JobsPage 
            onJobClick={handleJobClick}
            onJobApply={handleJobApply}
          />
        );
      
      case 'detail':
        return (
          <JobDetailPage
            jobId={selectedJobId}
            onBack={handleBack}
            onApply={handleJobApply}
          />
        );

      case 'client-job-detail':
        return (
          <ClientJobDetailPage
            jobId={selectedJobId}
            onBack={handleBack}
            onEdit={handleJobEdit}
          />
        );
      
      case 'apply':
        return (
          <JobApplicationPage
            job={selectedJob}
            jobId={selectedJobId}
            onBack={handleBack}
            onSuccess={() => {
              handleViewChange('browse');
              setSelectedJob(null);
              setSelectedJobId(null);
            }}
          />
        );
      
      case 'post-job':
        return (
          <PostJobPage
            onBack={handleBack}
            onJobPosted={handleJobPosted}
          />
        );
      
      case 'my-jobs':
        return (
          <MyJobsPage
            onJobClick={handleClientJobClick} // Use client job click handler
            onPostJob={() => handleViewChange('post-job')}
          />
        );
      
      case 'saved':
        return (
          <SavedJobsPage
            onJobClick={handleJobClick}
            onJobApply={handleJobApply}
          />
        );
      
      default:
        return (
          <JobsPage 
            onJobClick={handleJobClick}
            onJobApply={handleJobApply}
          />
        );
    }
  };

  return (
    <JobsLayout 
      user={user}
      currentView={currentView}
      onViewChange={handleViewChange}
    >
      {renderContent()}
    </JobsLayout>
  );
};

export default JobsMainPage;