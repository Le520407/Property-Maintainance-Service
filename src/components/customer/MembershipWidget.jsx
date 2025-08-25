import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Gift
} from 'lucide-react';
import { api } from '../../services/api';

const MembershipWidget = () => {
  const [membership, setMembership] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      const response = await api.get('/membership/my-membership');
      setMembership(response.data.membership);
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tierName) => {
    const colors = {
      BASIC: 'bg-gray-100 text-gray-800 border-gray-200',
      PREMIUM: 'bg-purple-100 text-purple-800 border-purple-200',
      ELITE: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[tierName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Non-member widget - Promote membership
  if (!membership) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <Crown className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Unlock Premium Benefits</h3>
              <p className="text-orange-100 mt-1">
                Get priority service, discounts, and exclusive perks
              </p>
            </div>
          </div>
          <Link
            to="/membership/plans"
            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center"
          >
            View Plans
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-orange-400/30">
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-200" />
            <div className="text-sm text-orange-100">Priority Response</div>
          </div>
          <div className="text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-200" />
            <div className="text-sm text-orange-100">Material Discounts</div>
          </div>
          <div className="text-center">
            <Gift className="h-6 w-6 mx-auto mb-2 text-orange-200" />
            <div className="text-sm text-orange-100">Free Inspections</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Member widget - Show current status and usage
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border-l-4 border-orange-500"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100 mr-3">
              <Crown className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {analytics?.tier} Member
              </h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTierColor(membership.tier.name)}`}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {membership.status}
              </div>
            </div>
          </div>
          <Link
            to="/membership/dashboard"
            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center"
          >
            Manage
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Service Requests</div>
            <div className="text-lg font-semibold text-gray-900">
              {analytics?.usage.serviceRequests.used || 0}
              <span className="text-sm font-normal text-gray-500">
                /{analytics?.usage.serviceRequests.limit || 'N/A'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-orange-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${analytics?.usage.serviceRequests.limit === 'Unlimited' 
                    ? 30 
                    : Math.min(100, ((analytics?.usage.serviceRequests.used || 0) / (parseInt(analytics?.usage.serviceRequests.limit) || 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Savings This Month</div>
            <div className="text-lg font-semibold text-green-600">
              ${analytics?.usage.materialDiscount.totalSaved?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics?.usage.materialDiscount.percentage || 0}% discount active
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              to="/jobs/create"
              className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Book Service
            </Link>
            <Link
              to="/membership/plans"
              className="text-gray-600 hover:text-gray-700 font-medium text-sm flex items-center"
            >
              <Star className="h-4 w-4 mr-1" />
              Upgrade
            </Link>
          </div>
          
          {/* Alert if near limit */}
          {analytics && 
           analytics.usage.serviceRequests.limit !== 'Unlimited' && 
           analytics.usage.serviceRequests.remaining <= 1 && (
            <div className="flex items-center text-xs text-amber-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              {analytics.usage.serviceRequests.remaining} left
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MembershipWidget;