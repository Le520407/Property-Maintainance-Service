import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Gift, 
  Users, 
  DollarSign, 
  Copy,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const referralCode = 'SWIFT123';
  const referralLink = `https://swiftfixpro.com/ref/${referralCode}`;
  
  const stats = [
    { title: 'Referred Users', value: '12', icon: Users, color: 'bg-orange-500' },
    { title: 'Total Rewards', value: '¥240', icon: Gift, color: 'bg-green-500' },
    { title: 'Pending Confirmation', value: '3', icon: CheckCircle, color: 'bg-yellow-500' },
    { title: 'Cumulative Earnings', value: '¥480', icon: DollarSign, color: 'bg-purple-500' }
  ];

  const rewards = [
    {
      level: 1,
      requirement: 'Refer 1 user to register',
      reward: '¥20 cash reward',
      status: 'completed'
    },
    {
      level: 2,
      requirement: 'Refer 5 users to register',
      reward: '¥50 cash reward',
      status: 'completed'
    },
    {
      level: 3,
      requirement: 'Refer 10 users to register',
      reward: '¥100 cash reward',
      status: 'in-progress'
    },
    {
      level: 4,
      requirement: 'Refer 20 users to register',
      reward: '¥200 cash reward',
      status: 'locked'
    }
  ];

  const referrals = [
    {
      id: 1,
      name: 'Mr. Zhang',
      date: '2024-01-15',
      status: 'completed',
      reward: '¥20'
    },
    {
      id: 2,
      name: 'Ms. Li',
      date: '2024-01-12',
      status: 'completed',
      reward: '¥20'
    },
    {
      id: 3,
      name: 'Mr. Wang',
      date: '2024-01-10',
      status: 'pending',
      reward: '¥20'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'rewards', name: 'Reward Levels' },
    { id: 'referrals', name: 'Referral History' }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Copy failed, please copy manually');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Swift Fix Pro - Property Maintenance Services',
        text: 'Check out Swift Fix Pro, a professional property maintenance platform!',
        url: referralLink
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Referral Program
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Invite friends to use Swift Fix Pro and earn rewards! Get a cash bonus for every successful referral.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${stat.color} text-white rounded-full mb-4`}>
                <stat.icon size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.title}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Referral Link */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={referralCode}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode);
                        toast.success('Referral code copied');
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Link
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} />
                    Share Link
                  </button>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Share your referral link</h4>
                    <p className="text-gray-600 mt-1">Send your personalized referral link to friends</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Friends register</h4>
                    <p className="text-gray-600 mt-1">Friends register and complete their first service using your link</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Earn rewards</h4>
                    <p className="text-gray-600 mt-1">You receive a cash reward after your friend completes their service</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Rewards Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Gift className="mr-2 text-yellow-500" />
                Reward Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-green-800">Base Reward</div>
                    <div className="text-sm text-green-600">Earn ¥20 per referral</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">¥20</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-orange-800">Bonus Rewards</div>
                    <div className="text-sm text-orange-600">Reach levels to unlock extra cash</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">¥50-200</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-purple-800">Friend Discount</div>
                    <div className="text-sm text-purple-600">Friends get 10% off their first service</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">10% OFF</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2 text-green-500" />
                Quick Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Referrals this month</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Earnings this month</span>
                  <span className="font-semibold text-green-600">¥100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Referrals</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">¥240</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Referral Tips</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <Star className="text-yellow-500 mr-2 mt-1" size={16} />
                  <span>Share your experience on social media</span>
                </div>
                <div className="flex items-start">
                  <Star className="text-yellow-500 mr-2 mt-1" size={16} />
                  <span>Recommend to friends needing property services</span>
                </div>
                <div className="flex items-start">
                  <Star className="text-yellow-500 mr-2 mt-1" size={16} />
                  <span>Show real service examples and results</span>
                </div>
                <div className="flex items-start">
                  <Star className="text-yellow-500 mr-2 mt-1" size={16} />
                  <span>Remind friends to use your referral code</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="bg-white rounded-lg shadow-lg">
            {/* Tab Navigation */}
            <div className="border-b">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {selectedTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Referral Overview</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Referral Progress</h4>
                      <div className="space-y-3">
                        {rewards.map((reward) => (
                          <div key={reward.level} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">Level {reward.level}</div>
                              <div className="text-sm text-gray-600">{reward.requirement}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-green-600">{reward.reward}</div>
                              <div className={`text-xs ${
                                reward.status === 'completed' ? 'text-green-600' :
                                reward.status === 'in-progress' ? 'text-yellow-600' :
                                'text-gray-500'
                              }`}>
                                {reward.status === 'completed' ? 'Completed' :
                                 reward.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Recent Referrals</h4>
                      <div className="space-y-3">
                        {referrals.slice(0, 3).map((referral) => (
                          <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{referral.name}</div>
                              <div className="text-sm text-gray-600">{referral.date}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-green-600">{referral.reward}</div>
                              <div className={`text-xs ${
                                referral.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {referral.status === 'completed' ? 'Completed' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'rewards' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Reward Levels</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {rewards.map((reward) => (
                      <div key={reward.level} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Level {reward.level}</h4>
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            reward.status === 'completed' ? 'bg-green-100 text-green-800' :
                            reward.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reward.status === 'completed' ? 'Completed' :
                             reward.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-600">{reward.requirement}</div>
                          <div className="font-semibold text-green-600">{reward.reward}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'referrals' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Referral History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3">Name</th>
                          <th className="text-left py-3">Registration Date</th>
                          <th className="text-left py-3">Status</th>
                          <th className="text-left py-3">Reward</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="border-b hover:bg-gray-50">
                            <td className="py-3">{referral.name}</td>
                            <td className="py-3">{referral.date}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                referral.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {referral.status === 'completed' ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-green-600">{referral.reward}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReferralPage;
