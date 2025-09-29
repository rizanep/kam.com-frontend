import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Trash2, Send, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { useNavigate } from 'react-router-dom'; // Add this import
import { jobsApi } from '../../services/jobsApi';

const PostJobPage = ({ onBack, onJobPosted }) => {
  const { categories, skills, createJob } = useJobs();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'published',
    category: '',
    skills: [],
    job_type: 'fixed',
    experience_level: 'any',
    estimated_duration: '',
    budget_min: '',
    budget_max: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    currency: 'USD',
    remote_allowed: true,
    location: '',
    timezone_preference: '',
    is_urgent: false,
    deadline: '',
    tags: [],
    milestones: [],
    attachments: []
  });
const navigate = useNavigate(); // Add this line
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSkill = (skillId) => {
    if (!formData.skills.includes(skillId)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillId] }));
    }
  };

  const removeSkill = (skillId) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(id => id !== skillId) 
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tagInput.trim()] 
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t !== tag) 
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        title: '',
        description: '',
        amount: '',
        due_date: '',
        order: prev.milestones.length + 1
      }]
    }));
  };

  const updateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
        .map((milestone, i) => ({ ...milestone, order: i + 1 }))
    }));
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'text/plain'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachments: `File "${file.name}" has an invalid type.` }));
        return false;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, attachments: `File "${file.name}" is too large. Maximum size is 10MB.` }));
        return false;
      }
      
      return true;
    });

    setAttachmentFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const removeAttachment = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (formData.title.trim().length < 10) newErrors.title = 'Title must be at least 10 characters';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.trim().length < 50) newErrors.description = 'Description must be at least 50 characters';
      if (!formData.category) newErrors.category = 'Category is required';
      // if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    }
    
    if (step === 2) {
      if (formData.job_type === 'hourly') {
        if (!formData.hourly_rate_min) newErrors.hourly_rate_min = 'Min hourly rate is required';
        if (!formData.hourly_rate_max) newErrors.hourly_rate_max = 'Max hourly rate is required';
        if (parseFloat(formData.hourly_rate_min) >= parseFloat(formData.hourly_rate_max)) {
          newErrors.hourly_rate_max = 'Max rate must be higher than min rate';
        }
      } else if (formData.job_type === 'milestone') {
        if (formData.milestones.length === 0) {
          newErrors.milestones = 'At least one milestone is required for milestone-based projects';
        } else {
          formData.milestones.forEach((milestone, index) => {
            if (!milestone.title.trim()) {
              newErrors[`milestone_${index}_title`] = 'Milestone title is required';
            }
            if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
              newErrors[`milestone_${index}_amount`] = 'Milestone amount is required';
            }
          });
        }
      } else {
        if (!formData.budget_min) newErrors.budget_min = 'Min budget is required';
        if (!formData.budget_max) newErrors.budget_max = 'Max budget is required';
        if (parseFloat(formData.budget_min) >= parseFloat(formData.budget_max)) {
          newErrors.budget_max = 'Max budget must be higher than min budget';
        }
      }
    }

    if (step === 3) {
      if (!formData.remote_allowed && !formData.location.trim()) {
        newErrors.location = 'Location is required when remote work is not allowed';
      }
      if (formData.deadline) {
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate <= today) {
          newErrors.deadline = 'Deadline must be in the future';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const calculateTotalBudget = () => {
    if (formData.job_type === 'milestone') {
      return formData.milestones.reduce((total, milestone) => {
        return total + (parseFloat(milestone.amount) || 0);
      }, 0);
    }
    return null;
  };
  const handleSubmit = async (e) => {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!validateStep(3)) return;

  setLoading(true);
  setErrors({});

  try {
    const submissionData = {
      ...formData,
      skill_ids: formData.skills,
      status: "published",
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      hourly_rate_min: formData.hourly_rate_min ? parseFloat(formData.hourly_rate_min) : null,
      hourly_rate_max: formData.hourly_rate_max ? parseFloat(formData.hourly_rate_max) : null,
      milestones: formData.milestones.map((m) => ({
        ...m,
        amount: parseFloat(m.amount),
      })),
    };

    console.log("=== JOB CREATION START ===");
    console.log("Submission data:", submissionData);

    // Call API
    
const newJob = await createJob(submissionData);

if (!newJob || !newJob.id) {
  throw new Error("Job creation failed – no job ID in response");
}

console.log("=== JOB CREATED SUCCESSFULLY ===");
console.log("New job:", newJob);
console.log("Job ID:", newJob.id);

    // Upload attachments if any
    if (attachmentFiles.length > 0) {
      console.log("=== STARTING ATTACHMENT UPLOAD ===");
      console.log("Files:", attachmentFiles);

      for (let i = 0; i < attachmentFiles.length; i++) {
        const file = attachmentFiles[i];
        console.log(`Uploading file ${i + 1}/${attachmentFiles.length}:`, file.name);

        try {
          const result = await jobsApi.uploadJobAttachment(newJob.id, file);
          console.log(`✓ File ${i + 1} uploaded successfully:`, result);
        } catch (uploadError) {
          console.error(`✗ File ${i + 1} upload failed:`, uploadError);
        }
      }
      console.log("=== ATTACHMENT UPLOAD COMPLETE ===");
    } else {
      console.log("No attachments to upload");
    }

    setSuccess("Job posted successfully! Redirecting to My Jobs...");
    onJobPosted?.(newJob);

    setTimeout(() => navigate("/jobs?view=my-jobs"), 1500);
  } catch (error) {
    console.error("=== JOB CREATION/UPLOAD ERROR ===");
    console.error(error);
    setErrors({ submit: error.message });
  } finally {
    setLoading(false);
  }
};

  const getSelectedSkills = () => {
    return skills.filter(skill => formData.skills.includes(skill.id));
  };

  const totalBudget = calculateTotalBudget();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Full Stack Web Developer for E-commerce Platform"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your project requirements, goals, and expectations..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="any">Any Level</option>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Skills Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills *
                </label>
                <div className="space-y-3">
                  <div className="flex">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Search skills..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {skillInput && (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                      {skills
                        .filter(skill => 
                          skill.name.toLowerCase().includes(skillInput.toLowerCase()) &&
                          !formData.skills.includes(skill.id)
                        )
                        .slice(0, 5)
                        .map(skill => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              addSkill(skill.id);
                              setSkillInput('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            {skill.name}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {getSelectedSkills().map(skill => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Timeline */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Budget & Timeline</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Job Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'fixed', label: 'Fixed Price', desc: 'Pay a fixed amount for the entire project' },
                    { value: 'hourly', label: 'Hourly Rate', desc: 'Pay based on hours worked' },
                    { value: 'milestone', label: 'Milestone Based', desc: 'Pay in phases as milestones are completed' }
                  ].map(type => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.job_type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleInputChange('job_type', type.value)}
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="job_type"
                          value={type.value}
                          checked={formData.job_type === type.value}
                          onChange={() => handleInputChange('job_type', type.value)}
                          className="mr-2"
                        />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Fields */}
              {formData.job_type === 'hourly' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Hourly Rate ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.hourly_rate_min}
                      onChange={(e) => handleInputChange('hourly_rate_min', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.hourly_rate_min ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="25"
                      min="1"
                      step="0.01"
                    />
                    {errors.hourly_rate_min && <p className="text-red-500 text-sm mt-1">{errors.hourly_rate_min}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Hourly Rate ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.hourly_rate_max}
                      onChange={(e) => handleInputChange('hourly_rate_max', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.hourly_rate_max ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="75"
                      min="1"
                      step="0.01"
                    />
                    {errors.hourly_rate_max && <p className="text-red-500 text-sm mt-1">{errors.hourly_rate_max}</p>}
                  </div>
                </div>
              ) : formData.job_type === 'milestone' ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Project Milestones *
                    </label>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} />
                      Add Milestone
                    </button>
                  </div>
                  
                  {formData.milestones.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <p className="text-gray-500 mb-2">No milestones added yet</p>
                      <button
                        type="button"
                        onClick={addMilestone}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add First Milestone
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.milestones.map((milestone, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">Milestone {milestone.order}</h4>
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                value={milestone.title}
                                onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`milestone_${index}_title`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g. Initial Design"
                              />
                              {errors[`milestone_${index}_title`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`milestone_${index}_title`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount ($) *
                              </label>
                              <input
                                type="number"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`milestone_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="500"
                                min="1"
                                step="0.01"
                              />
                              {errors[`milestone_${index}_amount`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`milestone_${index}_amount`]}</p>
                              )}
                            </div>
                            
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={milestone.description}
                                onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Describe what will be delivered in this milestone..."
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={milestone.due_date}
                                onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {totalBudget > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800 font-medium">
                            Total Project Budget: ${totalBudget.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errors.milestones && <p className="text-red-500 text-sm mt-2">{errors.milestones}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Budget ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => handleInputChange('budget_min', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.budget_min ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="500"
                      min="1"
                      step="0.01"
                    />
                    {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Budget ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => handleInputChange('budget_max', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.budget_max ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="2000"
                      min="1"
                      step="0.01"
                    />
                    {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration
                  </label>
                  <select
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Duration</option>
                    <option value="less_than_week">Less than a week</option>
                    <option value="1_to_4_weeks">1 to 4 weeks</option>
                    <option value="1_to_3_months">1 to 3 months</option>
                    <option value="3_to_6_months">3 to 6 months</option>
                    <option value="more_than_6_months">More than 6 months</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.deadline ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="remote_allowed"
                      checked={formData.remote_allowed}
                      onChange={(e) => handleInputChange('remote_allowed', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remote_allowed" className="ml-2 text-sm font-medium text-gray-700">
                      Remote work allowed
                    </label>
                  </div>
                  
                  {!formData.remote_allowed && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.location ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g. San Francisco, CA"
                      />
                      {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="is_urgent"
                      checked={formData.is_urgent}
                      onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_urgent" className="ml-2 text-sm font-medium text-gray-700">
                      Mark as urgent
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Urgent jobs get more visibility but may cost extra.</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-gray-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Files (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload size={32} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Drop files here or click to browse</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Support: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max: 10MB each, 5 files total)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>

                {/* Attachment List */}
                {attachmentFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachmentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.attachments && <p className="text-red-500 text-sm mt-2">{errors.attachments}</p>}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Post Job
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;