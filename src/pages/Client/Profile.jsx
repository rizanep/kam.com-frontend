import { 
  UserIcon, CameraIcon, SaveIcon, EditIcon, PlusIcon, XIcon,
  MapPinIcon, BriefcaseIcon, GraduationCapIcon, StarIcon,
  DollarSignIcon, ClockIcon, PhoneIcon, MailIcon, BuildingIcon,
  TagIcon, LinkIcon, AwardIcon, ExternalLinkIcon, CalendarIcon,
  GlobeIcon, TrendingUpIcon, UsersIcon, CheckCircleIcon,
  AlertCircleIcon, LanguagesIcon, LockIcon, EyeIcon, EyeOffIcon,
  ShieldIcon, VerifiedIcon, SendIcon, KeyIcon, Settings
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
const API_BASE_URL = 'http://localhost:8000/api/auth';

const UserProfile = () => {
  // Main state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Profile visibility state
  const [profileVisibility, setProfileVisibility] = useState({
    isPublic: false,
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showExperience: true,
    showEducation: true,
    showPortfolio: true
  });

  // Security modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Modal states for sections
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    verificationMethod: 'email'
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Verification states
  const [emailVerification, setEmailVerification] = useState({
    code: '',
    sent: false,
    verified: false,
    loading: false
  });
  const [phoneVerification, setPhoneVerification] = useState({
    code: '',
    sent: false,
    verified: false,
    loading: false
  });

  // State for profile sections
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);

  // API utility functions
  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: getAuthHeaders(),
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      if (method === 'DELETE') {
        return true;
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/users/profile/');
      setUser(data);
      setEducation(data.education || []);
      setExperience(data.experience || []);
      setCertifications(data.certifications || []);
      setPortfolio(data.portfolio || []);
      setSocialLinks(data.social_links || []);
      
      if (data.privacy_settings) {
        setProfileVisibility(data.privacy_settings);
      }
      
      setEmailVerification(prev => ({ ...prev, verified: data.email_verified }));
      setPhoneVerification(prev => ({ ...prev, verified: data.phone_verified }));
    } catch (err) {
      setError('Failed to load profile data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email verification functions
  const sendEmailVerification = async () => {
    try {
      setEmailVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-email/send/', 'POST');
      setEmailVerification(prev => ({ ...prev, sent: true, loading: false }));
      setSuccess('Verification email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send verification email: ' + err.message);
      setEmailVerification(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyEmailCode = async () => {
    try {
      setEmailVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-email/', 'POST', { code: emailVerification.code });
      setEmailVerification(prev => ({ ...prev, verified: true, loading: false }));
      setSuccess('Email verified successfully!');
      setShowEmailVerificationModal(false);
      fetchUserProfile();
    } catch (err) {
      setError('Invalid verification code: ' + err.message);
      setEmailVerification(prev => ({ ...prev, loading: false }));
    }
  };

  // Phone verification functions
  const sendPhoneVerification = async () => {
    try {
      setPhoneVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-phone/send/', 'POST');
      setPhoneVerification(prev => ({ ...prev, sent: true, loading: false }));
      setSuccess('Verification code sent to your phone!');
    } catch (err) {
      setError('Failed to send verification code: ' + err.message);
      setPhoneVerification(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyPhoneCode = async () => {
    try {
      setPhoneVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-phone/', 'POST', { code: phoneVerification.code });
      setPhoneVerification(prev => ({ ...prev, verified: true, loading: false }));
      setSuccess('Phone number verified successfully!');
      setShowPhoneVerificationModal(false);
      fetchUserProfile();
    } catch (err) {
      setError('Invalid verification code: ' + err.message);
      setPhoneVerification(prev => ({ ...prev, loading: false }));
    }
  };

  // Password change functions
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      const endpoint = passwordData.verificationMethod === 'email' 
        ? '/change-password/email/'
        : '/change-password/otp/';
      
      await apiCall(endpoint, 'POST', {
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        verification_method: passwordData.verificationMethod
      });
      
      setSuccess('Password change request sent! Check your email for verification.');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationMethod: 'email'
      });
    } catch (err) {
      setError('Failed to change password: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Privacy settings update
  const updatePrivacySettings = async () => {
    try {
      setSaving(true);
      await apiCall('/privacy-settings/', 'PATCH', profileVisibility);
      setSuccess('Privacy settings updated successfully!');
      setShowPrivacyModal(false);
    } catch (err) {
      setError('Failed to update privacy settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Modal handlers
  const openEducationModal = (item = null) => {
    setEditingItem(item);
    setShowEducationModal(true);
  };

  const openExperienceModal = (item = null) => {
    setEditingItem(item);
    setShowExperienceModal(true);
  };

  const openCertificationModal = (item = null) => {
    setEditingItem(item);
    setShowCertificationModal(true);
  };

  const openPortfolioModal = (item = null) => {
    setEditingItem(item);
    setShowPortfolioModal(true);
  };

  // CRUD operations
  const handleEducationSave = async (eduData) => {
    try {
      if (editingItem) {
        const updatedEdu = await apiCall(`/profile/education/${editingItem.id}/`, 'PATCH', eduData);
        setEducation(prev => prev.map(edu => edu.id === editingItem.id ? updatedEdu : edu));
      } else {
        const newEdu = await apiCall('/profile/education/', 'POST', eduData);
        setEducation(prev => [...prev, newEdu]);
      }
      setShowEducationModal(false);
      setEditingItem(null);
    } catch (err) {
      setError('Failed to save education: ' + err.message);
    }
  };

  const deleteEducation = async (id) => {
    try {
      await apiCall(`/profile/education/${id}/`, 'DELETE');
      setEducation(prev => prev.filter(edu => edu.id !== id));
    } catch (err) {
      setError('Failed to delete education: ' + err.message);
    }
  };

  const handleExperienceSave = async (expData) => {
    try {
      if (editingItem) {
        const updatedExp = await apiCall(`/profile/experience/${editingItem.id}/`, 'PATCH', expData);
        setExperience(prev => prev.map(exp => exp.id === editingItem.id ? updatedExp : exp));
      } else {
        const newExp = await apiCall('/profile/experience/', 'POST', expData);
        setExperience(prev => [...prev, newExp]);
      }
      setShowExperienceModal(false);
      setEditingItem(null);
    } catch (err) {
      setError('Failed to save experience: ' + err.message);
    }
  };

  const deleteExperience = async (id) => {
    try {
      await apiCall(`/profile/experience/${id}/`, 'DELETE');
      setExperience(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      setError('Failed to delete experience: ' + err.message);
    }
  };

  const handleCertificationSave = async (certData) => {
    try {
      if (editingItem) {
        const updatedCert = await apiCall(`/profile/certifications/${editingItem.id}/`, 'PATCH', certData);
        setCertifications(prev => prev.map(cert => cert.id === editingItem.id ? updatedCert : cert));
      } else {
        const newCert = await apiCall('/profile/certifications/', 'POST', certData);
        setCertifications(prev => [...prev, newCert]);
      }
      setShowCertificationModal(false);
      setEditingItem(null);
    } catch (err) {
      setError('Failed to save certification: ' + err.message);
    }
  };

  const deleteCertification = async (id) => {
    try {
      await apiCall(`/profile/certifications/${id}/`, 'DELETE');
      setCertifications(prev => prev.filter(cert => cert.id !== id));
    } catch (err) {
      setError('Failed to delete certification: ' + err.message);
    }
  };

  const handlePortfolioSave = async (portfolioData) => {
    try {
      if (editingItem) {
        const updatedPortfolio = await apiCall(`/profile/portfolio/${editingItem.id}/`, 'PATCH', portfolioData);
        setPortfolio(prev => prev.map(item => item.id === editingItem.id ? updatedPortfolio : item));
      } else {
        const newPortfolio = await apiCall('/profile/portfolio/', 'POST', portfolioData);
        setPortfolio(prev => [...prev, newPortfolio]);
      }
      setShowPortfolioModal(false);
      setEditingItem(null);
    } catch (err) {
      setError('Failed to save portfolio item: ' + err.message);
    }
  };

  const deletePortfolio = async (id) => {
    try {
      await apiCall(`/profile/portfolio/${id}/`, 'DELETE');
      setPortfolio(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete portfolio item: ' + err.message);
    }
  };

  // Handle input changes for basic profile info
  const handleInputChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field, value) => {
    if (value.trim() && !user[field]?.includes(value)) {
      setUser(prev => ({ 
        ...prev, 
        [field]: [...(prev[field] || []), value] 
      }));
    }
  };

  const handleArrayRemove = (field, index) => {
    setUser(prev => ({ 
      ...prev, 
      [field]: prev[field].filter((_, i) => i !== index) 
    }));
  };

  // Handle save for basic profile info
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = { ...user };
      
      // Remove read-only fields
      delete updateData.id;
      delete updateData.average_rating;
      delete updateData.total_reviews;
      delete updateData.total_projects_completed;
      delete updateData.total_projects_posted;
      delete updateData.total_spent;
      delete updateData.profile_completion_percentage;
      delete updateData.last_activity;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.groups;
      delete updateData.education;
      delete updateData.experience;
      delete updateData.certifications;
      delete updateData.portfolio;
      delete updateData.social_links;
      delete updateData.full_name;
      delete updateData.profile_picture;

      const updatedUser = await apiCall('/profile/update/', 'PATCH', updateData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Skill Input Component
  const SkillInput = ({ onAdd }) => {
    const [skillInput, setSkillInput] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (skillInput.trim()) {
        onAdd(skillInput.trim());
        setSkillInput('');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a skill..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </form>
    );
  };

  // Security Section Component
  const SecuritySection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <ShieldIcon className="h-5 w-5 mr-2" />
        Security & Verification
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Security */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <LockIcon className="h-4 w-4 mr-2" />
            Password Security
          </h4>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Update your account password with email verification</p>
              </div>
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Account Verification */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <VerifiedIcon className="h-4 w-4 mr-2" />
            Account Verification
          </h4>
          
          {/* Email Verification */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MailIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {emailVerification.verified ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => setShowEmailVerificationModal(true)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Phone Verification */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Phone Verification</p>
                  <p className="text-sm text-gray-500">{user?.phone_number || 'No phone number'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {phoneVerification.verified ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => setShowPhoneVerificationModal(true)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={!user?.phone_number}
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 flex items-center">
              <EyeIcon className="h-4 w-4 mr-2" />
              Profile Visibility
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Control what information is visible to other users
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profileVisibility.isPublic 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profileVisibility.isPublic ? 'Public Profile' : 'Private Profile'}
            </span>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 inline mr-1" />
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Public Profile Section
  const PublicProfileSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <GlobeIcon className="h-5 w-5 mr-2" />
        Public Profile
      </h3>
      
      {profileVisibility.isPublic ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Your profile is public</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Other users can view your profile and contact you for opportunities.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-800">Public profile URL:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/profile/${user?.id}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${user?.id}`);
                    setSuccess('Profile URL copied to clipboard!');
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => window.open(`/profile/${user?.id}`, '_blank')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview Public Profile
            </button>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Privacy Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircleIcon className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Your profile is private</span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Your profile is not visible to other users. Enable public profile to get discovered by potential clients.
          </p>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Make Profile Public
          </button>
        </div>
      )}
    </div>
  );

  // Password Change Modal
  const PasswordChangeModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <LockIcon className="h-5 w-5 mr-2" />
            Change Password
          </h3>
          
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password (min. 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Verification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={passwordData.verificationMethod === 'email'}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, verificationMethod: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Email verification</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="otp"
                    checked={passwordData.verificationMethod === 'otp'}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, verificationMethod: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="text-sm">SMS OTP</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handlePasswordChange}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    verificationMethod: 'email'
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Email Verification Modal
  const EmailVerificationModal = () => {
    if (!showEmailVerificationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <MailIcon className="h-5 w-5 mr-2" />
            Verify Email Address
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              We'll send a verification code to <strong>{user?.email}</strong>
            </p>
            
            {!emailVerification.sent ? (
              <button
                onClick={sendEmailVerification}
                disabled={emailVerification.loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {emailVerification.loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={emailVerification.code}
                    onChange={(e) => setEmailVerification(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={verifyEmailCode}
                  disabled={emailVerification.loading || emailVerification.code.length !== 6}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {emailVerification.loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={sendEmailVerification}
                  disabled={emailVerification.loading}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm"
                >
                  Resend Code
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowEmailVerificationModal(false);
                setEmailVerification(prev => ({ ...prev, code: '', sent: false }));
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Phone Verification Modal
  const PhoneVerificationModal = () => {
    if (!showPhoneVerificationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2" />
            Verify Phone Number
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              We'll send a verification code to <strong>{user?.phone_number}</strong>
            </p>
            
            {!phoneVerification.sent ? (
              <button
                onClick={sendPhoneVerification}
                disabled={phoneVerification.loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {phoneVerification.loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={phoneVerification.code}
                    onChange={(e) => setPhoneVerification(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={verifyPhoneCode}
                  disabled={phoneVerification.loading || phoneVerification.code.length !== 6}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {phoneVerification.loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={sendPhoneVerification}
                  disabled={phoneVerification.loading}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm"
                >
                  Resend Code
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowPhoneVerificationModal(false);
                setPhoneVerification(prev => ({ ...prev, code: '', sent: false }));
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Privacy Settings Modal
  const PrivacySettingsModal = () => {
    if (!showPrivacyModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            Privacy Settings
          </h3>
          
          <div className="space-y-4">
            {/* Public Profile Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-500">Make your profile visible to other users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileVisibility.isPublic}
                  onChange={(e) => setProfileVisibility(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Individual visibility settings */}
            {profileVisibility.isPublic && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What to show publicly:</h4>
                
                {[
                  { key: 'showEmail', label: 'Email Address', desc: 'Show your email to other users' },
                  { key: 'showPhone', label: 'Phone Number', desc: 'Show your phone number to other users' },
                  { key: 'showLocation', label: 'Location', desc: 'Show your city and country' },
                  { key: 'showExperience', label: 'Work Experience', desc: 'Show your work history' },
                  { key: 'showEducation', label: 'Education', desc: 'Show your educational background' },
                  { key: 'showPortfolio', label: 'Portfolio', desc: 'Show your portfolio items' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileVisibility[item.key]}
                        onChange={(e) => setProfileVisibility(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={updatePrivacySettings}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal Components for Profile Sections
  const EducationModal = () => {
    const [formData, setFormData] = useState(editingItem || {
      degree: '',
      field_of_study: '',
      institution: '',
      start_date: '',
      end_date: '',
      description: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleEducationSave(formData);
    };

    if (!showEducationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {editingItem ? 'Edit Education' : 'Add Education'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData({...formData, degree: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
              <input
                type="text"
                value={formData.field_of_study}
                onChange={(e) => setFormData({...formData, field_of_study: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEducationModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ExperienceModal = () => {
    const [formData, setFormData] = useState(editingItem || {
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
      is_current: false
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleExperienceSave(formData);
    };

    if (!showExperienceModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {editingItem ? 'Edit Experience' : 'Add Experience'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) => setFormData({...formData, is_current: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">This is my current position</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {!formData.is_current && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExperienceModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CertificationModal = () => {
    const [formData, setFormData] = useState(editingItem || {
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCertificationSave(formData);
    };

    if (!showCertificationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {editingItem ? 'Edit Certification' : 'Add Certification'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Organization</label>
              <input
                type="text"
                value={formData.issuing_organization}
                onChange={(e) => setFormData({...formData, issuing_organization: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credential ID</label>
              <input
                type="text"
                value={formData.credential_id}
                onChange={(e) => setFormData({...formData, credential_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credential URL</label>
              <input
                type="url"
                value={formData.credential_url}
                onChange={(e) => setFormData({...formData, credential_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCertificationModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const PortfolioModal = () => {
    const [formData, setFormData] = useState(editingItem || {
      title: '',
      description: '',
      url: '',
      technologies_used: []
    });
    const [techInput, setTechInput] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      handlePortfolioSave(formData);
    };

    const addTechnology = () => {
      if (techInput.trim() && !formData.technologies_used.includes(techInput.trim())) {
        setFormData({
          ...formData,
          technologies_used: [...formData.technologies_used, techInput.trim()]
        });
        setTechInput('');
      }
    };

    const removeTechnology = (index) => {
      setFormData({
        ...formData,
        technologies_used: formData.technologies_used.filter((_, i) => i !== index)
      });
    };

    if (!showPortfolioModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add technology..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTechnology();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTechnology}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies_used.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(index)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPortfolioModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Failed to load user data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture.startsWith('http')
                        ? user.profile_picture
                        : `http://localhost:8000${user.profile_picture}`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log('File selected:', file);
                      }
                    }}
                    className="absolute bottom-0 right-0 opacity-0 w-8 h-8 cursor-pointer"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.full_name}
                  </h1>
                  <div className="flex items-center space-x-2">
                    {user.email_verified && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" title="Email verified" />
                    )}
                    {user.phone_verified && (
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" title="Phone verified" />
                    )}
                    {user.is_verified && (
                      <VerifiedIcon className="h-6 w-6 text-blue-500" title="Verified account" />
                    )}
                  </div>
                </div>
                <p className="text-lg text-gray-600">{user.title}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{user.city}, {user.country}</span>
                  </div>
                  {user.user_type === 'freelancer' && (
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        user.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.availability_status}
                      </span>
                    </div>
                  )}
                </div>
                {user.bio && (
                  <p className="text-gray-600 mt-3 max-w-2xl">{user.bio}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 flex items-center">
            <AlertCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Security Section */}
        <SecuritySection />

        {/* Public Profile Section */}
        <PublicProfileSection />

        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={user.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={user.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MailIcon className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={user.email || ''}
                  disabled={true}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                {user.email_verified ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => setShowEmailVerificationModal(true)}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="tel"
                  value={user.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
                {user.phone_verified ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : user.phone_number ? (
                  <button
                    onClick={() => setShowPhoneVerificationModal(true)}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Verify
                  </button>
                ) : null}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={user.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={user.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={user.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Professional/Company Information */}
        {(user.user_type === 'freelancer' || user.user_type === 'client') && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {user.user_type === 'freelancer' ? 'Professional Information' : 'Company Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.user_type === 'freelancer' ? (
                // Freelancer fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={user.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="e.g. Senior Full Stack Developer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSignIcon className="h-4 w-4 inline mr-1" />
                      Hourly Rate ({user.currency})
                    </label>
                    <input
                      type="number"
                      value={user.hourly_rate || ''}
                      onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="75"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={user.experience_level || ''}
                      onChange={(e) => handleInputChange('experience_level', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select Level</option>
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={user.years_of_experience || ''}
                      onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
                    <select
                      value={user.availability_status || ''}
                      onChange={(e) => handleInputChange('availability_status', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Week</label>
                    <input
                      type="number"
                      value={user.availability_hours_per_week || ''}
                      onChange={(e) => handleInputChange('availability_hours_per_week', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="40"
                    />
                  </div>
                </>
              ) : (
                // Client fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <BuildingIcon className="h-4 w-4 inline mr-1" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={user.company_name || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GlobeIcon className="h-4 w-4 inline mr-1" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={user.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <select
                      value={user.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                    <select
                      value={user.company_size || ''}
                      onChange={(e) => handleInputChange('company_size', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select Size</option>
                      <option value="startup">Startup (1-10)</option>
                      <option value="small">Small (11-50)</option>
                      <option value="medium">Medium (51-200)</option>
                      <option value="large">Large (200+)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Skills Section - Only for Freelancers */}
        {user.user_type === 'freelancer' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <TagIcon className="h-5 w-5 inline mr-2" />
              Skills
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(user.skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleArrayRemove('skills', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <SkillInput onAdd={(skill) => handleArrayAdd('skills', skill)} />
              )}
            </div>
          </div>
        )}

        {/* Languages Section */}
        {user.user_type === 'freelancer' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <LanguagesIcon className="h-5 w-5 inline mr-2" />
            Languages
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(user.languages_spoken || []).map((language, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {language}
                  {isEditing && (
                    <button
                      onClick={() => handleArrayRemove('languages_spoken', index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <SkillInput onAdd={(language) => handleArrayAdd('languages_spoken', language)} />
            )}
          </div>
        </div>
        )}

        {/* Portfolio Section */}
                {user.user_type === 'freelancer' && (

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Portfolio</h3>
            {isEditing && (
              <button
                onClick={() => openPortfolioModal()}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Portfolio Item
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPortfolioModal(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePortfolio(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.technologies_used?.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    <ExternalLinkIcon className="h-3 w-3 mr-1" />
                    View Project
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
                )}
        {/* Education Section */}
                {user.user_type === 'freelancer' && (

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              <GraduationCapIcon className="h-5 w-5 inline mr-2" />
              Education
            </h3>
            {isEditing && (
              <button
                onClick={() => openEducationModal()}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Education
              </button>
            )}
          </div>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                    <p className="text-gray-600">{edu.field_of_study}</p>
                    <p className="text-gray-500 text-sm">{edu.institution}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {edu.start_date} - {edu.end_date || 'Present'}
                    </p>
                    {edu.description && (
                      <p className="text-gray-600 text-sm mt-2">{edu.description}</p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEducationModal(edu)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteEducation(edu.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
                )}
        {/* Experience Section */}
                {user.user_type === 'freelancer' && (

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              <BriefcaseIcon className="h-5 w-5 inline mr-2" />
              Experience
            </h3>
            {isEditing && (
              <button
                onClick={() => openExperienceModal()}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Experience
              </button>
            )}
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{exp.title}</h4>
                      {exp.is_current && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{exp.company}</p>
                    {exp.location && (
                      <p className="text-gray-500 text-sm">{exp.location}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {exp.start_date} - {exp.end_date || 'Present'}
                    </p>
                    {exp.description && (
                      <p className="text-gray-600 text-sm mt-2">{exp.description}</p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openExperienceModal(exp)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Certifications Section */}{user.user_type === 'freelancer' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              <AwardIcon className="h-5 w-5 inline mr-2" />
              Certifications
            </h3>
            {isEditing && (
              <button
                onClick={() => openCertificationModal()}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Certification
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                    <p className="text-gray-600 text-sm">{cert.issuing_organization}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Issued: {cert.issue_date}
                    </p>
                    {cert.expiry_date && (
                      <p className="text-gray-400 text-xs">
                        Expires: {cert.expiry_date}
                      </p>
                    )}
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                      >
                        <ExternalLinkIcon className="h-3 w-3 mr-1" />
                        View Certificate
                      </a>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openCertificationModal(cert)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCertification(cert.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Modals */}
        <PasswordChangeModal />
        <EmailVerificationModal />
        <PhoneVerificationModal />
        <PrivacySettingsModal />
        <EducationModal />
        <ExperienceModal />
        <CertificationModal />
        <PortfolioModal />
      </div>
    </div>
  );
};

export default UserProfile;