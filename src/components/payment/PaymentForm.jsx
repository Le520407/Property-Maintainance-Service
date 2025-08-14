import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Lock, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

const PaymentForm = ({ jobId, onPaymentComplete, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [formData, setFormData] = useState({
    paymentMethod: 'CREDIT_CARD',
    gateway: 'MOCK',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Singapore'
    }
  });

  // Create payment session on component mount
  useEffect(() => {
    createPaymentSession();
  }, [jobId]);

  const createPaymentSession = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/payments/create-session/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentMethod: formData.paymentMethod,
          gateway: formData.gateway
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentSession(data.payment);
      } else {
        setError(data.message || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentSession) {
      setError('No payment session available. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/payments/process/${paymentSession.paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cardDetails: {
            number: formData.cardNumber,
            expiryMonth: formData.expiryMonth,
            expiryYear: formData.expiryYear,
            cvv: formData.cvv,
            cardholderName: formData.cardholderName
          },
          billingAddress: formData.billingAddress
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentComplete && onPaymentComplete(data.payment);
        }, 2000);
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your payment of ${paymentSession?.totalAmount} has been processed successfully.
          </p>
          <p className="text-sm text-gray-500">
            You will be redirected to your order details shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Complete Payment
        </h3>
        {paymentSession && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-lg font-semibold text-gray-900">
                ${paymentSession.totalAmount}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Platform Fee (10%):</span>
              <span className="text-sm text-gray-700">
                ${paymentSession.platformCommission}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Vendor Amount:</span>
              <span className="text-sm text-gray-700">
                ${paymentSession.vendorAmount}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL'].map((method) => (
              <label key={method} className="flex items-center p-3 border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={formData.paymentMethod === method}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="text-sm font-medium">
                  {method.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Card Details */}
        {(formData.paymentMethod === 'CREDIT_CARD' || formData.paymentMethod === 'DEBIT_CARD') && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Card Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month
                </label>
                <select
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year
                </label>
                <select
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Billing Address */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="billing.line1"
                value={formData.billingAddress.line1}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="billing.city"
                value={formData.billingAddress.city}
                onChange={handleInputChange}
                placeholder="Singapore"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="billing.postalCode"
                value={formData.billingAddress.postalCode}
                onChange={handleInputChange}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center">
          <Lock className="w-5 h-5 text-blue-500 mr-2" />
          <span className="text-blue-700 text-sm">
            Your payment information is encrypted and secure
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="submit"
            disabled={loading || !paymentSession}
            className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Pay ${paymentSession?.totalAmount || '0.00'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 md:flex-none bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;