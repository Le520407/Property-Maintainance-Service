import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Crown, 
  Calendar,
  DollarSign,
  BarChart3,
  Award,
  ArrowRight,
  Clock,
  Package
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import MembershipPaymentFlow from './MembershipPaymentFlow';

export const CurrentPlanTab = () => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      const response = await api.get('/vendor/membership/my-membership');
      setMembership(response.data);
    } catch (error) {
      console.error('Error fetching membership:', error);
      // Demo data fallback
      setMembership({
        membership: {
          currentTier: 'BASIC',
          subscriptionStatus: 'ACTIVE',
          daysRemaining: null
        },
        tierDetails: {
          displayName: 'Basic',
          description: 'Perfect for getting started',
          monthlyPrice: 0,
          features: {
            maxMonthlyJobs: 10,
            maxPortfolioImages: 5,
            platformCommissionRate: 15
          }
        },
        vendorFeatures: {
          priorityAssignment: false,
          emergencyServiceEnabled: false,
          featuredListing: false,
          maxPortfolioImages: 5,
          customPackagesAllowed: false,
          advancedAnalytics: false,
          prioritySupport: false,
          platformCommissionRate: 15
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { membership: membershipData, tierDetails, vendorFeatures } = membership;

  const getTierColor = (tier) => {
    switch (tier) {
      case 'BASIC': return 'gray';
      case 'PROFESSIONAL': return 'blue';
      case 'PREMIUM': return 'purple';
      case 'ENTERPRISE': return 'orange';
      default: return 'gray';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'BASIC': return Package;
      case 'PROFESSIONAL': return Shield;
      case 'PREMIUM': return Crown;
      case 'ENTERPRISE': return Star;
      default: return Package;
    }
  };

  const color = getTierColor(membershipData.currentTier);
  const TierIcon = getTierIcon(membershipData.currentTier);

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
            <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
              <TierIcon className={`h-8 w-8 text-${color}-600`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tierDetails.displayName} Plan</h2>
              <p className="text-gray-600">{tierDetails.description}</p>
            </div>
          </div>
          {membershipData.currentTier !== 'BASIC' && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${tierDetails.monthlyPrice}
                <span className="text-base font-normal text-gray-500">/month</span>
              </div>
              {membershipData.daysRemaining && (
                <p className="text-sm text-gray-500">
                  {membershipData.daysRemaining} days remaining
                </p>
              )}
            </div>
          )}
        </div>

        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          membershipData.subscriptionStatus === 'ACTIVE' 
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {membershipData.subscriptionStatus}
        </div>
      </motion.div>

      {/* Plan Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Jobs Limit</span>
              <span className="text-sm font-medium">
                {tierDetails.features.maxMonthlyJobs === -1 ? 'Unlimited' : tierDetails.features.maxMonthlyJobs}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Portfolio Images</span>
              <span className="text-sm font-medium">
                {vendorFeatures.maxPortfolioImages === -1 ? 'Unlimited' : vendorFeatures.maxPortfolioImages}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Platform Commission</span>
              <span className="text-sm font-medium">{vendorFeatures.platformCommissionRate}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Priority Assignment</span>
              <div className={`w-4 h-4 rounded-full ${
                vendorFeatures.priorityAssignment ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Emergency Services</span>
              <div className={`w-4 h-4 rounded-full ${
                vendorFeatures.emergencyServiceEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Featured Listing</span>
              <div className={`w-4 h-4 rounded-full ${
                vendorFeatures.featuredListing ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      {membershipData.currentTier === 'BASIC' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Upgrade Your Plan</h3>
              <p className="text-orange-100">
                Unlock more features and grow your business with our premium plans
              </p>
            </div>
            <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
              View Plans
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const UpgradePlansTab = () => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [selectedTierForUpgrade, setSelectedTierForUpgrade] = useState(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await api.get('/vendor/membership/tiers');
      setTiers(response.data.tiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      // Demo data fallback
      setTiers([
        {
          name: 'BASIC',
          displayName: 'Basic',
          description: 'Perfect for getting started',
          monthlyPrice: 0,
          yearlyPrice: 0,
          features: { platformCommissionRate: 15, maxPortfolioImages: 5 }
        },
        {
          name: 'PROFESSIONAL',
          displayName: 'Professional',
          description: 'For growing businesses',
          monthlyPrice: 29.90,
          yearlyPrice: 299.00,
          features: { platformCommissionRate: 12, maxPortfolioImages: 15 }
        },
        {
          name: 'PREMIUM',
          displayName: 'Premium',
          description: 'For established businesses',
          monthlyPrice: 79.90,
          yearlyPrice: 799.00,
          features: { platformCommissionRate: 10, maxPortfolioImages: 30 }
        },
        {
          name: 'ENTERPRISE',
          displayName: 'Enterprise',
          description: 'For large operations',
          monthlyPrice: 149.90,
          yearlyPrice: 1499.00,
          features: { platformCommissionRate: 8, maxPortfolioImages: -1 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier) => {
    setSelectedTierForUpgrade(tier);
    setShowPaymentFlow(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('Membership upgraded successfully!');
    fetchTiers(); // Refresh the tiers
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'BASIC': return 'gray';
      case 'PROFESSIONAL': return 'blue';
      case 'PREMIUM': return 'purple';
      case 'ENTERPRISE': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the perfect plan for your business needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const color = getTierColor(tier.name);
          const isPopular = tier.name === 'PROFESSIONAL';
          const isEnterprise = tier.name === 'ENTERPRISE';

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-white rounded-lg shadow-sm border-2 ${
                isPopular ? 'border-orange-500' : 'border-gray-200'
              } p-6`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex p-2 rounded-full bg-${color}-100 mb-3`}>
                  {tier.name === 'BASIC' && <Package className={`h-6 w-6 text-${color}-600`} />}
                  {tier.name === 'PROFESSIONAL' && <Shield className={`h-6 w-6 text-${color}-600`} />}
                  {tier.name === 'PREMIUM' && <Crown className={`h-6 w-6 text-${color}-600`} />}
                  {tier.name === 'ENTERPRISE' && <Star className={`h-6 w-6 text-${color}-600`} />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{tier.displayName}</h3>
                <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  {tier.monthlyPrice === 0 ? 'Free' : `$${tier.monthlyPrice}`}
                  {tier.monthlyPrice > 0 && (
                    <span className="text-base font-normal text-gray-500">/month</span>
                  )}
                </div>
                {tier.yearlyPrice > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    or ${tier.yearlyPrice}/year (save 17%)
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>
                    {tier.features.maxPortfolioImages === -1 ? 'Unlimited' : tier.features.maxPortfolioImages} portfolio images
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>{tier.features.platformCommissionRate}% platform commission</span>
                </div>
                {tier.name !== 'BASIC' && (
                  <>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Priority job assignment</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced analytics</span>
                    </div>
                  </>
                )}
                {isEnterprise && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Dedicated account manager</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleUpgrade(tier)}
                disabled={tier.name === 'BASIC'}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  tier.name === 'BASIC'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPopular
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {tier.name === 'BASIC' ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Feature</th>
                {tiers.map(tier => (
                  <th key={tier.name} className="text-center py-2">{tier.displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 text-gray-600">Portfolio Images</td>
                {tiers.map(tier => (
                  <td key={tier.name} className="text-center py-3">
                    {tier.features.maxPortfolioImages === -1 ? '∞' : tier.features.maxPortfolioImages}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 text-gray-600">Commission Rate</td>
                {tiers.map(tier => (
                  <td key={tier.name} className="text-center py-3">
                    {tier.features.platformCommissionRate}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 text-gray-600">Priority Assignment</td>
                {tiers.map(tier => (
                  <td key={tier.name} className="text-center py-3">
                    {tier.name === 'BASIC' ? '❌' : '✅'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Flow Modal */}
      {showPaymentFlow && selectedTierForUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <MembershipPaymentFlow
              selectedTier={selectedTierForUpgrade}
              onCancel={() => {
                setShowPaymentFlow(false);
                setSelectedTierForUpgrade(null);
              }}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const UsageStatsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/vendor/membership/usage-stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      // Demo data fallback
      setStats({
        currentTier: 'BASIC',
        monthlyUsage: {
          jobsCompleted: 8,
          jobsAssigned: 12,
          revenue: 2450
        },
        limits: {
          portfolioImages: 5,
          customPackages: false,
          commissionRate: 15
        },
        benefitsEarned: {
          totalCommissionSaved: 0,
          priorityJobsReceived: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.monthlyUsage.jobsCompleted}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
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
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.monthlyUsage.revenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
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
              <p className="text-sm font-medium text-gray-600">Commission Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.limits.commissionRate}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Benefits Earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Commission Saved</span>
              <span className="text-lg font-bold text-green-600">
                ${stats.benefitsEarned.totalCommissionSaved}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Priority Jobs</span>
              <span className="text-lg font-bold text-blue-600">
                {stats.benefitsEarned.priorityJobsReceived}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan Limits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Limits & Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Portfolio Images Used</span>
            <span className="text-sm font-medium">
              3 / {stats.limits.portfolioImages === -1 ? '∞' : stats.limits.portfolioImages}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Custom Packages</span>
            <span className={`text-sm font-medium ${
              stats.limits.customPackages ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.limits.customPackages ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const BillingHistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const response = await api.get('/vendor/membership/history');
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching billing history:', error);
      // Demo data fallback
      setHistory([
        {
          _id: '1',
          fromTier: 'BASIC',
          toTier: 'PROFESSIONAL',
          changeDate: new Date('2024-01-15'),
          reason: 'UPGRADE_REQUEST',
          initiatedBy: 'VENDOR'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Membership History</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <ArrowRight className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Upgraded from {item.fromTier} to {item.toTier}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.reason.replace('_', ' ').toLowerCase()} • by {item.initiatedBy.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.changeDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No membership history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};