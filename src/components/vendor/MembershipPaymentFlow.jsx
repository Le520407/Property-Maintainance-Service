import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowLeft, 
  Lock,
  Calendar,
  DollarSign 
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const MembershipPaymentFlow = ({ selectedTier, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Plan Review, 2: Payment Details, 3: Confirmation
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Singapore'
    }
  });
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      
      // Validate payment data
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardHolder) {
        toast.error('Please fill in all payment details');
        return;
      }

      // Simulate payment processing
      console.log('Processing payment for:', {
        tier: selectedTier.name,
        billingCycle,
        amount: price,
        paymentData: {
          ...paymentData,
          cardNumber: paymentData.cardNumber.replace(/\d(?=\d{4})/g, "*")
        }
      });

      // In a real application, you would integrate with Stripe or another payment processor
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call the upgrade API
      const response = await api.post('/vendor/membership/upgrade', {
        targetTier: selectedTier.name,
        billingCycle: billingCycle,
        paymentMethod: {
          type: 'CARD',
          last4: paymentData.cardNumber.slice(-4),
          brand: 'VISA' // In real app, detect from card number
        }
      });

      setStep(3);
      toast.success('Membership upgraded successfully!');
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
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
        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Card Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Information
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cardNumber: formatCardNumber(e.target.value)
                    })}
                    maxLength="19"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      expiryDate: formatExpiryDate(e.target.value)
                    })}
                    maxLength="5"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cvv: e.target.value.replace(/[^0-9]/g, '')
                    })}
                    maxLength="4"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={paymentData.cardHolder}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardHolder: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">{selectedTier.displayName} Plan</span>
                <span>${price}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>${price}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center text-sm text-gray-600">
              <Lock className="h-4 w-4 mr-2" />
              Your payment information is secure and encrypted
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`px-6 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 disabled:opacity-50 flex items-center`}
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ${price}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    );
  }

  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to {selectedTier.displayName}!</h2>
          <p className="text-gray-600 mb-6">
            Your membership has been upgraded successfully. You now have access to all {selectedTier.displayName} features.
          </p>

          {/* New Features */}
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <h3 className="font-medium text-gray-900 mb-3">You now have access to:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Priority job assignments
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Lower platform commission rates
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Advanced analytics and insights
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                More portfolio images
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              onSuccess();
              onCancel(); // Close the flow
            }}
            className={`w-full py-3 px-6 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700`}
          >
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default MembershipPaymentFlow;