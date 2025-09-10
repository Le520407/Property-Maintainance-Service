import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const MembershipPaymentFlow = ({ selectedTier, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Plan Review, 2: Payment Confirmation
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [processing, setProcessing] = useState(false);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'PROFESSIONAL': return 'blue';
      case 'PREMIUM': return 'purple';
      case 'ENTERPRISE': return 'orange';
      default: return 'gray';
    }
  };

  const color = getTierColor(selectedTier.name);
  const price = billingCycle === 'YEARLY' ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;
  const savings = billingCycle === 'YEARLY' ? (selectedTier.monthlyPrice * 12) - selectedTier.yearlyPrice : 0;

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      // Determine if this is an upgrade or new subscription
      // If the tier has isUpgrade flag or we're upgrading from a paid tier, use upgrade endpoint
      // Otherwise, use create-payment for new subscriptions from BASIC
      const isUpgrade = selectedTier.isUpgrade || false;
      const endpoint = isUpgrade ? '/vendor/membership/upgrade' : '/vendor/membership/create-payment';
      
      console.log('Processing payment:', { 
        isUpgrade, 
        endpoint, 
        tier: selectedTier.name,
        billingCycle 
      });
      
      // Create HitPay payment request
      const response = await api.post(endpoint, {
        targetTier: selectedTier.name,
        billingCycle: billingCycle
      });

      console.log('Payment response:', response);

      // The api.post returns the JSON directly, not wrapped in response.data
      if (response && response.success) {
        // Redirect to HitPay payment page
        window.location.href = response.paymentUrl;
      } else {
        throw new Error(response?.message || 'Failed to create payment - invalid response format');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      
      // If we get "shouldUseUpgrade" error, retry with upgrade endpoint
      if (error.message && error.message.includes('shouldUseUpgrade')) {
        try {
          const response = await api.post('/vendor/membership/upgrade', {
            targetTier: selectedTier.name,
            billingCycle: billingCycle
          });
          
          console.log('Upgrade response:', response);
          
          // The api.post returns the JSON directly, not wrapped in response.data
          if (response && response.success) {
            window.location.href = response.paymentUrl;
            return;
          } else {
            throw new Error(response?.message || 'Upgrade failed - invalid response format');
          }
        } catch (upgradeError) {
          console.error('Upgrade error:', upgradeError);
        }
      }
      
      toast.error(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };


  if (step === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Plan Review */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to {selectedTier.displayName}</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">{selectedTier.description}</p>
            
            {/* Billing Cycle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Billing Cycle</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    billingCycle === 'MONTHLY'
                      ? `border-${color}-500 bg-${color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-lg">${selectedTier.monthlyPrice}</div>
                    <div className="text-sm text-gray-600">per month</div>
                  </div>
                </button>
                <button
                  onClick={() => setBillingCycle('YEARLY')}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    billingCycle === 'YEARLY'
                      ? `border-${color}-500 bg-${color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-lg">${selectedTier.yearlyPrice}</div>
                    <div className="text-sm text-gray-600">per year</div>
                    {savings > 0 && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Save ${savings}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {selectedTier.displayName} Plan ({billingCycle.toLowerCase()})
                </span>
                <span className="font-bold text-xl">${price}</span>
              </div>
              {billingCycle === 'YEARLY' && savings > 0 && (
                <div className="text-sm text-green-600 mt-1">
                  You save ${savings} compared to monthly billing
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              className={`px-6 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700`}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (step === 2) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Payment Confirmation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>

          {/* Payment Method Info */}
          <div className="mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-blue-900">Secure Payment with HitPay</h3>
                <p className="text-sm text-blue-700">
                  You'll be redirected to HitPay's secure payment gateway to complete your transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{selectedTier.displayName} Plan</span>
                <span className="font-medium">${price}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Billing Cycle</span>
                <span>{billingCycle.toLowerCase()}</span>
              </div>
              {billingCycle === 'YEARLY' && savings > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Annual Savings</span>
                  <span>-${savings}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>${price}</span>
              </div>
            </div>
          </div>

          {/* Features Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">You'll get access to:</h3>
            <ul className="space-y-2 text-sm">
              {selectedTier.features && Object.entries(selectedTier.features).map(([key, value]) => {
                let displayValue;
                if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (typeof value === 'object' && value !== null) {
                  // Handle object values like {verified: true, premium: true, etc.}
                  if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else {
                    // For objects, show the keys that are true or the object structure
                    const trueKeys = Object.entries(value)
                      .filter(([k, v]) => v === true)
                      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
                    displayValue = trueKeys.length > 0 ? trueKeys.join(', ') : JSON.stringify(value);
                  }
                } else {
                  displayValue = value;
                }
                
                return (
                  <li key={key} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {displayValue}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Security Notice */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Lock className="h-4 w-4 mr-2" />
            Your payment information is secure and encrypted by HitPay
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={processing}
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`px-6 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 disabled:opacity-50 flex items-center`}
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${price} with HitPay
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Note: Step 3 (success) is handled by HitPay redirect to success page
  // Users will be redirected to /vendor/membership/success after payment

  return null;
};

export default MembershipPaymentFlow;