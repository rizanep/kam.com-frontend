// src/services/paymentApi.js

import axios from 'axios';
import { toast } from "sonner"

const API_BASE_URL =  'https://kamcomuser.duckdns.org/api/bids';

class PaymentApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a payment order for a bid
   * @param {string} bidId - UUID of the bid
   * @returns {Promise} Payment order details
   */
  async createPaymentOrder(bidId) {
    try {
      const response = await this.client.post('/payments/create-order/', {
        bid_id: bidId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Verify payment with Razorpay response
   * @param {Object} paymentData - Payment verification data
   * @returns {Promise} Verification result
   */
  async verifyPayment(paymentData) {
    try {
      const response = await this.client.post('/payments/verify/', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get payment details by ID
   * @param {string} paymentId - UUID of the payment
   * @returns {Promise} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  /**
   * Get all payments for a bid
   * @param {string} bidId - UUID of the bid
   * @returns {Promise} List of payments
   */
  async getBidPayments(bidId) {
    try {
      const response = await this.client.get(`/bids/${bidId}/payments/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bid payments:', error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay payment
   * @param {Object} orderData - Order data from backend
   * @param {Object} options - Additional Razorpay options
   * @returns {Promise} Payment result
   */
  initializeRazorpayPayment(orderData, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay === 'undefined') {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const razorpayOptions = {
        key: orderData.razorpay_key,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: options.name || 'FreelanceHub',
        description: options.description || 'Payment for project',
        image: options.image || '/logo.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: orderData.payment_id,
            };

            const verificationResult = await paymentApiService.verifyPayment(verifyData);
            resolve(verificationResult);
          } catch (error) {
            reject(error);
          }
        },
        prefill: options.prefill || {},
        notes: options.notes || {},
        theme: {
          color: options.themeColor || '#2563eb',
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.on('payment.failed', function (response) {
        reject(new Error(response.error.description));
      });

      razorpay.open();
    });
  }

  /**
   * Complete payment flow (create order + initialize payment)
   * @param {string} bidId - UUID of the bid
   * @param {Object} jobData - Job information for display
   * @param {Object} userData - User information for prefill
   * @returns {Promise} Payment result
   */
  async processPayment(bidId, jobData = {}, userData = {}) {
    try {
      // Step 1: Create payment order
      const orderData = await this.createPaymentOrder(bidId);

      if (!orderData.success) {
        throw new Error('Failed to create payment order');
      }

      // Step 2: Initialize Razorpay payment
      const paymentOptions = {
        name: 'FreelanceHub',
        description: `Payment for ${jobData.title || 'project'}`,
        prefill: {
          name: userData.username || userData.name || '',
          email: userData.email || '',
          contact: userData.phone || '',
        },
        notes: {
          job_id: jobData.id,
          bid_id: bidId,
        },
      };

      const result = await this.initializeRazorpayPayment(orderData, paymentOptions);
      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Load Razorpay script dynamically
   * @returns {Promise} Script load result
   */
  loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        resolve(true);
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        reject(new Error('Failed to load Razorpay SDK'));
      };

      document.body.appendChild(script);
    });
  }

  /**
   * Download payment receipt
   * @param {string} paymentId - UUID of the payment
   */
  async downloadReceipt(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}/receipt/`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  }
}

// Create singleton instance
const paymentApiService = new PaymentApiService();

export default paymentApiService;


// ============= USAGE EXAMPLES =============

/*
// Example 1: Simple payment processing in component
import paymentApiService from '../services/paymentApi';

const handlePayment = async () => {
  try {
    // Load Razorpay script first
    await paymentApiService.loadRazorpayScript();
    
    // Process payment
    const result = await paymentApiService.processPayment(
      bidId,
      { id: jobId, title: 'Web Development Project' },
      { username: 'John Doe', email: 'john@example.com' }
    );
    
    if (result.success) {
      toast.success('Payment completed successfully!');
      // Update UI, reload data, etc.
    }
  } catch (error) {
    toast.error(error.message || 'Payment failed');
  }
};

// Example 2: Manual flow with more control
const handleManualPayment = async () => {
  try {
    // Create order
    const orderData = await paymentApiService.createPaymentOrder(bidId);
    
    // Initialize payment with custom options
    const result = await paymentApiService.initializeRazorpayPayment(orderData, {
      name: 'Custom Name',
      description: 'Custom Description',
      prefill: {
        name: 'John Doe',
        email: 'john@example.com',
        contact: '9999999999'
      },
      themeColor: '#FF5733'
    });
    
    console.log('Payment result:', result);
  } catch (error) {
    console.error('Payment error:', error);
  }
};

// Example 3: Get payment history
const getPaymentHistory = async (bidId) => {
  try {
    const payments = await paymentApiService.getBidPayments(bidId);
    console.log('Payment history:', payments);
    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
  }
};

// Example 4: Download receipt
const downloadPaymentReceipt = async (paymentId) => {
  try {
    await paymentApiService.downloadReceipt(paymentId);
    toast.success('Receipt downloaded successfully');
  } catch (error) {
    toast.error('Failed to download receipt');
  }
};
*/


// ============= REACT HOOK FOR PAYMENTS =============

/*
// src/hooks/usePayment.js
import { useState, useCallback } from 'react';
import paymentApiService from '../services/paymentApi';
import { toast } from "sonner"

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const processPayment = useCallback(async (bidId, jobData, userData) => {
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      await paymentApiService.loadRazorpayScript();

      // Process payment
      const result = await paymentApiService.processPayment(bidId, jobData, userData);
      
      setPaymentData(result);
      toast.success('Payment completed successfully!');
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentDetails = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);

    try {
      const details = await paymentApiService.getPaymentDetails(paymentId);
      setPaymentData(details);
      return details;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBidPayments = useCallback(async (bidId) => {
    setLoading(true);
    setError(null);

    try {
      const payments = await paymentApiService.getBidPayments(bidId);
      return payments;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    paymentData,
    processPayment,
    getPaymentDetails,
    getBidPayments,
  };
};

// Usage in component:
const MyComponent = () => {
  const { loading, error, processPayment } = usePayment();

  const handlePay = async () => {
    try {
      await processPayment(bidId, jobData, userData);
      // Payment successful
    } catch (error) {
      // Payment failed
    }
  };

  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};
*/