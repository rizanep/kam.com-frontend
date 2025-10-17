import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, CheckCircleIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner"

const Register = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState(searchParams.get('role') || '');
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState([]);

  // Helper function to get error message from backend response
  const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data) {
      const data = error.response.data;
      
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
      }
    }
    return error.message || defaultMessage;
  };

  // Helper function to extract field-specific errors from backend
  const extractFieldErrors = (error) => {
    const fieldErrors = {};
    if (error.response?.data) {
      const data = error.response.data;
      
      // Map backend field errors to form fields
      if (data.email) {
        fieldErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
      }
      if (data.password) {
        fieldErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
      }
      if (data.username) {
        fieldErrors.username = Array.isArray(data.username) ? data.username[0] : data.username;
      }
      if (data.account_types) {
        fieldErrors.account_types = Array.isArray(data.account_types) ? data.account_types[0] : data.account_types;
      }
      if (data.recaptcha) {
        fieldErrors.recaptcha = Array.isArray(data.recaptcha) ? data.recaptcha[0] : data.recaptcha;
      }
    }
    return fieldErrors;
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    // Clear recaptcha error when user completes it
    if (errors.recaptcha) {
      setErrors(prev => ({ ...prev, recaptcha: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRoleSelect = (role) => {
    setUserRole(role);
    setSelectedAccountTypes([role]);
    
    // Clear account type error when user selects a role
    if (errors.account_types) {
      setErrors(prev => ({ ...prev, account_types: '' }));
    }
    
    if (formData.email) {
      const username = formData.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        username: username,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
    }

    if (!userRole || selectedAccountTypes.length === 0) {
      newErrors.account_types = 'Please select a role';
    }

    if (!recaptchaToken) {
      newErrors.recaptcha = 'Please complete the reCAPTCHA';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        username: formData.username || formData.email.split('@')[0],
        password: formData.password,
        account_types: selectedAccountTypes,
        recaptcha: recaptchaToken,
      };

      console.log('Registration data:', registrationData);
      await register(registrationData);
      // Success toast is handled in AuthContext

    } catch (error) {
      console.error('Registration failed:', error);
      
      // Extract field-specific errors
      const fieldErrors = extractFieldErrors(error);
      setErrors(fieldErrors);
      
      // If there are no field-specific errors, show general error message
      if (Object.keys(fieldErrors).length === 0) {
        const generalError = getErrorMessage(error, 'Registration failed. Please try again.');
        toast.error(generalError);
      } else {
        // Show toast for first field error
        const firstError = Object.values(fieldErrors)[0];
        toast.error(firstError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPrimaryAccountType = (accountTypes) => {
    if (!Array.isArray(accountTypes) || accountTypes.length === 0) {
      return 'freelancer';
    }
    return accountTypes[0];
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!userRole || selectedAccountTypes.length === 0) {
      toast.error('Please select a role first (Hire a Freelancer or Work as a Freelancer)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://kamcomuser.duckdns.org:30443/api'}/auth/google/`,
        { 
          credential: credentialResponse.credential,
          account_types: selectedAccountTypes
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success('Google registration successful!');

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      const primaryAccountType = getPrimaryAccountType(res.data.user.account_types);
      
      if (primaryAccountType === 'client') {
        window.location.href = '/client/dashboard';
      } else if (primaryAccountType === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/freelancer/dashboard';
      }
    } catch (err) {
      console.error('Google registration failed:', err);
      const errorMessage = getErrorMessage(err, 'Google registration failed. Please try again.');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log('Google Registration Failed');
    toast.error('Google registration failed. Please try again.');
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I want to:
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleRoleSelect("client")}
              className={`relative flex flex-col items-center justify-center p-4 rounded-lg border ${
                userRole === 'client' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              {userRole === 'client' && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                </div>
              )}
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">Hire a Freelancer</p>
                <p className="text-xs text-gray-500">Post jobs and hire talent</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('freelancer')}
              className={`relative flex flex-col items-center justify-center p-4 rounded-lg border ${
                userRole === 'freelancer' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              {userRole === 'freelancer' && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                </div>
              )}
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">Work as a Freelancer</p>
                <p className="text-xs text-gray-500">Find jobs and earn</p>
              </div>
            </button>
          </div>
          {errors.account_types && (
            <p className="mt-1 text-sm text-red-600">{errors.account_types}</p>
          )}
        </div>

        {/* Google Registration */}
        <div>
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="mx-2 text-sm text-gray-500">Quick Sign Up</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="rectangular"
              size="large"
              width="300"
              text="signup_with"
            />
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="mx-2 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email & Password */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`shadow-sm mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must contain at least 8 characters, including uppercase, lowercase, number and special character.
              </p>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center my-4">
            <ReCAPTCHA 
              sitekey="6LcxH8MrAAAAAEJQdX6E7UtbjTZxE8RTlTBcEuv3" 
              onChange={handleRecaptchaChange} 
            />
          </div>
          {errors.recaptcha && (
            <p className="mt-1 text-sm text-red-600 text-center">{errors.recaptcha}</p>
          )}

          {/* Terms */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={!userRole || isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                userRole && !isLoading 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;