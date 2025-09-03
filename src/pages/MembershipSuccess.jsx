import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const MembershipSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [membershipData, setMembershipData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get payment parameters from URL
    const paymentId = searchParams.get('payment_id');
    const recurringBillingId = searchParams.get('recurring_billing_id');
    const status = searchParams.get('status');

    if (status === 'completed' && paymentId) {
      // Payment was successful, fetch updated membership data
      fetchMembershipData();
    } else if (status === 'failed' || status === 'cancelled') {
      setError('Payment was not completed. Please try again.');
      setLoading(false);
    } else {
      // Check if we have the necessary parameters
      fetchMembershipData();
    }
  }, [searchParams]);

  const fetchMembershipData = async () => {
    try {
      const response = await api.get('/membership/my-membership');
      if (response.membership) {
        setMembershipData(response.membership);
        if (response.membership.status === 'ACTIVE') {
          toast.success('🎉 Welcome to your new membership plan!');
        }
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
      setError('Unable to verify membership status. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    navigate('/customer/dashboard');
  };

  const handleViewMembership = () => {
    navigate('/customer/membership');
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
          Welcome to Swift Fix Pro!
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          Your membership has been activated successfully. You now have access to all the benefits of your{' '}
          <span className="font-semibold text-orange-600">
            {membershipData?.tier?.displayName || 'Premium'}
          </span>{' '}
          plan.
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
              {membershipData.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing:</span>
                  <span className="font-medium">
                    {new Date(membershipData.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
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
            View My Membership
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
              Access your member-exclusive benefits
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              Join our community for tips and updates
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MembershipSuccess;
