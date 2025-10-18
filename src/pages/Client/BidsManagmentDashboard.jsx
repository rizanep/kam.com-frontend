// src/components/Client/BidsManagementDashboard.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Users, TrendingUp, Clock, DollarSign, Star, Eye,
  CheckCircle, XCircle, MessageSquare, Filter, Search,
  Download, ExternalLink, Calendar, Award, MoreVertical,
  User, Mail, Phone, MapPin, Send, AlertCircle, Brain, Zap,
  Target, TrendingDown, CreditCard, Lock
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';
import { bidsApiService } from '../../services/bidsApi';
import AuthContext from '../../context/AuthContext';
import { toast } from "sonner"
import axios from 'axios';

const BidsManagementDashboard = () => {
  const jobsContext = useJobs();
  const { user } = useContext(AuthContext);
  
  if (!jobsContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Context Error</h3>
          <p className="text-gray-600">Jobs context is not available. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const { myJobs = [], loading: jobsLoading = false, loadMyJobs } = jobsContext;
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobBids, setJobBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [bidFilters, setBidFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [aiScores, setAiScores] = useState({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [scoreError, setScoreError] = useState('');

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    amount: 0,
    saveCard: false
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    if (user && (user.account_types?.includes('client') || user.user_type === 'client')) {
      if (loadMyJobs && typeof loadMyJobs === 'function') {
        loadMyJobs().catch(error => {
          console.error('Error loading jobs:', error);
          setError('Error loading jobs. Please try again.');
          toast.error('Failed to load your jobs');
        });
      }
    } else {
      setError('Access denied. Only clients can view proposal management.');
      toast.error('Access denied. Only clients can access this page.');
    }
  }, [user, loadMyJobs]);

  useEffect(() => {
    if (selectedJob) {
      loadJobBids(selectedJob.id);
    }
  }, [bidFilters, selectedJob]);

  useEffect(() => {
    if (selectedJob && jobBids.length > 0) {
      fetchAIScores(selectedJob);
    }
  }, [selectedJob, jobBids]);

  useEffect(() => {
    if (myJobs && myJobs.length > 0 && !selectedJob) {
      const jobWithBids = myJobs.find(job => (job.applications_count || 0) > 0);
      if (jobWithBids) {
        setSelectedJob(jobWithBids);
      } else if (myJobs.length > 0) {
        setSelectedJob(myJobs[0]);
      }
    }
  }, [myJobs, selectedJob]);

  const getUserIdFromBid = (bid) => {
    if (bid && !bid._logged) {
      console.log('=== BID STRUCTURE DEBUG ===');
      console.log('Full bid object:', bid);
      console.log('bid.freelancer_profile:', bid.freelancer_profile);
      console.log('Possible user_id locations:');
      console.log('  - bid.freelancer_profile?.user_id:', bid.freelancer_profile?.user_id);
      console.log('  - bid.freelancer_profile?.id:', bid.freelancer_profile?.id);
      console.log('  - bid.user_id:', bid.user_id);
      console.log('  - bid.freelancer_id:', bid.freelancer_id);
      console.log('  - bid.freelancer:', bid.freelancer);
      bid._logged = true;
    }
    
    const userId = bid.freelancer_profile?.user_id || 
                   bid.freelancer_profile?.id || 
                   bid.user_id || 
                   bid.freelancer_id ||
                   bid.freelancer;
    
    console.log(`getUserIdFromBid result: ${userId} (type: ${typeof userId})`);
    return userId;
  };

  const fetchAIScores = async (job) => {
    try {
      setLoadingScores(true);
      setScoreError('');

      const requiredSkills = job.skills?.map(skill => {
        if (typeof skill === 'object' && skill !== null && skill.name) {
          return skill.name;
        }
        return skill;
      }).filter(Boolean) || [];
      
      console.log('Extracted skills:', requiredSkills);
      
      const payload = {
        job_id: job.id,
        job_description: job.description || job.title,
        required_skills: requiredSkills
      };

      console.log('Fetching AI scores with payload:', payload);

      const response = await axios.post(
        'https://kamcomuser.duckdns.org/api/scoring/match-job/',
        payload
      );

      if (response.data && response.data.matches) {
        const scoresMap = {};
        response.data.matches.forEach(match => {
          scoresMap[match.user_id] = match;
          scoresMap[String(match.user_id)] = match;
        });
        
        setAiScores(scoresMap);
        console.log('=== AI SCORES DEBUG ===');
        console.log('AI Scores loaded:', scoresMap);
        console.log('Score keys (original):', Object.keys(scoresMap).filter(k => !isNaN(k) && Number(k) < 100));
        console.log('Current bids:', jobBids);
        
        if (jobBids.length > 0) {
          console.log('=== BID TO SCORE MAPPING ===');
          jobBids.forEach(bid => {
            const userId = getUserIdFromBid(bid);
            const hasScore = !!scoresMap[userId];
            console.log(`Bid ID: ${bid.id}, Freelancer: ${bid.freelancer_profile?.username}, User ID: ${userId} (type: ${typeof userId}), Has Score: ${hasScore}`);
            
            if (!hasScore) {
              console.warn(`❌ No score found for user ${userId}. Available score keys:`, Object.keys(scoresMap).filter(k => !isNaN(k) && Number(k) < 100));
            } else {
              console.log(`✅ Score found for user ${userId}:`, scoresMap[userId].combined_score);
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI scores:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch AI matching scores';
      setScoreError(errorMessage);
      console.warn('AI Scoring unavailable:', errorMessage);
    } finally {
      setLoadingScores(false);
    }
  };

  const loadJobBids = async (jobId) => {
    try {
      setLoadingBids(true);
      setError('');
      
      const params = {
        ordering: bidFilters.sortOrder === 'desc' ? `-${bidFilters.sortBy}` : bidFilters.sortBy,
      };

      if (bidFilters.status !== 'all') {
        params.status = bidFilters.status;
      }

      if (bidFilters.search) {
        params.search = bidFilters.search;
      }

      const response = await bidsApiService.getJobBids(jobId, params);
      setJobBids(response.results || response || []);
    } catch (err) {
      console.error('Failed to load job bids:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load bids';
      setError(errorMessage);
      toast.error(errorMessage);
      setJobBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setJobBids([]);
    setAiScores({});
    console.log('Selected job:', job);
  };

  const handleBidStatusUpdate = async (bidId, status, feedback = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [bidId]: status }));
      
      await bidsApiService.updateBidStatus(bidId, { 
        status, 
        feedback: feedback || rejectionReason 
      });
      
      const successMessage = `Proposal ${status === 'accepted' ? 'accepted' : 'declined'} successfully`;
      toast.success(successMessage);
      
      if (selectedJob) {
        loadJobBids(selectedJob.id);
      }
      
      if (loadMyJobs && typeof loadMyJobs === 'function') {
        loadMyJobs();
      }
      
      setShowRejectModal(false);
      setRejectionReason('');
      
    } catch (err) {
      console.error('Failed to update bid status:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to update bid status';
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [bidId]: null }));
    }
  };

  const handleAcceptBid = (bid) => {
    if (window.confirm('Are you sure you want to accept this proposal? This action will reject all other pending proposals for this job.')) {
      setSelectedBid(bid);
      setPaymentForm(prev => ({
        ...prev,
        amount: bid.bid_type === 'hourly' 
          ? bid.hourly_rate * (bid.estimated_hours || 40)
          : bid.total_amount
      }));
      setShowPaymentModal(true);
    }
  };

  const handleRejectBid = (bid) => {
    setSelectedBid(bid);
    setShowRejectModal(true);
  };

  const handleViewBidDetails = async (bid) => {
    try {
      setActionLoading(prev => ({ ...prev, [bid.id]: 'loading' }));
      const bidDetails = await bidsApiService.getBidDetails(bid.id);
      setSelectedBid(bidDetails);
      setShowBidDetails(true);
    } catch (err) {
      console.error('Failed to load bid details:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load bid details';
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [bid.id]: null }));
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!paymentForm.cardNumber || !paymentForm.cardName || !paymentForm.expiryDate || !paymentForm.cvv) {
      toast.error('Please fill in all payment details');
      return;
    }

    // Validate card number (basic check)
    if (paymentForm.cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Invalid card number');
      return;
    }

    // Validate CVV
    if (paymentForm.cvv.length < 3) {
      toast.error('Invalid CVV');
      return;
    }

    try {
      setProcessingPayment(true);

      // TODO: Replace with your actual payment API endpoint
      const paymentPayload = {
        bid_id: selectedBid.id,
        job_id: selectedJob.id,
        amount: paymentForm.amount,
        card_number: paymentForm.cardNumber.replace(/\s/g, ''),
        card_name: paymentForm.cardName,
        expiry_date: paymentForm.expiryDate,
        cvv: paymentForm.cvv,
        save_card: paymentForm.saveCard
      };

      // Simulated payment processing
      // Replace this with your actual payment API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful payment, accept the bid
      await handleBidStatusUpdate(selectedBid.id, 'accepted');
      
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      
      // Reset payment form
      setPaymentForm({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        amount: 0,
        saveCard: false
      });

    } catch (err) {
      console.error('Payment failed:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExportBids = () => {
    if (selectedJob) {
      try {
        bidsApiService.exportBids('csv', { job_id: selectedJob.id });
        toast.success('Export started successfully');
      } catch (err) {
        toast.error('Failed to export bids');
      }
    }
  };

  const handleMessageFreelancer = (bid) => {
    console.log('Message freelancer:', bid.freelancer_profile?.username);
    toast.info('Messaging feature coming soon');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const getScoreColor = (score) => {
    const numScore = Number(score) || 0;
    if (numScore >= 70) return 'text-green-600 bg-green-50';
    if (numScore >= 50) return 'text-yellow-600 bg-yellow-50';
    if (numScore >= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeColor = (score) => {
    const numScore = Number(score) || 0;
    if (numScore >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (numScore >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (numScore >= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const jobsWithApplications = myJobs.filter(job => 
    job.status !== 'draft' && job.status !== 'cancelled'
  );

  const calculateJobStats = (job) => {
    return {
      total_bids: job.applications_count || 0,
      new_bids: 0,
      average_bid: 0,
      quality_score: 0,
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access proposal management.</p>
        </div>
      </div>
    );
  }

  if (!user.account_types?.includes('client') && user.user_type !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only clients can access proposal management.</p>
        </div>
      </div>
    );
  }

  const AIScoreBadge = ({ bid }) => {
    const userId = getUserIdFromBid(bid);
    const scoreData = aiScores[userId];
    
    if (loadingScores) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <Brain size={16} className="text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-500">Analyzing...</span>
        </div>
      );
    }

    if (!scoreData) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
          <AlertCircle size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">Score unavailable</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getScoreBadgeColor(scoreData.combined_score)}`}>
        <Brain size={16} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              AI Match: {scoreData.combined_score.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs opacity-75">
            Skills: {scoreData.skill_match.toFixed(0)}% | Similarity: {(scoreData.similarity_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  const AIScoreDetails = ({ bid }) => {
    const userId = getUserIdFromBid(bid);
    const scoreData = aiScores[userId];
    
    if (!scoreData) return null;

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={20} className="text-purple-600" />
          <h4 className="font-semibold text-gray-900">AI Matching Analysis</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(scoreData.combined_score).split(' ')[0]}`}>
              {scoreData.combined_score.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Overall Match</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(scoreData.skill_match).split(' ')[0]}`}>
              {scoreData.skill_match.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Skill Match</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(scoreData.similarity_score * 100).split(' ')[0]}`}>
              {(scoreData.similarity_score * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Profile Similarity</div>
          </div>
        </div>

        {scoreData.matched_skills && scoreData.matched_skills.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <CheckCircle size={14} className="text-green-600" />
              Matched Skills ({scoreData.matched_skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {scoreData.matched_skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {scoreData.missing_skills && scoreData.missing_skills.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <XCircle size={14} className="text-red-600" />
              Missing Skills ({scoreData.missing_skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {scoreData.missing_skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {scoreData.freelancer_skills && scoreData.freelancer_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              All Freelancer Skills ({scoreData.freelancer_skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {scoreData.freelancer_skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const PaymentModal = () => {
    if (!showPaymentModal || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pay {selectedBid.freelancer_profile?.first_name} {selectedBid.freelancer_profile?.last_name}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={processingPayment}
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          
          <form onSubmit={handlePaymentSubmit} className="p-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Payment Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentForm.amount)}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {selectedBid.bid_type === 'hourly' 
                  ? `${formatCurrency(selectedBid.hourly_rate)}/hr × ${selectedBid.estimated_hours || 40} hours`
                  : 'Fixed price project'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm(prev => ({
                      ...prev,
                      cardNumber: formatCardNumber(e.target.value)
                    }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <CreditCard size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={paymentForm.cardName}
                  onChange={(e) => setPaymentForm(prev => ({
                    ...prev,
                    cardName: e.target.value.toUpperCase()
                  }))}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={(e) => setPaymentForm(prev => ({
                      ...prev,
                      expiryDate: formatExpiryDate(e.target.value)
                    }))}
                    placeholder="MM/YY"
                    maxLength="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        cvv: e.target.value.replace(/\D/g, '')
                      }))}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Lock size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={paymentForm.saveCard}
                  onChange={(e) => setPaymentForm(prev => ({
                    ...prev,
                    saveCard: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700">
                  Save card for future payments
                </label>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Lock size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  Your payment information is encrypted and secure. By proceeding, you agree to accept this proposal and begin the project.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingPayment}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay {formatCurrency(paymentForm.amount)}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const FreelancerCard = ({ bid }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {bid.freelancer_profile?.profile_picture_url ? (
                <img 
                  src={bid.freelancer_profile.profile_picture_url} 
                  alt={bid.freelancer_profile.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {bid.freelancer_profile?.first_name} {bid.freelancer_profile?.last_name}
              </h4>
              <p className="text-sm text-gray-600">{bid.freelancer_profile?.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {bid.freelancer_profile?.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {bid.freelancer_profile.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {bid.freelancer_profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {bid.bid_type === 'hourly' 
                ? `${formatCurrency(bid.hourly_rate)}/hr`
                : formatCurrency(bid.total_amount)
              }
            </p>
            <p className="text-sm text-gray-600">
              {bid.estimated_delivery} days delivery
            </p>
          </div>
        </div>

        <div className="mb-4">
          <AIScoreBadge bid={bid} />
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Proposal</p>
          <p className="text-gray-600 text-sm line-clamp-3">{bid.proposal}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {bid.freelancer_profile?.acceptance_rate || 0}%
            </p>
            <p className="text-xs text-gray-600">Success Rate</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {bid.freelancer_profile?.total_bids || 0}
            </p>
            <p className="text-xs text-gray-600">Total Bids</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {bid.freelancer_profile?.completed_projects || 0}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
        </div>

        {bid.milestones_count > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">
              {bid.milestones_count} Milestones Proposed
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Applied {formatDate(bid.created_at)}</span>
          </div>

          <div className="flex items-center gap-2">
            {bid.status === 'pending' && (
              <>
                <button
                  onClick={() => handleMessageFreelancer(bid)}
                  className="px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 text-sm flex items-center gap-1"
                >
                  <MessageSquare size={14} />
                  Message
                </button>
                <button
                  onClick={() => handleRejectBid(bid)}
                  disabled={actionLoading[bid.id] === 'rejected'}
                  className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm disabled:opacity-50"
                >
                  {actionLoading[bid.id] === 'rejected' ? 'Declining...' : 'Decline'}
                </button>
                <button
                  onClick={() => handleBidStatusUpdate(selectedBid.id, 'accepted')}
                  disabled={actionLoading[bid.id] === 'accepted'}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {actionLoading[bid.id] === 'accepted' ? 'Accepting...' : (
                    <>
                  
                      Accept & Pay
                    </>
                  )}
                </button>
              </>
            )}
            
            {bid.status === 'accepted' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                <CheckCircle size={14} />
                Accepted
              </span>
            )}
            
            {bid.status === 'rejected' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                <XCircle size={14} />
                Declined
              </span>
            )}

            <button
              onClick={() => handleViewBidDetails(bid)}
              disabled={actionLoading[bid.id] === 'loading'}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {actionLoading[bid.id] === 'loading' ? 'Loading...' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BidDetailsModal = () => {
    if (!showBidDetails || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" ref={modalRef}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Proposal from {selectedBid.freelancer_profile?.first_name} {selectedBid.freelancer_profile?.last_name}
              </h2>
              <button
                onClick={() => setShowBidDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <AIScoreDetails bid={selectedBid} />

            <div className="mt-6 mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Proposal</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedBid.proposal}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              {selectedBid.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowBidDetails(false);
                      handleRejectBid(selectedBid);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      setShowBidDetails(false);
                      handleAcceptBid(selectedBid);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    Accept & Pay
                  </button>
                </>
              )}
              <button
                onClick={() => setShowBidDetails(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RejectModal = () => {
    if (!showRejectModal || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Decline Proposal</h3>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to decline this proposal from {selectedBid.freelancer_profile?.first_name} {selectedBid.freelancer_profile?.last_name}?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback to help the freelancer improve..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBidStatusUpdate(selectedBid.id, 'rejected')}
                disabled={actionLoading[selectedBid.id] === 'rejected'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading[selectedBid.id] === 'rejected' ? 'Declining...' : 'Decline Proposal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (jobsLoading && myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proposal Management</h1>
              <p className="text-gray-600 mt-2">Review and manage proposals for your projects</p>
            </div>
            {selectedJob && loadingScores && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <Brain size={20} className="text-purple-600 animate-pulse" />
                <span className="text-sm text-purple-700 font-medium">AI analyzing proposals...</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {scoreError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            AI Scoring unavailable: {scoreError}. Basic proposal view is still available.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Projects ({jobsWithApplications.length})
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {jobsWithApplications.map((job) => {
                const jobStats = calculateJobStats(job);
                return (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedJob?.id === job.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {job.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Proposals:</span>
                        <span className="font-medium">{job.applications_count || 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium capitalize ${
                          job.status === 'published' ? 'text-green-600' :
                          job.status === 'in_progress' ? 'text-blue-600' :
                          job.status === 'completed' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {job.status?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{job.budget_display || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Posted:</span>
                        <span className="font-medium">{job.time_posted || formatDate(job.created_at)}</span>
                      </div>

                      {job.experience_level && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Level:</span>
                          <span className="font-medium capitalize">{job.experience_level.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>

                    {job.applications_count > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {job.applications_count} proposal{job.applications_count !== 1 ? 's' : ''}
                        </span>
                        {job.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <Star size={12} className="fill-current" />
                            Featured
                          </span>
                        )}
                        {job.is_urgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            <Zap size={12} />
                            Urgent
                          </span>
                        )}
                      </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {skill.name || skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {jobsWithApplications.length === 0 && (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No published projects yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedJob ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Proposals for: {selectedJob.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {jobBids.length} total proposals
                    </p>
                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Target size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Required: {selectedJob.skills.map(s => s.name || s).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleExportBids}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button 
                      onClick={() => window.open(`/jobs/${selectedJob.id}`, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink size={16} />
                      View Job
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search proposals..."
                          value={bidFilters.search}
                          onChange={(e) => setBidFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <select 
                      value={bidFilters.status}
                      onChange={(e) => setBidFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select 
                      value={`${bidFilters.sortBy}-${bidFilters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setBidFilters(prev => ({ ...prev, sortBy, sortOrder }));
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at-desc">Latest First</option>
                      <option value="total_amount-asc">Price: Low to High</option>
                      <option value="total_amount-desc">Price: High to Low</option>
                      <option value="freelancer_profile__average_rating-desc">Highest Rated</option>
                      <option value="estimated_delivery-asc">Fastest Delivery</option>
                    </select>
                  </div>
                </div>

                {!loadingScores && Object.keys(aiScores).length > 0 && (
                  <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Brain size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Matching Active</h4>
                        <p className="text-sm text-gray-700">
                          We've analyzed each freelancer's profile against your job requirements. 
                          The AI match score considers skill alignment, profile similarity, and experience level.
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            70%+ Excellent Match
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            50-70% Good Match
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            30-50% Fair Match
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            &lt;30% Low Match
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {loadingBids ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading proposals...</p>
                    </div>
                  ) : jobBids.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No proposals found</h3>
                      <p className="text-gray-600">
                        {bidFilters.search || bidFilters.status !== 'all' 
                          ? 'Try adjusting your filters to see more results'
                          : 'No proposals have been received for this job yet.'
                        }
                      </p>
                    </div>
                  ) : (
                    jobBids.map((bid) => (
                      <FreelancerCard key={bid.id} bid={bid} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Select a Project
                </h3>
                <p className="text-gray-600">
                  Choose a project from the left to view and manage proposals
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BidDetailsModal />
      <RejectModal />
      <PaymentModal />
    </div>
  );
};

export default BidsManagementDashboard;