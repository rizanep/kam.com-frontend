// // src/pages/Jobs/JobDetail.jsx
// import React, { useState, useEffect } from 'react';
// import { 
//   ArrowLeft, MapPin, Clock, DollarSign, Star, Bookmark, BookmarkCheck, 
//   User, Eye, Users, Calendar, Building, Award, CheckCircle, Send,
//   ExternalLink, Download
// } from 'lucide-react';

// const API_BASE_URL = 'http://localhost:8001/api';

// const getAuthToken = () => localStorage.getItem('access_token');

// const getAuthHeaders = () => ({
//   'Authorization': `Bearer ${getAuthToken()}`,
//   'Content-Type': 'application/json',
// });

// const apiCall = async (url, method = 'GET', data = null) => {
//   const config = {
//     method,
//     headers: getAuthHeaders(),
//   };
  
//   if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
//     config.body = JSON.stringify(data);
//   }

//   const response = await fetch(url, config);
//   if (!response.ok) {
//     throw new Error(`HTTP ${response.status}`);
//   }
//   return method === 'DELETE' ? true : await response.json();
// };

// const JobDetail = ({ jobId, onBack, onNavigate }) => {
//   const [job, setJob] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [isSaved, setIsSaved] = useState(false);
//   const [applying, setApplying] = useState(false);

//   useEffect(() => {
//     if (jobId) {
//       loadJobDetail();
//     }
//   }, [jobId]);

//   const loadJobDetail = async () => {
//     try {
//       const jobData = await apiCall(`${API_BASE_URL}/jobs/${jobId}/`);
//       setJob(jobData);
//       setIsSaved(jobData.is_saved);
//     } catch (error) {
//       setError('Failed to load job details');
//       console.error('Error loading job:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     const token = getAuthToken();
//     if (!token) {
//       setError('Please login to save jobs');
//       return;
//     }

//     try {
//       if (isSaved) {
//         await apiCall(`${API_BASE_URL}/jobs/${jobId}/unsave/`, 'DELETE');
//       } else {
//         await apiCall(`${API_BASE_URL}/jobs/${jobId}/save/`, 'POST');
//       }
//       setIsSaved(!isSaved);
//     } catch (error) {
//       setError('Failed to save job');
//     }
//   };

//   const handleApply = () => {
//     setApplying(true);
//     if (onNavigate) {
//       onNavigate('apply', jobId);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading job details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !job) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
//           <p className="text-gray-600 mb-4">{error || 'The job you are looking for does not exist.'}</p>
//           <button
//             onClick={() => onNavigate && onNavigate('browse')}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//           >
//             Browse Jobs
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Back Button */}
//         <button
//           onClick={onBack}
//           className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
//         >
//           <ArrowLeft size={20} />
//           Back to Jobs
//         </button>

//         {/* Job Header */}
//         <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
//           <div className="flex justify-between items-start mb-6">
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-4">
//                 <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
//                 {job.is_featured && (
//                   <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
//                     Featured
//                   </span>
//                 )}
//                 {job.is_urgent && (
//                   <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full font-medium">
//                     Urgent
//                   </span>
//                 )}
//               </div>
              
//               <div className="flex items-center gap-6 text-gray-600 mb-4">
//                 <span className="flex items-center gap-1">
//                   <DollarSign size={18} />
//                   <span className="text-lg font-semibold text-gray-900">{job.budget_display}</span>
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Clock size={18} />
//                   {job.time_posted}
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <MapPin size={18} />
//                   {job.remote_allowed ? 'Remote' : job.location}
//                 </span>
//               </div>

//               <div className="flex items-center gap-6 text-sm text-gray-500">
//                 <span className="flex items-center gap-1">
//                   <Eye size={16} />
//                   {job.views_count} views
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Users size={16} />
//                   {job.applications_count} proposals
//                 </span>
//                 {job.deadline && (
//                   <span className="flex items-center gap-1">
//                     <Calendar size={16} />
//                     Deadline: {new Date(job.deadline).toLocaleDateString()}
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={handleSave}
//                 className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//               >
//                 {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
//                 {isSaved ? 'Saved' : 'Save'}
//               </button>
//               <button
//                 onClick={handleApply}
//                 disabled={applying}
//                 className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//               >
//                 <Send size={18} />
//                 Apply Now
//               </button>
//             </div>
//           </div>

