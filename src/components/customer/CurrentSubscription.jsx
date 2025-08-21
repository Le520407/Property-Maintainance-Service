import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Building, 
  Building2, 
  Store,
  Calendar,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Heart
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const CurrentSubscription = ({ subscription, onUpdate }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const propertyIcons = {
    HDB: Home,
    CONDOMINIUM: Building,
    LANDED: Building2,
    COMMERCIAL: Store
  };

  const tierColors = {
    HDB: 'green',
    CONDOMINIUM: 'blue',
    LANDED: 'purple',
    COMMERCIAL: 'orange'
  };

  const IconComponent = propertyIcons[subscription.propertyType] || Home;
  const color = tierColors[subscription.propertyType] || 'gray';

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/subscriptions/cancel/${subscription._id}`, {
        reason: cancelReason
      });
      
      toast.success('Subscription cancelled successfully');
      setShowCancelModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 bg-${color}-100 rounded-lg flex items-center justify-center mr-4`}>
              <IconComponent className={`h-8 w-8 text-${color}-600`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {subscription.propertyType.replace('_', ' ')} Plan
              </h2>
              <p className="text-gray-600">
                Active since {formatDate(subscription.startDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              ${subscription.monthlyPrice}
            </div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {subscription.status}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Next billing: {formatDate(subscription.nextBillingDate)}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Services Used</div>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {subscription.usageStats?.servicesUsed || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              This month: {subscription.usageStats?.monthlyServicesUsed || 0}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Social Impact</div>
              <Heart className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {subscription.socialImpactContribution?.freeServicesEarned || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Free services earned
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Contribution</div>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ${subscription.socialImpactContribution?.totalContribution?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Lifetime value
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="font-medium text-gray-900">
                {subscription.paymentMethod?.brand || 'Card'} ending in {subscription.paymentMethod?.last4 || '****'}
              </div>
              <div className="text-sm text-gray-500">
                {subscription.paymentMethod?.type || 'Credit Card'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Billing History</h3>
        <div className="space-y-3">
          {subscription.billingHistory?.slice(0, 5).map((bill, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  bill.status === 'PAID' ? 'bg-green-500' :
                  bill.status === 'FAILED' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">
                    ${bill.amount} - {bill.status}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(bill.date)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {bill.transactionId}
              </div>
            </div>
          ))}
          {(!subscription.billingHistory || subscription.billingHistory.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              No billing history available
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Actions</h3>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 flex items-center`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Update Plan
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Cancel Subscription
          </button>
        </div>
      </motion.div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCancelModal(false)} />
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Subscription</h3>
              <p className="text-gray-600 mb-4">
                We're sorry to see you go. Please let us know why you're cancelling so we can improve our service.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 mb-4"
                rows={4}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSubscription;