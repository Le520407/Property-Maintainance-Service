import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Users, 
  Shield, 
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const VendorMembershipSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get payment details from URL params
  const paymentId = searchParams.get('payment_id');
  const reference = searchParams.get('reference');
  const status = searchParams.get('status');

  useEffect(() => {
    // Verify payment and get updated membership info
    const verifyPayment = async () => {
      try {
        if (status === 'completed' || status === 'succeeded') {
          // Fetch updated membership data
          const response = await api.get('/vendor/membership/my-membership');
          setMembershipData(response.data);
          toast.success('Membership upgraded successfully!');
        } else {
          toast.error('Payment was not completed successfully');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!membershipData || status !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h2>
          <p className="text-gray-600 mb-6">
            Your payment is being processed. This may take a few minutes. 
            You'll receive an email confirmation once it's complete.
          </p>
          <button
            onClick={() => navigate('/vendor/membership')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Go to Membership Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tierDetails = membershipData.tierDetails;
  const membership = membershipData.membership;

  const getTierColor = (tier) => {
    switch (tier) {
      case 'PROFESSIONAL': return 'blue';
      case 'PREMIUM': return 'purple';
      case 'ENTERPRISE': return 'orange';
      default: return 'gray';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'PROFESSIONAL': return Star;
      case 'PREMIUM': return Shield;
      case 'ENTERPRISE': return Award;
      default: return CheckCircle;
    }
  };

  const color = getTierColor(membership.currentTier);
  const TierIcon = getTierIcon(membership.currentTier);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Success Icon */}
          <div className={`w-20 h-20 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <CheckCircle className={`h-10 w-10 text-${color}-600`} />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {tierDetails.displayName}!
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your membership has been upgraded successfully. You now have access to all {tierDetails.displayName} features and benefits.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Membership Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <TierIcon className={`h-8 w-8 text-${color}-600 mr-3`} />
              <h2 className="text-2xl font-bold text-gray-900">{tierDetails.displayName}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800`}>
                  {membership.subscriptionStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-medium">{membership.billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Reference</span>
                <span className="font-mono text-sm">{reference}</span>
              </div>
              {membership.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing</span>
                  <span className="font-medium">
                    {new Date(membership.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* New Features */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
              You Now Have Access To
            </h3>
            
            <ul className="space-y-3">
              {tierDetails.features && Object.entries(tierDetails.features).map(([key, value]) => (
                <li key={key} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {typeof value === 'boolean' ? (value ? 'Unlimited' : 'Not included') : value}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Benefits Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-white mb-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Unlock Your Full Potential</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h4 className="font-bold mb-2">Priority Support</h4>
              <p className="text-orange-100">Get faster response times and dedicated assistance</p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h4 className="font-bold mb-2">Higher Earnings</h4>
              <p className="text-orange-100">Reduced commission rates mean more money in your pocket</p>
            </div>
            
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h4 className="font-bold mb-2">Premium Features</h4>
              <p className="text-orange-100">Access exclusive tools to grow your business</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/vendor/membership')}
            className={`px-8 py-4 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors flex items-center justify-center`}
          >
            View Membership Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/vendor/dashboard')}
            className="px-8 py-4 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Vendor Dashboard
          </button>
        </motion.div>

        {/* Email Confirmation Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-gray-600"
        >
          <p>📧 A confirmation email has been sent to your registered email address.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorMembershipSuccessPage;
