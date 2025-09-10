import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  X,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const MembershipDashboard = () => {
  const [membership, setMembership] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      console.log('🔍 Fetching membership data...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        toast.error('Please log in to view your membership');
        setLoading(false);
        return;
      }
      
      const response = await api.get('/membership/my-membership');
      
      console.log('📋 API Response:', response);
      
      if (response?.success) {
        setMembership(response.membership);
        setAnalytics(response.analytics);
        console.log('✅ Membership data loaded successfully');
      } else if (response?.success === false) {
        console.error('❌ API returned unsuccessful response:', response);
        toast.error(response.message || 'Failed to load membership data');
      } else {
        console.error('❌ Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error fetching membership data:', error);
      
      // Check different error types
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
      } else if (error.message.includes('404')) {
        toast.error('Membership service not found. Please contact support.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Unable to connect to server. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to load membership data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMembership = async (immediate = false) => {
    const confirmText = immediate 
      ? 'Are you sure you want to cancel your membership immediately? You will lose access to all benefits right away and no refund will be provided.'
      : 'Are you sure you want to cancel your membership? It will remain active until the end of your current billing period.';

    if (!window.confirm(confirmText)) {
      return;
    }

    setCancelLoading(true);
    try {
      console.log('🔍 Cancelling membership, immediate:', immediate);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to cancel your membership');
        setCancelLoading(false);
        return;
      }
      
      const response = await api.put('/membership/cancel', { immediate });
      
      console.log('📋 Cancel API Response:', response);
      
      if (response?.success) {
        const message = immediate 
          ? 'Membership cancelled immediately - access ended' 
          : 'Auto-renewal stopped - access continues until end of period';
        toast.success(message);
        setShowCancelModal(false);
        fetchMembershipData(); // Refresh data
        console.log('✅ Membership cancelled successfully');
      } else if (response?.success === false) {
        console.error('❌ API returned unsuccessful response:', response);
        toast.error(response.message || 'Failed to cancel membership');
      } else {
        console.error('❌ Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Cancellation failed:', error);
      
      // Check different error types
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
      } else if (error.message.includes('404')) {
        toast.error('Cancellation service not found. Please contact support.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Unable to connect to server. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to cancel membership');
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateMembership = async () => {
    if (!window.confirm('Are you sure you want to reactivate your membership?')) {
      return;
    }

    try {
      console.log('🔍 Reactivating membership...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to reactivate your membership');
        return;
      }
      
      const response = await api.put('/membership/reactivate');
      
      console.log('📋 Reactivate API Response:', response);
      
      if (response?.success) {
        toast.success('Membership reactivated successfully!');
        setShowCancelModal(false);
        fetchMembershipData(); // Refresh data
        console.log('✅ Membership reactivated successfully');
      } else if (response?.success === false) {
        console.error('❌ API returned unsuccessful response:', response);
        toast.error(response.message || 'Failed to reactivate membership');
      } else {
        console.error('❌ Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Reactivation failed:', error);
      
      // Check different error types
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
      } else if (error.message.includes('404')) {
        toast.error('Reactivation service not found. Please contact support.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Unable to connect to server. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to reactivate membership');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Membership</h3>
          <p className="text-gray-600 mb-6">
            Subscribe to a membership plan to enjoy priority service, discounts, and exclusive benefits.
          </p>
          <button
            onClick={() => window.location.href = '/membership/plans'}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            View Membership Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Membership Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{analytics.tier}</h2>
              <p className="text-gray-600">
                {analytics.billingCycle} billing • Next payment: {new Date(analytics.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              membership.cancelledAt && !membership.autoRenew
                ? 'bg-orange-100 text-orange-800' // Cancelled but still active
                : membership.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800'
                : membership.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : membership.status === 'PENDING'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {membership.cancelledAt && !membership.autoRenew ? (
                <AlertTriangle className="h-4 w-4 mr-1" />
              ) : membership.status === 'ACTIVE' ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : membership.status === 'CANCELLED' ? (
                <X className="h-4 w-4 mr-1" />
              ) : (
                <Clock className="h-4 w-4 mr-1" />
              )}
              {membership.cancelledAt && !membership.autoRenew 
                ? 'Cancelled (Active until expiry)'
                : membership.status === 'ACTIVE' 
                ? 'Active'
                : membership.status
              }
            </div>
            {membership.cancelledAt && !membership.autoRenew && (
              <p className="text-sm text-orange-600 mt-1">
                Access until {new Date(membership.willExpireAt || membership.endDate).toLocaleDateString()}
              </p>
            )}
            {membership.cancelledAt && !membership.autoRenew && (
              <p className="text-xs text-green-600 mt-1">
                ✓ No more charges will be taken
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Service Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.usage.serviceRequests.used}
                <span className="text-base font-normal text-gray-500">
                  /{analytics.usage.serviceRequests.limit}
                </span>
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Usage this month</span>
              <span>{analytics.usage.serviceRequests.remaining} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${analytics.usage.serviceRequests.limit === 'Unlimited' 
                    ? 50 
                    : (analytics.usage.serviceRequests.used / parseInt(analytics.usage.serviceRequests.limit)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Savings This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${analytics.usage.materialDiscount.totalSaved.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {analytics.usage.materialDiscount.percentage}% discount on materials
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.benefits.responseTime}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Guaranteed response</p>
        </motion.div>
      </div>

      {/* Benefits Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm p-6 mb-8"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Membership Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                analytics.benefits.prioritySupport ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Priority Support</span>
            </div>
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                analytics.benefits.emergencyService ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Emergency Service</span>
            </div>
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                analytics.benefits.dedicatedManager ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Dedicated Account Manager</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Material Discount</span>
              <span className="font-medium">{analytics.usage.materialDiscount.percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Annual Inspections</span>
              <span className="font-medium">{analytics.usage.inspections.available}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Response Time</span>
              <span className="font-medium">{analytics.benefits.responseTime}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Your Membership</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => window.location.href = '/membership/plans'}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Change Plan
          </button>
          
          <button
            onClick={() => window.location.href = '/jobs/create'}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Service
          </button>
          
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            {membership.cancelledAt && !membership.autoRenew ? 'Manage Cancellation' : 'Cancel Membership'}
          </button>
        </div>
      </motion.div>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {membership.cancelledAt && !membership.autoRenew ? 'Manage Cancellation' : 'Cancel Membership'}
                </h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {membership.cancelledAt && !membership.autoRenew ? (
                <div>
                  <div className="flex items-center mb-4 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-sm text-orange-800 font-medium">
                        Recurring billing has been cancelled
                      </p>
                      <p className="text-xs text-orange-600">
                        Access until {new Date(membership.willExpireAt || membership.endDate).toLocaleDateString()} • No more charges
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleReactivateMembership}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Reactivate Auto-Renewal
                    </button>
                    
                    <button
                      onClick={() => handleCancelMembership(true)}
                      disabled={cancelLoading}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? 'Processing...' : 'End Access Immediately'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-gray-600 mb-4">
                      Choose how you'd like to handle your membership:
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleCancelMembership(false)}
                        disabled={cancelLoading}
                        className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium text-gray-900">Stop Auto-Renewal</div>
                        <div className="text-sm text-gray-600">
                          Keep access until {membership.nextBillingDate && new Date(membership.nextBillingDate).toLocaleDateString()} • No more charges
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleCancelMembership(true)}
                        disabled={cancelLoading}
                        className="w-full text-left p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium text-red-900">End Access Immediately</div>
                        <div className="text-sm text-red-600">
                          Lose access right away (no refund)
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {cancelLoading && (
                    <div className="text-center py-2">
                      <div className="inline-block w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-gray-600">Processing cancellation...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembershipDashboard;