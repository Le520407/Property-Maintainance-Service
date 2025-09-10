import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Star,
  Plus,
  FileText,
  Settings,
  X,
  Eye,
  Package,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MembershipCard from '../../components/customer/MembershipCard';
import { toast } from 'react-hot-toast';


const CustomerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    recentOrders: [],
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalSpent: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const handleCancelOrder = async (orderId) => {
    // Check if order is already cancelled to prevent duplicate actions
    const orderToCancel = dashboardData.recentOrders.find(order => order._id === orderId);
    if (orderToCancel?.status === 'CANCELLED') {
      toast('Order is already cancelled');
      return;
    }
    
    // Update order status to cancelled
    setDashboardData(prevData => {
      const updatedOrders = prevData.recentOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'CANCELLED' }
          : order
      );
      
      // Recalculate all stats from the updated orders
      const newStats = {
        totalOrders: updatedOrders.length,
        pendingOrders: updatedOrders.filter(order => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(order.status)).length,
        completedOrders: updatedOrders.filter(order => order.status === 'COMPLETED').length,
        // Only count spent money for completed orders (cancelled orders get refunded)
        totalSpent: updatedOrders
          .filter(order => order.status === 'COMPLETED')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      };
      
      return {
        ...prevData,
        recentOrders: updatedOrders,
        stats: newStats
      };
    });
    
    toast.success('Order cancelled successfully!', { duration: 2000 });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch real dashboard data from API using correct endpoints
      const jobsResponse = await api.jobs.getUserJobs({ limit: 5 });
      
      // Extract orders from response
      const orders = jobsResponse.jobs || jobsResponse.data?.jobs || [];
      
      // Calculate stats from the orders data
      const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(order.status)).length,
        completedOrders: orders.filter(order => order.status === 'COMPLETED').length,
        totalSpent: orders
          .filter(order => order.status === 'COMPLETED')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      };

      setDashboardData({
        recentOrders: orders,
        stats: stats
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data from /jobs/user:', error);
      
      // Try fallback API endpoint
      try {
        const fallbackResponse = await api.customer.getJobs();
        const orders = fallbackResponse.jobs || fallbackResponse.data?.jobs || [];
        
        // Calculate stats from the orders data
        const stats = {
          totalOrders: orders.length,
          pendingOrders: orders.filter(order => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(order.status)).length,
          completedOrders: orders.filter(order => order.status === 'COMPLETED').length,
          totalSpent: orders
            .filter(order => order.status === 'COMPLETED')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        };

        setDashboardData({
          recentOrders: orders,
          stats: stats
        });
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        // Set empty data if both APIs fail
        setDashboardData({
          recentOrders: [],
          stats: {
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalSpent: 0
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };


  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your property maintenance services</p>
        </div>
        <Link
          to="/jobs/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Book Service
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-blue-100 mr-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-yellow-100 mr-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingOrders}</p>
                </div>
              </div>
            </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedOrders}</p>
                </div>
              </div>
              <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity`}>
                <stat.icon size={28} className={stat.textColor} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

          {/* Modern Recent Orders Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-orange-50 p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 font-roboto">Recent Orders</h2>
                  <p className="text-gray-600">Track your latest service requests and their progress</p>
                </div>
                <Link
                  to="/jobs"
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center"
                >
                  View All Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            <div className="p-8">{dashboardData.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentOrders.slice(0, 5).map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl hover:from-orange-50 hover:to-gray-50 transition-all duration-300 border border-gray-200 hover:border-orange-200 hover:shadow-md group"
                  >
                    {/* Fixed Layout - No Overlap */}
                    <div className="space-y-4">
                      {/* Order Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Job Number</p>
                          <p className="font-mono text-sm font-medium text-gray-900">{order.jobNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Service</p>
                          <p className="font-semibold text-gray-900">{order.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-gray-700">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="text-xl font-bold text-gray-900">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {/* Status & Actions Row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        
                        <div className="flex space-x-2">
                          <Link
                            to={`/jobs/${order._id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                          {['PENDING', 'ASSIGNED'].includes(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-medium inline-flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No orders yet</h3>
                <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">Ready to get started? Request your first service and let us handle the rest!</p>
                <Link
                  to="/order-request"
                  className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Request Your First Service
                </Link>
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Enhanced Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link
              to="/order-request"
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block text-white group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-4 rounded-xl bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold">Request Service</h3>
                      <p className="text-orange-100 mt-1">Book a new maintenance service</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-orange-200 group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-200" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Recent Updates */}
          {dashboardData.recentOrders.some(order => order.workProgress?.workNotes || order.completionDetails) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {dashboardData.recentOrders
                  .filter(order => order.workProgress?.workNotes || order.completionDetails)
                  .slice(0, 2)
                  .map((order) => (
                    <div key={order._id} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm font-medium text-gray-900">{order.title}</p>
                      <p className="text-xs text-gray-600">
                        {order.completionDetails || order.workProgress?.workNotes}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-200 group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-200" />
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={fetchDashboardData}
              className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white group w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-4 rounded-xl bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold">Refresh Data</h3>
                      <p className="text-emerald-100 mt-1">Update dashboard information</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-emerald-200 group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-200" />
                </div>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Membership Card */}
      <MembershipCard />
    </div>
  );
};

export default CustomerDashboard;
