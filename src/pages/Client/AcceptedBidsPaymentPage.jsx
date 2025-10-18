// src/components/Client/AcceptedBidsPaymentPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  CreditCard, CheckCircle, Clock, DollarSign, User,
  Calendar, FileText, AlertCircle, Download, ExternalLink,
  Lock, ArrowLeft, Search, Filter, Star, Zap, XCircle
} from 'lucide-react';
import { bidsApiService } from '../../services/bidsApi';
import AuthContext from '../../context/AuthContext';
import { toast } from "sonner"
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL =  'https://kamcomuser.duckdns.org/api/bids';

const AcceptedBidsPaymentPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [acceptedBids, setAcceptedBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending_payment, payment_completed
  const [paymentHistory, setPaymentHistory] = useState({});

  useEffect(() => {
    loadAcceptedBids();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  const loadAcceptedBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch all accepted bids for the client
      const response = await axios.get(
        `${API_BASE_URL}/client-accepted-bids/`,
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

  const handlePayment = async (bid) => {
    setSelectedBid(bid);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('access_token');

      if (!token) {
        toast.error('Please log in to make payment');
        return;
      }

      // Create payment order
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payments/create-order/`,
        { bid_id: selectedBid.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      const { order_id, amount, currency, razorpay_key, payment_id } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: razorpay_key,
        amount: Math.round(amount * 100),
        currency: currency,
        name: 'FreelanceHub',
        description: `Payment for ${selectedBid.job_title || 'project'}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/payments/verify/`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                payment_id: payment_id
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (verifyResponse.data.success) {
              toast.success('Payment completed successfully!');
              setShowPaymentModal(false);
              setProcessingPayment(false);
              loadAcceptedBids(); // Reload to update payment status
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.username || user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessingPayment(false);
      });
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
      setProcessingPayment(false);
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

  const getPaymentStatus = (bid) => {
    const payment = paymentHistory[bid.id];
    if (payment) {
      return 'payment_completed';
    }
    return 'pending_payment';
  };

  const filteredBids = acceptedBids.filter(bid => {
    const matchesSearch = bid.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.freelancer_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.freelancer_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const paymentStatus = getPaymentStatus(bid);
    const matchesFilter = filterStatus === 'all' || 
                         filterStatus === paymentStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: acceptedBids.length,
    pending: acceptedBids.filter(bid => !paymentHistory[bid.id]).length,
    completed: acceptedBids.filter(bid => paymentHistory[bid.id]).length,
    totalAmount: acceptedBids.reduce((sum, bid) => sum + (bid.total_amount || 0), 0),
    paidAmount: acceptedBids
      .filter(bid => paymentHistory[bid.id])
      .reduce((sum, bid) => sum + (bid.total_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accepted bids...</p>
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
            onClick={() => navigate('/client/proposals')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Proposals
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accepted Bids & Payments</h1>
              <p className="text-gray-600 mt-2">Manage payments for your accepted proposals</p>
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
                <CheckCircle size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payment</p>
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
                <p className="text-sm text-gray-600">Payment Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CreditCard size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Paid: {formatCurrency(stats.paidAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-purple-600" />
              </div>
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
                  placeholder="Search by project or freelancer..."
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
              <option value="pending_payment">Pending Payment</option>
              <option value="payment_completed">Payment Completed</option>
            </select>
          </div>
        </div>

        {/* Bids List */}
        <div className="space-y-4">
          {filteredBids.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No accepted bids found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Accept some proposals to see them here'
                }
              </p>
              <button
                onClick={() => navigate('/client/bids')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Proposals
              </button>
            </div>
          ) : (
            filteredBids.map((bid) => {
              const payment = paymentHistory[bid.id];
              const isPaid = !!payment;

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
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            <CheckCircle size={14} />
                            Payment Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                            <Clock size={14} />
                            Pending Payment
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          <span>
                            {bid.freelancer_profile?.first_name} {bid.freelancer_profile?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Accepted: {formatDate(bid.accepted_at || bid.created_at)}</span>
                        </div>
                        {bid.freelancer_profile?.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-400 fill-current" />
                            <span>{bid.freelancer_profile.average_rating.toFixed(1)}</span>
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
                    </div>
                  </div>

                  {bid.bid_type === 'hourly' && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Rate</p>
                          <p className="font-medium">{formatCurrency(bid.hourly_rate)}/hr</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Estimated Hours</p>
                          <p className="font-medium">{bid.estimated_hours || 0} hours</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Delivery</p>
                          <p className="font-medium">{bid.estimated_delivery} days</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isPaid && payment && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 mb-1">Payment Successful</p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                            <div>
                              <span className="text-green-600">Receipt:</span> {payment.receipt_number}
                            </div>
                            <div>
                              <span className="text-green-600">Date:</span> {formatDate(payment.completed_at || payment.created_at)}
                            </div>
                            <div>
                              <span className="text-green-600">Amount:</span> {formatCurrency(payment.amount)}
                            </div>
                            <div>
                              <span className="text-green-600">Method:</span> {payment.payment_method || 'Razorpay'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
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
                          Download Receipt
                        </button>
                      )}
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => handlePayment(bid)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <CreditCard size={16} />
                        Make Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBid && (
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
            
            <div className="p-6">
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(selectedBid.total_amount || selectedBid.amount || 0)}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Project:</span>
                    <span className="font-medium">{selectedBid.job_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">
                      {selectedBid.bid_type === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
                    </span>
                  </div>
                  {selectedBid.bid_type === 'hourly' && (
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedBid.hourly_rate)}/hr × {selectedBid.estimated_hours || 0} hours
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-medium">{selectedBid.estimated_delivery} days</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-2">Test Card Details:</p>
                <div className="space-y-1 text-xs text-gray-700">
                  <p>Card: 4111 1111 1111 1111</p>
                  <p>CVV: Any 3 digits | Expiry: Any future date</p>
                  <p>UPI: success@razorpay</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2 text-sm text-green-800">
                  <Lock size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-xs">
                      Your payment is secured by Razorpay with industry-standard encryption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Pay Now {formatCurrency(selectedBid.total_amount || selectedBid.amount || 0)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedBidsPaymentPage;