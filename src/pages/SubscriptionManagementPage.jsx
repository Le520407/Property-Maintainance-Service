import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  AlertTriangle, 
  XCircle,
  ArrowUpCircle,
  FileText,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionManagementPage = () => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [prorationAmount, setProrationAmount] = useState(0);

  const subscriptionPlans = useMemo(() => ({
    HDB: { name: 'HDB', price: 19.90, description: 'Basic maintenance services' },
    CONDOMINIUM: { name: 'Condominium', price: 29.90, description: 'Standard maintenance services' },
    LANDED: { name: 'Landed Property', price: 49.90, description: 'Premium maintenance services' },
    COMMERCIAL: { name: 'Commercial', price: 89.90, description: 'Professional maintenance services' }
  }), []);

  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found in localStorage');
        setCurrentSubscription(null);
        return;
      }
      
      console.log('Making API call to /api/users/membership with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/users/membership', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Raw membership data from API:', JSON.stringify(data, null, 2));
        
        if (data.success && data.membership) {
          // Convert membership data to subscription format for compatibility
          console.log('📋 Tier data:', data.membership.tier);
          console.log('📋 Tier name:', data.membership.tier?.name);
          console.log('📋 Tier displayName:', data.membership.tier?.displayName);
          
          const subscription = {
            id: data.membership.id,
            propertyType: data.membership.tier?.name || 'Unknown',
            billingCycle: data.membership.billingCycle || 'MONTHLY',
            status: data.membership.status,
            price: data.membership.currentPrice || 0,
            nextBillingDate: data.membership.nextBillingDate,
            tier: data.membership.tier,
            autoRenew: data.membership.autoRenew
          };
          
          console.log('🔄 Mapped subscription data:', JSON.stringify(subscription, null, 2));
          console.log('🔑 Available subscription plans:', Object.keys(subscriptionPlans));
          
          setCurrentSubscription(subscription);
          console.log('✅ Successfully set current subscription');
        } else {
          console.warn('❌ API returned success:false or no membership data:', data);
          setCurrentSubscription(null);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API call failed:', response.status, errorText);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('💥 Error fetching membership:', error);
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionPlans]);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const calculateProration = async (newPlan) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subscriptions/calculate-proration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          newPropertyType: newPlan
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProrationAmount(data.data.amount);
      }
    } catch (error) {
      console.error('Error calculating proration:', error);
      // Demo calculation with null checks
      const currentPlan = subscriptionPlans[currentSubscription?.propertyType];
      const newPlanData = subscriptionPlans[newPlan];
      
      if (currentPlan && newPlanData) {
        const currentPrice = currentPlan.price;
        const newPrice = newPlanData.price;
        const remainingDays = 15; // Demo: 15 days remaining
        const daysInMonth = 30;
        const prorated = ((newPrice - currentPrice) * remainingDays) / daysInMonth;
        setProrationAmount(prorated);
      } else {
        setProrationAmount(0);
      }
    }
  };

  const handlePlanChange = async (newPlan) => {
    if (newPlan === currentSubscription.propertyType) return;
    
    setSelectedPlan(newPlan);
    await calculateProration(newPlan);
    setShowUpgradeModal(true);
  };

  const confirmPlanChange = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subscriptions/update/${currentSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyType: selectedPlan
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.data.subscription);
        setShowUpgradeModal(false);
        alert('Plan updated successfully!');
      } else {
        alert('Failed to update plan. Please try again.');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error updating plan. Please try again.');
    }
  };

  const handleCancelSubscription = async (immediate = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subscriptions/cancel/${currentSubscription.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          immediate
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.data.subscription);
        setShowCancelModal(false);
        alert(immediate ? 'Subscription cancelled immediately with refund.' : 'Subscription will cancel at the end of the billing period.');
      } else {
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error cancelling subscription. Please try again.');
    }
  };

  if (loading) {
    console.log('⏳ Loading subscription data...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (!currentSubscription) {
    console.log('🚫 No current subscription detected. State value:', currentSubscription);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h2>
          <p className="text-gray-600 mb-2">You don't have an active subscription.</p>
          <p className="text-sm text-gray-500 mb-6">Debug: currentSubscription = {JSON.stringify(currentSubscription)}</p>
          <Link
            to="/subscription"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Subscription Plans
          </Link>
          <button
            onClick={fetchCurrentSubscription}
            className="ml-4 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-3 text-blue-600" />
                Subscription Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your subscription plan, billing, and cancellation options
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/subscription/billing-history"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Billing History
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Current Subscription */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Current Subscription
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      currentSubscription.status === 'ACTIVE' ? 'bg-green-500' : 
                      currentSubscription.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">
                      {subscriptionPlans[currentSubscription?.propertyType]?.name || 'Unknown'} Plan
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        currentSubscription.status === 'ACTIVE' ? 'text-green-600' : 
                        currentSubscription.status === 'CANCELLED' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {currentSubscription.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Cycle:</span>
                      <span className="font-medium text-gray-900">{currentSubscription.billingCycle}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">SGD {currentSubscription.amount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Billing:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period End:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Plan Options */}
            {currentSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Your Plan</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(subscriptionPlans).map(([planId, plan]) => {
                  if (!plan || !currentSubscription) return null;
                  
                  const currentPlan = subscriptionPlans[currentSubscription.propertyType];
                  if (!currentPlan) return null;
                  
                  return (
                    <div
                      key={planId}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        planId === currentSubscription.propertyType 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePlanChange(planId)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        {planId === currentSubscription.propertyType && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">CURRENT</span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">SGD {plan.price}</span>
                        {planId !== currentSubscription.propertyType && (
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            {plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  to="/subscription/billing-history"
                  className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium">View Billing History</span>
                  <FileText className="h-5 w-5" />
                </Link>
                
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="font-medium">Cancel Subscription</span>
                  <XCircle className="h-5 w-5" />
                </button>
                
                <Link
                  to="/customer/dashboard"
                  className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">Back to Dashboard</span>
                  <ArrowUpCircle className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Have questions about your subscription or need assistance with plan changes?
              </p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Contact Support
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Plan Change Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Plan Change</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                You're changing from <strong>{subscriptionPlans[currentSubscription.propertyType]?.name}</strong> to <strong>{subscriptionPlans[selectedPlan]?.name}</strong>
              </p>
              
              {prorationAmount !== 0 && (
                <div className={`p-3 rounded-lg ${prorationAmount > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <p className={`text-sm ${prorationAmount > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                    {prorationAmount > 0 
                      ? `Additional charge: SGD ${prorationAmount.toFixed(2)} (prorated for remaining period)`
                      : `Refund: SGD ${Math.abs(prorationAmount).toFixed(2)} (prorated for remaining period)`
                    }
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlanChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Change
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Cancel Subscription
            </h3>
            
            <p className="text-gray-600 mb-6">
              Choose how you'd like to cancel your subscription:
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCancelSubscription(false)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">Cancel at period end</div>
                <div className="text-sm text-gray-600">Continue until {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</div>
              </button>
              
              <button
                onClick={() => handleCancelSubscription(true)}
                className="w-full p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
              >
                <div className="font-medium text-red-900">Cancel immediately</div>
                <div className="text-sm text-red-600">Get prorated refund for unused time</div>
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Keep Subscription
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementPage;
