import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed, clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Store current location for redirect after login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to get primary account type for navigation
  const getPrimaryAccountType = (accountTypes) => {
    if (!Array.isArray(accountTypes) || accountTypes.length === 0) {
      return 'freelancer';
    }
    return accountTypes[0];
  };

  // Helper function to extract error message from backend response
  const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data) {
      const data = error.response.data;
      
      // Check for different error formats
      if (data.error) {
        return data.error;
      } else if (data.message) {
        return data.message;
      } else if (data.detail) {
        return data.detail;
      } else if (data.non_field_errors) {
        return Array.isArray(data.non_field_errors) 
          ? data.non_field_errors[0] 
          : data.non_field_errors;
      } else if (typeof data === 'string') {
        return data;
      } else {
        // Extract first error from object
        const firstError = Object.values(data)[0];
        return Array.isArray(firstError) ? firstError[0] : firstError;
      }
    }
    return error.message || defaultMessage;
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/user/');
      setUser(response.data);
      
      // Check for redirect after login
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear tokens if the error is authentication related
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login/', { email, password });

      // Check if MFA is required
      if (response.data.mfa_required) {
        const mfaError = new Error('MFA Required');
        mfaError.response = { data: response.data };
        throw mfaError;
      }

      const { access, refresh, user: userData } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Set user data
      setUser(userData);
      
      // Show success toast
      toast.success('Login successful!');

      // Redirect logic using account types array
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        // Use primary account type for navigation
        const primaryAccountType = getPrimaryAccountType(userData.account_types);
        
        if (primaryAccountType === 'client') {
          navigate('/client/dashboard');
        } else if (primaryAccountType === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/freelancer/dashboard');
        }
      }

      return response.data;
    } catch (error) {
      if (error.message === 'MFA Required') {
        // Re-throw MFA errors to be handled by Login component
        throw error;
      }

      const errorMessage = getErrorMessage(error, 'Login failed. Please try again.');
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/', userData);
      console.log('Registration data sent:', userData);
      console.log('Registration response:', response.data);
      
      const { access, refresh, user: newUser } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set user data
      setUser(newUser);
      
      // Show success toast
      toast.success('Account created successfully!');

      // Redirect based on primary account type
      const primaryAccountType = getPrimaryAccountType(newUser.account_types);
      
      if (primaryAccountType === 'client') {
        navigate('/client/dashboard');
      } else if (primaryAccountType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/freelancer/dashboard');
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      const errorMessage = getErrorMessage(error, 'Registration failed. Please try again.');
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('redirectAfterLogin');
    setUser(null);
    setError(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateUser = (updatedUser) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUser }));
  };

  const clearError = () => {
    setError(null);
  };

  // Function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const response = await api.get('/auth/user/');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      const errorMessage = getErrorMessage(error, 'Failed to refresh user data');
      toast.error(errorMessage);
      throw error;
    }
  };

  // Helper function to check if user has specific account type
  const hasAccountType = (accountType) => {
    if (!user || !user.account_types) return false;
    return user.account_types.includes(accountType);
  };

  // Helper function to get user's primary account type
  const getPrimaryUserAccountType = () => {
    if (!user || !user.account_types) return null;
    return getPrimaryAccountType(user.account_types);
  };

  // Helper function to check if user can access admin features
  const isAdmin = () => {
    return hasAccountType('admin');
  };

  // Helper function to check if user is a freelancer
  const isFreelancer = () => {
    return hasAccountType('freelancer');
  };

  // Helper function to check if user is a client
  const isClient = () => {
    return hasAccountType('client');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshUserData,
    api,
    // Helper functions for account type checking
    hasAccountType,
    getPrimaryUserAccountType,
    isAdmin,
    isFreelancer,
    isClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the api instance with auth
export const useApi = () => {
  const { api } = useAuth();
  return api;
};

export default AuthContext;