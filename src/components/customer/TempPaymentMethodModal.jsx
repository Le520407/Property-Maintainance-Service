import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react';

const TempPaymentMethodModal = ({ isOpen, onClose, onPaymentSuccess, selectedPlan, billingCycle, isUpgrade = false }) => {
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      // Simulate successful payment
      onPaymentSuccess('demo_payment_method_123');
    }, 1000); // Reduced to 1 second for simplicity
  };

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
                {isUpgrade ? 'Confirm Plan Upgrade' : 'Complete Your Subscription'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Plan Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedPlan?.displayName}</h4>
                      <p className="text-sm text-gray-600">{selectedPlan?.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ${billingCycle === 'YEARLY' ? selectedPlan?.monthlyPrice * 10 : selectedPlan?.monthlyPrice}
                        <span className="text-sm font-normal text-gray-500">
                          /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                        </span>
                      </div>
                      {billingCycle === 'YEARLY' && (
                        <p className="text-sm text-green-600">Save ${(selectedPlan?.monthlyPrice * 2).toFixed(2)}/year</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simple Demo Payment Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Payment Details
                  </label>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Credit Card Number"
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                      defaultValue="4242 4242 4242 4242"
                      disabled={processing}
                    />
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                      defaultValue="John Doe"
                      disabled={processing}
                    />
                  </div>
                </div>

                {/* Demo Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      <strong>Demo Mode:</strong> This is a demo payment form. No actual payment will be processed.
                    </p>
                  </div>
                </div>

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
                    disabled={processing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `${isUpgrade ? 'Upgrade to' : 'Subscribe for'} $${billingCycle === 'YEARLY' ? selectedPlan?.monthlyPrice * 10 : selectedPlan?.monthlyPrice}/${billingCycle === 'YEARLY' ? 'year' : 'month'}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TempPaymentMethodModal;