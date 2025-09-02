import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  Copy, 
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const ReferralDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchShareData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.referral.getDashboard();
      setDashboardData(data);
    } catch (error) {
      setError(error.message || 'Error loading dashboard');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShareData = async () => {
    try {
      const data = await api.referral.getShareLink();
      setShareData(data);
    } catch (error) {
      console.error('Error fetching share data:', error);
    }
  };

  const generateReferralCode = async () => {
    try {
      await api.referral.generateCode();
      await fetchDashboardData();
      await fetchShareData();
      toast.success('Referral code generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Error generating referral code');
      console.error('Error:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareReferralLink = async () => {
    if (!shareData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Swift Fix Pro',
          text: shareData.shareText,
          url: shareData.referralLink,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyToClipboard(shareData.referralLink);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 1: return 'text-amber-600 bg-amber-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'APPROVED': return 'text-blue-600 bg-blue-50';
      case 'PAID': return 'text-green-600 bg-green-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData.hasReferralCode) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Gift className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Start Your Referral Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Earn commissions by referring new customers to Swift Fix Pro
            </p>
            <button
              onClick={generateReferralCode}
              className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700 transition-colors"
            >
              Generate Referral Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { currentTier, nextTier, statistics, referredUsers, recentCommissions } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Agent Dashboard Header */}
      <div className="bg-orange-600 text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">Referral Dashboard</h1>
            <p className="text-2xl text-orange-100 mb-8 max-w-4xl mx-auto">
              Manage your referrals and track your commission earnings with our comprehensive agent tools
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Referral Code Section */}
        {shareData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl p-10 mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Your Referral Code</h2>
              <span className={`px-6 py-3 rounded-full text-lg font-bold ${getTierColor(currentTier.level)}`}>
                {currentTier.name} Tier - {currentTier.rate}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">
                  Referral Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareData.referralCode}
                    readOnly
                    className="flex-1 rounded-l-lg border border-gray-300 px-6 py-4 bg-gray-50 text-xl font-mono font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(shareData.referralCode)}
                    className="px-6 py-4 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300 transition-colors"
                  >
                    <Copy className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">
                  Referral Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareData.referralLink}
                    readOnly
                    className="flex-1 rounded-l-lg border border-gray-300 px-6 py-4 bg-gray-50 text-base"
                  />
                  <button
                    onClick={shareReferralLink}
                    className="px-6 py-4 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600"
          >
            <div className="flex items-center">
              <Users className="h-12 w-12 text-blue-600" />
              <div className="ml-6">
                <p className="text-lg font-bold text-gray-600">Total Referrals</p>
                <p className="text-4xl font-bold text-gray-900">{statistics.totalReferrals}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-600"
          >
            <div className="flex items-center">
              <TrendingUp className="h-12 w-12 text-green-600" />
              <div className="ml-6">
                <p className="text-lg font-bold text-gray-600">Active Referrals</p>
                <p className="text-4xl font-bold text-gray-900">{statistics.activeReferrals}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-yellow-600"
          >
            <div className="flex items-center">
              <DollarSign className="h-12 w-12 text-yellow-600" />
              <div className="ml-6">
                <p className="text-lg font-bold text-gray-600">Total Earned</p>
                <p className="text-4xl font-bold text-gray-900">${statistics.totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-orange-600"
          >
            <div className="flex items-center">
              <Clock className="h-12 w-12 text-orange-600" />
              <div className="ml-6">
                <p className="text-lg font-bold text-gray-600">Pending</p>
                <p className="text-4xl font-bold text-gray-900">${statistics.pendingEarnings.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-xl p-10 mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Tier Progress</h3>
              <Award className="h-10 w-10 text-yellow-600" />
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between text-xl font-bold text-gray-600 mb-4">
                <span>{currentTier.name} Tier ({currentTier.rate}%)</span>
                <span>{nextTier.name} Tier ({nextTier.rate}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-blue-600 h-6 rounded-full transition-all duration-300"
                  style={{ width: `${nextTier.progress}%` }}
                ></div>
              </div>
              <p className="text-lg font-bold text-gray-700 mt-4">
                {nextTier.requirement - statistics.activeReferrals} more active referrals needed for {nextTier.name} tier
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Recent Commissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-xl"
          >
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Recent Commissions</h3>
            </div>
            <div className="p-8">
              {recentCommissions && recentCommissions.length > 0 ? (
                <div className="space-y-6">
                  {recentCommissions.map((commission, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          ${commission.commissionAmount.toFixed(2)}
                        </p>
                        <p className="text-lg text-gray-600">
                          From {commission.referredUser.firstName} {commission.referredUser.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-lg">No commissions yet</p>
              )}
            </div>
          </motion.div>

          {/* Referred Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-xl"
          >
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Your Referrals</h3>
            </div>
            <div className="p-8">
              {referredUsers && referredUsers.length > 0 ? (
                <div className="space-y-6">
                  {referredUsers.slice(0, 5).map((referral, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {referral.user.firstName} {referral.user.lastName}
                        </p>
                        <p className="text-lg text-gray-600">
                          Joined {new Date(referral.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(referral.status)}`}>
                          {referral.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          ${referral.totalSpent.toFixed(2)} spent
                        </p>
                      </div>
                    </div>
                  ))}
                  {referredUsers.length > 5 && (
                    <p className="text-lg text-gray-500 text-center pt-4">
                      And {referredUsers.length - 5} more...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-lg">No referrals yet</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboardPage;