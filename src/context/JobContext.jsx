import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
};

function jobReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_JOBS':
      return { ...state, jobs: action.payload, loading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SKILLS':
      return { ...state, skills: action.payload };
    case 'SET_MY_JOBS':
      return { ...state, myJobs: action.payload };
    case 'SET_SAVED_JOBS':
      return { ...state, savedJobs: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'ADD_JOB':
      return { ...state, myJobs: [action.payload, ...state.myJobs] };
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
    case 'TOGGLE_SAVE_JOB':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload ? { ...job, is_saved: !job.is_saved } : job
        )
      };
    default:
      return state;
  }
}

export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  const loadJobs = async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await jobsApi.getJobs(params);
      dispatch({ type: 'SET_JOBS', payload: data.results || data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadCategories = async () => {
    try {
      const data = await jobsApi.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMyJobs = async () => {
    try {
      const data = await jobsApi.getMyJobs();
      dispatch({ type: 'SET_MY_JOBS', payload: data.results || data });
    } catch (error) {
      console.error('Error loading my jobs:', error);
    }
  };

  const saveJob = async (jobId) => {
    try {
      await jobsApi.saveJob(jobId);
      dispatch({ type: 'TOGGLE_SAVE_JOB', payload: jobId });
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const unsaveJob = async (jobId) => {
    try {
      await jobsApi.unsaveJob(jobId);
      dispatch({ type: 'TOGGLE_SAVE_JOB', payload: jobId });
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const value = {
    ...state,
    dispatch,
    loadJobs,
    loadMyJobs,
    saveJob,
    unsaveJob,
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
