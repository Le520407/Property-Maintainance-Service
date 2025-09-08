import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        toast.error('Order not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 mb-8 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {order.paymentStatus === 'paid' ? 'Payment Successful!' : 'Order Created!'}
            </h1>
            <p className="text-gray-600 mb-4">
              Your order has been {order.paymentStatus === 'paid' ? 'confirmed and payment received' : 'created successfully'}.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span className="text-gray-500">Order Number:</span>
              <span className="font-mono font-bold text-orange-600">{order.orderNumber}</span>
            </div>
          </motion.div>

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-8 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Details</h2>
            
            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.serviceName}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-orange-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-8 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Shipping Address
            </h2>
            <div className="text-gray-700">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-8 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              What's Next?
            </h2>
            <div className="space-y-4">
              {order.paymentStatus === 'paid' ? (
                <>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Confirmed</p>
                      <p className="text-sm text-gray-600">Your payment has been processed successfully.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Order Processing</p>
                      <p className="text-sm text-gray-600">We'll prepare your order and notify you when it ships.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Payment Pending</p>
                    <p className="text-sm text-gray-600">
                      Please complete your payment to confirm the order. You can check the status in your orders page.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              View All Orders
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
