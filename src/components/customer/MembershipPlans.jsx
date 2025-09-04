import {
  Briefcase,
  Building,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Home,
  Shield,
  Star,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import TempPaymentMethodModal from './TempPaymentMethodModal';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const MembershipPlans = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchMembershipData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [tiersResponse, membershipResponse] = await Promise.all([
        api.get('/membership/tiers'),
        api.get('/membership/my-membership')
      ]);

      setTiers(tiersResponse.tiers);
      setCurrentMembership(membershipResponse.membership);
    } catch (error) {
      console.error('Error fetching membership data:', error);
      if (error.message?.includes('401') || error.message?.includes('Access token required')) {
        toast.error('Please log in to view membership plans');
      } else {
        toast.error('Failed to load membership plans');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembershipData();
  }, [user, fetchMembershipData]);

  const handleSubscribe = async (tier) => {
    // Check authentication before proceeding
    if (!user) {
      toast.error('Please log in to subscribe to a membership plan');
      return;
    }

    if (user.role !== 'customer') {
      toast.error('Only customers can subscribe to membership plans');
      return;
    }

    // Check if user is already subscribed to this tier
    if (currentMembership?.tier._id === tier._id) {
      toast('You are already subscribed to this plan');
      return;
    }

    // Check if this is an upgrade or new subscription
    const isUpgrade = currentMembership && currentMembership.status === 'ACTIVE';

    try {
      setSubscribing(true);
      
      // Show loading message
      toast.loading(isUpgrade ? 'Preparing plan upgrade...' : 'Preparing your membership...', { 
        id: 'preparing' 
      });

      let response;
      if (isUpgrade) {
        // Use change plan endpoint for upgrades
        response = await api.put('/membership/change-plan', {
          newTierId: tier._id,
          billingCycle: billingCycle
        });
      } else {
        // Use membership payment endpoint for new subscriptions
        response = await api.post('/membership/payment', {
          tierId: tier._id,
          billingCycle: billingCycle
        });
      }

      // Dismiss loading toast
      toast.dismiss('preparing');

      if (response.paymentUrl) {
        // Show redirect message
        toast.success(
          isUpgrade 
            ? 'Redirecting to payment gateway for plan upgrade...' 
            : 'Redirecting to HitPay payment gateway...', 
          { duration: 2000 }
        );
        
        // Small delay for better UX, then redirect to HitPay
        setTimeout(() => {
          window.location.href = response.paymentUrl;
        }, 1500);
        
      } else if (response.success) {
        // If no payment URL, membership was activated directly (shouldn't happen in normal flow)
        toast.success(isUpgrade ? 'Plan upgraded successfully!' : 'Membership activated successfully!');
        setCurrentMembership(response.membership);
      } else {
        throw new Error('Unexpected response format');
      }

    } catch (error) {
      toast.dismiss('preparing');
      console.error('Membership subscription error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to subscribe to a membership plan');
        // Optional: redirect to login page
        // window.location.href = '/login';
      } else {
        toast.error(
          error.response?.data?.message || 
          error.message || 
          (isUpgrade ? 'Failed to upgrade membership plan' : 'Failed to create membership payment')
        );
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId) => {
    // This method is now deprecated in favor of direct HitPay integration
    // Kept for backward compatibility with existing payment modal component
    if (!selectedTier) return;

    const isUpgrade = currentMembership && currentMembership.status === 'ACTIVE';
    
    try {
      setSubscribing(true);
      let response;
      
      if (isUpgrade) {
        response = await api.put('/membership/change-plan', {
          newTierId: selectedTier._id,
          billingCycle: billingCycle
        });
      } else {
        response = await api.post('/membership/payment', {
          tierId: selectedTier._id,
          billingCycle: billingCycle
        });
      }

      if (response.paymentUrl) {
        setShowPaymentModal(false);
        setSelectedTier(null);
        window.location.href = response.paymentUrl;
      } else if (response.success) {
        toast.success(isUpgrade ? 'Plan upgraded!' : 'Membership activated!');
        setCurrentMembership(response.membership);
        setShowPaymentModal(false);
        setSelectedTier(null);
      }
    } catch (error) {
      console.error(isUpgrade ? 'Plan upgrade failed:' : 'Subscription failed:', error);
      toast.error(error.message || (isUpgrade ? 'Failed to upgrade plan' : 'Failed to activate membership'));
    } finally {
      setSubscribing(false);
    }
  };

  const handleChangePlan = async (newTier) => {
    try {
      const response = await api.put('/membership/change-plan', {
        newTierId: newTier._id,
        immediate: true
      });

      if (response.success) {
        toast.success('Membership plan updated successfully!');
        setCurrentMembership(response.membership);
      }
    } catch (error) {
      console.error('Plan change failed:', error);
      toast.error(error.message || 'Failed to update plan');
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Are you sure you want to cancel your membership? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.put('/membership/cancel', {
        immediate: false // Cancel at end of billing period
      });

      if (response.success) {
        toast.success('Membership cancelled successfully. Your plan will remain active until the end of the current billing period.');
        setCurrentMembership(response.membership);
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error(error.message || 'Failed to cancel membership');
    }
  };

  const getTierIcon = (tierName) => {
    switch (tierName) {
      case 'HDB': return <Home className="h-8 w-8" />;
      case 'CONDOMINIUM': return <Building className="h-8 w-8" />;
      case 'LANDED': return <Building2 className="h-8 w-8" />;
      case 'COMMERCIAL': return <Briefcase className="h-8 w-8" />;
      default: return <Shield className="h-8 w-8" />;
    }
  };

  const getTierColor = (tierName) => {
    switch (tierName) {
      case 'HDB': return 'green';
      case 'CONDOMINIUM': return 'blue';
      case 'LANDED': return 'purple';
      case 'COMMERCIAL': return 'orange';
      default: return 'gray';
    }
  };

  const getTierGradient = (tierName) => {
    switch (tierName) {
      case 'HDB': return 'from-green-500 to-emerald-600';
      case 'CONDOMINIUM': return 'from-blue-500 to-indigo-600';
      case 'LANDED': return 'from-purple-500 to-violet-600';
      case 'COMMERCIAL': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatPrice = (price) => {
    return billingCycle === 'YEARLY' ? price * 10 : price; // 2 months free for yearly
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view and subscribe to membership plans.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading membership plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold mb-6">
              Choose Your
              <span className="block bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent mt-2">
                Perfect Plan
              </span>
            </h1>
            <p className="text-xl text-orange-100 max-w-4xl mx-auto leading-relaxed mb-8">
              Experience premium property maintenance with our tailored membership plans. 
              From HDB units to commercial spaces, we've got you covered with professional service and unmatched reliability.
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span>24/7 Emergency Support</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span>Licensed Professionals</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span>Quality Guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative">
        {/* Current Membership Status */}
        {currentMembership && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mb-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${getTierGradient(currentMembership.tier.name)} mr-6 shadow-lg`}>
                  <div className="text-white">
                    {getTierIcon(currentMembership.tier.name)}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    Current Plan: {currentMembership.tier.displayName}
                  </h3>
                  <p className="text-gray-600 text-lg">{currentMembership.tier.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${currentMembership.tier.monthlyPrice}
                  <span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    currentMembership.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : currentMembership.status === 'CANCELLED' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {currentMembership.status === 'CANCELLED' && !currentMembership.autoRenew 
                      ? 'Cancelled - Active until ' + new Date(currentMembership.endDate).toLocaleDateString()
                      : currentMembership.status
                    }
                  </div>
                  {currentMembership.status === 'ACTIVE' && (
                    <button
                      onClick={handleCancelMembership}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-white rounded-2xl p-2 flex shadow-lg border border-gray-200">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                billingCycle === 'MONTHLY'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                billingCycle === 'YEARLY'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Yearly Billing
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-20">
          {tiers.map((tier, index) => {
            const color = getTierColor(tier.name);
            const gradient = getTierGradient(tier.name);
            const isCurrentPlan = currentMembership?.tier._id === tier._id;
            const isPopular = false; // Removed popular badge

            return (
              <motion.div
                key={tier._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className={`relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border-2 overflow-hidden ${
                  isPopular ? 'border-orange-500 ring-4 ring-orange-100 scale-105' : 'border-gray-200 hover:border-gray-300'
                } ${isCurrentPlan ? 'ring-4 ring-green-100 border-green-500' : ''}`}
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full -mr-12 -mt-12`}></div>
                
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-xl">
                      🔥 Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                      ✓ Active Plan
                    </span>
                  </div>
                )}

                <div className={`text-center mb-8 relative z-10 ${isCurrentPlan ? 'pt-12' : 'pt-4'}`}>
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} mb-6 shadow-lg`}>
                    <div className="text-white">
                      {getTierIcon(tier.name)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{tier.displayName}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{tier.description}</p>
                </div>

                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-4">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      <span className={`text-${color}-600`}>${formatPrice(tier.monthlyPrice)}</span>
                      <span className="text-lg font-normal text-gray-500">
                        /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'YEARLY' && tier.monthlyPrice > 0 && (
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold inline-block">
                        💰 Save ${(tier.monthlyPrice * 2).toFixed(2)}/year
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-sm bg-green-50 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">
                      {tier.features.serviceRequestsPerMonth === -1 
                        ? 'Unlimited' 
                        : tier.features.serviceRequestsPerMonth
                      } service requests/month
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm bg-blue-50 rounded-xl p-3">
                    <Clock className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">{tier.features.responseTimeHours}h response time</span>
                  </div>

                  {tier.features.materialDiscountPercent > 0 && (
                    <div className="flex items-center text-sm bg-purple-50 rounded-xl p-3">
                      <CreditCard className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">{tier.features.materialDiscountPercent}% discount on materials</span>
                    </div>
                  )}

                  {tier.features.annualInspections > 0 && (
                    <div className="flex items-center text-sm bg-indigo-50 rounded-xl p-3">
                      <Shield className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">
                        {tier.features.annualInspections === 1 
                          ? 'Annual inspection' 
                          : `${tier.features.annualInspections} inspections/year`
                        }
                      </span>
                    </div>
                  )}

                  {tier.features.emergencyService && (
                    <div className="flex items-center text-sm bg-yellow-50 rounded-xl p-3">
                      <Zap className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">Emergency same-day service</span>
                    </div>
                  )}

                  {tier.features.prioritySupport && (
                    <div className="flex items-center text-sm bg-pink-50 rounded-xl p-3">
                      <Star className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">Priority customer support</span>
                    </div>
                  )}

                  {tier.features.dedicatedManager && (
                    <div className="flex items-center text-sm bg-rose-50 rounded-xl p-3">
                      <Users className="h-5 w-5 text-rose-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">Dedicated account manager</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (isCurrentPlan) return;
                    if (currentMembership && currentMembership.status === 'CANCELLED') return;
                    handleSubscribe(tier); // Direct HitPay integration - no modal needed
                  }}
                  disabled={isCurrentPlan || subscribing || (currentMembership && currentMembership.status === 'CANCELLED')}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    isCurrentPlan
                      ? 'bg-green-100 text-green-600 cursor-not-allowed border-2 border-green-200'
                      : (currentMembership && currentMembership.status === 'CANCELLED')
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200'
                      : isPopular
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl'
                      : `bg-gradient-to-r ${gradient} text-white hover:shadow-xl`
                  } ${subscribing ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {subscribing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Redirecting to HitPay...
                    </div>
                  ) : isCurrentPlan ? (
                    '✓ Current Plan'
                  ) : currentMembership && currentMembership.status === 'CANCELLED' ? (
                    'Plan Cancelled'
                  ) : currentMembership ? (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 inline" />
                      Upgrade & Pay with HitPay
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 inline" />
                      Subscribe & Pay with HitPay
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-16 border-t border-gray-200"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Trusted by Singapore Homeowners</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">1000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Emergency Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">5-Star</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-gray-600">Licensed Professionals</div>
            </div>
          </div>
        </motion.div>

        {/* Payment Modal */}
        {showPaymentModal && selectedTier && (
          <TempPaymentMethodModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedTier(null);
            }}
            onPaymentSuccess={handlePaymentSuccess}
            selectedPlan={selectedTier}
            billingCycle={billingCycle}
            isUpgrade={currentMembership && currentMembership.status === 'ACTIVE'}
          />
        )}
      </div>
    </div>
  );
};

export default MembershipPlans;