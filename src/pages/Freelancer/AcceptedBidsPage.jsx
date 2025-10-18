// src/components/Freelancer/AcceptedBidsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  CheckCircle, Clock, DollarSign, User, Calendar, 
  AlertCircle, Download, ExternalLink, Lock, ArrowLeft, 
  Search, Star, TrendingUp, Package, FileText, Eye,
  Briefcase, Award, Target, Mail, Phone, XCircle
} from 'lucide-react';
import { bidsApiService } from '../../services/bidsApi';
import AuthContext from '../../context/AuthContext';
import { toast } from "sonner"
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL =  'https://kamcomuser.duckdns.org/api/bids';

const FreelancerAcceptedBidsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [acceptedBids, setAcceptedBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, payment_pending, payment_received
  const [paymentHistory, setPaymentHistory] = useState({});

  useEffect(() => {
    loadAcceptedBids();
  }, []);

  const loadAcceptedBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch all accepted bids for the freelancer
      const response = await axios.get(
        `${API_BASE_URL}/freelancer-accepted-bids/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const bids = response.data.results || response.data || [];
      setAcceptedBids(bids);

      // Load payment status for each bid
      const paymentStatuses = {};
      for (const bid of bids) {
        try {
          const payments = await axios.get(
            `${API_BASE_URL}/${bid.id}/payments/`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          const completedPayment = payments.data.find(p => p.status === 'completed');
          paymentStatuses[bid.id] = completedPayment || null;
        } catch (err) {
          paymentStatuses[bid.id] = null;
        }
      }
      
      setPaymentHistory(paymentStatuses);
      
    } catch (error) {
      console.error('Error loading accepted bids:', error);
      toast.error('Failed to load accepted bids');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bid) => {
    setSelectedBid(bid);
    setShowDetailsModal(true);
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

  const getPaymentStatus = (bid) => {
    const payment = paymentHistory[bid.id];
    if (payment) {
      return 'payment_received';
    }
    return 'payment_pending';
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBids = acceptedBids.filter(bid => {
    const matchesSearch = bid.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const paymentStatus = getPaymentStatus(bid);
    const matchesFilter = filterStatus === 'all' || 
                         filterStatus === paymentStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: acceptedBids.length,
    pending: acceptedBids.filter(bid => !paymentHistory[bid.id]).length,
    received: acceptedBids.filter(bid => paymentHistory[bid.id]).length,
    totalEarnings: acceptedBids
      .filter(bid => paymentHistory[bid.id])
      .reduce((sum, bid) => sum + (bid.total_amount || 0), 0),
    potentialEarnings: acceptedBids
      .filter(bid => !paymentHistory[bid.id])
      .reduce((sum, bid) => sum + (bid.total_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your accepted bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/freelancer/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Accepted Bids</h1>
              <p className="text-gray-600 mt-2">Track your accepted projects and payment status</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {acceptedBids.length > 0 ? ((stats.received / stats.total) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Received</p>
                <p className="text-2xl font-bold text-green-600">{stats.received}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Pending: {formatCurrency(stats.potentialEarnings)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">Payment Information</p>
              <p className="text-sm text-blue-800">
                Once the client makes the payment, you'll receive a notification and can start working on the project. 
                Payments typically reflect within 24-48 hours of completion.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="payment_received">Payment Received</option>
            </select>
          </div>
        </div>

        {/* Bids List */}
        <div className="space-y-4">
          {filteredBids.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No accepted bids found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Submit proposals to get your first accepted bid'
                }
              </p>
              <button
                onClick={() => navigate('/jobs')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            filteredBids.map((bid) => {
              const payment = paymentHistory[bid.id];
              const isPaid = !!payment;
              const daysAgo = getDaysAgo(bid.accepted_at || bid.created_at);

              return (
                <div
                  key={bid.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {bid.job_title || 'Project'}
                        </h3>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                            <CheckCircle size={14} />
                            Payment Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                            <Clock size={14} />
                            Awaiting Payment
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          <span>Client: {bid.client_name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Accepted {daysAgo} days ago</span>
                        </div>
                        {bid.estimated_delivery && (
                          <div className="flex items-center gap-1">
                            <Target size={16} />
                            <span>{bid.estimated_delivery} days delivery</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(bid.total_amount || bid.amount || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bid.bid_type === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
                      </p>
                      {isPaid && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle size={12} />
                            Paid on {formatDate(payment.completed_at || payment.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium capitalize">{bid.bid_type}</p>
                      </div>
                      {bid.bid_type === 'hourly' && (
                        <>
                          <div>
                            <p className="text-gray-600">Hourly Rate</p>
                            <p className="font-medium">{formatCurrency(bid.hourly_rate)}/hr</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estimated Hours</p>
                            <p className="font-medium">{bid.estimated_hours || 0} hours</p>
                          </div>
                        </>
                      )}
                      {bid.milestones_count > 0 && (
                        <div>
                          <p className="text-gray-600">Milestones</p>
                          <p className="font-medium">{bid.milestones_count} planned</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {isPaid && payment && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 mb-2">Payment Received Successfully</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-green-700 font-medium">Receipt:</span>
                              <p className="text-green-800">{payment.receipt_number}</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Amount:</span>
                              <p className="text-green-800 font-semibold">{formatCurrency(payment.amount)}</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Payment Date:</span>
                              <p className="text-green-800">{formatDate(payment.completed_at || payment.created_at)}</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Method:</span>
                              <p className="text-green-800 capitalize">{payment.payment_method || 'Razorpay'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Awaiting Payment */}
                  {!isPaid && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-900 mb-1">Awaiting Client Payment</p>
                          <p className="text-sm text-orange-800">
                            The client has accepted your bid. Once they complete the payment, you'll be notified and can start working on the project.
                          </p>
                          {daysAgo > 3 && (
                            <div className="mt-2 flex items-center gap-2">
                              <AlertCircle size={14} className="text-orange-600" />
                              <p className="text-xs text-orange-700">
                                Payment pending for {daysAgo} days. Consider following up with the client.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proposal Preview */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Proposal</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{bid.proposal}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      {isPaid && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award size={16} className="text-yellow-500" />
                          <span>Ready to start work</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/jobs/${bid.job_id}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ExternalLink size={16} />
                        View Job
                      </button>
                      
                      {isPaid && (
                        <button
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Download size={16} />
                          Receipt
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleViewDetails(bid)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedBid.job_title}</h3>
                  <p className="text-sm text-gray-600 mt-1">Bid Details & Payment Information</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Payment Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Status</h4>
                {paymentHistory[selectedBid.id] ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <p className="font-medium text-green-900">Payment Received</p>
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>Receipt: {paymentHistory[selectedBid.id].receipt_number}</p>
                      <p>Amount: {formatCurrency(paymentHistory[selectedBid.id].amount)}</p>
                      <p>Date: {formatDate(paymentHistory[selectedBid.id].completed_at)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={20} className="text-orange-600" />
                      <p className="font-medium text-orange-900">Awaiting Payment</p>
                    </div>
                    <p className="text-sm text-orange-800">
                      The client needs to complete the payment before you can start working.
                    </p>
                  </div>
                )}
              </div>

              {/* Bid Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Bid Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Bid Amount</p>
                    <p className="font-semibold text-lg">{formatCurrency(selectedBid.total_amount)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Bid Type</p>
                    <p className="font-semibold capitalize">{selectedBid.bid_type}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Delivery Time</p>
                    <p className="font-semibold">{selectedBid.estimated_delivery} days</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Accepted Date</p>
                    <p className="font-semibold">{formatDate(selectedBid.accepted_at || selectedBid.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Full Proposal */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Your Proposal</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBid.proposal}</p>
                </div>
              </div>

              {/* Milestones */}
              {selectedBid.milestones_count > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Milestones ({selectedBid.milestones_count})
                  </h4>
                  <p className="text-sm text-gray-600">
                    You proposed {selectedBid.milestones_count} milestones for this project.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`/jobs/${selectedBid.job_id}`, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  View Job Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerAcceptedBidsPage;