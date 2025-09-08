import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Home, 
  Building, 
  Building2, 
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cachedApi } from '../../utils/globalCache';

import { useAuth } from '../../contexts/AuthContext';

const MembershipCard = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembership();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembership = async () => {
    if (!user) return;
    
    try {
      const response = await cachedApi.getMembership(user.id);
      setMembership(response.membership);
    } catch (error) {
      console.error('Failed to fetch membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierName) => {
    const icons = {
      'HDB': <Home className="w-6 h-6" />,
      'CONDOMINIUM': <Building className="w-6 h-6" />,
      'LANDED_PROPERTY': <Building2 className="w-6 h-6" />,
      'COMMERCIAL': <Briefcase className="w-6 h-6" />
    };
    return icons[tierName] || <Home className="w-6 h-6" />;
  };

  const getTierGradient = (tierName) => {
    const gradients = {
      'HDB': 'from-blue-500 to-blue-600',
      'CONDOMINIUM': 'from-green-500 to-green-600',
      'LANDED_PROPERTY': 'from-purple-500 to-purple-600',
      'COMMERCIAL': 'from-orange-500 to-orange-600'
    };
    return gradients[tierName] || 'from-gray-500 to-gray-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'EXPIRED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-dashed border-orange-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Membership</h3>
        <p className="text-gray-600 mb-6">
          Unlock exclusive benefits and priority support with our membership plans
        </p>
        <Link
          to="/membership"
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
        >
          <Crown className="w-5 h-5 mr-2" />
          View Plans
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTierGradient(membership.tier.name)} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
              {getTierIcon(membership.tier.name)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{membership.tier.displayName}</h3>
              <p className="text-white text-opacity-90">{membership.tier.description}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(membership.status)} bg-white bg-opacity-20 text-white`}>
            {membership.status}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Plan Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Billing Cycle</p>
            <p className="text-lg font-semibold text-gray-900">{membership.billingCycle}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Monthly Price</p>
            <p className="text-lg font-semibold text-gray-900">${membership.currentPrice}</p>
          </div>
        </div>

        {/* Current Usage */}
        {membership.usage && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">This Month's Usage</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Requests</span>
                <span className="text-sm font-semibold text-gray-900">
                  {membership.usage.serviceRequestsUsed} / {membership.remaining.serviceRequests}
                </span>
              </div>
              
              {membership.tier.features.emergencyService && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emergency Service</span>
                  <span className="text-sm font-semibold text-green-600">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Available
                  </span>
                </div>
              )}

              {membership.tier.features.materialDiscountPercent > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Material Discount</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {membership.tier.features.materialDiscountPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Dates */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Start Date
              </span>
              <span className="font-semibold text-gray-900">{formatDate(membership.startDate)}</span>
            </div>
            
            {membership.endDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  End Date
                </span>
                <span className="font-semibold text-gray-900">{formatDate(membership.endDate)}</span>
              </div>
            )}

            {membership.nextBillingDate && membership.status === 'ACTIVE' && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Next Billing
                </span>
                <span className="font-semibold text-gray-900">{formatDate(membership.nextBillingDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Link
            to="/membership"
            className="flex-1 text-center px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-semibold"
          >
            View All Plans
          </Link>
          {membership.status === 'ACTIVE' && (
            <Link
              to="/membership?upgrade=true"
              className="flex-1 text-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MembershipCard;
