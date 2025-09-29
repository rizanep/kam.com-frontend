// src/components/Freelancer/BidsDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Clock, DollarSign, FileText, Eye, Award,
  Filter, Search, MoreVertical, CheckCircle, XCircle,
  AlertTriangle, Calendar, Star, ArrowRight, Edit,
  Trash2, Copy, ExternalLink
} from 'lucide-react';
import { bidsApiService } from '../../services/bidsApi';

const BidsDashboard = () => {
  const [bids, setBids] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [editFormData, setEditFormData] = useState({
    proposal: '',
    total_amount: '',
    hourly_rate: '',
    estimated_delivery: '',
    estimated_hours: ''
  });
  const [pagination, setPagination] = useState({
    hasNext: false,
    nextUrl: null,
    count: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadBids();
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await bidsApiService.getFreelancerDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const loadBids = async (loadMore = false) => {
    try {
      setLoading(!loadMore);
      const params = {
        ordering: filters.sortOrder === 'desc' ? `-${filters.sortBy}` : filters.sortBy,
      };

      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await bidsApiService.getFreelancerBids(params);
      
      if (loadMore) {
        setBids(prev => [...prev, ...(response.results || response)]);
      } else {
        setBids(response.results || response);
      }

      // Handle pagination
      setPagination({
        hasNext: !!response.next,
        nextUrl: response.next,
        count: response.count || (response.results?.length || response.length)
      });

    } catch (err) {
      setError('Failed to load bids: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleWithdrawBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [bidId]: 'withdrawing' }));
      await bidsApiService.withdrawBid(bidId);
      
      // Update the specific bid in the list
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, status: 'withdrawn' }
          : bid
      ));
      
      loadDashboardData();
      setOpenDropdown(null);
    } catch (err) {
      alert('Failed to withdraw bid: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [bidId]: null }));
    }
  };

  const handleViewDetails = async (bid) => {
    try {
      setActionLoading(prev => ({ ...prev, [bid.id]: 'loading' }));
      const bidDetails = await bidsApiService.getBidDetails(bid.id);
      setSelectedBid(bidDetails);
      setShowBidDetails(true);
      setOpenDropdown(null);
    } catch (err) {
      alert('Failed to load bid details: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [bid.id]: null }));
    }
  };

  const handleCopyBid = (bid) => {
    const bidText = `Job Application #${bid.id.slice(-8)}\nAmount: ${bid.bid_type === 'hourly' ? `$${bid.hourly_rate}/hr` : `$${bid.total_amount}`}\nDelivery: ${bid.estimated_delivery} days\nProposal: ${bid.proposal}`;
    navigator.clipboard.writeText(bidText);
    alert('Bid details copied to clipboard!');
    setOpenDropdown(null);
  };

  const handleEditBid = (bid) => {
    // Option 1: Navigate to edit page (uncomment to use)
    // navigate(`/freelancer/bids/${bid.id}/edit`);
    
    // Option 2: Open inline edit modal
    setEditingBid(bid);
    setEditFormData({
      proposal: bid.proposal,
      total_amount: bid.total_amount || '',
      hourly_rate: bid.hourly_rate || '',
      estimated_delivery: bid.estimated_delivery || '',
      estimated_hours: bid.estimated_hours || ''
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleUpdateBid = async () => {
    if (!editingBid) return;

    try {
      setActionLoading(prev => ({ ...prev, [editingBid.id]: 'updating' }));
      
      // Prepare update data based on bid type
      const updateData = {
        proposal: editFormData.proposal,
        estimated_delivery: parseInt(editFormData.estimated_delivery)
      };

      if (editingBid.bid_type === 'fixed') {
        updateData.total_amount = parseFloat(editFormData.total_amount);
      } else {
        updateData.hourly_rate = parseFloat(editFormData.hourly_rate);
        updateData.estimated_hours = parseInt(editFormData.estimated_hours);
      }

      await bidsApiService.updateBid(editingBid.id, updateData);
      
      // Update the bid in the list
      setBids(prev => prev.map(bid => 
        bid.id === editingBid.id 
          ? { ...bid, ...updateData }
          : bid
      ));
      
      setShowEditModal(false);
      setEditingBid(null);
      loadDashboardData(); // Refresh dashboard stats
      
    } catch (err) {
      alert('Failed to update bid: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [editingBid.id]: null }));
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'accepted': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'withdrawn': return <AlertTriangle size={16} />;
      case 'expired': return <Calendar size={16} />;
      default: return <Clock size={16} />;
    }
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

  const ActionDropdown = ({ bid }) => (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpenDropdown(openDropdown === bid.id ? null : bid.id)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={actionLoading[bid.id]}
      >
        <MoreVertical size={16} />
      </button>
      
      {openDropdown === bid.id && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <button
              onClick={() => handleViewDetails(bid)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Eye size={16} />
              View Details
            </button>
            
            {bid.status === 'pending' && !bid.is_expired && (
              <>
                <button
                  onClick={() => handleEditBid(bid)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Proposal
                </button>
                
                <button
                  onClick={() => handleWithdrawBid(bid.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  disabled={actionLoading[bid.id] === 'withdrawing'}
                >
                  <Trash2 size={16} />
                  {actionLoading[bid.id] === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </>
            )}
            
            <button
              onClick={() => handleCopyBid(bid)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy size={16} />
              Copy Details
            </button>
            
            <button
              onClick={() => {
                window.open(`/jobs/${bid.job_id}`, '_blank');
                setOpenDropdown(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <ExternalLink size={16} />
              View Job
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const EditBidModal = () => {
    if (!showEditModal || !editingBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Proposal #{editingBid.id.slice(-8)}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Proposal Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editFormData.proposal}
                onChange={(e) => handleEditFormChange('proposal', e.target.value)}
                placeholder="Describe your approach to this project..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {editFormData.proposal.length}/2000 characters
              </p>
            </div>

            {/* Pricing based on bid type */}
            {editingBid.bid_type === 'fixed' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.total_amount}
                  onChange={(e) => handleEditFormChange('total_amount', e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editFormData.hourly_rate}
                    onChange={(e) => handleEditFormChange('hourly_rate', e.target.value)}
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editFormData.estimated_hours}
                    onChange={(e) => handleEditFormChange('estimated_hours', e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Delivery Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery (days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={editFormData.estimated_delivery}
                onChange={(e) => handleEditFormChange('estimated_delivery', e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Preview of calculated total for hourly bids */}
            {editingBid.bid_type === 'hourly' && editFormData.hourly_rate && editFormData.estimated_hours && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Estimated Total: </strong>
                  {formatCurrency(parseFloat(editFormData.hourly_rate) * parseInt(editFormData.estimated_hours))}
                  <span className="text-blue-600"> ({editFormData.estimated_hours} hours × ${editFormData.hourly_rate}/hr)</span>
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can only edit pending proposals. Once a proposal is accepted, rejected, or withdrawn, it cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBid}
                disabled={
                  !editFormData.proposal.trim() ||
                  !editFormData.estimated_delivery ||
                  (editingBid.bid_type === 'fixed' && !editFormData.total_amount) ||
                  (editingBid.bid_type === 'hourly' && (!editFormData.hourly_rate || !editFormData.estimated_hours)) ||
                  actionLoading[editingBid.id] === 'updating'
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading[editingBid.id] === 'updating' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Proposal'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BidDetailsModal = () => {
    if (!showBidDetails || !selectedBid) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Proposal Details #{selectedBid.id.slice(-8)}
              </h2>
              <button
                onClick={() => setShowBidDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBid.status)}`}>
                    {getStatusIcon(selectedBid.status)}
                    {selectedBid.status.charAt(0).toUpperCase() + selectedBid.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-gray-900">{formatDate(selectedBid.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Views</label>
                <p className="mt-1 text-gray-900">{selectedBid.views_count || 0}</p>
              </div>
            </div>

            {/* Bid Amount and Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Bid Amount</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedBid.bid_type === 'hourly' 
                    ? `${formatCurrency(selectedBid.hourly_rate)}/hr` 
                    : formatCurrency(selectedBid.total_amount)
                  }
                </p>
                {selectedBid.bid_type === 'hourly' && (
                  <p className="text-sm text-gray-500">
                    {selectedBid.estimated_hours} hours estimated
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Delivery Time</label>
                <p className="mt-1 text-lg text-gray-900">{selectedBid.estimated_delivery} days</p>
              </div>
            </div>

            {/* Proposal */}
            <div>
              <label className="text-sm font-medium text-gray-700">Proposal</label>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedBid.proposal}</p>
              </div>
            </div>

            {/* Milestones */}
            {selectedBid.milestones && selectedBid.milestones.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Milestones</label>
                <div className="mt-2 space-y-2">
                  {selectedBid.milestones.map((milestone, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(milestone.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Feedback */}
            {selectedBid.client_feedback && (
              <div>
                <label className="text-sm font-medium text-gray-700">Client Feedback</label>
                <div className="mt-1 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-900">{selectedBid.client_feedback}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedBid.attachments && selectedBid.attachments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Attachments</label>
                <div className="mt-2 space-y-2">
                  {selectedBid.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{attachment.filename}</p>
                        <p className="text-sm text-gray-600">{attachment.description}</p>
                      </div>
                      <button
                        onClick={() => bidsApiService.downloadBidAttachment(selectedBid.id, attachment.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              {selectedBid.status === 'pending' && !selectedBid.is_expired && (
                <>
                  <button
                    onClick={() => {
                      setShowBidDetails(false);
                      handleEditBid(selectedBid);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Edit Proposal
                  </button>
                  <button
                    onClick={() => handleWithdrawBid(selectedBid.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    disabled={actionLoading[selectedBid.id] === 'withdrawing'}
                  >
                    {actionLoading[selectedBid.id] === 'withdrawing' ? 'Withdrawing...' : 'Withdraw Bid'}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Proposals</h1>
          <p className="text-gray-600 mt-2">Track and manage all your job proposals</p>
        </div>

        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_bids}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-500">
                  {dashboardData.pending_bids} pending
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.acceptance_rate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-500">
                  {dashboardData.accepted_bids} accepted
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Potential Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.total_potential_earnings)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-yellow-600" size={24} />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-500">
                  Avg: {formatCurrency(dashboardData.average_bid_amount)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.profile_views}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-500">
                  Response rate: {dashboardData.response_rate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="estimated_delivery-asc">Fastest Delivery</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bids List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your proposals...</p>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No proposals found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.status !== 'all' 
                  ? 'Try adjusting your filters to see more results'
                  : "You haven't submitted any proposals yet. Start browsing jobs to find opportunities!"
                }
              </p>
              {(!filters.search && filters.status === 'all') && (
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Browse Jobs
                </button>
              )}
            </div>
          ) : (
            bids.map((bid) => (
              <div key={bid.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Job Application #{bid.id.slice(-8)}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(bid.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {bid.estimated_delivery} days delivery
                      </span>
                      {bid.views_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {bid.views_count} views
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                      {getStatusIcon(bid.status)}
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>

                    <ActionDropdown bid={bid} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bid Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.bid_type === 'hourly' 
                        ? `${formatCurrency(bid.hourly_rate)}/hr` 
                        : formatCurrency(bid.total_amount)
                      }
                    </p>
                    {bid.bid_type === 'hourly' && (
                      <p className="text-sm text-gray-500">
                        {bid.estimated_hours} hours estimated
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Bid Type</p>
                    <p className="text-gray-900 capitalize">{bid.bid_type} Price</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Attachments</p>
                    <p className="text-gray-900">{bid.attachments_count || 0} files</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Proposal Preview</p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {bid.proposal.substring(0, 150)}...
                  </p>
                </div>

                {bid.milestones_count > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {bid.milestones_count} Milestones
                    </p>
                  </div>
                )}

                {bid.client_feedback && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Client Feedback</p>
                    <p className="text-sm text-gray-600">{bid.client_feedback}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {bid.expires_at && !bid.is_expired && (
                      <span>
                        Expires: {formatDate(bid.expires_at)}
                      </span>
                    )}
                    {bid.is_expired && (
                      <span className="text-red-600 font-medium">Expired</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {bid.status === 'pending' && !bid.is_expired && (
                      <button
                        onClick={() => handleWithdrawBid(bid.id)}
                        disabled={actionLoading[bid.id] === 'withdrawing'}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading[bid.id] === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleViewDetails(bid)}
                      disabled={actionLoading[bid.id] === 'loading'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading[bid.id] === 'loading' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          View Details
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {pagination.hasNext && (
          <div className="text-center mt-8">
            <button 
              onClick={() => loadBids(true)}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Proposals'}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <BidDetailsModal />
      <EditBidModal />
    </div>
  );
};

export default BidsDashboard;