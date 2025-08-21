import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  Heart,
  BarChart3,
  Home,
  Building,
  Building2,
  Store,
  Calendar,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SubscriptionAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/subscriptions/analytics?range=${timeRange}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load subscription analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const { overview, subscriptionsByTier, socialImpact } = analytics;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor subscription performance and social impact</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900">{overview.totalSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${overview.monthlyRevenue}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Avg Revenue/User</p>
              <p className="text-3xl font-bold text-gray-900">${overview.averageRevenuePerUser?.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Free Services Given</p>
              <p className="text-3xl font-bold text-gray-900">{socialImpact.totalFreeServicesUsed}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriptions by Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscriptions by Property Type</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {subscriptionsByTier.map((tier) => {
              const IconComponent = propertyIcons[tier._id] || Home;
              const color = tierColors[tier._id] || 'gray';
              const percentage = overview.totalSubscriptions > 0 ? 
                (tier.count / overview.totalSubscriptions) * 100 : 0;

              return (
                <div key={tier._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className={`h-4 w-4 text-${color}-600`} />
                      </div>
                      <span className="font-medium text-gray-900">{tier._id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{tier.count}</span>
                      <span className="text-sm text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: ${tier.revenue}/month
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Social Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Social Impact Metrics</h3>
            <Heart className="h-5 w-5 text-pink-400" />
          </div>

          <div className="space-y-6">
            {/* Impact Ratio */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                10:1
              </div>
              <p className="text-sm text-gray-600">Paid to Free Service Ratio</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {socialImpact.totalPaidServices}
                </div>
                <div className="text-xs text-green-800">Paid Services</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {socialImpact.totalFreeServices}
                </div>
                <div className="text-xs text-blue-800">Free Services Earned</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {socialImpact.totalFreeServicesUsed}
                </div>
                <div className="text-xs text-purple-800">Free Services Used</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {socialImpact.totalFreeServices - socialImpact.totalFreeServicesUsed}
                </div>
                <div className="text-xs text-orange-800">Available Free</div>
              </div>
            </div>

            {/* Total Impact */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  Total Community Contribution
                </div>
                <div className="text-3xl font-bold text-green-600">
                  ${socialImpact.totalContribution?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600">
                  Generated by subscriber community
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Achievement Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-white text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <Award className="h-8 w-8 mr-3" />
          <h3 className="text-2xl font-bold">Community Impact Achievement</h3>
        </div>
        <p className="text-lg mb-4">
          Together, our subscribers have enabled {socialImpact.totalFreeServicesUsed} free maintenance services 
          for families in need across Singapore.
        </p>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="text-3xl font-bold">{overview.totalSubscriptions}</div>
            <div className="text-sm opacity-90">Active Subscribers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{socialImpact.totalFreeServicesUsed}</div>
            <div className="text-sm opacity-90">Families Helped</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              ${socialImpact.totalContribution?.toFixed(0) || '0'}
            </div>
            <div className="text-sm opacity-90">Community Value</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionAnalytics;