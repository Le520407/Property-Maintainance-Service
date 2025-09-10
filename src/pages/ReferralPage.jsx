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
  Heart
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
    stats: {
      totalReferrals: 0,
      totalPoints: 0,
      pendingPoints: 0
    }
  });
  const [loading, setLoading] = useState(false);
  
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
    }
  }, [user]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const response = await api.referral.getDashboard();
      setReferralData({
        hasReferralCode: response.hasReferralCode,
        referralCode: response.referralCode || '',
        referralLink: response.referralLink || '',
        stats: {
          totalReferrals: response.statistics?.totalReferrals || 0,
          totalPoints: response.statistics?.totalPoints || 0,
          pendingPoints: response.statistics?.pendingPoints || 0
        }
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      setLoading(true);
      await api.referral.generateCode();
      await loadReferralData();
      toast.success('Referral code generated successfully!');
    } catch (error) {
      toast.error('Error generating referral code');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // This page works for both logged-in customers and non-logged-in users
  return (
      <div className="min-h-screen bg-gray-50">
        {/* Customer Dashboard Section - Show for logged-in customers */}
        {user && user.role === 'customer' && (
          <section className="pt-20 pb-8">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8 mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Referral Dashboard</h1>
                    <p className="text-gray-600">Earn points by referring friends to Swift Fix Pro</p>
                  </div>
                  <Gift className="w-12 h-12 text-orange-600" />
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{referralData.stats.totalReferrals}</div>
                    <div className="text-sm text-gray-600">Total Referrals</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{referralData.stats.totalPoints}</div>
                    <div className="text-sm text-gray-600">Points Earned</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{referralData.stats.pendingPoints}</div>
                    <div className="text-sm text-gray-600">Pending Points</div>
                  </div>
                </div>

                {/* Referral Code Section */}
                {referralData.hasReferralCode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Code</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={referralData.referralCode}
                          readOnly
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-lg font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(referralData.referralCode)}
                          className="px-4 py-3 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={referralData.referralLink}
                          readOnly
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(referralData.referralLink)}
                          className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
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
            </div>
          </section>
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
                Get cash rewards when your friends register and complete their first service with us.
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
      </div>
    );
};

export default ReferralPage;
