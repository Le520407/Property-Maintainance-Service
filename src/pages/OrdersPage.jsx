import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Calendar, CreditCard, Eye, Search, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/my-orders?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg p-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number or service name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-8 text-center"
            >
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter ? 'No orders match your search criteria.' : 'You haven\'t placed any orders yet.'}
              </p>
              <button
                onClick={() => navigate('/services')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Browse Services
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Order #{order.orderNumber}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-1" />
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-3 lg:mt-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.items.slice(0, 3).map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{item.serviceName}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            +{order.items.length - 3} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Total: ${order.total.toFixed(2)}</span>
                      <span className="mx-2">•</span>
                      <span>{order.items.length} item(s)</span>
                    </div>
                    <button
                      onClick={() => navigate(`/orders/${order._id}/success`)}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex justify-center"
            >
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(pagination.pages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      pagination.page === index + 1
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
