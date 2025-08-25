import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ onPaymentSuccess, selectedPlan, billingCycle, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: {
          name: 'Customer Name', // Should be from user profile
        },
      });

      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }

      // Call parent success handler with payment method
      await onPaymentSuccess(paymentMethod.id);
      
    } catch (err) {
      setError(err.message || 'An error occurred while processing payment');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">{selectedPlan.displayName}</h4>
            <p className="text-sm text-gray-600">{selectedPlan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              ${billingCycle === 'YEARLY' ? selectedPlan.monthlyPrice * 10 : selectedPlan.monthlyPrice}
              <span className="text-sm font-normal text-gray-500">
                /{billingCycle === 'YEARLY' ? 'year' : 'month'}
              </span>
            </div>
            {billingCycle === 'YEARLY' && (
              <p className="text-sm text-green-600">Save ${(selectedPlan.monthlyPrice * 2).toFixed(2)}/year</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCard className="h-4 w-4 inline mr-2" />
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center text-sm text-gray-600">
        <Lock className="h-4 w-4 mr-2" />
        Your payment information is secured with 256-bit SSL encryption
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            `Subscribe for $${billingCycle === 'YEARLY' ? selectedPlan.monthlyPrice * 10 : selectedPlan.monthlyPrice}/${billingCycle === 'YEARLY' ? 'year' : 'month'}`
          )}
        </button>
      </div>
    </form>
  );
};

const PaymentMethodModal = ({ isOpen, onClose, onPaymentSuccess, selectedPlan, billingCycle }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete Your Subscription
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <Elements stripe={stripePromise}>
                <PaymentForm
                  onPaymentSuccess={onPaymentSuccess}
                  selectedPlan={selectedPlan}
                  billingCycle={billingCycle}
                  onClose={onClose}
                />
              </Elements>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentMethodModal;