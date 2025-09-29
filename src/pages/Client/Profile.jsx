import { 
  UserIcon, CameraIcon, SaveIcon, EditIcon, PlusIcon, XIcon,
  MapPinIcon, BriefcaseIcon, GraduationCapIcon, StarIcon,
  DollarSignIcon, ClockIcon, PhoneIcon, MailIcon, BuildingIcon,
  TagIcon, LinkIcon, AwardIcon, ExternalLinkIcon, CalendarIcon,
  GlobeIcon, TrendingUpIcon, UsersIcon, CheckCircleIcon,
  AlertCircleIcon, LanguagesIcon, LockIcon, EyeIcon, EyeOffIcon,
  ShieldIcon, VerifiedIcon, SendIcon, KeyIcon, Settings, SwitchCameraIcon,
  UserPlusIcon, UserMinusIcon
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

  // Profile type management
  const [activeProfileType, setActiveProfileType] = useState('basic');
  const [availableAccountTypes, setAvailableAccountTypes] = useState([]);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);

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
const tokenn=localStorage.getItem("access_token")
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
console.log(user)
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
      
      // Extract account types
      const accountTypes = data.account_types || [];
      setAvailableAccountTypes(accountTypes);
      
      // Set initial active profile type
      if (accountTypes.includes('freelancer')) {
        setActiveProfileType('freelancer');
      } else if (accountTypes.includes('client')) {
        setActiveProfileType('client');
      } else {
        setActiveProfileType('basic');
      }

      // Set nested data
      setEducation(data.education || []);
      setExperience(data.experience || []);
      setCertifications(data.certifications || []);
      setPortfolio(data.portfolio || []);
      setSocialLinks(data.social_links || []);
      
      // Set preferences
      if (data.preferences?.privacy_settings) {
        setProfileVisibility(data.preferences.privacy_settings);
      }
      
      setEmailVerification(prev => ({ ...prev, verified: data.is_verified }));
      setPhoneVerification(prev => ({ ...prev, verified: data.phone_verified }));
    } catch (err) {
      setError('Failed to load profile data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Account type management
  const addAccountType = async (accountType) => {
    try {
      setSaving(true);
      await apiCall('/account-type/manage/', 'POST', {
        account_type: accountType,
        action: 'add'
      });
      setSuccess(`${accountType} profile added successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setShowAccountTypeModal(false);
      fetchUserProfile(); // Refresh data
    } catch (err) {
      setError('Failed to add account type: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const removeAccountType = async (accountType) => {
    if (availableAccountTypes.length === 1) {
      setError('Cannot remove the last account type');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSaving(true);
      await apiCall('/account-type/manage/', 'POST', {
        account_type: accountType,
        action: 'remove'
      });
      setSuccess(`${accountType} profile removed successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Switch to a different profile type if current one was removed
      if (activeProfileType === accountType) {
        const remainingTypes = availableAccountTypes.filter(type => type !== accountType);
        setActiveProfileType(remainingTypes[0] || 'basic');
      }
      
      fetchUserProfile(); // Refresh data
    } catch (err) {
      setError('Failed to remove account type: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Email verification functions
  const sendEmailVerification = async () => {
    try {
      setEmailVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-email/send/', 'POST');
      setEmailVerification(prev => ({ ...prev, sent: true, loading: false }));
      setSuccess('Verification email sent! Check your inbox.');
      setTimeout(() => setSuccess(''), 3000);
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
      setTimeout(() => setSuccess(''), 3000);
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send verification code: ' + err.message);
      setTimeout(() => setError(''), 3000);
      setPhoneVerification(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyPhoneCode = async () => {
    try {
      setPhoneVerification(prev => ({ ...prev, loading: true }));
      await apiCall('/verify-phone/', 'POST', { code: phoneVerification.code });
      setPhoneVerification(prev => ({ ...prev, verified: true, loading: false }));
      setSuccess('Phone number verified successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowPhoneVerificationModal(false);
      fetchUserProfile();
    } catch (err) {
      setError('Invalid verification code: ' + err.message);
      setTimeout(() => setError(''), 3000);
      setPhoneVerification(prev => ({ ...prev, loading: false }));
    }
  };

  // Password change functions
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSaving(true);
      await apiCall('/change-password/', 'POST', {
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });
      
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationMethod: 'email'
      });
    } catch (err) {
      setError('Failed to change password: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Privacy settings update
  const updatePrivacySettings = async () => {
    try {
      setSaving(true);
      await apiCall('/profile/update/', 'PATCH', {
        preferences: {
          privacy_settings: profileVisibility
        }
      });
      setSuccess('Privacy settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowPrivacyModal(false);
    } catch (err) {
      setError('Failed to update privacy settings: ' + err.message);
      setTimeout(() => setError(''), 3000);
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
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteEducation = async (id) => {
    try {
      await apiCall(`/profile/education/${id}/`, 'DELETE');
      setEducation(prev => prev.filter(edu => edu.id !== id));
    } catch (err) {
      setError('Failed to delete education: ' + err.message);
      setTimeout(() => setError(''), 3000);
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
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteExperience = async (id) => {
    try {
      await apiCall(`/profile/experience/${id}/`, 'DELETE');
      setExperience(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      setError('Failed to delete experience: ' + err.message);
      setTimeout(() => setError(''), 3000);
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
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteCertification = async (id) => {
    try {
      await apiCall(`/profile/certifications/${id}/`, 'DELETE');
      setCertifications(prev => prev.filter(cert => cert.id !== id));
    } catch (err) {
      setError('Failed to delete certification: ' + err.message);
      setTimeout(() => setError(''), 3000);
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
      setTimeout(() => setError(''), 3000);
    }
  };

  const deletePortfolio = async (id) => {
    try {
      await apiCall(`/profile/portfolio/${id}/`, 'DELETE');
      setPortfolio(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete portfolio item: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle input changes for nested profiles
  const handleNestedInputChange = (profileType, field, value) => {
    setUser(prev => ({
      ...prev,
      [profileType]: {
        ...prev[profileType],
        [field]: value
      }
    }));
  };

  const handleBasicInputChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (profileType, field, value) => {
    if (value.trim() && !user[profileType]?.[field]?.includes(value)) {
      setUser(prev => ({ 
        ...prev, 
        [profileType]: {
          ...prev[profileType],
          [field]: [...(prev[profileType]?.[field] || []), value] 
        }
      }));
    }
  };

  const handleArrayRemove = (profileType, field, index) => {
    setUser(prev => ({ 
      ...prev, 
      [profileType]: {
        ...prev[profileType],
        [field]: prev[profileType]?.[field]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // Handle save for profile data
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {};
      
      // Basic user fields
      updateData.first_name = user.first_name;
      updateData.last_name = user.last_name;
      updateData.phone_number = user.phone_number;
      updateData.bio = user.bio;
      updateData.country = user.country;
      updateData.city = user.city;
      updateData.timezone = user.timezone;

      // Professional profile
      if (user.professional_profile) {
        updateData.professional_profile = {
          title: user.professional_profile.title,
          company_name: user.professional_profile.company_name,
          website: user.professional_profile.website,
          linkedin_url: user.professional_profile.linkedin_url,
          github_url: user.professional_profile.github_url,
          portfolio_url: user.professional_profile.portfolio_url,
          languages_spoken: user.professional_profile.languages_spoken
        };
      }

      // Freelancer profile
      if (user.freelancer_profile && availableAccountTypes.includes('freelancer')) {
        updateData.freelancer_profile = {
          skills: user.freelancer_profile.skills,
          experience_level: user.freelancer_profile.experience_level,
          years_of_experience: user.freelancer_profile.years_of_experience,
          hourly_rate: user.freelancer_profile.hourly_rate,
          currency: user.freelancer_profile.currency,
          availability_status: user.freelancer_profile.availability_status,
          availability_hours_per_week: user.freelancer_profile.availability_hours_per_week
        };
      }

      // Client profile
      if (user.client_profile && availableAccountTypes.includes('client')) {
        updateData.client_profile = {
          company_size: user.client_profile.company_size,
          industry: user.client_profile.industry
        };
      }

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

  // Profile Type Switcher Component
  const ProfileTypeSwitcher = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Profile Type</h3>
          
          {/* Profile Type Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveProfileType('basic')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeProfileType === 'basic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-1" />
              Basic
            </button>
            
            {availableAccountTypes.includes('freelancer') && (
              <button
                onClick={() => setActiveProfileType('freelancer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeProfileType === 'freelancer'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                Freelancer
              </button>
            )}
            
            {availableAccountTypes.includes('client') && (
              <button
                onClick={() => setActiveProfileType('client')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeProfileType === 'client'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BuildingIcon className="h-4 w-4 inline mr-1" />
                Client
              </button>
            )}
            
            {availableAccountTypes.includes('admin') && (
              <button
                onClick={() => setActiveProfileType('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeProfileType === 'admin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldIcon className="h-4 w-4 inline mr-1" />
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Manage Account Types */}
        <button
          onClick={() => setShowAccountTypeModal(true)}
          className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <SwitchCameraIcon className="h-4 w-4 mr-1" />
          Manage Profiles
        </button>
      </div>

      {/* Active Account Types Display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {availableAccountTypes.filter(type => type !== "admin").map(type => (
          <span
            key={type}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {availableAccountTypes.length > 1 && (
              <button
                onClick={() => removeAccountType(type)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );

  // Account Type Management Modal
  const AccountTypeModal = () => {
    if (!showAccountTypeModal) return null;

    const allAccountTypes = ['freelancer', 'client'];
    const availableToAdd = allAccountTypes.filter(type => !availableAccountTypes.includes(type));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <SwitchCameraIcon className="h-5 w-5 mr-2" />
            Manage Profile Types
          </h3>
          
          <div className="space-y-4">
            {/* Current Account Types */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Profiles:</h4>
              <div className="space-y-2">
                {availableAccountTypes.map(type => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {type === 'freelancer' && <BriefcaseIcon className="h-4 w-4 text-blue-600" />}
                      {type === 'client' && <BuildingIcon className="h-4 w-4 text-green-600" />}
                      {type === 'admin' && <ShieldIcon className="h-4 w-4 text-purple-600" />}
                      <span className="font-medium text-gray-900 capitalize">{type}</span>
                    </div>
                    {availableAccountTypes.length > 1 && (
                      <button
                        onClick={() => removeAccountType(type)}
                        className="text-red-600 hover:text-red-800"
                        disabled={saving}
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available to Add */}
            {availableToAdd.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Add Profile Type:</h4>
                <div className="space-y-2">
                  {availableToAdd.map(type => (
                    <button
                      key={type}
                      onClick={() => addAccountType(type)}
                      disabled={saving}
                      className="w-full flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {type === 'freelancer' && <BriefcaseIcon className="h-4 w-4 text-blue-600" />}
                      {type === 'client' && <BuildingIcon className="h-4 w-4 text-green-600" />}
                      {type === 'admin' && <ShieldIcon className="h-4 w-4 text-purple-600" />}
                      <span className="font-medium text-gray-900 capitalize">{type}</span>
                      <UserPlusIcon className="h-4 w-4 ml-auto text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowAccountTypeModal(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Skill Input Component
  const SkillInput = ({ profileType, field, onAdd }) => {
    const [skillInput, setSkillInput] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (skillInput.trim()) {
        onAdd(profileType, field, skillInput.trim());
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
          placeholder="Add item..."
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
                <p className="text-sm text-gray-500">Update your account password</p>
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
                {user?.is_verified ? (
                  <button
                    disabled
                    className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-md cursor-not-allowed flex items-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Verified
                  </button>
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
                {user?.phone_verified ? (
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
                    setTimeout(() => setSuccess(''), 3000);
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
const wsUrl = `ws://localhost:8003/ws/notifications/?token=${tokenn}`;
const socket = new WebSocket(wsUrl);

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'notification') {
        // Handle bid notifications
        console.log(data.data);
    }
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
  src={`http://localhost:8000/${user.profile_picture}`}
                      alt="Prsofile"
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
                    {user.is_verified && (
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
                <p className="text-lg text-gray-600">
                  {user.professional_profile?.title || 'No title set'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{user.city}, {user.country}</span>
                  </div>
                  {user.freelancer_profile && (
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.freelancer_profile.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        user.freelancer_profile.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.freelancer_profile.availability_status}
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

        {/* Profile Type Switcher */}
        <ProfileTypeSwitcher />

        {/* Security Section */}
        <SecuritySection />

        {/* Public Profile Section */}
        <PublicProfileSection />

        {/* Profile Content Based on Active Type */}
        {activeProfileType === 'basic' && (
          <>
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={user.first_name || ''}
                    onChange={(e) => handleBasicInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={user.last_name || ''}
                    onChange={(e) => handleBasicInputChange('last_name', e.target.value)}
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
                    {user.is_verified ? (
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
                      onChange={(e) => handleBasicInputChange('phone_number', e.target.value)}
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
                    onChange={(e) => handleBasicInputChange('country', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={user.city || ''}
                    onChange={(e) => handleBasicInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={user.bio || ''}
                    onChange={(e) => handleBasicInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={user.professional_profile?.title || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'title', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="e.g. Senior Full Stack Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={user.professional_profile?.company_name || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'company_name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={user.professional_profile?.website || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'website', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={user.professional_profile?.linkedin_url || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'linkedin_url', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={user.professional_profile?.github_url || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'github_url', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio URL</label>
                  <input
                    type="url"
                    value={user.professional_profile?.portfolio_url || ''}
                    onChange={(e) => handleNestedInputChange('professional_profile', 'portfolio_url', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              {/* Languages Section */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  <LanguagesIcon className="h-5 w-5 inline mr-2" />
                  Languages Spoken
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(user.professional_profile?.languages_spoken || []).map((language, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {language}
                        {isEditing && (
                          <button
                            onClick={() => handleArrayRemove('professional_profile', 'languages_spoken', index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <SkillInput 
                      profileType="professional_profile" 
                      field="languages_spoken" 
                      onAdd={handleArrayAdd} 
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Freelancer Profile Content */}
        {activeProfileType === 'freelancer' && availableAccountTypes.includes('freelancer') && (
          <>
            {/* Freelancer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <BriefcaseIcon className="h-5 w-5 inline mr-2" />
                Freelancer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={user.freelancer_profile?.experience_level || ''}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'experience_level', e.target.value)}
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
                    value={user.freelancer_profile?.years_of_experience || ''}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'years_of_experience', parseInt(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSignIcon className="h-4 w-4 inline mr-1" />
                    Hourly Rate ({user.freelancer_profile?.currency || 'USD'})
                  </label>
                  <input
                    type="number"
                    value={user.freelancer_profile?.hourly_rate || ''}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'hourly_rate', parseFloat(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="75"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={user.freelancer_profile?.currency || 'USD'}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'currency', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
                  <select
                    value={user.freelancer_profile?.availability_status || 'available'}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'availability_status', e.target.value)}
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
                    value={user.freelancer_profile?.availability_hours_per_week || ''}
                    onChange={(e) => handleNestedInputChange('freelancer_profile', 'availability_hours_per_week', parseInt(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="40"
                  />
                </div>
              </div>

              {/* Freelancer Stats */}
              {user.freelancer_profile && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Performance Stats</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                        <span className="text-2xl font-bold text-gray-900">
                          {user.freelancer_profile.average_rating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Average Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {user.freelancer_profile.total_reviews}
                      </div>
                      <p className="text-sm text-gray-500">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {user.freelancer_profile.total_projects_completed}
                      </div>
                      <p className="text-sm text-gray-500">Projects Completed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <TagIcon className="h-5 w-5 inline mr-2" />
                Skills
              </h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(user.freelancer_profile?.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => handleArrayRemove('freelancer_profile', 'skills', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <SkillInput 
                    profileType="freelancer_profile" 
                    field="skills" 
                    onAdd={handleArrayAdd} 
                  />
                )}
              </div>
            </div>

            {/* Portfolio Section */}
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

            {/* Education Section */}
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

            {/* Experience Section */}
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

            {/* Certifications Section */}
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
          </>
        )}

        {/* Client Profile Content */}
        {activeProfileType === 'client' && availableAccountTypes.includes('client') && (
          <>
            {/* Client Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <BuildingIcon className="h-5 w-5 inline mr-2" />
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={user.client_profile?.industry || ''}
                    onChange={(e) => handleNestedInputChange('client_profile', 'industry', e.target.value)}
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
                    value={user.client_profile?.company_size || ''}
                    onChange={(e) => handleNestedInputChange('client_profile', 'company_size', e.target.value)}
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
              </div>

              {/* Client Stats */}
              {user.client_profile && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Project Stats</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {user.client_profile.total_projects_posted}
                      </div>
                      <p className="text-sm text-gray-500">Projects Posted</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        ${user.client_profile.total_spent}
                      </div>
                      <p className="text-sm text-gray-500">Total Spent</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Admin Profile Content */}
        {activeProfileType === 'admin' && availableAccountTypes.includes('admin') && user?.is_staff && (
          <>
            {/* Admin Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <ShieldIcon className="h-5 w-5 inline mr-2" />
                Admin Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={user.admin_profile?.department || ''}
                    onChange={(e) => handleNestedInputChange('admin_profile', 'department', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="e.g. Platform Operations"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Level</label>
                  <select
                    value={user.admin_profile?.admin_level || 'basic'}
                    onChange={(e) => handleNestedInputChange('admin_profile', 'admin_level', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                    <option value="super">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Admin Permissions */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Admin Permissions</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Admin permissions are managed by the system administrator.
                  </p>
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-xs text-purple-800">
                      <ShieldIcon className="h-3 w-3 inline mr-1" />
                      Staff-level access required for admin functions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        <AccountTypeModal />
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