//           {/* Client Info */}
//           <div className="border-t border-gray-200 pt-6">
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
//                 {job.client_info?.profile_picture ? (
//                   <img 
//                     src={job.client_info.profile_picture} 
//                     alt={job.client_info.username}
//                     className="w-16 h-16 rounded-full object-cover"
//                   />
//                 ) : (
//                   <User size={24} className="text-gray-600" />
//                 )}
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     {job.client_info?.first_name} {job.client_info?.last_name}
//                   </h3>
//                   {job.client_info?.is_verified && (
//                     <CheckCircle size={18} className="text-blue-600" />
//                   )}
//                 </div>
//                 <div className="flex items-center gap-4 text-sm text-gray-600">
//                   {job.client_info?.rating && (
//                     <div className="flex items-center gap-1">
//                       <Star size={14} className="text-yellow-400 fill-current" />
//                       <span>{job.client_info.rating}</span>
//                     </div>
//                   )}
//                   <span>${job.client_info?.total_spent?.toLocaleString() || 0} spent</span>
//                   <span>{job.client_info?.jobs_posted || 0} jobs posted</span>
//                   {job.client_info?.member_since && (
//                     <span>Member since {new Date(job.client_info.member_since).getFullYear()}</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Job Description */}
//         <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
//           <div className="prose max-w-none">
//             <p className="text-gray-700 leading-relaxed whitespace-pre-line">
//               {job.description}
//             </p>
//           </div>
//         </div>

//         {/* Skills & Requirements */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           <div className="bg-white rounded-lg border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
//             <div className="flex flex-wrap gap-2">
//               {job.skills?.map((skill) => (
//                 <span
//                   key={skill.id}
//                   className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
//                 >
//                   {skill.name}
//                 </span>
//               ))}
//             </div>
//           </div>

//           <div className="bg-white rounded-lg border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Job Type</span>
//                 <span className="font-medium capitalize">{job.job_type.replace('_', ' ')}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Experience Level</span>
//                 <span className="font-medium capitalize">{job.experience_level}</span>
//               </div>
//               {job.estimated_duration && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Duration</span>
//                   <span className="font-medium">{job.estimated_duration.replace('_', ' ')}</span>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Remote</span>
//                 <span className="font-medium">{job.remote_allowed ? 'Yes' : 'No'}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Milestones */}
//         {job.job_type === 'milestone' && job.milestones?.length > 0 && (
//           <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Project Milestones</h2>
//             <div className="space-y-4">
//               {job.milestones.map((milestone) => (
//                 <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
//                   <div className="flex justify-between items-start mb-2">
//                     <h4 className="font-semibold text-gray-900">
//                       {milestone.order}. {milestone.title}
//                     </h4>
//                     <span className="font-semibold text-green-600">
//                       ${milestone.amount}
//                     </span>
//                   </div>
//                   <p className="text-gray-600 text-sm">{milestone.description}</p>
//                   {milestone.due_date && (
//                     <p className="text-gray-500 text-xs mt-2">
//                       Due: {new Date(milestone.due_date).toLocaleDateString()}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Attachments */}
//         {job.attachments?.length > 0 && (
//           <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Attachments</h2>
//             <div className="space-y-3">
//               {job.attachments.map((attachment) => (
//                 <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
//                   <Download size={20} className="text-gray-400" />
//                   <div className="flex-1">
//                     <p className="font-medium text-gray-900">{attachment.filename}</p>
//                     <p className="text-sm text-gray-500">
//                       {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
//                     </p>
//                   </div>
//                   <a
//                     href={attachment.file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
//                   >
//                     <ExternalLink size={16} />
//                     Download
//                   </a>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // src/pages/Jobs/JobApplication.jsx
// const JobApplication = ({ jobId, onBack, onNavigate }) => {
//   const [job, setJob] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [formData, setFormData] = useState({
//     cover_letter: '',
//     bid_amount: '',
//     delivery_time: '',
//     portfolio_items: [],
//     attachments: []
//   });

//   useEffect(() => {
//     if (jobId) {
//       loadJobData();
//     }
//   }, [jobId]);

//   const loadJobData = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
//         headers: getAuthHeaders()
//       });
//       const jobData = await response.json();
//       setJob(jobData);
//     } catch (error) {
//       console.error('Error loading job:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
    
