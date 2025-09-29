// src/context/BidsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { bidsApiService } from '../services/bidsApi';

const BidsContext = createContext();

export const useBids = () => {
  const context = useContext(BidsContext);
  if (!context) {
    throw new Error('useBids must be used within a BidsProvider');
  }
  return context;
};

export const BidsProvider = ({ children }) => {
  const [bids, setBids] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load freelancer bids
  const loadFreelancerBids = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidsApiService.getFreelancerBids(params);
      setBids(response.results || response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load freelancer dashboard
  const loadFreelancerDashboard = async () => {
    try {
      const data = await bidsApiService.getFreelancerDashboard();
      setDashboardData(data);
      return data;
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      throw err;
    }
  };

  // Create a new bid
  const createBid = async (bidData) => {
    try {
      setError(null);
      const newBid = await bidsApiService.createBid(bidData);
      
      // Add to local state
      setBids(prev => [newBid, ...prev]);
      
      // Update dashboard data
      if (dashboardData) {
        setDashboardData(prev => ({
          ...prev,
          total_bids: prev.total_bids + 1,
          pending_bids: prev.pending_bids + 1,
          total_potential_earnings: prev.total_potential_earnings + (newBid.total_amount || 0)
        }));
      }
      
      return newBid;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update bid
  const updateBid = async (bidId, bidData) => {
    try {
      setError(null);
      const updatedBid = await bidsApiService.updateBid(bidId, bidData);
      
      // Update local state
      setBids(prev => prev.map(bid => 
        bid.id === bidId ? { ...bid, ...updatedBid } : bid
      ));
      
      return updatedBid;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Withdraw bid
  const withdrawBid = async (bidId) => {
    try {
      setError(null);
      await bidsApiService.withdrawBid(bidId);
      
      // Update local state
      setBids(prev => prev.map(bid => 
        bid.id === bidId ? { ...bid, status: 'withdrawn' } : bid
      ));
      
      // Update dashboard data
      if (dashboardData) {
        setDashboardData(prev => ({
          ...prev,
          pending_bids: Math.max(0, prev.pending_bids - 1)
        }));
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Upload bid attachment
  const uploadBidAttachment = async (bidId, formData) => {
    try {
      setError(null);
      const attachment = await bidsApiService.uploadBidAttachment(bidId, formData);
      
      // Update local state to increment attachments count
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, attachments_count: (bid.attachments_count || 0) + 1 }
          : bid
      ));
      
      return attachment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete bid attachment
  const deleteBidAttachment = async (bidId, attachmentId) => {
    try {
      setError(null);
      await bidsApiService.deleteBidAttachment(bidId, attachmentId);
      
      // Update local state to decrement attachments count
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, attachments_count: Math.max(0, (bid.attachments_count || 0) - 1) }
          : bid
      ));
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get job bids (for clients)
  const getJobBids = async (jobId, params = {}) => {
    try {
      setError(null);
      const response = await bidsApiService.getJobBids(jobId, params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get job bid summary
  const getJobBidSummary = async (jobId) => {
    try {
      setError(null);
      const summary = await bidsApiService.getJobBidSummary(jobId);
      return summary;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update bid status (for clients)
  const updateBidStatus = async (bidId, statusData) => {
    try {
      setError(null);
      const result = await bidsApiService.updateBidStatus(bidId, statusData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get client dashboard
  const getClientDashboard = async () => {
    try {
      setError(null);
      const dashboard = await bidsApiService.getClientDashboard();
      return dashboard;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get bid details
  const getBidDetails = async (bidId) => {
    try {
      setError(null);
      const bid = await bidsApiService.getBidDetails(bidId);
      return bid;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get bid statistics
  const getBidStatistics = async () => {
    try {
      setError(null);
      const stats = await bidsApiService.getBidStatistics();
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear errors
  const clearError = () => {
    setError(null);
  };

  // Clear all data (for logout)
  const clearBidsData = () => {
    setBids([]);
    setDashboardData(null);
    setError(null);
  };

  const value = {
    // State
    bids,
    dashboardData,
    loading,
    error,

    // Freelancer actions
    loadFreelancerBids,
    loadFreelancerDashboard,
    createBid,
    updateBid,
    withdrawBid,
    uploadBidAttachment,
    deleteBidAttachment,

    // Client actions
    getJobBids,
    getJobBidSummary,
    updateBidStatus,
    getClientDashboard,

    // Common actions
    getBidDetails,
    getBidStatistics,

    // Utility
    clearError,
    clearBidsData,
  };

  return (
    <BidsContext.Provider value={value}>
      {children}
    </BidsContext.Provider>
  );
};

export default BidsProvider;