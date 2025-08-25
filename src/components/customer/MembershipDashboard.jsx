import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Shield
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const MembershipDashboard = () => {
  const [membership, setMembership] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      const response = await api.get('/membership/my-membership');
      
      if (response.data.success) {
        setMembership(response.data.membership);
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
      toast.error('Failed to load membership data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Are you sure you want to cancel your membership? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.put('/membership/cancel', { immediate: false });
      
      if (response.data.success) {
        toast.success('Membership will be cancelled at the end of your billing period');
        fetchMembershipData(); // Refresh data
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel membership');
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
              membership.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {membership.status}
            </div>
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
            onClick={handleCancelMembership}
            className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Cancel Membership
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MembershipDashboard;