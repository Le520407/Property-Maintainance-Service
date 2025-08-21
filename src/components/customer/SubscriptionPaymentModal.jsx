import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Lock, 
  CheckCircle,
  Home,
  Building,
  Building2,
  Store
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const SubscriptionPaymentModal = ({ tier, onClose, onSuccess, currentSubscription }) => {
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Success
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

  const propertyIcons = {
    HDB: Home,
    CONDOMINIUM: Building,
    LANDED: Building2,
    COMMERCIAL: Store
  };

  const IconComponent = propertyIcons[tier.propertyType] || Home;
  const isUpgrade = currentSubscription && currentSubscription.propertyType !== tier.propertyType;

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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardHolder) {
      toast.error('Please fill in all payment details');
      return;
    }

    try {
      setProcessing(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const subscriptionData = {
        propertyType: tier.propertyType,
        paymentMethod: {
          type: 'CARD',
          last4: paymentData.cardNumber.slice(-4),
          brand: 'VISA'
        }
      };

      let response;
      if (isUpgrade) {
        response = await api.put(`/subscriptions/update/${currentSubscription._id}`, subscriptionData);
      } else {
        response = await api.post('/subscriptions/subscribe', subscriptionData);
      }

      setStep(3);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>

            {step === 1 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isUpgrade ? `Upgrade to ${tier.displayName}` : `Subscribe to ${tier.displayName}`}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                </div>

                {/* Plan Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Monthly Price:</span>
                    <span className="text-2xl font-bold text-blue-600">${tier.monthlyPrice}</span>
                  </div>
                  {isUpgrade && currentSubscription && (
                    <div className="text-sm text-gray-600">
                      Current: ${currentSubscription.monthlyPrice}/month → New: ${tier.monthlyPrice}/month
                    </div>
                  )}
                </div>

                {/* Services Preview */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Included Services:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {tier.services?.slice(0, 6).map((service, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                  <p className="text-sm text-gray-500 mt-1">Complete your {isUpgrade ? 'upgrade' : 'subscription'}</p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {/* Card Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        cardNumber: formatCardNumber(e.target.value)
                      })}
                      maxLength="19"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData({
                          ...paymentData,
                          expiryDate: formatExpiryDate(e.target.value)
                        })}
                        maxLength="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData({
                          ...paymentData,
                          cvv: e.target.value.replace(/[^0-9]/g, '')
                        })}
                        maxLength="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total (Monthly)</span>
                      <span className="text-xl text-blue-600">${tier.monthlyPrice}</span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Lock className="h-4 w-4 mr-2" />
                    Your payment information is secure and encrypted
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay ${tier.monthlyPrice}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isUpgrade ? 'Subscription Updated!' : 'Welcome to Swift Fix Pro!'}
                </h3>
                <p className="text-gray-600 mb-6">
                  Your {tier.displayName} subscription is now active. You'll receive your first maintenance service within 24 hours.
                </p>

                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    🌱 Your subscription contributes to our social impact initiative. 
                    Together, we're helping families in need access quality maintenance services.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SubscriptionPaymentModal;