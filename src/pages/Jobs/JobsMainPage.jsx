import React, { useState, useEffect } from 'react';
import JobsPage from './JobsPage';

const JobsMainPage = () => {
  const [currentView, setCurrentView] = useState('browse');
  const [selectedJobId, setSelectedJobId] = useState(null);

  const handleJobClick = (jobId) => {
    setSelectedJobId(jobId);
    setCurrentView('detail');
  };

  const handleJobApply = (job) => {
    setSelectedJobId(job.id);
    setCurrentView('apply');
  };

  const handleBack = () => {
    setCurrentView('browse');
    setSelectedJobId(null);
  };

  switch (currentView) {
    case 'detail':
      return (
        <JobDetailPage
          jobId={selectedJobId}
          onBack={handleBack}
          onApply={handleJobApply}
        />
      );
    case 'apply':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Form</h2>
            <p className="text-gray-600 mb-4">Application feature coming soon!</p>
            <button
              onClick={() => setCurrentView('detail')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Job Details
            </button>
          </div>
        </div>
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

export default JobsMainPage;