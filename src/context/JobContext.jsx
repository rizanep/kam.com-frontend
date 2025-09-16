import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { jobsApi } from '../services/jobsApi';

const JobContext = createContext();

const initialState = {
  jobs: [],
  categories: [],
  skills: [],
  myJobs: [],
  savedJobs: [],
  loading: false,
  error: null,
  filters: {},
  searchQuery: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNext: false,
    hasPrevious: false
  }
};

function jobReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_JOBS':
      return { 
        ...state, 
        jobs: action.payload.results || action.payload,
        pagination: {
          currentPage: action.payload.current_page || 1,
          totalPages: action.payload.total_pages || 1,
          totalJobs: action.payload.count || action.payload.length || 0,
          hasNext: action.payload.has_next || false,
          hasPrevious: action.payload.has_previous || false
        },
        loading: false 
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SKILLS':
      return { ...state, skills: action.payload };
    case 'SET_MY_JOBS':
      return { ...state, myJobs: action.payload.results || action.payload };
    case 'SET_SAVED_JOBS':
      return { ...state, savedJobs: action.payload.results || action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'ADD_JOB':
      return { 
        ...state, 
        myJobs: [action.payload, ...state.myJobs],
        jobs: [action.payload, ...state.jobs]
      };
    case 'UPDATE_JOB':
      return {
        ...state,
        myJobs: state.myJobs.map(job => 
          job.id === action.payload.id ? action.payload : job
        ),
        jobs: state.jobs.map(job => 
          job.id === action.payload.id ? action.payload : job
        )
      };
    case 'DELETE_JOB':
      return {
        ...state,
        myJobs: state.myJobs.filter(job => job.id !== action.payload),
        jobs: state.jobs.filter(job => job.id !== action.payload)
      };
    case 'TOGGLE_SAVE_JOB':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload ? { ...job, is_saved: !job.is_saved } : job
        ),
        savedJobs: action.unsave 
          ? state.savedJobs.filter(job => job.id !== action.payload)
          : state.savedJobs
      };
    case 'ADD_TO_SAVED':
      return {
        ...state,
        savedJobs: [action.payload, ...state.savedJobs]
      };
    case 'REMOVE_FROM_SAVED':
      return {
        ...state,
        savedJobs: state.savedJobs.filter(job => job.id !== action.payload)
      };
    default:
      return state;
  }
}

export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  const loadJobs = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const data = await jobsApi.getJobs(params);
      dispatch({ type: 'SET_JOBS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await jobsApi.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const data = await jobsApi.getSkills();
      dispatch({ type: 'SET_SKILLS', payload: data });
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  }, []);

  const loadMyJobs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await jobsApi.getMyJobs();
      dispatch({ type: 'SET_MY_JOBS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadSavedJobs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await jobsApi.getSavedJobs();
      dispatch({ type: 'SET_SAVED_JOBS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createJob = useCallback(async (jobData) => {
    try {
      const newJob = await jobsApi.createJob(jobData);
      dispatch({ type: 'ADD_JOB', payload: newJob });
      return newJob;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateJob = useCallback(async (jobId, jobData) => {
    try {
      const updatedJob = await jobsApi.updateJob(jobId, jobData);
      dispatch({ type: 'UPDATE_JOB', payload: updatedJob });
      return updatedJob;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteJob = useCallback(async (jobId) => {
    try {
      await jobsApi.deleteJob(jobId);
      dispatch({ type: 'DELETE_JOB', payload: jobId });
    } catch (error) {
      throw error;
    }
  }, []);

  const saveJob = useCallback(async (jobId) => {
    try {
      await jobsApi.saveJob(jobId);
      dispatch({ type: 'TOGGLE_SAVE_JOB', payload: jobId, unsave: false });
    } catch (error) {
      throw error;
    }
  }, []);

  const unsaveJob = useCallback(async (jobId) => {
    try {
      await jobsApi.unsaveJob(jobId);
      dispatch({ type: 'TOGGLE_SAVE_JOB', payload: jobId, unsave: true });
      dispatch({ type: 'REMOVE_FROM_SAVED', payload: jobId });
    } catch (error) {
      throw error;
    }
  }, []);

  const applyToJob = useCallback(async (jobId, applicationData) => {
    try {
      return await jobsApi.applyToJob(jobId, applicationData);
    } catch (error) {
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  useEffect(() => {
    loadCategories();
    loadSkills();
  }, [loadCategories, loadSkills]);

  const value = {
    ...state,
    dispatch,
    loadJobs,
    loadMyJobs,
    loadSavedJobs,
    createJob,
    updateJob,
    deleteJob,
    saveJob,
    unsaveJob,
    applyToJob,
    clearError,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within JobProvider');
  }
  return context;
};