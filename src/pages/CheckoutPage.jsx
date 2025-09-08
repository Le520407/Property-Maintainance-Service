import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recipientName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: 'Singapore',
    postalCode: '',
    paymentMethod: 'credit-card'
  });

  const shippingCost = 10;
  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.recipientName || !formData.phone || !formData.address || 
          !formData.city || !formData.postalCode) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          serviceId: item.id,
          serviceName: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || 'service'
        })),
        shippingAddress: {
          fullName: formData.recipientName,
          phone: formData.phone,
          email: formData.email,
          street: formData.address,
          city: formData.city,
          state: formData.state || 'Singapore',
          postalCode: formData.postalCode,
          country: 'Singapore',
          notes: formData.notes
        },
        paymentMethod: 'hitpay'
      };

      console.log('Creating order with data:', orderData);

      // Create order and get payment URL
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/create`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Order creation response:', response.data);

      if (response.data.success && response.data.paymentUrl) {
        // Clear cart before redirecting to payment
        clearCart();
        
        toast.success('Order created! Redirecting to payment...');
        
        // Redirect to HitPay payment page
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      
      let errorMessage = 'Failed to process order. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-8"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Please add some items to your cart before proceeding to checkout.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-8"
          >
            Checkout
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 mb-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        name="recipientName"
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </form>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit-card"
                      checked={formData.paymentMethod === 'credit-card'}
                      onChange={handleInputChange}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Credit Card</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleInputChange}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">PayPal</span>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6 sticky top-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">SGD {(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">SGD {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">SGD {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-orange-600">SGD {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>

                {/* Security Notice */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure payment processing
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 