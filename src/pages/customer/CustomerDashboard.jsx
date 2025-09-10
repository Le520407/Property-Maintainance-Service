import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
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
import { api } from '../../services/api';
import MembershipCard from '../../components/customer/MembershipCard';
import { toast } from 'react-hot-toast';

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onOrderUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      await api.jobs.cancelJob(order._id, 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      onOrderUpdate(); // Refresh parent data
      onClose();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">Job #{order.jobNumber || order._id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Key Info */}
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
              <h3 className="text-lg font-semibold mt-2">{order.title}</h3>
              <p className="text-gray-600">{order.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${order.totalAmount?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Service Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium capitalize">{order.category || 'General'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendor</p>
                <p className="font-medium">{order.vendor?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-medium">{order.priority || 'Medium'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Service</p>
                <p className="font-medium">{order.isEmergency ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Work Progress */}
          {order.workProgress && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Work Progress</h4>
              {order.workProgress.percentage > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{order.workProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${order.workProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {order.workProgress.workNotes && (
                <div>
                  <p className="text-sm text-gray-600">Latest Update</p>
                  <p className="text-sm">{order.workProgress.workNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Completion Details */}
          {order.completionDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Work Completed</h4>
              <p className="text-sm">{order.completionDetails}</p>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Order Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Membership Discount */}
          {order.membershipDiscount > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-green-800">Membership Benefits</h4>
              <div className="flex justify-between">
                <span className="text-green-700">Membership Discount:</span>
                <span className="font-medium text-green-800">-${order.membershipDiscount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          
          <div className="space-x-3">
            {['PENDING', 'ASSIGNED'].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
            
            {order.status === 'COMPLETED' && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Leave Review
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CustomerDashboard = () => {
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewOrder = (job) => {
    setSelectedOrder(job);
    setShowOrderDetails(true);
  };

  const handleOrderUpdate = () => {
    fetchDashboardData(); // Refresh data
  };

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
      // Fetch real dashboard data from API
      const [jobsResponse, statsResponse] = await Promise.all([
        api.get('/jobs/my-jobs?limit=5'),
        api.get('/jobs/my-stats')
      ]);

      setDashboardData({
        recentOrders: jobsResponse.data.jobs || [],
        stats: statsResponse.data.stats || {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalSpent: 0
        }
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty data if API fails - no demo data
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_discussion: 'bg-blue-100 text-blue-800',
      quote_sent: 'bg-orange-100 text-orange-800',
      quote_accepted: 'bg-purple-100 text-purple-800',
      quote_rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      in_progress: AlertTriangle,
      completed: CheckCircle,
      cancelled: AlertTriangle
    };
    return icons[status] || Clock;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-green-100 mr-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-purple-100 mr-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardData.stats.totalSpent}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
                <Link
                  to="/jobs"
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  View all
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {dashboardData.recentJobs.length > 0 ? (
                dashboardData.recentJobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status);
                  return (
                    <div
                      key={job._id}
                      className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-4">
                            <StatusIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">
                              {job.vendor?.name} • {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                            {job.membershipDiscount > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Membership discount: -${job.membershipDiscount}
                              </p>
                            )}
                            
                            {/* Latest Progress Update */}
                            {job.workProgress?.workNotes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                <p className="text-blue-800 font-medium">Latest Update:</p>
                                <p className="text-blue-700">{job.workProgress.workNotes}</p>
                              </div>
                            )}
                            
                            {/* Completion Details */}
                            {job.status === 'COMPLETED' && job.completionDetails && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                <p className="text-green-800 font-medium">Work Completed:</p>
                                <p className="text-green-700">{job.completionDetails}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status.replace('_', ' ').toUpperCase()}
                            </span>
                            
                            {/* Progress Bar for IN_PROGRESS jobs */}
                            {(job.status === 'IN_PROGRESS' || job.status === 'COMPLETED') && job.workProgress?.percentage > 0 && (
                              <div className="w-24">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{job.workProgress.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      job.status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${job.workProgress.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                job.totalAmount ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {job.totalAmount ? `$${job.totalAmount.toLocaleString()}` : 'Quote pending'}
                              </p>
                            </div>
                          </div>
                          
                          {/* View Details Button */}
                          <button
                            onClick={() => handleViewOrder(job)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors font-medium flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No jobs yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Book your first service to get started
                  </p>
                  <Link
                    to="/jobs/create"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    Book Service Now
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Membership Card */}
          <MembershipCard />

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/jobs/create"
                className="w-full flex items-center justify-between p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <span className="font-medium">Book New Service</span>
                <Calendar className="h-5 w-5" />
              </Link>
              
              <Link
                to="/jobs"
                className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">View All Jobs</span>
                <Clock className="h-5 w-5" />
              </Link>
              
              <Link
                to="/membership/plans"
                className="w-full flex items-center justify-between p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <span className="font-medium">Membership Plans</span>
                <Star className="h-5 w-5" />
              </Link>
              
              <Link
                to="/subscription/manage"
                className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="font-medium">Manage Subscription</span>
                <Settings className="h-5 w-5" />
              </Link>
              
              <Link
                to="/subscription/billing-history"
                className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium">Billing History</span>
                <FileText className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>

          {/* Recent Updates */}
          {dashboardData.recentJobs.some(job => job.workProgress?.workNotes || job.completionDetails) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {dashboardData.recentJobs
                  .filter(job => job.workProgress?.workNotes || job.completionDetails)
                  .slice(0, 2)
                  .map((job) => (
                    <div key={job._id} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-600">
                        {job.completionDetails || job.workProgress?.workNotes}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Support Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is here to help with any questions about your services or membership.
            </p>
            <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
              <Users className="h-4 w-4 mr-2" />
              Contact Support
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setShowOrderDetails(false)}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;