//     try {
//       // Submit application to backend
//       const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply/`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         alert('Application submitted successfully!');
//         onNavigate && onNavigate('detail', jobId);
//       } else {
//         throw new Error('Failed to submit application');
//       }
//     } catch (error) {
//       console.error('Error submitting application:', error);
//       alert('Failed to submit application. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Back Button */}
//         <button
//           onClick={onBack}
//           className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
//         >
//           <ArrowLeft size={20} />
//           Back to Job Details
//         </button>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Job Summary */}
//           <div className="bg-white rounded-lg border border-gray-200 p-6">
//             <h3 className="font-semibold text-gray-900 mb-4">Job Summary</h3>
//             <h4 className="font-medium text-gray-900 mb-2">{job?.title}</h4>
//             <div className="space-y-2 text-sm text-gray-600">
//               <div className="flex items-center gap-2">
//                 <DollarSign size={16} />
//                 {job?.budget_display}
//               </div>
//               <div className="flex items-center gap-2">
//                 <Clock size={16} />
//                 {job?.estimated_duration?.replace('_', ' ') || 'Not specified'}
//               </div>
//               <div className="flex items-center gap-2">
//                 <FileText size={16} />
//                 {job?.applications_count} proposals
//               </div>
//             </div>
            
//             <div className="mt-4 pt-4 border-t border-gray-200">
//               <h5 className="font-medium text-gray-900 mb-2">Required Skills</h5>
//               <div className="flex flex-wrap gap-1">
//                 {job?.skills?.slice(0, 5).map((skill) => (
//                   <span
//                     key={skill.id}
//                     className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
//                   >
//                     {skill.name}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Application Form */}
//           <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-8">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Application</h2>
            
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Cover Letter *
//                 </label>
//                 <textarea
//                   value={formData.cover_letter}
//                   onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
//                   rows={8}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="Tell the client why you're the perfect fit for this job..."
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Your Bid Amount ($) *
//                   </label>
//                   <input
//                     type="number"
//                     value={formData.bid_amount}
//                     onChange={(e) => setFormData(prev => ({ ...prev, bid_amount: e.target.value }))}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="1500"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Delivery Time (days) *
//                   </label>
//                   <input
//                     type="number"
//                     value={formData.delivery_time}
//                     onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="14"
//                     required
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Attachments (Optional)
//                 </label>
//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//                   <Upload size={32} className="mx-auto text-gray-400 mb-4" />
//                   <p className="text-gray-600 mb-2">Drop files here or click to browse</p>
//                   <p className="text-xs text-gray-500">Support: PDF, DOC, DOCX, JPG, PNG (Max: 10MB each)</p>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-4 pt-6">
//                 <button
//                   type="button"
//                   onClick={onBack}
//                   className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleSubmit}
//                   disabled={submitting || !formData.cover_letter || !formData.bid_amount || !formData.delivery_time}
//                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
//                 >
//                   {submitting ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Submitting...
//                     </>
//                   ) : (
//                     'Submit Application'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // src/services/jobsApi.js - API service functions
// const jobsApi = {
//   // Get all jobs with filters
//   async getJobs(params = {}) {
//     const queryString = new URLSearchParams(params).toString();
//     const url = `${API_BASE_URL}/jobs/${queryString ? `?${queryString}` : ''}`;
//     return apiCall(url);
//   },

//   // Get single job
//   async getJob(jobId) {
//     return apiCall(`${API_BASE_URL}/jobs/${jobId}/`);
//   },

//   // Get job categories
//   async getCategories() {
//     return apiCall(`${API_BASE_URL}/categories/`);
//   },

//   // Get skills
//   async getSkills() {
//     return apiCall(`${API_BASE_URL}/skills/`);
//   },

//   // Client APIs
//   async getMyJobs() {
//     return apiCall(`${API_BASE_URL}/client/jobs/`);
//   },

//   async createJob(jobData) {
//     return apiCall(`${API_BASE_URL}/client/jobs/create/`, 'POST', jobData);
//   },

//   async updateJob(jobId, jobData) {
//     return apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'PATCH', jobData);
//   },

//   async deleteJob(jobId) {
//     return apiCall(`${API_BASE_URL}/client/jobs/${jobId}/`, 'DELETE');
//   },

//   async updateJobStatus(jobId, status) {
//     return apiCall(`${API_BASE_URL}/client/jobs/${jobId}/status/`, 'PATCH', { status });
//   },

//   // Freelancer APIs
//   async getSavedJobs() {
//     return apiCall(`${API_BASE_URL}/saved-jobs/`);
//   },

//   async saveJob(jobId) {
//     return apiCall(`${API_BASE_URL}/jobs/${jobId}/save/`, 'POST');
//   },

