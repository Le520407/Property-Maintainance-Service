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
  Gift,
  Wallet,
  Plus,
  Eye,
  Shield,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const ReferralDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [referralLinks, setReferralLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchShareData();
    fetchWalletData();
    fetchFraudAlerts();
    fetchCommissionHistory();
    fetchReferralLinks();
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

  const fetchWalletData = async () => {
    try {
      const data = await api.referral.getWallet();
      setWalletData(data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const data = await api.referral.getFraudAlerts();
      setFraudAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
    }
  };

  const fetchCommissionHistory = async () => {
    try {
      const data = await api.referral.getCommissions();
      setCommissionHistory(data.commissions || []);
    } catch (error) {
      console.error('Error fetching commission history:', error);
    }
  };

  const fetchReferralLinks = async () => {
    try {
      const data = await api.referral.getLinks();
      setReferralLinks(data.links || []);
    } catch (error) {
      console.error('Error fetching referral links:', error);
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

  const handlePayoutRequest = async (payoutData) => {
    try {
      await api.referral.requestPayout(payoutData);
      await fetchWalletData();
      setShowPayoutModal(false);
      toast.success('Payout request submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Error requesting payout');
      console.error('Error:', error);
    }
  };

  const handleCreateAdvancedLink = async (linkData) => {
    try {
      await api.referral.generateAdvancedLink(linkData);
      await fetchReferralLinks();
      setShowLinkModal(false);
      toast.success('Advanced link created successfully!');
    } catch (error) {
      toast.error(error.message || 'Error creating advanced link');
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
            
            {/* Tab Navigation */}
            <div className="flex justify-center space-x-8 mt-8">
              {['overview', 'wallet', 'commissions', 'links', 'alerts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-orange-600'
                      : 'bg-orange-700 text-orange-100 hover:bg-orange-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
            className="bg-white rounded-xl shadow-lg p-8"
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
            className="bg-white rounded-xl shadow-lg p-8"
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
            className="bg-white rounded-xl shadow-lg p-8"
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
            className="bg-white rounded-xl shadow-lg p-8"
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
          </>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && walletData && (
          <div className="space-y-8">
            {/* Wallet Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Wallet Overview</h2>
                <Wallet className="h-10 w-10 text-green-600" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                  <p className="text-sm font-bold text-green-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900">${walletData.wallet.totalEarnings.toFixed(2)}</p>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-600">
                  <p className="text-sm font-bold text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">${walletData.wallet.pendingEarnings.toFixed(2)}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                  <p className="text-sm font-bold text-blue-600">Available for Payout</p>
                  <p className="text-3xl font-bold text-gray-900">${walletData.wallet.availableForPayout.toFixed(2)}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-600">
                  <p className="text-sm font-bold text-gray-600">Total Paid</p>
                  <p className="text-3xl font-bold text-gray-900">${walletData.wallet.totalPaid.toFixed(2)}</p>
                </div>
              </div>

              {walletData.wallet.availableForPayout >= walletData.minimumPayout && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                  >
                    <CreditCard className="inline-block h-5 w-5 mr-2" />
                    Request Payout
                  </button>
                </div>
              )}
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-xl"
            >
              <div className="p-8 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="p-8">
                {walletData.recentTransactions?.length > 0 ? (
                  <div className="space-y-4">
                    {walletData.recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            ${transaction.commissionAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            From {transaction.referredUser?.firstName} {transaction.referredUser?.lastName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl"
          >
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900">Commission History</h2>
            </div>
            <div className="p-8">
              {commissionHistory.length > 0 ? (
                <div className="space-y-4">
                  {commissionHistory.map((commission, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            ${commission.commissionAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Commission from {commission.referredUser?.firstName} {commission.referredUser?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Order Value: ${commission.orderAmount.toFixed(2)} • Rate: {commission.commissionRate}%
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No commissions yet</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Referral Links</h2>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="inline-block h-5 w-5 mr-2" />
                  Create Advanced Link
                </button>
              </div>
              
              {referralLinks.length > 0 ? (
                <div className="space-y-4">
                  {referralLinks.map((link, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{link.campaign?.name || 'Default Campaign'}</p>
                          <p className="text-sm text-gray-600 font-mono">{link.shortUrl}</p>
                          <p className="text-sm text-gray-500">
                            Clicks: {link.totalClicks} • Created: {new Date(link.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(link.shortUrl)}
                            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No custom links created yet</p>
              )}
            </motion.div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl"
          >
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Security Alerts</h2>
              </div>
            </div>
            <div className="p-8">
              {fraudAlerts.length > 0 ? (
                <div className="space-y-4">
                  {fraudAlerts.map((alert, index) => (
                    <div key={index} className={`border-l-4 p-4 rounded-lg ${
                      alert.severity === 'CRITICAL' ? 'border-red-600 bg-red-50' :
                      alert.severity === 'HIGH' ? 'border-orange-600 bg-orange-50' :
                      'border-yellow-600 bg-yellow-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{alert.type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Risk Score: {alert.riskScore}% • {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                          alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-bold text-gray-900">All Clear!</p>
                  <p className="text-gray-500">No security alerts for your referrals</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Payout Modal */}
        {showPayoutModal && <PayoutModal onClose={() => setShowPayoutModal(false)} onSubmit={handlePayoutRequest} walletData={walletData} />}
        
        {/* Advanced Link Modal */}
        {showLinkModal && <AdvancedLinkModal onClose={() => setShowLinkModal(false)} onSubmit={handleCreateAdvancedLink} />}
      </div>
    </div>
  );
};

// Payout Request Modal Component
const PayoutModal = ({ onClose, onSubmit, walletData }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'BANK_TRANSFER',
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      accountHolderName: ''
    },
    paypalEmail: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Request Payout</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-bold">Available for Payout</p>
          <p className="text-2xl font-bold text-green-900">
            ${walletData?.wallet?.availableForPayout?.toFixed(2) || '0.00'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          {formData.paymentMethod === 'BANK_TRANSFER' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountHolderName}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.routingNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, routingNumber: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </>
          )}

          {formData.paymentMethod === 'PAYPAL' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                PayPal Email
              </label>
              <input
                type="email"
                value={formData.paypalEmail}
                onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Advanced Link Creation Modal Component
const AdvancedLinkModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    campaign: '',
    source: 'direct',
    medium: 'referral',
    content: '',
    term: '',
    expiresAt: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create Advanced Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="e.g. Facebook Ads"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Source
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="e.g. facebook, twitter, email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Medium
            </label>
            <input
              type="text"
              value={formData.medium}
              onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="e.g. social, email, cpc"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Content (Optional)
            </label>
            <input
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Ad content or version"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              Create Link
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReferralDashboardPage;