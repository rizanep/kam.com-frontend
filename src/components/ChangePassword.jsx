import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required';
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'New password must be at least 8 characters long';
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "New passwords don't match";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    setErrors({});

    try {
      // Get the auth token from localStorage or wherever you store it
      const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
      
      const response = await fetch('https://kamcomuser.duckdns.org:30443/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Adjust based on your auth format (Bearer, Token, etc.)
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: data.message || 'Password changed successfully!',
          type: 'success'
        });
        
        // Reset form
        setFormData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        if (data.old_password) {
          setErrors({ old_password: data.old_password[0] });
        } else if (data.new_password) {
          setErrors({ new_password: data.new_password[0] });
        } else if (data.non_field_errors) {
          setMessage({
            text: data.non_field_errors[0],
            type: 'error'
          });
        } else {
          setMessage({
            text: 'Failed to change password. Please try again.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      setMessage({
        text: 'Network error. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ name, label, placeholder, error }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPasswords[name] ? "text" : "password"}
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(name)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPasswords[name] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
        <p className="text-gray-600 mt-2">Update your account password</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <PasswordInput
          name="old_password"
          label="Current Password"
          placeholder="Enter your current password"
          error={errors.old_password}
        />

        <PasswordInput
          name="new_password"
          label="New Password"
          placeholder="Enter your new password (min. 8 characters)"
          error={errors.new_password}
        />

        <PasswordInput
          name="confirm_password"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          error={errors.confirm_password}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Changing Password...
            </div>
          ) : (
            'Change Password'
          )}
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500 space-y-1">
        <p>Password requirements:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>At least 8 characters long</li>
          <li>Must be different from your current password</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;