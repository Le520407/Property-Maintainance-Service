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
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

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
          <div className="min-h-screen bg-gray-50 pt-8">
            {/* Customer Referral Header */}
            <div className="bg-orange-600 text-white py-16 mb-12">
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="text-center">
                  <h1 className="text-6xl font-bold mb-6">Your Referral Dashboard</h1>
                  <p className="text-2xl text-orange-100 mb-8 max-w-4xl mx-auto">
                    Earn points by referring friends to Swift Fix Pro and unlock amazing rewards
                  </p>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              {/* Referral Code Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-xl p-10 mb-12"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Your Referral Code</h2>
                  <Gift className="w-12 h-12 text-orange-600" />
                </div>
                
                {referralData.hasReferralCode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-4">
                        Referral Code
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={referralData.referralCode}
                          readOnly
                          className="flex-1 rounded-l-lg border border-gray-300 px-6 py-4 bg-gray-50 text-xl font-mono font-bold"
                        />
                        <button
                          onClick={() => copyToClipboard(referralData.referralCode)}
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
                          value={referralData.referralLink}
                          readOnly
                          className="flex-1 rounded-l-lg border border-gray-300 px-6 py-4 bg-gray-50 text-base"
                        />
                        <button
                          onClick={() => copyToClipboard(referralData.referralLink)}
                          className="px-6 py-4 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors"
                        >
                          <Share2 className="h-6 w-6" />
                        </button>
                      </div>
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
                      <p className="text-4xl font-bold text-gray-900">{referralData.stats?.totalReferrals || 0}</p>
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
                    <Star className="h-12 w-12 text-green-600" />
                    <div className="ml-6">
                      <p className="text-lg font-bold text-gray-600">Points Earned</p>
                      <p className="text-4xl font-bold text-gray-900">{referralData.stats?.totalPoints || 0}</p>
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
                    <TrendingUp className="h-12 w-12 text-orange-600" />
                    <div className="ml-6">
                      <p className="text-lg font-bold text-gray-600">Pending Points</p>
                      <p className="text-4xl font-bold text-gray-900">{referralData.stats?.pendingPoints || 0}</p>
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

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-xl shadow-xl p-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
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

                    {/* How It Works */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
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
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero Section - Show only for non-logged-in users */}
        {!user && (
          <section className="bg-gradient-to-r from-orange-600 to-purple-600 text-white py-16">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <Gift className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Referral Program
                </h1>
                <p className="text-xl mb-8 max-w-2xl mx-auto">
                  Earn points by referring friends to Swift Fix Pro! Join our community and get rewarded for sharing great property maintenance services.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Login to Get Started
                  </Link>
                  <Link 
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-3 bg-orange-800 text-white font-semibold rounded-lg hover:bg-orange-900 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Join Swift Fix Pro
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        )}

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

          {/* Trust & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
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
