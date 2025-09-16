import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Home } from 'lucide-react';
import { jobsApi } from '../../services/jobsApi';

const JobDetailPage = ({ jobId, onBack, onApply }) => {
  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetail();
      loadRelatedJobs();
    }
  }, [jobId]);

  const loadJobDetail = async () => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      const jobData = await jobsApi.getJob(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Error loading job detail:', error);
      
      // Check if it's a 404 error
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        setNotFound(true);
        setError('This job is no longer available or has been removed.');
      } else {
        setError('Failed to load job details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedJobs = async () => {
    if (!jobId) return;
    
    try {
      const related = await jobsApi.getRelatedJobs(jobId);
      setRelatedJobs(related || []);
    } catch (error) {
      console.error('Error loading related jobs:', error);
      // Don't show error for related jobs, just log it
      setRelatedJobs([]);
    }
  };

  const handleBack = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      // Fallback navigation
      window.history.back();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/jobs';
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

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          {/* 404 Error Message */}
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle size={64} className="text-gray-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This job is no longer available. It may have been removed, expired, or filled by the client.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home size={20} className="mr-2" />
                Browse All Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          {/* Error Message */}
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Job</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={loadJobDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No job data available.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Your existing JobDetailPage component content would go here
  // For now, showing a basic structure
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Jobs
        </button>

        {/* Job Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h1>
          <p className="text-gray-600 mb-6">{job.description}</p>
          
          {/* Add your existing job detail content here */}
          <div className="text-sm text-gray-500">
            Job ID: {job.id}
          </div>
          
          {onApply && (
            <button
              onClick={() => onApply(job)}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply for this Job
            </button>
          )}
        </div>

        {/* Related Jobs */}
        {relatedJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Jobs</h2>
            <div className="grid gap-4">
              {relatedJobs.slice(0, 3).map((relatedJob) => (
                <div key={relatedJob.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900">{relatedJob.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{relatedJob.description?.slice(0, 100)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;