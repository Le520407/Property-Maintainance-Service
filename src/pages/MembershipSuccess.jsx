import { ArrowRight, CheckCircle, Home, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { api } from '../services/api';
import { cachedApi } from '../utils/globalCache';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const MembershipSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membershipData, setMembershipData] = useState(null);
  const [error, setError] = useState(null);

  // Helper to detect recurring payment
  const isRecurringPayment = () => {
    const recurringBillingId = searchParams.get('recurring_billing_id');
    return !!(recurringBillingId || (membershipData?.autoRenew && membershipData?.hitpayRecurringBillingId));
  };

  const fetchMembershipData = useCallback(async () => {
    try {
      // Force cache invalidation to get fresh membership data
      if (user?.id) {
        cachedApi.invalidateMembershipCache(user.id);
        console.log('🗑️ Cache invalidated for membership data refresh');
      }
      
      const response = await api.get('/membership/my-membership');
      if (response.membership) {
        setMembershipData(response.membership);
        if (response.membership.status === 'ACTIVE') {
          toast.success('🎉 Welcome to your new membership plan!');
        }
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Please log in to view your membership status. Your payment was processed successfully.');
      } else {
        setError('Unable to verify membership status. Please contact support if your payment was completed.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const activateMembershipForUser = useCallback(async (userId, paymentData) => {
    try {
      console.log('🔄 Activating membership for user:', userId, 'with payment data:', paymentData);
      
      // Use our new HitPay success endpoint
      const urlStatus = searchParams.get('status');
      const response = await api.post('/membership/hitpay-success', {
        userId: userId,
        reference: paymentData.firstReference || paymentData.reference, // Use first reference as plan ID
        hitpayRecurringBillingId: paymentData.reference, // Use last reference as billing ID
        hitpay_payment_id: paymentData.paymentId || paymentData.recurringBillingId,
        status: urlStatus // Pass the status from URL to force activation if status=active
      });
      
      if (response.success) {
        console.log('✅ Membership activated successfully via HitPay redirect');
        toast.success('🎉 Payment successful! Your membership has been activated!');
      } else {
        console.warn('HitPay success response:', response);
        toast.warning('Payment completed, but activation may be delayed. Please refresh the page.');
      }
    } catch (error) {
      console.error('Failed to activate membership via HitPay redirect:', error);
      toast.error('Payment completed, but there was an issue activating your membership. Please contact support.');
    }
  }, [searchParams]);

  const activateMembershipByReference = useCallback(async (reference) => {
    try {
      console.log('🔄 Activating membership with reference:', reference);
      
      // Get all reference values from URL (in case there are multiple)
      const allReferences = searchParams.getAll('reference');
      console.log('🔍 All reference values from URL:', allReferences);
      
      // Use our new HitPay success endpoint which is more specific for HitPay payments
      const hitpayPaymentId = searchParams.get('payment_id') || searchParams.get('payment_request_id');
      const urlStatus = searchParams.get('status');
      
      // Try each reference value until one works
      for (const ref of allReferences) {
        try {
          console.log('🔄 Trying reference:', ref);
          const response = await api.post('/membership/hitpay-success', {
            userId: user?.id,
            reference: ref,
            hitpay_payment_id: hitpayPaymentId,
            status: urlStatus // Pass the status from URL to force activation if status=active
          });
          
          if (response.success) {
            console.log('✅ Membership activated successfully with reference:', ref);
            toast.success('🎉 Your membership has been activated!');
            return; // Success, exit the loop
          }
        } catch (refError) {
          console.warn('❌ Failed with reference:', ref, refError.message);
          // Continue to next reference
        }
      }
      
      // If we get here, none of the references worked
      console.warn('⚠️ All reference values failed, falling back to original method');
      await fallbackActivateByReference(reference);
    } catch (error) {
      console.error('Failed to activate membership via HitPay success:', error);
      // Fallback to the original method
      await fallbackActivateByReference(reference);
    }
  }, [searchParams, user?.id]);

  const fallbackActivateByReference = async (reference) => {
    try {
      console.log('🔄 Fallback: Activating membership with reference:', reference);
      
      // Use our dedicated activation endpoint
      const response = await api.post('/membership/activate-by-reference', {
        reference: reference
      });
      
      if (response.success) {
        console.log('✅ Membership activated successfully');
        toast.success('🎉 Your membership has been activated!');
      } else {
        console.warn('Activation response:', response);
      }
    } catch (error) {
      console.error('Failed to activate membership:', error);
      // Don't show error toast here, let the membership fetch handle it
    }
  };

  useEffect(() => {
    // Get payment parameters from URL - handle both HitPay format and demo format
    const paymentId = searchParams.get('payment_id');
    const recurringBillingId = searchParams.get('recurring_billing_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // recurring payment type or plan_change
    const demo = searchParams.get('demo') === 'true';
    const userId = searchParams.get('userId');
    const source = searchParams.get('source');
    
    // Handle duplicate 'reference' parameters - extract all values
    const urlString = window.location.search;
    const referenceMatches = urlString.match(/reference=([^&]*)/g) || [];
    const referenceValues = referenceMatches.map(match => decodeURIComponent(match.split('=')[1]));
    const reference = referenceValues[referenceValues.length - 1]; // Use the last one (hitpayRecurringBillingId)
    const firstReference = referenceValues[0]; // The first one (hitpayPlanId)
    
    console.log('🔍 MembershipSuccess URL params:', { 
      paymentId, 
      reference, 
      firstReference,
      referenceValues,
      recurringBillingId, 
      status, 
      type, 
      demo, 
      userId, 
      source 
    });

    // Check if we have a valid payment identifier (either payment_id or reference)
    const hasValidPayment = paymentId || reference;

    // Set initial state for recurring payment
    if (recurringBillingId || type === 'recurring') {
      console.log('🔄 Recurring billing detected:', recurringBillingId || reference);
    }

    // Always activate if status=active and reference are present
    if (status === 'active' && reference) {
      console.log('✅ URL status=active detected, activating membership');
      activateMembershipByReference(reference).finally(fetchMembershipData);
      return;
    }

    // Handle HitPay redirect success (NEW APPROACH)
    if (source === 'hitpay' && userId) {
      console.log('🎉 HitPay redirect detected - activating membership for user:', userId);
      activateMembershipForUser(userId, { 
        paymentId, 
        reference, 
        firstReference,
        recurringBillingId 
      }).finally(fetchMembershipData);
      return;
    }

    // Handle plan change success
    if (type === 'plan_change' && reference) {
      console.log('🔄 Plan change payment completed successfully');
      toast.success('🎉 Plan change completed successfully!');
      fetchMembershipData();
      return;
    }

    // Handle other status scenarios (LEGACY SUPPORT)
    if (status === 'completed' && hasValidPayment) {
      // For demo mode, trigger backend simulation to flip membership ACTIVE
      if (demo && recurringBillingId) {
        simulateDemoRecurring(recurringBillingId).finally(fetchMembershipData);
      } else {
        // Payment was successful, fetch updated membership data
        fetchMembershipData();
      }
    } else if (status === 'failed' || status === 'cancelled') {
      setError('Payment was not completed. Please try again.');
      setLoading(false);
    } else {
      // Check if we have the necessary parameters or just fetch membership data
      fetchMembershipData();
    }
  }, [searchParams, activateMembershipByReference, activateMembershipForUser, fetchMembershipData]);

  const simulateDemoRecurring = async (recurringBillingId) => {
    try {
      await api.post('/hitpay/simulate/recurring', {
        recurring_billing_id: recurringBillingId,
        status: 'completed',
      });
    } catch (e) {
      console.warn('Demo simulate recurring failed:', e);
    }
  };



  const handleReturnHome = () => {
    navigate('/customer/dashboard');
  };

  const handleViewMembership = () => {
    navigate('/customer/membership');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-4">
            {error && error.includes('log in') && (
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Log In to View Status
              </button>
            )}
            <button
              onClick={() => navigate('/customer/membership')}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleReturnHome}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="h-12 w-12 text-green-600" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          {searchParams.get('type') === 'plan_change' 
            ? 'Plan Changed Successfully!' 
            : isRecurringPayment() 
            ? 'Recurring Subscription Activated!' 
            : 'Welcome to Swift Fix Pro!'
          }
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          {searchParams.get('type') === 'plan_change' ? (
            <>
              Your plan has been changed successfully! You now have access to all the benefits of your new{' '}
              <span className="font-semibold text-orange-600">
                {membershipData?.tier?.displayName || 'Premium'}
              </span>{' '}
              plan. Your previous plan has been cancelled.
            </>
          ) : isRecurringPayment() ? (
            <>
              Your recurring membership has been activated successfully! Your{' '}
              <span className="font-semibold text-orange-600">
                {membershipData?.tier?.displayName || 'Premium'}
              </span>{' '}
              plan will automatically renew every{' '}
              <span className="font-semibold">
                {membershipData?.billingCycle?.toLowerCase() === 'yearly' ? 'year' : 'month'}
              </span>.
            </>
          ) : (
            <>
              Your membership has been activated successfully. You now have access to all the benefits of your{' '}
              <span className="font-semibold text-orange-600">
                {membershipData?.tier?.displayName || 'Premium'}
              </span>{' '}
              plan.
            </>
          )}
        </motion.p>

        {/* Membership Details */}
        {membershipData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-6 mb-8"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Your Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{membershipData.tier.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing:</span>
                <span className="font-medium">{membershipData.billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">{membershipData.status}</span>
              </div>
              {isRecurringPayment() && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-medium text-blue-600">🔄 Recurring</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Auto Renew:</span>
                <span className={`font-medium ${membershipData.autoRenew ? 'text-green-600' : 'text-orange-600'}`}>
                  {membershipData.autoRenew ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
              {membershipData.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing:</span>
                  <span className="font-medium">
                    {new Date(membershipData.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Current Price:</span>
                <span className="font-medium">${membershipData.currentPrice || membershipData.monthlyPrice}/
                  {membershipData.billingCycle?.toLowerCase() === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Benefits Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-green-50 rounded-xl p-4 mb-8"
        >
          <h4 className="font-semibold text-green-800 mb-2">🌱 Social Impact</h4>
          <p className="text-sm text-green-700">
            Your subscription helps us provide maintenance services to families in need. 
            Thank you for making a difference!
          </p>
        </motion.div>

        {/* Recurring Payment Benefits */}
        {isRecurringPayment() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-blue-50 rounded-xl p-4 mb-8"
          >
            <h4 className="font-semibold text-blue-800 mb-2">🔄 Recurring Payment Benefits</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                Never worry about missing a payment
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                Uninterrupted access to all services
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                Easy to manage or cancel anytime
              </div>
              {membershipData?.billingCycle?.toLowerCase() === 'yearly' && (
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                  Save money with annual billing
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Next Payment Information */}
        {isRecurringPayment() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 rounded-xl p-4 mb-8"
          >
            <h4 className="font-semibold text-gray-800 mb-3">📅 Payment Schedule</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next billing date:</span>
                <span className="text-sm font-medium text-gray-800">
                  {(() => {
                    const nextBilling = new Date();
                    if (membershipData?.billingCycle?.toLowerCase() === 'monthly') {
                      nextBilling.setMonth(nextBilling.getMonth() + 1);
                    } else if (membershipData?.billingCycle?.toLowerCase() === 'yearly') {
                      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                    } else {
                      nextBilling.setMonth(nextBilling.getMonth() + 1); // default to monthly
                    }
                    return nextBilling.toLocaleDateString();
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment method:</span>
                <span className="text-sm font-medium text-gray-800">
                  Auto-charge enabled
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                You can modify or cancel your subscription anytime from your dashboard.
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <button
            onClick={handleViewMembership}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center group"
          >
            {isRecurringPayment() ? 'Manage Subscription' : 'View My Membership'}
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={handleReturnHome}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
          <div className="text-left space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              Schedule your first maintenance service
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              Explore all available services in your area
            </div>
            {isRecurringPayment() && (
              <>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Your next payment will be processed automatically
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Manage subscription settings anytime from your dashboard
                </div>
              </>
            )}
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              Contact support if you need any assistance
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MembershipSuccess;