//   async unsaveJob(jobId) {
//     return apiCall(`${API_BASE_URL}/jobs/${jobId}/unsave/`, 'DELETE');
//   },

//   async applyToJob(jobId, applicationData) {
//     return apiCall(`${API_BASE_URL}/jobs/${jobId}/apply/`, 'POST', applicationData);
//   },

//   // File upload
//   async uploadJobAttachment(jobId, file, description = '') {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('description', description);

//     const response = await fetch(`${API_BASE_URL}/client/jobs/${jobId}/attachments/`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${getAuthToken()}`
//       },
//       body: formData
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }
//     return response.json();
//   },

//   async deleteJobAttachment(jobId, attachmentId) {
//     return apiCall(`${API_BASE_URL}/client/jobs/${jobId}/attachments/${attachmentId}/`, 'DELETE');
//   }
// };

// // src/components/Jobs/JobsDashboard.jsx - Dashboard component
// const JobsDashboard = ({ user }) => {
//   const [activeView, setActiveView] = useState('browse');
//   const [selectedJobId, setSelectedJobId] = useState(null);

//   const handleNavigate = (view, jobId = null) => {
//     setActiveView(view);
//     setSelectedJobId(jobId);
//   };

//   const renderView = () => {
//     switch (activeView) {
//       case 'detail':
//         return (
//           <JobDetail
//             jobId={selectedJobId}
//             onBack={() => setActiveView('browse')}
//             onNavigate={handleNavigate}
//           />
//         );
//       case 'apply':
//         return (
//           <JobApplication
//             jobId={selectedJobId}
//             onBack={() => setActiveView('detail')}
//             onNavigate={handleNavigate}
//           />
//         );
//       default:
//         return (
//           <JobsApp
//             user={user}
//             onNavigate={handleNavigate}
//           />
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {renderView()}
//     </div>
//   );
// };

// export { JobDetail, JobApplication, JobsDashboard, jobsApi };




import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Clock, DollarSign, Star, Bookmark, BookmarkCheck, 
  User, Eye, Users, Calendar, CheckCircle, Send, Download, ExternalLink
} from 'lucide-react';
import { jobsApi } from '../../services/jobsApi';

const JobDetailPage = ({ jobId, onBack, onApply }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetail();
    }
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      const jobData = await jobsApi.getJob(jobId);
      setJob(jobData);
      setIsSaved(jobData.is_saved);
    } catch (error) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await jobsApi.unsaveJob(jobId);
      } else {
        await jobsApi.saveJob(jobId);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      setError('Failed to save job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Jobs
        </button>

        {/* Job Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                {job.is_featured && (
                  <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
                    Featured
                  </span>
                )}
                {job.is_urgent && (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full font-medium">
                    Urgent
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <DollarSign size={18} />
                  <span className="text-lg font-semibold text-gray-900">{job.budget_display}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={18} />
                  {job.time_posted}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={18} />
                  {job.remote_allowed ? 'Remote' : job.location}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye size={16} />
                  {job.views_count} views
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {job.applications_count} proposals
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => onApply && onApply(job)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Send size={18} />
                Apply Now
              </button>
            </div>
          </div>

          {/* Client Info */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {job.client_info?.profile_picture ? (
                  <img 
                    src={job.client_info.profile_picture} 
                    alt={job.client_info.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.client_info?.first_name} {job.client_info?.last_name}
                  </h3>
                  {job.client_info?.is_verified && (
                    <CheckCircle size={18} className="text-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {job.client_info?.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span>{job.client_info.rating}</span>
                    </div>
                  )}
                  <span>${job.client_info?.total_spent?.toLocaleString() || 0} spent</span>
                  <span>{job.client_info?.jobs_posted || 0} jobs posted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </div>

        {/* Skills & Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Job Type</span>
                <span className="font-medium capitalize">{job.job_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className="font-medium capitalize">{job.experience_level}</span>
              </div>
              {job.estimated_duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{job.estimated_duration.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Remote</span>
                <span className="font-medium">{job.remote_allowed ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {job.job_type === 'milestone' && job.milestones?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Milestones</h2>
            <div className="space-y-4">
              {job.milestones.map((milestone) => (
                <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {milestone.order}. {milestone.title}
                    </h4>
                    <span className="font-semibold text-green-600">
                      ${milestone.amount}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{milestone.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {job.attachments?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attachments</h2>
            <div className="space-y-3">
              {job.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Download size={20} className="text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{attachment.filename}</p>
                    <p className="text-sm text-gray-500">
                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={16} />
                    Download
                  </a>
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