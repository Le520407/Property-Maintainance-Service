import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Package, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  User,
  DollarSign,
  Star,
  Eye,
  X,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try primary API endpoint for customer jobs
      let jobsResponse;
      try {
        jobsResponse = await api.get('/jobs/my-orders');
        console.log('Jobs response:', jobsResponse);
      } catch (error) {
        console.error('Primary API failed, trying fallback:', error);
        // Try fallback endpoint
        jobsResponse = await api.get('/customer/jobs');
      }
      
      // Extract orders from response
      const orders = jobsResponse.jobs || jobsResponse.data?.jobs || [];
      console.log('Extracted orders:', orders);
      
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
      console.error('Error fetching dashboard data:', error);
      // Set empty data if APIs fail
      setDashboardData({
        recentOrders: [],
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalSpent: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = [
    {
      title: 'Total Jobs',
      value: dashboardData.stats.totalOrders,
      color: '#EC5C0D',
      icon: Package
    },
    {
      title: 'Active Jobs',
      value: dashboardData.stats.pendingOrders,
      color: '#EC5C0D',
      icon: Clock
    },
    {
      title: 'Completed Jobs',
      value: dashboardData.stats.completedOrders,
      color: '#EC5C0D',
      icon: CheckCircle
    },
    {
      title: 'Total Spent',
      value: dashboardData.stats.totalSpent,
      color: '#EC5C0D',
      icon: DollarSign,
      prefix: '$'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || user?.name || 'Customer'}!
              </h1>
              <p className="text-gray-600">Here's what's happening with your services</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              to="/services"
              className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md group"
              style={{ backgroundColor: '#EC5C0D', color: 'white' }}
            >
              <Calendar className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">Book New Service</span>
            </Link>

            <Link
              to="/customer/jobs"
              className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md group"
              style={{ backgroundColor: '#EC5C0D', color: 'white' }}
            >
              <Package className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">View All Jobs</span>
            </Link>

            <Link
              to="/referrals"
              className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md group"
              style={{ backgroundColor: '#EC5C0D', color: 'white' }}
            >
              <Star className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">Referrals</span>
            </Link>

            <Link
              to="/membership"
              className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md group"
              style={{ backgroundColor: '#EC5C0D', color: 'white' }}
            >
              <CreditCard className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">Manage Subscription</span>
            </Link>

            <Link
              to="/billing"
              className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md group"
              style={{ backgroundColor: '#EC5C0D', color: 'white' }}
            >
              <DollarSign className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">Billing History</span>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-orange-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#EC5C0D' }}>
                    {stat.prefix || ''}{typeof stat.value === 'number' && stat.prefix === '$' 
                      ? stat.value.toFixed(2) 
                      : stat.value}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.title}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Orders Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Jobs</h2>
            <Link 
              to="/orders" 
              className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {dashboardData.recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-500 mb-6">Start by booking your first service</p>
              <Link
                to="/services"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentOrders.slice(0, 5).map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl hover:from-orange-50 hover:to-gray-50 transition-all duration-300 border border-gray-200 hover:border-orange-200 hover:shadow-md group"
                >
                  <div className="space-y-4">
                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Job Number</p>
                        <p className="font-mono text-sm font-medium text-gray-900">{order.jobNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service</p>
                        <p className="font-semibold text-gray-900">{order.title || order.service?.name || 'Service'}</p>
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
                      {getJobStatusBadge(order.status)}
                      
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
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;