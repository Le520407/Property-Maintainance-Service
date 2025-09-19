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
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('MONTHLY');
  const [completingPayment, setCompletingPayment] = useState(false);

  useEffect(() => {
    fetchMembershipData();
    fetchAvailablePlans();
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      const response = await api.get('/membership/tiers');
      if (response?.success) {
        setAvailablePlans(response.tiers);
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
    }
  };

  const fetchMembershipData = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        toast.error('Please log in to view your membership');
        setLoading(false);
        return;
      }
      
      const response = await api.get('/membership/my-membership');
      
      if (response?.success) {
        setMembership(response.membership);
        setAnalytics(response.analytics);
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
    // Check if membership is already cancelled or expired
    if (membership.status === 'CANCELLED' || membership.status === 'EXPIRED') {
      if (membership.status === 'CANCELLED' && immediate) {
        // Allow immediate cancellation if status is CANCELLED but not yet EXPIRED
        // This is for users who cancelled auto-renewal but want to end access immediately
      } else {
        const errorMsg = membership.status === 'EXPIRED' 
          ? 'Membership has already expired' 
          : 'Membership is already cancelled';
        toast.error(errorMsg);
        setShowCancelModal(false);
        return;
      }
    }

    const confirmText = immediate 
      ? 'Are you sure you want to cancel your membership immediately? You will lose access to all benefits right away and no refund will be provided.'
      : 'Are you sure you want to cancel your membership? It will remain active until the end of your current billing period.';

    if (!window.confirm(confirmText)) {
      return;
    }

    setCancelLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to cancel your membership');
        setCancelLoading(false);
        return;
      }
      
      const response = await api.put('/membership/cancel', { immediate });
      
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
      } else if (response?.success === false) {
        console.error('❌ API returned unsuccessful response:', response);
        toast.error(response.message || 'Failed to cancel membership');
      } else {
        console.error('❌ Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Cancellation failed:', error);
      
      // Check different error types and specific error messages
      if (error.message.includes('Membership is already cancelled or inactive')) {
        toast.error('This membership is already cancelled or inactive');
        // Close modal and refresh data to show current status
        setShowCancelModal(false);
        fetchMembershipData();
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
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

  const handleChangePlan = async (newTier) => {
    if (!window.confirm(`Are you sure you want to change to the ${newTier.displayName} plan? You will be redirected to complete the payment, and after successful payment, your current plan will be cancelled and the new plan will start immediately.`)) {
      return;
    }

    setChangingPlan(true);
    try {
      // Create payment request for plan change
      const response = await api.post('/membership/change-plan-payment', {
        newTierId: newTier._id,
        billingCycle: selectedBillingCycle,
        immediate: true
      });

      if (response?.success && response?.paymentUrl) {
        // Redirect to HitPay payment page
        window.location.href = response.paymentUrl;
      } else {
        toast.error(response?.message || 'Failed to initiate payment for plan change');
      }
    } catch (error) {
      console.error('Plan change payment failed:', error);
      toast.error(error.message || 'Failed to initiate payment for plan change');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!membership || membership.status !== 'PENDING') {
      toast.error('No pending payment found');
      return;
    }

    setCompletingPayment(true);
    try {
      console.log('🔄 Attempting to complete payment for pending membership...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to complete your payment');
        setCompletingPayment(false);
        return;
      }

      // Call API to retry payment for the pending membership
      const response = await api.post('/membership/retry-payment', {});

      console.log('📋 Retry Payment API Response:', response);

      if (response?.success) {
        const redirectUrl = response.paymentUrl || response.checkoutUrl;
        if (redirectUrl) {
          // Show success message and redirect to payment gateway
          toast.success('Redirecting to payment gateway to complete your membership...', { 
            duration: 2000 
          });
          
          // Small delay for better UX, then redirect to HitPay
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          // If no payment URL, membership might have been activated directly
          toast.success('Payment completed successfully!');
          fetchMembershipData(); // Refresh membership data
        }
      } else {
        console.error('❌ API returned unsuccessful response:', response);
        toast.error(response.message || 'Failed to initiate payment completion');
      }
    } catch (error) {
      console.error('❌ Complete payment failed:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
      } else if (error.message.includes('404')) {
        toast.error('Payment service not found. Please contact support.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Unable to connect to server. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to complete payment');
      }
    } finally {
      setCompletingPayment(false);
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

  // Create enhanced analytics data with proper inspection calculations
  const effectiveAnalytics = {
    tier: analytics?.tier || membership.tier?.displayName || 'Unknown Plan',
    billingCycle: analytics?.billingCycle || membership.billingCycle || 'MONTHLY',
    nextBillingDate: analytics?.nextBillingDate || membership.nextBillingDate || membership.endDate,
    usage: {
      serviceRequests: {
        used: analytics?.usage?.serviceRequests?.used || membership.currentUsage?.serviceRequestsUsed || 0,
        limit: analytics?.usage?.serviceRequests?.limit || membership.tier?.features?.serviceRequestsPerMonth || 'Unlimited',
        remaining: analytics?.usage?.serviceRequests?.remaining || (membership.tier?.features?.serviceRequestsPerMonth 
          ? Math.max(0, membership.tier.features.serviceRequestsPerMonth - (membership.currentUsage?.serviceRequestsUsed || 0))
          : 'Unlimited')
      },
      materialDiscount: {
        totalSaved: analytics?.usage?.materialDiscount?.totalSaved || 0,
        percentage: analytics?.usage?.materialDiscount?.percentage || membership.tier?.features?.materialDiscountPercent || 0
      },
      inspections: {
        used: analytics?.usage?.inspections?.used || membership.currentUsage?.inspectionCreditsUsed || 0,
        available: analytics?.usage?.inspections?.available || membership.tier?.features?.annualInspections || 12,
        monthly: 1, // Hardcode to 1 for now to test display
        monthlyUsed: 0 // Hardcode to 0 for now to test display 
      }
    },
    benefits: {
      responseTime: analytics?.benefits?.responseTime || (membership.tier?.features?.responseTimeHours ? `${membership.tier.features.responseTimeHours} hours` : 'Standard'),
      prioritySupport: analytics?.benefits?.prioritySupport || membership.tier?.features?.prioritySupport || false,
      emergencyService: analytics?.benefits?.emergencyService || membership.tier?.features?.emergencyService || false,
      dedicatedManager: analytics?.benefits?.dedicatedManager || membership.tier?.features?.dedicatedManager || false
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
                membership.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {membership.status === 'ACTIVE' && <CheckCircle className="h-4 w-4 mr-1" />}
                {membership.status === 'CANCELLED' && membership.hasActiveAccess && <AlertTriangle className="h-4 w-4 mr-1" />}
                {membership.status === 'CANCELLED' && !membership.hasActiveAccess && <X className="h-4 w-4 mr-1" />}
                {membership.status === 'EXPIRED' && <X className="h-4 w-4 mr-1" />}
                {membership.status === 'PENDING' && <Clock className="h-4 w-4 mr-1" />}
                {/* Show the actual status from database for immediate cancellations */}
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-orange-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900">Payment Pending</h3>
                <p className="text-orange-700 text-sm">
                  Your membership payment is pending. Click below to complete your payment and activate your plan.
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Having trouble? Contact support if you need assistance
                </p>
              </div>
              <div className="text-right flex flex-col items-end space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <Clock className="h-4 w-4 mr-1" />
                  PENDING
                </span>
                <button
                  onClick={handleCompletePayment}
                  disabled={completingPayment}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    completingPayment
                      ? 'bg-orange-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {completingPayment ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Payment
                    </div>
                  )}
                </button>
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
                ? 'bg-orange-100 text-orange-800' // Pending
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
              <p className="text-sm font-medium text-gray-600">Monthly Inspections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {effectiveAnalytics.usage.inspections.monthlyUsed}
                <span className="text-base font-normal text-gray-500">
                  /{effectiveAnalytics.usage.inspections.monthly}
                </span>
              </p>
            </div>
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Usage this month</span>
              <span>{effectiveAnalytics.usage.inspections.monthly - effectiveAnalytics.usage.inspections.monthlyUsed} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ 
                  width: `${(effectiveAnalytics.usage.inspections.monthlyUsed / effectiveAnalytics.usage.inspections.monthly) * 100}%` 
                }}
              ></div>
            </div>
          </div>
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
              <span>Monthly Inspections</span>
              <span className="font-medium">{effectiveAnalytics.usage.inspections.monthlyUsed}/{effectiveAnalytics.usage.inspections.monthly}</span>
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
            onClick={() => setShowChangePlanModal(true)}
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
            onClick={() => {
              if (membership.status !== 'EXPIRED') {
                setShowCancelModal(true);
              }
            }}
            disabled={membership.status === 'EXPIRED'}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              membership.status === 'EXPIRED'
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : membership.status === 'CANCELLED'
                  ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  : 'border-red-300 text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            {membership.status === 'EXPIRED' 
              ? 'Already Expired' 
              : membership.status === 'CANCELLED'
                ? 'Cancel Immediately'
                : (membership.cancelledAt && !membership.autoRenew) 
                  ? 'Cancel Immediately' 
                  : 'Cancel Membership'
            }
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
                  {(membership.status === 'CANCELLED' || (membership.cancelledAt && !membership.autoRenew)) ? 'Cancel Immediately' : 'Cancel Membership'}
                </h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {(membership.status === 'CANCELLED' || (membership.cancelledAt && !membership.autoRenew)) ? (
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
                    {membership.status === 'EXPIRED' ? (
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Membership has already been cancelled and expired</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCancelMembership(true)}
                        disabled={cancelLoading}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {cancelLoading ? 'Processing...' : 'End Access Immediately'}
                      </button>
                    )}
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

      {/* Plan Change Modal */}
      <AnimatePresence>
        {showChangePlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChangePlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Change Your Plan
                  </h3>
                  <button
                    onClick={() => setShowChangePlanModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Current Plan Info */}
                {membership && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-orange-900 mb-2">Current Plan</h4>
                    <p className="text-orange-800">
                      {membership.tier?.displayName} - {membership.billingCycle} billing
                    </p>
                    <p className="text-sm text-orange-600">
                      Your current plan will be cancelled immediately and the new plan will start right away.
                    </p>
                  </div>
                )}

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setSelectedBillingCycle('MONTHLY')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedBillingCycle === 'MONTHLY'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedBillingCycle('YEARLY')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedBillingCycle === 'YEARLY'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yearly (Save 2 months)
                    </button>
                  </div>
                </div>

                {/* Available Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePlans.map((plan) => {
                    const isCurrentPlan = membership?.tier?._id === plan._id;
                    const price = selectedBillingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
                    const savings = selectedBillingCycle === 'YEARLY' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
                    
                    // Determine if this is an upgrade or downgrade
                    const currentPrice = selectedBillingCycle === 'YEARLY' 
                      ? membership?.tier?.yearlyPrice || 0 
                      : membership?.tier?.monthlyPrice || 0;
                    const isUpgrade = price > currentPrice;
                    const isDowngrade = price < currentPrice && !isCurrentPlan;

                    return (
                      <motion.div
                        key={plan._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                          isCurrentPlan 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {/* Plan Header */}
                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {plan.displayName}
                            </h3>
                            {isUpgrade && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                UPGRADE
                              </span>
                            )}
                            {isDowngrade && (
                              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                DOWNGRADE
                              </span>
                            )}
                          </div>
                          <div className="text-3xl font-bold text-orange-600 mb-1">
                            ${price}
                            <span className="text-sm text-gray-600 font-normal">
                              /{selectedBillingCycle === 'YEARLY' ? 'year' : 'month'}
                            </span>
                          </div>
                          {selectedBillingCycle === 'YEARLY' && savings > 0 && (
                            <p className="text-sm text-green-600 font-medium">
                              Save ${savings}/year
                            </p>
                          )}
                        </div>

                        {/* Plan Features */}
                        <div className="space-y-3 mb-6">
                          {plan.features ? (
                            <>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">
                                  {plan.features.serviceRequestsPerMonth} service request{plan.features.serviceRequestsPerMonth > 1 ? 's' : ''} per month
                                </span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">
                                  {plan.features.responseTimeHours}hr response time
                                </span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">
                                  {Math.floor((plan.features.annualInspections || 0) / 12) || 1} monthly inspection{Math.floor((plan.features.annualInspections || 0) / 12) === 1 ? '' : 's'}
                                </span>
                              </div>
                              {plan.features.materialDiscountPercent > 0 && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm">
                                    {plan.features.materialDiscountPercent}% material discount
                                  </span>
                                </div>
                              )}
                              {plan.features.emergencyService && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm">24/7 emergency service</span>
                                </div>
                              )}
                              {plan.features.prioritySupport && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm">Priority support</span>
                                </div>
                              )}
                              {plan.features.dedicatedManager && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm">Dedicated account manager</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">Priority booking</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">24/7 customer support</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">Service discounts</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">Regular maintenance check</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            if (isCurrentPlan) {
                              toast('This is your current plan');
                              return;
                            }
                            handleChangePlan(plan);
                          }}
                          disabled={isCurrentPlan || changingPlan}
                          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                            isCurrentPlan
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : changingPlan
                              ? 'bg-orange-400 text-white cursor-wait'
                              : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg'
                          }`}
                        >
                          {isCurrentPlan 
                            ? 'Current Plan' 
                            : changingPlan 
                            ? 'Redirecting to Payment...' 
                            : 'Pay & Switch to This Plan'
                          }
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Warning Message */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Payment Required</h4>
                      <p className="text-yellow-800 text-sm">
                        When you select a new plan, you'll be redirected to our secure payment gateway to complete the payment. 
                        After successful payment, your current subscription will be cancelled immediately and the new plan will start right away.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembershipDashboard;