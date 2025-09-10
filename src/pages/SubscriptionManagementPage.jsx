import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Home,
  Building,
  Building2,
  Briefcase,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const SubscriptionManagementPage = () => {
  const [membership, setMembership] = useState(null);
  const [availableTiers, setAvailableTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [planChangePreview, setPlanChangePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  // Fetch current membership and available tiers
  useEffect(() => {
    fetchMembershipData();
    fetchAvailableTiers();
  }, []);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/membership/my-membership');
      if (response.success && response.membership) {
        setMembership(response.membership);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      toast.error('Failed to load membership data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTiers = async () => {
    try {
      const response = await api.get('/membership/tiers');
      if (response.success && response.tiers) {
        setAvailableTiers(response.tiers);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const getTierIcon = (tierName) => {
    const icons = {
      'HDB': <Home className="w-6 h-6" />,
      'CONDOMINIUM': <Building className="w-6 h-6" />,
      'LANDED_PROPERTY': <Building2 className="w-6 h-6" />,
      'COMMERCIAL': <Briefcase className="w-6 h-6" />
    };
    return icons[tierName] || <Home className="w-6 h-6" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handlePlanChangeRequest = async (tier) => {
    if (!membership || tier._id === membership.tier._id) return;
    
    setSelectedTier(tier);
    setPreviewLoading(true);
    
    try {
      const response = await api.post('/membership/plan-change-preview', {
        newTierId: tier._id,
        billingCycle: membership.billingCycle
      });
      
      if (response.success) {
        setPlanChangePreview(response.preview);
        setShowPlanChangeModal(true);
      }
    } catch (error) {
      console.error('Error getting plan preview:', error);
      toast.error('Failed to calculate plan change cost');
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmPlanChange = async () => {
    if (!selectedTier || !membership) return;
    
    setChangingPlan(true);
    
    try {
      // Debug logging
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Auth token exists:', !!token);
      console.log('🔍 Debug - Request data:', {
        newTierId: selectedTier._id,
        billingCycle: membership.billingCycle
      });
      
      // Use the change-plan endpoint for plan changes with refund processing
      const response = await api.put('/membership/change-plan', {
        newTierId: selectedTier._id,
        billingCycle: membership.billingCycle
      });
      
      if (response.success) {
        // Show refund information if applicable
        if (response.refundInfo && response.refundInfo.refundAmount > 0) {
          toast.success(`Plan change initiated! Refund of $${response.refundInfo.refundAmount.toFixed(2)} processed.`);
        }
        
        // Redirect to HitPay checkout
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        } else {
          toast.success(response.message || 'Plan change completed!');
          setShowPlanChangeModal(false);
          fetchMembershipData();
        }
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">You don't have an active subscription.</p>
          <button
            onClick={() => window.location.href = '/membership/plans'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysUntilExpiry(membership.endDate);
  const isExpiringSoon = daysRemaining <= 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your current subscription and change plans</p>
        </motion.div>

        {/* Current Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                {getTierIcon(membership.tier?.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{membership.tier?.displayName}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    membership.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {membership.status}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 capitalize">{membership.billingCycle?.toLowerCase()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${membership.currentPrice}
                <span className="text-lg text-gray-500">/{membership.billingCycle === 'YEARLY' ? 'year' : 'month'}</span>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Next Billing Date</p>
                <p className="font-medium text-gray-900">{formatDate(membership.nextBillingDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Period End Date</p>
                <p className="font-medium text-gray-900">{formatDate(membership.endDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Days Remaining</p>
                <p className={`font-medium ${isExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                  {daysRemaining} days
                </p>
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-orange-800 font-medium">Subscription Expiring Soon</p>
                  <p className="text-orange-700 text-sm">Your subscription will expire in {daysRemaining} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Plan Features */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Plan Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  {membership.tier?.features?.serviceRequestsPerMonth === -1 
                    ? 'Unlimited' 
                    : membership.tier?.features?.serviceRequestsPerMonth || 0} service requests/month
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  {membership.tier?.features?.responseTimeHours || 0} hour response time
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  {membership.tier?.features?.materialDiscountPercent || 0}% material discount
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  {membership.tier?.features?.annualInspections || 0} annual inspections
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Your Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableTiers.map((tier) => {
              const isCurrentPlan = tier._id === membership.tier._id;
              const isUpgrade = tier.monthlyPrice > membership.tier.monthlyPrice;
              const isDowngrade = tier.monthlyPrice < membership.tier.monthlyPrice;
              
              return (
                <motion.div
                  key={tier._id}
                  whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
                  className={`border rounded-xl p-4 transition-all ${
                    isCurrentPlan 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isCurrentPlan && handlePlanChangeRequest(tier)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTierIcon(tier.name)}
                    </div>
                    {isCurrentPlan && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        Current
                      </span>
                    )}
                    {!isCurrentPlan && isUpgrade && (
                      <ArrowUpCircle className="w-4 h-4 text-green-600" />
                    )}
                    {!isCurrentPlan && isDowngrade && (
                      <ArrowDownCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{tier.displayName}</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${membership.billingCycle === 'YEARLY' ? tier.yearlyPrice : tier.monthlyPrice}
                    <span className="text-sm text-gray-500">/{membership.billingCycle === 'YEARLY' ? 'yr' : 'mo'}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{tier.features?.serviceRequestsPerMonth === -1 ? 'Unlimited' : tier.features?.serviceRequestsPerMonth} requests</div>
                    <div>{tier.features?.responseTimeHours}h response</div>
                    <div>{tier.features?.materialDiscountPercent}% discount</div>
                  </div>
                  
                  {!isCurrentPlan && (
                    <button
                      disabled={previewLoading}
                      className={`w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        isUpgrade 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      } disabled:opacity-50`}
                    >
                      {previewLoading ? 'Loading...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Plan Change Modal */}
        {showPlanChangeModal && planChangePreview && selectedTier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Change Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Current Plan</span>
                  <span className="font-medium">{planChangePreview.currentPlan.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">New Plan</span>
                  <span className="font-medium">{planChangePreview.newPlan.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Refund from Current Plan</span>
                  <span className="font-medium text-green-600">
                    ${planChangePreview.financial.refundFromCurrentPlan.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">New Plan Cost</span>
                  <span className="font-medium">${planChangePreview.financial.newPlanCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Net Amount</span>
                  <span className={
                    planChangePreview.financial.needsPayment 
                      ? 'text-blue-600' 
                      : planChangePreview.financial.refundToCustomer > 0 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                  }>
                    {planChangePreview.financial.needsPayment 
                      ? `Pay $${(planChangePreview.financial.netAmountToPay || 0).toFixed(2)}`
                      : planChangePreview.financial.refundToCustomer > 0
                        ? `Refund $${planChangePreview.financial.refundToCustomer.toFixed(2)}`
                        : 'No change ($0.00)'
                    }
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded-lg">
                {planChangePreview.summary}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPlanChangeModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={changingPlan}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlanChange}
                  disabled={changingPlan}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {changingPlan ? 'Processing...' : 'Confirm Change'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
