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
        
        // Clear cache and refresh data
        import('../../utils/globalCache').then(module => {
          const { cachedApi } = module;
          const token = localStorage.getItem('token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            cachedApi.invalidateMembershipCache(payload.id);
          }
        });
        
        fetchMembershipData(); // Refresh data
        console.log('✅ Membership cancelled successfully, cache invalidated');
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
      <div className="flex items-center justify-center py-12 pt-28">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pt-28">
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

  // Create fallback analytics data from membership if analytics is null
  const effectiveAnalytics = analytics || {
    tier: membership.tier?.displayName || 'Unknown Plan',
    billingCycle: membership.billingCycle || 'MONTHLY',
    nextBillingDate: membership.nextBillingDate || membership.endDate,
    usage: {
      serviceRequests: {
        used: membership.currentUsage?.serviceRequestsUsed || 0,
        limit: membership.tier?.features?.serviceRequestsPerMonth || 'Unlimited',
        remaining: membership.tier?.features?.serviceRequestsPerMonth 
          ? Math.max(0, membership.tier.features.serviceRequestsPerMonth - (membership.currentUsage?.serviceRequestsUsed || 0))
          : 'Unlimited'
      },
      materialDiscount: {
        totalSaved: 0,
        percentage: membership.tier?.features?.materialDiscountPercent || 0
      },
      inspections: {
        available: membership.tier?.features?.annualInspections || 0
      }
    },
    benefits: {
      responseTime: membership.tier?.features?.responseTimeHours ? `${membership.tier.features.responseTimeHours} hours` : 'Standard',
      prioritySupport: membership.tier?.features?.prioritySupport || false,
      emergencyService: membership.tier?.features?.emergencyService || false,
      dedicatedManager: membership.tier?.features?.dedicatedManager || false
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-28">
      {/* Page Title with Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              Membership Dashboard
              <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                membership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                membership.status === 'CANCELLED' && membership.hasActiveAccess ? 'bg-orange-100 text-orange-800' :
                membership.status === 'CANCELLED' && !membership.hasActiveAccess ? 'bg-red-100 text-red-800' :
                membership.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                membership.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {membership.status === 'ACTIVE' && <CheckCircle className="h-4 w-4 mr-1" />}
                {membership.status === 'CANCELLED' && membership.hasActiveAccess && <AlertTriangle className="h-4 w-4 mr-1" />}
                {((membership.status === 'CANCELLED' && !membership.hasActiveAccess) || membership.status === 'EXPIRED') && <X className="h-4 w-4 mr-1" />}
                {membership.status === 'PENDING' && <Clock className="h-4 w-4 mr-1" />}
                {membership.status}
              </span>
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your subscription and view usage statistics
            </p>
          </div>
        </div>
      </motion.div>

      {/* Membership Status Alert - Prominent Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* ACTIVE Status */}
        {membership.status === 'ACTIVE' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900">Membership Active</h3>
                <p className="text-green-700 text-sm">
                  Your {effectiveAnalytics.tier} plan is active and ready to use. Next billing: {new Date(effectiveAnalytics.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CANCELLED Status with Access */}
        {membership.status === 'CANCELLED' && membership.hasActiveAccess && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900">Membership Cancelled</h3>
                <p className="text-orange-700 text-sm">
                  Your subscription has been cancelled but you still have access until {new Date(membership.endDate).toLocaleDateString()}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  ✓ No more charges will be taken • You can reactivate anytime before expiration
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  CANCELLED
                </span>
                <p className="text-xs text-orange-600 mt-1">
                  Access until {new Date(membership.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CANCELLED Status without Access (Expired) */}
        {membership.status === 'CANCELLED' && !membership.hasActiveAccess && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="h-6 w-6 text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">Membership Expired</h3>
                <p className="text-red-700 text-sm">
                  Your membership was cancelled and expired on {new Date(membership.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Subscribe to a new plan to restore access to membership benefits
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <X className="h-4 w-4 mr-1" />
                  EXPIRED
                </span>
                <p className="text-xs text-red-600 mt-1">
                  Expired {new Date(membership.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EXPIRED Status */}
        {membership.status === 'EXPIRED' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="h-6 w-6 text-gray-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Membership Expired</h3>
                <p className="text-gray-700 text-sm">
                  Your membership expired on {new Date(membership.endDate || membership.expiredAt).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Subscribe to a new plan to restore access to membership benefits
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  <X className="h-4 w-4 mr-1" />
                  EXPIRED
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Expired {new Date(membership.endDate || membership.expiredAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PENDING Status */}
        {membership.status === 'PENDING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900">Membership Pending</h3>
                <p className="text-blue-700 text-sm">
                  Your membership is being activated. This usually takes a few minutes.
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Contact support if this status persists for more than 30 minutes
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Clock className="h-4 w-4 mr-1" />
                  PENDING
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Membership Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{effectiveAnalytics.tier}</h2>
              <p className="text-gray-600">
                {effectiveAnalytics.billingCycle} billing • Next payment: {new Date(effectiveAnalytics.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              membership.status === 'CANCELLED' && membership.hasActiveAccess
                ? 'bg-orange-100 text-orange-800' // Cancelled but still has access
                : membership.status === 'CANCELLED' && !membership.hasActiveAccess
                ? 'bg-red-100 text-red-800' // Cancelled and expired
                : membership.status === 'EXPIRED'
                ? 'bg-gray-100 text-gray-800' // Expired
                : membership.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' // Active
                : membership.status === 'PENDING'
                ? 'bg-blue-100 text-blue-800' // Pending
                : 'bg-gray-100 text-gray-800' // Default
            }`}>
              {membership.status === 'CANCELLED' && membership.hasActiveAccess ? (
                <AlertTriangle className="h-4 w-4 mr-1" />
              ) : membership.status === 'CANCELLED' && !membership.hasActiveAccess ? (
                <X className="h-4 w-4 mr-1" />
              ) : membership.status === 'EXPIRED' ? (
                <X className="h-4 w-4 mr-1" />
              ) : membership.status === 'ACTIVE' ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <Clock className="h-4 w-4 mr-1" />
              )}
              {membership.accessStatus?.statusMessage || membership.status}
            </div>
            
            {/* Show cancellation info for cancelled memberships with access */}
            {membership.status === 'CANCELLED' && membership.hasActiveAccess && (
              <>
                <p className="text-sm text-orange-600 mt-1">
                  Access until {new Date(membership.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ✓ No more charges will be taken
                </p>
              </>
            )}
            
            {/* Show expiration info for cancelled memberships without access */}
            {membership.status === 'CANCELLED' && !membership.hasActiveAccess && (
              <p className="text-sm text-red-600 mt-1">
                Expired on {new Date(membership.endDate).toLocaleDateString()}
              </p>
            )}
            
            {/* Show expiration info for expired memberships */}
            {membership.status === 'EXPIRED' && (
              <p className="text-sm text-gray-600 mt-1">
                Expired on {new Date(membership.endDate || membership.expiredAt).toLocaleDateString()}
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
                {effectiveAnalytics.usage.serviceRequests.used}
                <span className="text-base font-normal text-gray-500">
                  /{effectiveAnalytics.usage.serviceRequests.limit}
                </span>
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Usage this month</span>
              <span>{effectiveAnalytics.usage.serviceRequests.remaining} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${effectiveAnalytics.usage.serviceRequests.limit === 'Unlimited' 
                    ? 50 
                    : (effectiveAnalytics.usage.serviceRequests.used / parseInt(effectiveAnalytics.usage.serviceRequests.limit)) * 100}%` 
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
                ${effectiveAnalytics.usage.materialDiscount.totalSaved.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {effectiveAnalytics.usage.materialDiscount.percentage}% discount on materials
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
                {effectiveAnalytics.benefits.responseTime}
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
                effectiveAnalytics.benefits.prioritySupport ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Priority Support</span>
            </div>
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                effectiveAnalytics.benefits.emergencyService ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Emergency Service</span>
            </div>
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                effectiveAnalytics.benefits.dedicatedManager ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span>Dedicated Account Manager</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Material Discount</span>
              <span className="font-medium">{effectiveAnalytics.usage.materialDiscount.percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Annual Inspections</span>
              <span className="font-medium">{effectiveAnalytics.usage.inspections.available}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Response Time</span>
              <span className="font-medium">{effectiveAnalytics.benefits.responseTime}</span>
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
                      Choose how you'd like to handle your membership cancellation:
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleCancelMembership(false)}
                        disabled={cancelLoading}
                        className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium text-gray-900">Cancel at Period End</div>
                        <div className="text-sm text-gray-600">
                          • Status changes to "CANCELLED" but you keep access until {membership.nextBillingDate && new Date(membership.nextBillingDate).toLocaleDateString()}<br/>
                          • No more charges will be taken<br/>
                          • After {membership.nextBillingDate && new Date(membership.nextBillingDate).toLocaleDateString()}, status changes to "EXPIRED" with no access
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleCancelMembership(true)}
                        disabled={cancelLoading}
                        className="w-full text-left p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium text-red-900">Cancel Immediately</div>
                        <div className="text-sm text-red-600">
                          • Status changes to "EXPIRED" and lose access right away<br/>
                          • No refund for remaining period
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