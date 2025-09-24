import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Share2,
  Gift,
  Users,
  DollarSign,
  Copy,
  CheckCircle,
  Star,
  TrendingUp,
  LogIn,
  UserPlus,
  Shield,
  Heart,
  X,
  Award,
  Clock,
  Wallet,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import VoucherExchange from '../components/VoucherExchange';

const ReferralPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState({
    hasReferralCode: false,
    referralCode: '',
    referralLink: '',
    shareText: '',
    stats: {
      totalReferrals: 0,
      totalPoints: 0,
      pendingPoints: 0,
      tier: 'Bronze'
    },
    statistics: {
      totalReferrals: 0,
      activeReferrals: 0
    },
    currentTier: null,
    nextTier: null
  });
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Only redirect referral users (property agents) to their dashboard
  useEffect(() => {
    if (user && user.role === 'referral') {
      navigate('/referral-dashboard');
    }
  }, [user, navigate]);

  // Load referral data for logged-in customers
  useEffect(() => {
    if (user && user.role === 'customer') {
      loadReferralData();
      loadWalletData();
    }
  }, [user]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Map the new API response structure to the expected frontend structure
        const mappedData = {
          ...data,
          stats: {
            totalReferrals: data.statistics?.totalReferrals || 0,
            totalPoints: data.statistics?.totalEarned || 0, // Map totalEarned to totalPoints
            pendingPoints: data.statistics?.pendingEarnings || 0, // Map pendingEarnings to pendingPoints
            pointsBalance: data.statistics?.pointsBalance || 0, // Add pointsBalance
            tier: data.currentTier?.name || 'Bronze'
          }
        };
        
        setReferralData(mappedData);
        
        // Set recent activity from referral transactions
        setRecentActivity(data.recentTransactions || []);
        
        // If user has referral code, get share link
        if (data.hasReferralCode) {
          const linkResponse = await fetch('/api/referral/share-link', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            setReferralData(prev => ({
              ...prev,
              referralLink: linkData.referralLink,
              shareText: linkData.shareText
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const generateReferralCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/generate-code', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralData(prev => ({
          ...prev,
          hasReferralCode: true,
          referralCode: data.referral.code,
          stats: {
            totalReferrals: data.referral.totalReferrals,
            totalPoints: data.referral.totalPointsEarned || 0,
            pendingPoints: data.referral.pendingPoints || 0,
            tier: data.referral.tierName
          }
        }));
        toast.success('Referral code generated successfully!');
        loadReferralData(); // Reload to get share link
      }
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      toast.error('Failed to generate referral code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareOnSocial = (platform) => {
    const text = encodeURIComponent(referralData.shareText);
    const url = encodeURIComponent(referralData.referralLink);
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // This page works for both logged-in customers and non-logged-in users
  return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading state for customers */}
        {user && user.role === 'customer' && loading && (
          <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your referral dashboard...</p>
            </div>
          </div>
        )}

        {/* Customer Dashboard Section - Show for logged-in customers */}
        {user && user.role === 'customer' && !loading && (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-0">
            {/* Enhanced Customer Referral Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20 mb-12 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-black/5"></div>

              {/* Subtle Floating Elements */}
              <div className="absolute top-8 right-8 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
              <div className="absolute bottom-8 left-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-md"></div>

              <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="text-center">
                  {/* Welcome Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/20">
                    <Gift className="w-5 h-5" />
                    <span className="text-sm font-semibold">Your Personal Dashboard</span>
                  </div>

                  <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text">
                    Your Referral Dashboard
                  </h1>
                  <p className="text-xl text-orange-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                    🎯 Earn points by referring friends to Swift Fix Pro and unlock amazing rewards
                  </p>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              {/* Enhanced Referral Code Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl p-10 mb-12 border border-orange-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Your Referral Tools</h2>
                      <p className="text-gray-600">Share with friends to earn rewards</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                      🏆 Points System
                    </span>
                  </div>
                </div>
                
                {referralData.hasReferralCode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Copy className="w-4 h-4 text-white" />
                        </div>
                        <label className="text-lg font-bold text-gray-700">
                          Referral Code
                        </label>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={referralData.referralCode}
                          readOnly
                          className="flex-1 rounded-l-xl border-2 border-gray-300 px-4 py-3 bg-gray-50 text-xl font-mono font-bold text-center tracking-wider focus:border-blue-500 transition-colors"
                        />
                        <motion.button
                          onClick={() => copyToClipboard(referralData.referralCode)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-3 bg-blue-600 text-white border-2 border-blue-600 rounded-r-xl hover:bg-blue-700 transition-colors"
                        >
                          <Copy className="h-5 w-5" />
                        </motion.button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Short code for quick sharing</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <label className="text-lg font-bold text-gray-700">
                          Referral Link
                        </label>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={referralData.referralLink}
                          readOnly
                          className="flex-1 rounded-l-xl border-2 border-gray-300 px-4 py-3 bg-gray-50 text-sm focus:border-orange-500 transition-colors"
                        />
                        <motion.button
                          onClick={() => copyToClipboard(referralData.referralLink)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-3 bg-orange-600 text-white border-2 border-orange-600 rounded-r-xl hover:bg-orange-700 transition-colors"
                        >
                          <Share2 className="h-5 w-5" />
                        </motion.button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Full trackable link with analytics</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Get Your Referral Code</h3>
                    <p className="text-gray-600 mb-6">Generate your unique referral code and start earning points</p>
                    <button
                      onClick={generateReferralCode}
                      disabled={loading}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate My Referral Code'}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="h-10 w-10 text-blue-200" />
                      <span className="text-blue-200 text-sm font-medium">👥</span>
                    </div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Referrals</p>
                    <p className="text-4xl font-bold">{referralData.stats?.totalReferrals || 0}</p>
                    <div className="mt-2 text-blue-200 text-xs">
                      +{Math.floor(Math.random() * 3) + 1} this week
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Star className="h-10 w-10 text-green-200" />
                      <span className="text-green-200 text-sm font-medium">⭐</span>
                    </div>
                    <p className="text-green-100 text-sm font-medium mb-1">Points Earned</p>
                    <p className="text-4xl font-bold">{referralData.stats?.totalPoints || 0}</p>
                    <div className="mt-2 text-green-200 text-xs">
                      Lifetime total earned
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-10 w-10 text-orange-200" />
                      <span className="text-orange-200 text-sm font-medium">🔥</span>
                    </div>
                    <p className="text-orange-100 text-sm font-medium mb-1">Available Points</p>
                    <p className="text-4xl font-bold">{referralData.stats?.pointsBalance || 0}</p>
                    <div className="mt-2 text-orange-200 text-xs">
                      Ready to redeem
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Referral Dashboard for Customer */}
              {referralData.hasReferralCode && (
                <div className="space-y-8">
                  {/* Performance Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl shadow-xl p-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">{referralData.statistics?.totalReferrals || 0}</div>
                        <div className="text-lg text-gray-600">Total Referrals</div>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">{referralData.statistics?.activeReferrals || 0}</div>
                        <div className="text-lg text-gray-600">Active Referrals</div>
                      </div>
                      <div className="text-center p-6 bg-orange-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">{referralData.currentTier?.name || 'Bronze'}</div>
                        <div className="text-lg text-gray-600">Current Tier</div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-xl shadow-xl p-8"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                      {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                          {recentActivity.slice(0, 5).map((activity, index) => {
                            // Handle different activity types - points transactions vs commissions
                            const isPointsTransaction = activity.type === 'EARNED_REFERRAL' || activity.points;
                            const referredUserName = isPointsTransaction 
                              ? activity.metadata?.referredUser
                              : activity.referredUser;
                            
                            return (
                              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-3 ${
                                    isPointsTransaction 
                                      ? (activity.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500')
                                      : (activity.status === 'PAID' ? 'bg-green-500' : 
                                         activity.status === 'APPROVED' ? 'bg-blue-500' : 'bg-yellow-500')
                                  }`}></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {isPointsTransaction 
                                        ? `🎉 Earned ${activity.points} points from ${referredUserName?.firstName || 'Unknown'} ${referredUserName?.lastName || 'User'}`
                                        : `Points from ${activity.referredUser?.firstName} ${activity.referredUser?.lastName}`
                                      }
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {isPointsTransaction && activity.description 
                                        ? activity.description 
                                        : new Date(activity.createdAt).toLocaleDateString()
                                      }
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-green-600">
                                  +{isPointsTransaction ? activity.points : activity.commissionAmount} pts
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">📊</div>
                          <div className="text-sm text-gray-600">No activity yet</div>
                          <div className="text-xs text-gray-500">Start referring friends to see activity here</div>
                        </div>
                      )}
                    </motion.div>

                    {/* Points Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-xl shadow-xl p-8"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Points Summary</h3>
                      <div className="space-y-6">
                        <div className="flex justify-between">
                          <span className="text-lg text-gray-600">Total Points Earned</span>
                          <span className="font-bold text-gray-900 text-lg">{referralData.stats?.totalPoints || 0} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lg text-gray-600">Pending Points</span>
                          <span className="font-bold text-yellow-600 text-lg">{referralData.stats?.pendingPoints || 0} pts</span>
                        </div>
                        <hr />
                        <div className="flex justify-between">
                          <span className="text-lg text-gray-600">Available Points</span>
                          <span className="font-bold text-green-600 text-lg">
                            {referralData.stats?.pointsBalance || 0} pts
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                        <h4 className="text-lg font-bold text-orange-800 mb-2">Redeem Your Points</h4>
                        <p className="text-sm text-orange-600 mb-3">
                          Use your points for discounts on future services!
                        </p>
                        <p className="text-xs text-orange-500">
                          100 points = $10 discount • Contact support to redeem
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Tier Progress */}
                  {referralData.nextTier && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white rounded-xl shadow-xl p-8"
                    >
                      <div className="flex items-center mb-6">
                        <Award className="w-8 w-8 text-yellow-600 mr-3" />
                        <h3 className="text-2xl font-bold text-gray-900">Tier Progress</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-lg">
                          <span>Current: {referralData.currentTier?.name}</span>
                          <span>Next: {referralData.nextTier?.name}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-orange-500 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(referralData.nextTier?.progress || 0, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {referralData.statistics?.activeReferrals} / {referralData.nextTier?.requirement} referrals
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-xl shadow-xl mb-8"
                  >
                    <div className="border-b border-gray-200">
                      <nav className="flex space-x-8 px-8">
                        <button
                          onClick={() => setActiveTab('overview')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'overview'
                              ? 'border-orange-500 text-orange-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Star className="inline w-4 h-4 mr-2" />
                          Overview
                        </button>
                        <button
                          onClick={() => setActiveTab('vouchers')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'vouchers'
                              ? 'border-orange-500 text-orange-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Gift className="inline w-4 h-4 mr-2" />
                          Voucher Exchange
                        </button>
                        <button
                          onClick={() => setActiveTab('actions')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'actions'
                              ? 'border-orange-500 text-orange-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Share2 className="inline w-4 h-4 mr-2" />
                          Share & Actions
                        </button>
                      </nav>
                    </div>

                    <div className="p-8">
                      {activeTab === 'overview' && (
                        <div className="space-y-8">
                          {/* Performance Stats */}
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center p-6 bg-blue-50 rounded-lg">
                                <div className="text-3xl font-bold text-blue-600">{referralData.statistics?.totalReferrals || 0}</div>
                                <div className="text-lg text-gray-600">Total Referrals</div>
                              </div>
                              <div className="text-center p-6 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-600">{referralData.statistics?.activeReferrals || 0}</div>
                                <div className="text-lg text-gray-600">Active Referrals</div>
                              </div>
                              <div className="text-center p-6 bg-orange-50 rounded-lg">
                                <div className="text-3xl font-bold text-orange-600">{referralData.currentTier?.name || 'Bronze'}</div>
                                <div className="text-lg text-gray-600">Current Tier</div>
                              </div>
                            </div>
                          </div>

                          {/* Points Summary */}
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Points Summary</h3>
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                              <div className="space-y-4">
                                <div className="flex justify-between">
                                  <span className="text-lg text-gray-600">Total Points Earned</span>
                                  <span className="font-bold text-gray-900 text-lg">{referralData.stats?.totalPoints || 0} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-lg text-gray-600">Pending Points</span>
                                  <span className="font-bold text-yellow-600 text-lg">{referralData.stats?.pendingPoints || 0} pts</span>
                                </div>
                                <hr />
                                <div className="flex justify-between">
                                  <span className="text-lg text-gray-600">Available Points</span>
                                  <span className="font-bold text-green-600 text-lg">
                                    {referralData.stats?.pointsBalance || 0} pts
                                  </span>
                                </div>
                              </div>

                              <div className="mt-6 p-4 bg-orange-100 rounded-lg">
                                <h4 className="text-lg font-bold text-orange-800 mb-2">💰 Redeem Your Points</h4>
                                <p className="text-sm text-orange-600 mb-3">
                                  Exchange your points for discount vouchers!
                                </p>
                                <button
                                  onClick={() => setActiveTab('vouchers')}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                                >
                                  Exchange Points
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                            {recentActivity.length > 0 ? (
                              <div className="space-y-4">
                                {recentActivity.slice(0, 5).map((activity, index) => {
                                  const isPointsTransaction = activity.type === 'EARNED_REFERRAL' || activity.points;
                                  const referredUserName = isPointsTransaction
                                    ? activity.metadata?.referredUser
                                    : activity.referredUser;

                                  return (
                                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                      <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                          isPointsTransaction
                                            ? (activity.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500')
                                            : (activity.status === 'PAID' ? 'bg-green-500' :
                                               activity.status === 'APPROVED' ? 'bg-blue-500' : 'bg-yellow-500')
                                        }`}></div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {isPointsTransaction
                                              ? `🎉 Earned ${activity.points} points from ${referredUserName?.firstName || 'Unknown'} ${referredUserName?.lastName || 'User'}`
                                              : `Points from ${activity.referredUser?.firstName} ${activity.referredUser?.lastName}`
                                            }
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {isPointsTransaction && activity.description
                                              ? activity.description
                                              : new Date(activity.createdAt).toLocaleDateString()
                                            }
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold text-green-600">
                                        +{isPointsTransaction ? activity.points : activity.commissionAmount} pts
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">📊</div>
                                <div className="text-sm text-gray-600">No activity yet</div>
                                <div className="text-xs text-gray-500">Start referring friends to see activity here</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'vouchers' && (
                        <VoucherExchange onVoucherCreated={(voucher) => {
                          toast.success(`Voucher ${voucher.code} created successfully!`);
                          // Optionally refresh referral data to update points balance
                          loadReferralData();
                        }} />
                      )}

                      {activeTab === 'actions' && (
                        <div className="space-y-8">
                          {/* Quick Actions */}
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Share Your Referral</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                              >
                                <Share2 className="w-5 h-5 mr-2" />
                                Share on Social
                              </button>
                              <button
                                onClick={copyReferralLink}
                                className="flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold"
                              >
                                <Copy className="w-5 h-5 mr-2" />
                                Copy Link
                              </button>
                              <button
                                onClick={() => copyToClipboard(referralData.referralCode)}
                                className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                              >
                                <Copy className="w-5 h-5 mr-2" />
                                Copy Code
                              </button>
                            </div>
                          </div>

                          {/* How It Works */}
                          <div className="p-6 bg-gray-50 rounded-lg">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">How It Works</h4>
                            <div className="space-y-3 text-sm text-gray-600">
                              <div className="flex items-start">
                                <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">1</span>
                                <span>Share your referral code or link with friends</span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">2</span>
                                <span>They sign up and make their first purchase</span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">3</span>
                                <span>You earn {referralData.currentTier?.points || 20} points when they complete their first order</span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">4</span>
                                <span>Exchange points for discount vouchers on your future services</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Hero Section - Show only for non-logged-in users */}
        {!user && (
          <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white py-20 overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>

            <div className="relative max-w-7xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/30">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-semibold">Join Our Referral Program</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  Earn with Swift Fix Pro
                </h1>
                <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Turn your network into income! Join our referral program and earn rewards by connecting people with quality home maintenance services.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Get Started Today
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Already Have Account?
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Enhanced Benefits Section - Show only for non-logged-in users */}
        {!user && (
          <div className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Join Our Program?</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  We believe in rewarding loyalty and helping our community grow together.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <DollarSign className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Rewards</h3>
                  <p className="text-gray-600">
                    Earn up to 15% commission on every successful referral with our tiered reward system.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Zap className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Payouts</h3>
                  <p className="text-gray-600">
                    Fast and reliable payouts through multiple payment methods including bank transfer and PayPal.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Target className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Tracking</h3>
                  <p className="text-gray-600">
                    Real-time dashboard to track your referrals, earnings, and performance with detailed analytics.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Heart className="w-12 h-12 text-red-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Lifetime Earnings</h3>
                  <p className="text-gray-600">
                    Earn from your referrals for life! Continue earning as your referred customers use our services.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Marketing Sections - Show only for non-logged-in users */}
        {!user && (
          <div className="container mx-auto px-4 py-16">
            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How Our Referral Program Works</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                It's simple! Share Swift Fix Pro with your friends and family, and earn rewards when they join our community.
              </p>
            </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up & Get Your Link</h3>
              <p className="text-gray-600">
                Create your Swift Fix Pro account and receive your unique referral link to share with friends.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Share With Friends</h3>
              <p className="text-gray-600">
                Invite friends and family to try our professional property maintenance services using your link.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Earn Rewards</h3>
              <p className="text-gray-600">
                Get points when your friends register and complete their first service with us.
              </p>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Referral Benefits</h2>
              <p className="text-lg text-gray-600">
                Everyone wins when you share Swift Fix Pro!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Gift className="w-6 h-6 text-orange-600 mr-2" />
                  For You (Referrer)
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Earn 20 points for each successful referral</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Unlock bonus points at milestone levels (50-200 points)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Redeem points for discounts and rewards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Help friends discover reliable property services</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Heart className="w-6 h-6 text-red-500 mr-2" />
                  For Your Friends
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Get 10% discount on their first service</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Access to verified professional contractors</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Quality guaranteed property maintenance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>24/7 customer support and service tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Reward Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Reward Tiers</h2>
              <p className="text-lg text-gray-600">
                The more friends you refer, the more rewards you earn!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { tier: 'Starter', referrals: '1 referral', reward: '20 pts', color: 'bg-gray-500' },
                { tier: 'Bronze', referrals: '5 referrals', reward: '50 pts bonus', color: 'bg-orange-600' },
                { tier: 'Silver', referrals: '10 referrals', reward: '100 pts bonus', color: 'bg-gray-400' },
                { tier: 'Gold', referrals: '20 referrals', reward: '200 pts bonus', color: 'bg-yellow-500' }
              ].map((tier, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className={`w-12 h-12 ${tier.color} text-white rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{tier.tier}</h3>
                  <p className="text-gray-600 mb-2">{tier.referrals}</p>
                  <p className="text-xl font-bold text-green-600">{tier.reward}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Professional Commission Tiers - Show only for non-logged-in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-16"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Commission Tiers</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  For referral agents and property agents: The more you refer, the higher your commission rates!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-8 border-2 border-amber-200 hover:shadow-xl transition-shadow"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Bronze Tier</h3>
                    <p className="text-amber-700 font-bold text-lg mb-4">5% Commission</p>
                    <p className="text-gray-600 mb-6">Perfect for getting started with referrals</p>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li>• 1-5 active referrals</li>
                      <li>• 5% commission rate</li>
                      <li>• Basic tracking tools</li>
                      <li>• Email support</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 border-2 border-gray-300 hover:shadow-xl transition-shadow transform scale-105"
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">POPULAR</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Silver Tier</h3>
                    <p className="text-gray-700 font-bold text-lg mb-4">10% Commission</p>
                    <p className="text-gray-600 mb-6">Great for active referrers</p>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li>• 6-15 active referrals</li>
                      <li>• 10% commission rate</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                      <li>• Custom referral links</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8 border-2 border-yellow-300 hover:shadow-xl transition-shadow"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Gold Tier</h3>
                    <p className="text-yellow-700 font-bold text-lg mb-4">15% Commission</p>
                    <p className="text-gray-600 mb-6">For our top referral partners</p>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li>• 16+ active referrals</li>
                      <li>• 15% commission rate</li>
                      <li>• Premium dashboard</li>
                      <li>• Dedicated account manager</li>
                      <li>• Bonus incentives</li>
                      <li>• Early access to new features</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* FAQ Section - Show only for non-logged-in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-16"
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                  <p className="text-xl text-gray-600">
                    Everything you need to know about our referral program
                  </p>
                </div>

                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-3">How do I get paid?</h3>
                    <p className="text-gray-600">
                      We offer multiple payout methods including bank transfer, PayPal, and direct deposit.
                      Payouts are processed monthly with a minimum threshold of $50.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-3">When do I earn commission?</h3>
                    <p className="text-gray-600">
                      You earn commission when someone uses your referral code to sign up and completes their first service booking.
                      Commissions are credited to your account within 48 hours of service completion.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Can I track my referrals?</h3>
                    <p className="text-gray-600">
                      Yes! Our comprehensive dashboard provides real-time tracking of your referrals, earnings,
                      click-through rates, and conversion statistics. You'll have full visibility into your performance.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Is there a limit to how much I can earn?</h3>
                    <p className="text-gray-600">
                      There's no limit! The more people you refer, the more you earn. Our tier system actually increases
                      your commission rate as you refer more people, so your earning potential grows over time.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trust & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-16"
          >
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted & Secure</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Swift Fix Pro is a trusted platform with verified contractors, secure payments, and quality guarantees.
                Your friends will thank you for introducing them to reliable property maintenance services.
              </p>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-xl mb-8">
              Join Swift Fix Pro today and start sharing the benefits with your friends!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Free Account
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-orange-800 text-white font-semibold rounded-lg hover:bg-orange-900 border-2 border-white transition-colors"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Already Have Account? Login
              </Link>
            </div>
          </motion.div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Share Your Referral Link</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your Referral Link</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={referralData.referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-3 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 transition-colors font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Share on Social Media</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => shareOnSocial('facebook')}
                      className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                    >
                      📘 Facebook
                    </button>
                    <button
                      onClick={() => shareOnSocial('twitter')}
                      className="flex items-center justify-center px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-bold"
                    >
                      🐦 Twitter
                    </button>
                    <button
                      onClick={() => shareOnSocial('linkedin')}
                      className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-bold"
                    >
                      💼 LinkedIn
                    </button>
                    <button
                      onClick={() => shareOnSocial('whatsapp')}
                      className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Withdraw Modal - for future implementation */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Points Redemption</h3>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-orange-50 rounded-lg p-6 text-center">
                  <Wallet className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                  <div className="text-sm text-orange-600 font-bold">Available Points</div>
                  <div className="text-3xl font-bold text-orange-900 mb-2">
                    {referralData.stats?.pointsBalance || 0} pts
                  </div>
                  <div className="text-sm text-orange-600">
                    ≈ ${((referralData.stats?.pointsBalance || 0) / 10).toFixed(2)} value
                  </div>
                </div>
                
                <div className="text-center">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Coming Soon!</h4>
                  <p className="text-gray-600 mb-4">
                    Points redemption system is under development. You'll soon be able to redeem points for:
                  </p>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• Service discounts</li>
                    <li>• Account credits</li>
                    <li>• Exclusive offers</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
};

export default ReferralPage;
