import {
  Briefcase,
  Building,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  Home,
  RefreshCw,
  Shield,
  Star,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import TempPaymentMethodModal from './TempPaymentMethodModal';
import { api } from '../../services/api';
import { cachedApi } from '../../utils/globalCache';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MembershipPlans = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchMembershipData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembershipData = async () => {
    if (!user) return;
    
    try {
      // Check for refresh parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const forceRefresh = urlParams.get('refresh') === 'true';
      
      const [tiersResponse, membershipResponse] = await Promise.all([
        cachedApi.getMembershipTiers(forceRefresh),
        cachedApi.getMembership(user.id, forceRefresh)
      ]);

      console.log('Tiers:', tiersResponse.tiers);
      console.log('Current Membership:', membershipResponse.membership);
      setTiers(tiersResponse.tiers);
      setCurrentMembership(membershipResponse.membership);
    } catch (error) {
      console.error('Error fetching membership data:', error);
      toast.error('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    toast.loading('Refreshing membership status...', { id: 'refresh' });
    try {
      const [tiersResponse, membershipResponse] = await Promise.all([
        cachedApi.getMembershipTiers(true),
        cachedApi.getMembership(user.id, true)
      ]);
      setTiers(tiersResponse.tiers);
      setCurrentMembership(membershipResponse.membership);
      toast.success('Membership status updated!', { id: 'refresh' });
    } catch (error) {
      console.error('Error refreshing membership data:', error);
      toast.error('Failed to refresh membership status', { id: 'refresh' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
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
        // Use membership subscribe endpoint for new subscriptions (recurring payments)
        response = await api.post('/membership/subscribe', {
          tierId: tier._id,
          billingCycle: billingCycle
        });
      }

      // Dismiss loading toast
      toast.dismiss('preparing');

      const redirectUrl = response.paymentUrl || response.checkoutUrl;
      if (redirectUrl) {
        // Show redirect message
        toast.success(
          isUpgrade 
            ? 'Redirecting to payment gateway for plan upgrade...' 
            : 'Redirecting to HitPay payment gateway...', 
          { duration: 2000 }
        );
        
        // Small delay for better UX, then redirect to HitPay
        setTimeout(() => {
          window.location.href = redirectUrl;
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
        response = await api.post('/membership/subscribe', {
          tierId: selectedTier._id,
          billingCycle: billingCycle
        });
      }

      const redirectUrl = response.paymentUrl || response.checkoutUrl;
      if (redirectUrl) {
        setShowPaymentModal(false);
        setSelectedTier(null);
        window.location.href = redirectUrl;
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
    <div className="min-h-screen">
      {/* Hero Section - Orange Modern Style */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-orange-400 rounded-full opacity-10 transform rotate-45"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-30 rounded-full text-orange-100 text-sm font-medium mb-4 backdrop-blur-sm">
                Premium Membership Plans
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              Choose Your
              <span className="block text-orange-200">Perfect Plan</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Experience premium property maintenance with our tailored membership plans. 
              From HDB units to commercial spaces, we've got you covered with professional service and unmatched reliability.
            </motion.p>
            
            {/* Features list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6 text-orange-100"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-orange-200" />
                <span>24/7 Emergency Support</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-orange-200" />
                <span>Licensed Professionals</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-orange-200" />
                <span>Quality Guarantee</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="bg-gray-50">
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
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    title="Refresh to see latest status"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </button>
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

        {/* Membership Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier, index) => {
            const isCurrentPlan = currentMembership?.tier._id === tier._id;
            const isPopular = index === 1; // Make middle plan popular
            const price = formatPrice(tier.monthlyPrice);
            
            return (
              <div
                key={tier._id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  isPopular 
                    ? 'border-orange-500 transform scale-105' 
                    : 'border-gray-200 hover:border-orange-300'
                } ${selectedTier?._id === tier._id ? 'ring-4 ring-orange-200' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Plan Icon */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                      isPopular ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                      <div className={`text-2xl ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                        {getTierIcon(tier.name)}
                      </div>
                    </div>
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    {tier.displayName}
                  </h3>

                  {/* Plan Description */}
                  <p className="text-gray-600 text-center mb-6 min-h-[3rem] flex items-center justify-center">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {tier.monthlyPrice === 0 ? 'FREE' : `$${price}`}
                      {tier.monthlyPrice > 0 && (
                        <span className="text-lg font-normal text-gray-500">
                          /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'YEARLY' && tier.monthlyPrice > 0 && (
                      <div className="text-sm text-orange-600 font-medium">
                        Save ${(tier.monthlyPrice * 2).toFixed(2)}/year
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-4 mb-8 flex-grow">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.serviceRequestsPerMonth === -1 
                          ? 'Unlimited service requests' 
                          : `Up to ${tier.features.serviceRequestsPerMonth} service requests`}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.responseTimeHours}h response time
                      </span>
                    </div>

                    {tier.features.materialDiscountPercent > 0 ? (
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">
                          {tier.features.materialDiscountPercent}% material discount
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500">No material discount</span>
                      </div>
                    )}

                    {tier.features.annualInspections > 0 ? (
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">
                          {tier.features.annualInspections === 1 ? 'Annual inspection' : `${tier.features.annualInspections} inspections/year`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500">No inspections</span>
                      </div>
                    )}

                    {tier.features.emergencyService ? (
                      <div className="flex items-center">
                        <Zap className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">Emergency service</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500">No emergency service</span>
                      </div>
                    )}

                    {tier.features.prioritySupport ? (
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">Priority support</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500">Standard support</span>
                      </div>
                    )}

                    {tier.features.dedicatedManager ? (
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">Dedicated manager</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500">No dedicated manager</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    <button
                      onClick={() => {
                        if (isCurrentPlan) {
                          toast('You are already subscribed to this plan');
                          return;
                        }
                        if (currentMembership && currentMembership.status === 'CANCELLED') {
                          toast.error('Cannot upgrade cancelled membership');
                          return;
                        }
                        setSelectedTier(tier);
                        handleSubscribe(tier);
                      }}
                      disabled={isCurrentPlan || subscribing || (currentMembership && currentMembership.status === 'CANCELLED')}
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        isCurrentPlan
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : subscribing && selectedTier?._id === tier._id
                          ? 'bg-orange-500 text-white cursor-wait'
                          : isPopular
                          ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-500 hover:text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isCurrentPlan ? (
                        'Current Plan'
                      ) : subscribing && selectedTier?._id === tier._id ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : tier.monthlyPrice === 0 ? (
                        'Start Free'
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators - Stats Section */}
        <section className="py-16 bg-white mb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Singapore Homeowners</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust us with their property maintenance needs.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
                <div className="text-gray-600">Happy Customers</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Emergency Support</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">5-Star</div>
                <div className="text-gray-600">Average Rating</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">100%</div>
                <div className="text-gray-600">Licensed Professionals</div>
              </motion.div>
            </div>
          </div>
        </section>

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
    </div>
  );
};

export default MembershipPlans;