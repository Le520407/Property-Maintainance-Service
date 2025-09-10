import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Calendar, 
  DollarSign, 
  Users, 
  Package,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  Building,
  CheckCircle,
  ArrowRight,
  Gift,
  Share2,
  Copy,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

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
            <p className="text-sm text-gray-600">Job #{order.jobNumber}</p>
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
              <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Service Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium capitalize">{order.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-medium">{order.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Duration</p>
                <p className="font-medium">{order.estimatedDuration} hours</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Service</p>
                <p className="font-medium">{order.isEmergency ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Location Details */}
          {order.location && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </h4>
              <div className="space-y-1">
                <p>{order.location.address}</p>
                <p>{order.location.city}, {order.location.state} {order.location.zipCode}</p>
              </div>
              {order.accessInstructions && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Access Instructions</p>
                  <p className="text-sm">{order.accessInstructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Timing Details */}
          {order.requestedTimeSlot && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Requested Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(order.requestedTimeSlot.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{order.requestedTimeSlot.startTime} - {order.requestedTimeSlot.endTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Contact Information
            </h4>
            <p className="font-medium">{order.customerContactNumber}</p>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Special Instructions
              </h4>
              <p className="text-sm">{order.specialInstructions}</p>
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

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-medium">${order.subtotal?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax</p>
                <p className="font-medium">${order.taxAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{order.payment?.status || 'Pending'}</p>
              </div>
            </div>
          </div>
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

// Enhanced Customer Dashboard with Real Data
const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalSpent: 0
    },
    recentOrders: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const hasShownLoadToast = useRef(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Load order data (using sample data as backend is not connected)
    const orders = [
      {
        _id: '689e8db0fca44481aba3371f',
        jobNumber: 'JOB1755221424634BA9G',
        title: 'Pest Control',
        description: 'Effective pest control and prevention services using safe chemicals and professional techniques.',
        category: 'general',
        status: 'PENDING',
        priority: 'MEDIUM',
        isEmergency: false,
        totalAmount: 200,
        subtotal: 200,
        taxAmount: 0,
        estimatedDuration: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: {
          address: '789 Test Pest Street',
          city: 'Singapore',
          state: 'Singapore',
          zipCode: '567890'
        },
        requestedTimeSlot: {
          date: '2024-12-17',
          startTime: '10:00',
          endTime: '12:00'
        },
        customerContactNumber: '+65 9876 5432',
        specialInstructions: 'Please use safe chemicals, we have pets',
        accessInstructions: 'Ring doorbell twice',
        payment: { status: 'PENDING' }
      },
      {
        _id: '689e99a5fca44481aba337ab',
        jobNumber: 'JOB1755224485804756G',
        title: 'Emergency Plumbing Fix',
        description: 'Fix leaking kitchen sink',
        category: 'plumbing',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        isEmergency: true,
        totalAmount: 150,
        subtotal: 150,
        taxAmount: 0,
        estimatedDuration: 3,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString(),
        location: {
          address: '456 Emergency Street',
          city: 'Singapore',
          state: 'Singapore',
          zipCode: '567890'
        },
        requestedTimeSlot: {
          date: '2024-12-16',
          startTime: '10:00',
          endTime: '14:00'
        },
        customerContactNumber: '+65 9876 5432',
        specialInstructions: 'Urgent fix needed',
        accessInstructions: 'Ring doorbell',
        payment: { status: 'PENDING' }
      },
      {
        _id: '689e8db0fca44481aba33720',
        jobNumber: 'JOB1755221424634BA9H',
        title: 'House Cleaning Service',
        description: 'Deep cleaning for 3-bedroom apartment',
        category: 'cleaning',
        status: 'COMPLETED',
        priority: 'LOW',
        isEmergency: false,
        totalAmount: 120,
        subtotal: 120,
        taxAmount: 0,
        estimatedDuration: 4,
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        location: {
          address: '123 Clean Street',
          city: 'Singapore',
          state: 'Singapore',
          zipCode: '123456'
        },
        requestedTimeSlot: {
          date: '2024-12-14',
          startTime: '09:00',
          endTime: '13:00'
        },
        customerContactNumber: '+65 1234 5678',
        specialInstructions: 'Please clean bathroom thoroughly',
        accessInstructions: 'Key under mat',
        payment: { status: 'PAID' }
      }
    ];
    
    
    // Calculate stats from orders
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(order => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(order.status)).length,
      completedOrders: orders.filter(order => order.status === 'COMPLETED').length,
      totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    
    // Set the data
    setDashboardData({ stats, recentOrders: orders });
    
    // Show success message only once
    if (!hasShownLoadToast.current) {
      toast.success('Dashboard loaded successfully!', { duration: 2000 });
      hasShownLoadToast.current = true;
    }
    
    setLoading(false);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
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
      title: 'Total Orders', 
      value: dashboardData.stats.totalOrders, 
      icon: Package, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Pending', 
      value: dashboardData.stats.pendingOrders, 
      icon: Calendar, 
      color: 'bg-gradient-to-r from-amber-500 to-yellow-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      title: 'Completed', 
      value: dashboardData.stats.completedOrders, 
      icon: CheckCircle, 
      color: 'bg-gradient-to-r from-emerald-500 to-green-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      title: 'Total Spent', 
      value: `$${dashboardData.stats.totalSpent.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-gradient-to-r from-purple-500 to-indigo-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-300 rounded-full w-20 mb-3"></div>
                  <div className="h-8 bg-gray-300 rounded-full w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="h-8 bg-gray-300 rounded-full w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner - Matching HomePage Design */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns - Matching HomePage */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes - Matching HomePage */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-orange-400 rounded-full opacity-10 transform rotate-45"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-30 rounded-full text-orange-100 text-sm font-medium mb-4 backdrop-blur-sm">
                Dashboard Overview
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              Welcome back,
              <span className="block text-orange-200">{user?.firstName || user?.name}! 👋</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Track your service requests, manage your property maintenance, and stay updated with your orders 
              - all in one convenient dashboard.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/order-request"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center text-lg"
              >
                <Package className="mr-2 w-5 h-5" />
                Request New Service
              </Link>
              <Link
                to="/services"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors text-lg"
              >
                Browse Services
              </Link>
            </motion.div>
            
            {/* Quick Stats Info - Matching HomePage contact style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-8 text-orange-100"
            >
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                <span>{dashboardData.stats.totalOrders} Total Orders</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>{dashboardData.stats.completedOrders} Completed</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                <span>${dashboardData.stats.totalSpent.toFixed(0)} Total Spent</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Enhanced Stats Cards */}
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
                <div className={`p-4 rounded-xl ${stat.color} text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <stat.icon size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} group-hover:scale-105 transition-transform`}>{stat.value}</p>
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
            <button
              onClick={() => navigate('/dashboard?section=orders')}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center"
            >
              View All Orders
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
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
                {/* Mobile & Desktop Unified Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Order Info */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
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
                      <p className="text-xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      {['PENDING', 'ASSIGNED'].includes(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-medium"
                        >
                          <X className="w-4 h-4 inline mr-1" />
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

      {/* Enhanced Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-roboto">Quick Actions</h2>
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
              {/* Background decoration */}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/services"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block text-white group relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-4 rounded-xl bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200">
                      <Settings className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold">Browse Services</h3>
                      <p className="text-blue-100 mt-1">Explore available services</p>
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
              onClick={loadDashboardData}
              className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white group w-full relative overflow-hidden"
            >
              {/* Background decoration */}
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

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderDetails(false)}
          onOrderUpdate={loadDashboardData}
        />
      )}
    </div>
  );
};

const VendorDashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: 'SGD 8,450', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Monthly Orders', value: '28', icon: Package, color: 'bg-blue-500' },
    { title: 'Customer Rating', value: '4.8', icon: Star, color: 'bg-yellow-500' },
    { title: 'Active Customers', value: '45', icon: Users, color: 'bg-purple-500' },
    { title: 'Monthly Commission', value: 'SGD 1,267', icon: TrendingUp, color: 'bg-indigo-500' },
    { title: 'Completion Rate', value: '94%', icon: CheckCircle, color: 'bg-emerald-500' }
  ];

  const subscriptionInfo = {
    plan: 'Professional',
    status: 'Active',
    nextBilling: '2024-02-15',
    features: ['Advanced CRM', 'Detailed Analytics', 'Custom Quote Templates', 'Priority Support']
  };

  const recentJobs = [
    { id: 1, customer: 'John Smith', service: 'Plumbing Repair', status: 'In Progress', amount: 'SGD 350', commission: 'SGD 52.50' },
    { id: 2, customer: 'Sarah Johnson', service: 'Electrical Inspection', status: 'Completed', amount: 'SGD 200', commission: 'SGD 30.00' },
    { id: 3, customer: 'Mike Wilson', service: 'Cleaning Service', status: 'Pending', amount: 'SGD 150', commission: 'SGD 22.50' }
  ];

  const upcomingTraining = [
    { title: 'Customer Service Skills', date: '2024-01-25', duration: '2 hours', type: 'Online Course' },
    { title: 'Financial Management Basics', date: '2024-01-30', duration: '3 hours', type: 'Online Course' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
      
      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
            <p className="text-orange-50">Current Plan: {subscriptionInfo.plan}</p>
            <p className="text-orange-50">Next Billing: {subscriptionInfo.nextBilling}</p>
          </div>
          <div className="text-right space-y-2">
            <div>
              <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
                {subscriptionInfo.status}
              </span>
            </div>
            <div>
              <Link
                to="/membership/dashboard"
                className="inline-flex items-center px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Subscription
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Customer</th>
                  <th className="text-left py-3">Service</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{job.customer}</td>
                    <td className="py-3">{job.service}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{job.amount}</td>
                    <td className="py-3 text-green-600 font-medium">{job.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Training */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Training</h2>
          <div className="space-y-4">
            {upcomingTraining.map((training, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{training.title}</h3>
                    <p className="text-sm text-gray-600">{training.date} • {training.duration}</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                      {training.type}
                    </span>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                    Join
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Schedule Work</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">Create Quote</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">Customer Communication</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const stats = [
    { title: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
    { title: 'Total Vendors', value: '89', icon: Building, color: 'bg-green-500' },
    { title: 'Monthly Revenue', value: '$45,680', icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Pending Review', value: '12', icon: FileText, color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/faqs"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              FAQ Management
            </Link>
            <Link
              to="/admin/pricing"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Pricing Management
            </Link>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              Review Vendor Applications
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              View System Reports
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              Manage User Accounts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Server Status</span>
              <span className="text-green-600">Normal</span>
            </div>
            <div className="flex justify-between">
              <span>Database Connection</span>
              <span className="text-green-600">Normal</span>
            </div>
            <div className="flex justify-between">
              <span>Payment System</span>
              <span className="text-green-600">Normal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Management Component
const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '', // Street Address
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'Malaysia'
  });
  
  // Update profile data when user context changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'Malaysia'
      });
    }
  }, [user]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    try {
      const response = await api.users.updateProfile(profileData);
      
      setIsEditing(false);
      toast.success('Profile updated successfully! ✅');
      
      // Update the profileData state with the response to reflect any server changes
      if (response.user) {
        const updatedProfileData = {
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          address: response.user.address || '',
          city: response.user.city || '',
          state: response.user.state || '',
          zipCode: response.user.zipCode || '',
          country: response.user.country || 'Malaysia'
        };
        setProfileData(updatedProfileData);
        
        // Update the AuthContext with new user data so it's reflected everywhere
        updateUser({
          // Keep all other user properties unchanged
          ...user,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          name: response.user.fullName || `${response.user.firstName} ${response.user.lastName}`,
          phone: response.user.phone,
          address: response.user.address || '',
          city: response.user.city || '',
          state: response.user.state || '',
          zipCode: response.user.zipCode || '',
          country: response.user.country || 'Malaysia'
        });
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  const handlePasswordChange = async () => {
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    try {
      const response = await api.users.changePassword(passwordData);
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
      toast.success('Password changed successfully! ✅');
    } catch (error) {
      console.error('❌ Password change error:', error);
      toast.error(`Failed to change password: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                disabled={!isEditing}
                placeholder="Jalan Permas 16/1, Bandar Baru Permas Jaya, 81750, Masai, Johor"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                autoComplete="street-address"
                name="street-address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={profileData.city}
              onChange={(e) => setProfileData({...profileData, city: e.target.value})}
              disabled={!isEditing}
              placeholder="Masai"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              autoComplete="address-level2"
              name="city"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
            <input
              type="text"
              value={profileData.state}
              onChange={(e) => setProfileData({...profileData, state: e.target.value})}
              disabled={!isEditing}
              placeholder="Johor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              autoComplete="address-level1"
              name="state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
            <input
              type="text"
              value={profileData.zipCode}
              onChange={(e) => setProfileData({...profileData, zipCode: e.target.value})}
              disabled={!isEditing}
              placeholder="81750"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              autoComplete="postal-code"
              name="postal-code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={profileData.country}
              onChange={(e) => setProfileData({...profileData, country: e.target.value})}
              disabled={!isEditing}
              placeholder="Malaysia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              autoComplete="country-name"
              name="country"
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProfileUpdate}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Password & Security</h3>
          {!showPasswordChange && (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordChange && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPasswordChange(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specific Referral Components
const ReferralOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const response = await api.referral.getDashboard();
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading referral data...</div>;
  }

  if (!dashboardData?.hasReferralCode) {
    return (
      <div className="text-center py-12">
        <Gift className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Referrals</h2>
        <p className="text-gray-600 mb-8">Start earning commissions by referring friends to Swift Fix Pro</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Bronze Tier</h3>
            <p className="text-2xl font-bold text-orange-600">5%</p>
            <p className="text-sm text-orange-600">Commission Rate</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Silver Tier</h3>
            <p className="text-2xl font-bold text-gray-600">7.5%</p>
            <p className="text-sm text-gray-600">10+ Referrals</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Gold Tier</h3>
            <p className="text-2xl font-bold text-yellow-600">10%</p>
            <p className="text-sm text-yellow-600">25+ Referrals</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Your Code</p>
              <p className="text-2xl font-bold">{dashboardData.referralCode}</p>
            </div>
            <Gift className="w-10 h-10 text-orange-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.totalReferrals}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-green-600">${dashboardData.statistics.totalEarned.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Current Tier</p>
              <p className="text-xl font-bold text-yellow-600">{dashboardData.currentTier.name}</p>
            </div>
            <Star className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {dashboardData.nextTier && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tier Progress</h3>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{dashboardData.currentTier.name} ({dashboardData.currentTier.rate}%)</span>
            <span>{dashboardData.nextTier.name} ({dashboardData.nextTier.rate}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-orange-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(dashboardData.nextTier.progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {dashboardData.nextTier.requirement - dashboardData.statistics.activeReferrals} more referrals needed
          </p>
        </div>
      )}
    </div>
  );
};

const ReferralList = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralList();
  }, []);

  const loadReferralList = async () => {
    try {
      const response = await api.referral.getDashboard();
      setReferrals(response.referredUsers || []);
    } catch (error) {
      console.error('Failed to load referral list:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading referrals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">My Referrals ({referrals.length})</h3>
        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Joined Date</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Total Spent</th>
                  <th className="text-left py-3 px-2">My Earnings</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{referral.user.firstName} {referral.user.lastName}</td>
                    <td className="py-3 px-2 text-gray-600">{referral.user.email}</td>
                    <td className="py-3 px-2">{new Date(referral.joinedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium">${referral.totalSpent.toFixed(2)}</td>
                    <td className="py-3 px-2 font-medium text-green-600">
                      ${(referral.totalSpent * 0.05).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No referrals yet. Start sharing your referral code!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferralEarnings = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const response = await api.referral.getCommissions();
      setCommissions(response.commissions || []);
      
      const total = response.commissions?.reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
      const pending = response.commissions?.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
      const paid = response.commissions?.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
      
      setStats({ total, pending, paid });
    } catch (error) {
      console.error('Failed to load commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading earnings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">${stats.total.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">${stats.pending.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Paid Out</h3>
          <p className="text-3xl font-bold text-blue-600">${stats.paid.toFixed(2)}</p>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Commission History</h3>
        {commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Referred User</th>
                  <th className="text-left py-3">Order Amount</th>
                  <th className="text-left py-3">Commission Rate</th>
                  <th className="text-left py-3">My Commission</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">{new Date(commission.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">{commission.referredUser.firstName} {commission.referredUser.lastName}</td>
                    <td className="py-3">${commission.orderAmount.toFixed(2)}</td>
                    <td className="py-3">{commission.commissionRate}%</td>
                    <td className="py-3 font-bold text-green-600">${commission.commissionAmount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        commission.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        commission.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {commission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No commissions yet. Start referring to earn!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferralShare = () => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShareData();
  }, []);

  const loadShareData = async () => {
    try {
      const response = await api.referral.getShareLink();
      setShareData(response);
    } catch (error) {
      console.error('Failed to load share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`);
    });
  };

  const generateReferralCode = async () => {
    try {
      await api.referral.generateCode();
      await loadShareData();
      toast.success('Referral code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate referral code');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading share options...</div>;
  }

  if (!shareData) {
    return (
      <div className="text-center py-12">
        <Gift className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Your Referral Code</h2>
        <p className="text-gray-600 mb-8">Create your unique referral code to start sharing</p>
        <button
          onClick={generateReferralCode}
          className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700"
        >
          Generate Referral Code
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Share & Earn Commissions</h2>
        <p className="text-orange-100">Share your referral code and earn up to 10% commission on every sale!</p>
      </div>

      {/* Share Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2 text-orange-600" />
            Referral Code
          </h3>
          <div className="flex mb-4">
            <input
              type="text"
              value={shareData.referralCode}
              readOnly
              className="flex-1 px-4 py-3 text-lg font-bold border border-gray-300 rounded-l-lg bg-gray-50 text-center"
            />
            <button
              onClick={() => copyToClipboard(shareData.referralCode, 'Referral code')}
              className="px-6 py-3 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Share this code with friends during their registration process.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-blue-600" />
            Referral Link
          </h3>
          <div className="flex mb-4">
            <input
              type="text"
              value={shareData.referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
            />
            <button
              onClick={() => copyToClipboard(shareData.referralLink, 'Referral link')}
              className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Direct link that automatically applies your referral code.
          </p>
        </div>
      </div>

      {/* Share Message Template */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Share Message Template</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">{shareData.shareText}</p>
        </div>
        <button
          onClick={() => copyToClipboard(shareData.shareText, 'Share message')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Copy Message
        </button>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('dashboard');

  // Get active tab from URL or state
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    const currentTab = pathSegments[1] || 'overview'; // dashboard/profile -> 'profile'
    
    // Map specific tabs to their sections
    if (['profile', 'security', 'preferences'].includes(currentTab)) {
      setActiveSection('account');
    } else if (['referrals', 'ref-overview', 'my-referrals', 'earnings', 'share'].includes(currentTab) || 
               location.pathname.startsWith('/dashboard/referrals')) {
      setActiveSection('referrals');
    } else {
      setActiveSection('dashboard');
    }
    
    // Set the correct tab based on URL
    if (currentTab === 'profile') {
      setActiveTab('profile');
    } else if (currentTab === 'security') {
      setActiveTab('security');
    } else if (currentTab === 'preferences') {
      setActiveTab('preferences');
    } else if (location.pathname.includes('/referrals')) {
      if (location.pathname.includes('/list')) {
        setActiveTab('my-referrals');
      } else if (location.pathname.includes('/earnings')) {
        setActiveTab('earnings');
      } else if (location.pathname.includes('/share')) {
        setActiveTab('share');
      } else {
        setActiveTab('ref-overview');
      }
    } else {
      setActiveTab(currentTab || 'overview');
    }
  }, [location]);

  const mainNavigation = [
    { 
      name: 'Dashboard', 
      section: 'dashboard',
      icon: Home,
      description: 'Overview & Analytics',
      tabs: [
        { name: 'Overview', tab: 'overview', href: '/dashboard' },
        { name: 'Analytics', tab: 'analytics', href: '/dashboard/analytics' },
        { name: 'Activity', tab: 'activity', href: '/dashboard/activity' }
      ]
    },
    { 
      name: 'Account', 
      section: 'account',
      icon: User,
      description: 'Profile & Settings',
      tabs: [
        { name: 'Profile', tab: 'profile', href: '/dashboard/profile' },
        { name: 'Security', tab: 'security', href: '/dashboard/security' },
        { name: 'Preferences', tab: 'preferences', href: '/dashboard/preferences' }
      ]
    },
    { 
      name: 'Referrals', 
      section: 'referrals',
      icon: Gift,
      description: 'Earn & Share',
      tabs: [
        { name: 'Overview', tab: 'ref-overview', href: '/dashboard/referrals' },
        { name: 'My Referrals', tab: 'my-referrals', href: '/dashboard/referrals/list' },
        { name: 'Earnings', tab: 'earnings', href: '/dashboard/referrals/earnings' },
        { name: 'Share', tab: 'share', href: '/dashboard/referrals/share' }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
  };

  // Show different dashboards based on user role
  const getDashboardContent = () => {
    if (!user) return <div>Please login first</div>;
    
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  // Get current section from navigation
  const getCurrentSection = () => {
    return mainNavigation.find(nav => nav.section === activeSection);
  };

  // Get tab content based on active section and tab
  const getTabContent = () => {
    const section = getCurrentSection();
    
    if (activeSection === 'dashboard') {
      switch (activeTab) {
        case 'analytics':
          return <div className="text-center py-12 text-gray-500">Analytics coming soon...</div>;
        case 'activity':
          return <div className="text-center py-12 text-gray-500">Activity feed coming soon...</div>;
        default:
          return getDashboardContent();
      }
    }
    
    if (activeSection === 'account') {
      switch (activeTab) {
        case 'profile':
          return <ProfileTab />;
        case 'security':
          return <div className="text-center py-12 text-gray-500">Security settings coming soon...</div>;
        case 'preferences':
          return <div className="text-center py-12 text-gray-500">Preferences coming soon...</div>;
        default:
          return <ProfileTab />;
      }
    }
    
    if (activeSection === 'referrals') {
      switch (activeTab) {
        case 'my-referrals':
          return <ReferralList />;
        case 'earnings':
          return <ReferralEarnings />;
        case 'share':
          return <ReferralShare />;
        default:
          return <ReferralOverview />;
      }
    }

    return getDashboardContent();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Modern Sidebar */}
        <div className="w-80 bg-white shadow-2xl border-r border-gray-100 min-h-screen">
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
            <a href="/" className="block mb-6">
              <h1 className="text-2xl font-bold text-white hover:text-orange-100 transition-colors">Swift Fix Pro</h1>
              <p className="text-orange-100 text-sm mt-1">Property Maintenance</p>
            </a>
            
            {/* User Profile Card */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-white">{user?.name || 'User'}</p>
                  <p className="text-orange-100 text-sm capitalize">{user?.role || 'Customer'}</p>
                </div>
              </div>
            </div>
          </div>
            
          {/* Navigation */}
          <div className="p-6">
            <nav className="space-y-2">
              {mainNavigation.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 group"
                    >
                      <div className="w-10 h-10 bg-gray-100 group-hover:bg-orange-100 rounded-lg flex items-center justify-center mr-3 transition-colors">
                        <item.icon size={20} className="group-hover:text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                      </div>
                    </a>
                  );
                }

                const isActiveSection = item.section === activeSection;
                
                return (
                  <div key={item.name} className="space-y-1">
                    <div 
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                        isActiveSection 
                          ? 'bg-orange-50 border border-orange-200 shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setActiveSection(item.section);
                        setActiveTab(item.tabs[0].tab);
                        navigate(item.tabs[0].href);
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                        isActiveSection 
                          ? 'bg-orange-100' 
                          : 'bg-gray-100 group-hover:bg-orange-50'
                      }`}>
                        <item.icon size={20} className={`${
                          isActiveSection ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          isActiveSection ? 'text-orange-700' : 'text-gray-900'
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      {isActiveSection && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Sub-navigation tabs */}
                    {isActiveSection && item.tabs && (
                      <div className="ml-14 space-y-1 mt-2">
                        {item.tabs.map((tab) => (
                          <Link
                            key={tab.tab}
                            to={tab.href}
                            onClick={() => setActiveTab(tab.tab)}
                            className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                              activeTab === tab.tab
                                ? 'bg-orange-100 text-orange-700 font-medium border-l-2 border-orange-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                            }`}
                          >
                            {tab.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <LogOut size={20} className="group-hover:text-red-600" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
          {/* Top Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="px-8 py-6">
              {/* Breadcrumb */}
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Home className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
                {getCurrentSection()?.tabs?.find(t => t.tab === activeTab) && (
                  <>
                    <span className="mx-2">›</span>
                    <span className="text-gray-700">{getCurrentSection()?.tabs?.find(t => t.tab === activeTab)?.name}</span>
                  </>
                )}
              </div>
              
              {/* Page Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-roboto">
                    {getCurrentSection()?.tabs?.find(t => t.tab === activeTab)?.name || getCurrentSection()?.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {getCurrentSection()?.description}
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-3">
                  <Link
                    to="/services"
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors inline-flex items-center"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Book Service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            <Routes>
              <Route path="/" element={getTabContent()} />
              <Route path="/analytics" element={<div className="text-center py-12 text-gray-500">Analytics coming soon...</div>} />
              <Route path="/activity" element={<div className="text-center py-12 text-gray-500">Activity feed coming soon...</div>} />
              <Route path="/profile" element={<ProfileTab />} />
              <Route path="/security" element={<div className="text-center py-12 text-gray-500">Security settings coming soon...</div>} />
              <Route path="/preferences" element={<div className="text-center py-12 text-gray-500">Preferences coming soon...</div>} />
              <Route path="/referrals" element={<ReferralOverview />} />
              <Route path="/referrals/list" element={<ReferralList />} />
              <Route path="/referrals/earnings" element={<ReferralEarnings />} />
              <Route path="/referrals/share" element={<ReferralShare />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 