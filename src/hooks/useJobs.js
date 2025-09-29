import { useContext, useState, useEffect, useCallback } from 'react';
import { JobContext } from '../context/JobContext';
import { jobsApi } from '../services/jobsApi';

// Enhanced useJobs hook with additional utilities
export const useJobs = () => {
  const context = useContext(JobContext);
  
  if (!context) {
    throw new Error('useJobs must be used within JobProvider');
  }
  
  return context;
};

// Custom hook for job search with debouncing
export const useJobSearch = (initialFilters = {}, debounceMs = 500) => {
  const { loadJobs, jobs, loading, error } = useJobs();
  const [searchFilters, setSearchFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);

  // Debounce search filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(searchFilters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchFilters, debounceMs]);

  // Load jobs when debounced filters change
  useEffect(() => {
    loadJobs(debouncedFilters);
  }, [debouncedFilters, loadJobs]);

  const updateFilters = useCallback((newFilters) => {
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchFilters(initialFilters);
  }, [initialFilters]);

  return {
    jobs,
    loading,
    error,
    filters: searchFilters,
    updateFilters,
    resetFilters,
    search: (query) => updateFilters({ search: query })
  };
};

// Custom hook for job statistics
export const useJobStats = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobsApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refresh: loadStats };
};

// Custom hook for managing job applications
export const useJobApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobsApi.getMyApplications();
      setApplications(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitApplication = useCallback(async (jobId, applicationData) => {
    try {
      setLoading(true);
      setError(null);
      const newApplication = await jobsApi.applyToJob(jobId, applicationData);
      setApplications(prev => [newApplication, ...prev]);
      return newApplication;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const withdrawApplication = useCallback(async (applicationId) => {
    try {
      setLoading(true);
      setError(null);
      await jobsApi.withdrawApplication(applicationId);
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return {
    applications,
    loading,
    error,
    submitApplication,
    withdrawApplication,
    refresh: loadApplications
  };
};

// Custom hook for saved jobs management
export const useSavedJobs = () => {
  const { savedJobs, loadSavedJobs, saveJob, unsaveJob } = useJobs();
  const [optimisticSaves, setOptimisticSaves] = useState(new Set());

  const handleSaveJob = useCallback(async (jobId) => {
    setOptimisticSaves(prev => new Set([...prev, jobId]));
    try {
      await saveJob(jobId);
    } catch (error) {
      setOptimisticSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
      throw error;
    }
  }, [saveJob]);

  const handleUnsaveJob = useCallback(async (jobId) => {
    setOptimisticSaves(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
    try {
      await unsaveJob(jobId);
    } catch (error) {
      setOptimisticSaves(prev => new Set([...prev, jobId]));
      throw error;
    }
  }, [unsaveJob]);

  const isJobSaved = useCallback((jobId) => {
    return optimisticSaves.has(jobId) || savedJobs.some(job => job.id === jobId);
  }, [optimisticSaves, savedJobs]);

  return {
    savedJobs,
    loadSavedJobs,
    saveJob: handleSaveJob,
    unsaveJob: handleUnsaveJob,
    isJobSaved
  };
};

// Custom hook for real-time updates
export const useJobUpdates = (jobId) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await jobsApi.getJob(jobId);
      setJob(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Refresh job data periodically
  useEffect(() => {
    loadJob();
    
    const interval = setInterval(loadJob, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadJob]);

  return { job, loading, error, refresh: loadJob };
};

// Custom hook for file uploads
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file, jobId, description = '') => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await jobsApi.uploadJobAttachment(jobId, file, description);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setUploading(false);
      }, 500);

      return result;
    } catch (err) {
      setError(err.message);
      setProgress(0);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadFile, uploading, progress, error };
};

// Custom hook for pagination
export const usePagination = (initialPage = 1, initialItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) setCurrentPage(prev => prev + 1);
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) setCurrentPage(prev => prev - 1);
  }, [hasPrevious]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext,
    hasPrevious,
    goToPage,
    nextPage,
    previousPage,
    reset,
    setTotalItems,
    setItemsPerPage // ✅ allows changing page size at runtime
  };
};
// Custom hook for local storage state
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};