import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Gift,
  Home,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Save,
  Settings,
  TrendingUp,
  User,
  Video,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { api } from '../../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const SimpleDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeOrders: 0,
      completedOrders: 0,
      nextAppointment: null
    },
    recentOrders: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch user's orders from API (customers use /my-orders endpoint)
      const response = await fetch('/api/jobs/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.jobs || [];

        const stats = {
          activeOrders: orders.filter(o => ['PENDING', 'IN_PROGRESS', 'ASSIGNED', 'IN_DISCUSSION', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PAID'].includes(o.status)).length,
          completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
          nextAppointment: orders.find(o => ['PENDING', 'ASSIGNED', 'PAID'].includes(o.status))
        };

        setDashboardData({ stats, recentOrders: orders });
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText);
        if (response.status === 403) {
          console.log('User might not be a customer or token is invalid');
        }
        // Set empty state instead of sample data
        setDashboardData({ 
          stats: { activeOrders: 0, completedOrders: 0, nextAppointment: null }, 
          recentOrders: [] 
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty state instead of sample data
      setDashboardData({ 
        stats: { activeOrders: 0, completedOrders: 0, nextAppointment: null }, 
        recentOrders: [] 
      });
    }
  };

  const loadSampleData = () => {
    // Sample data - fallback
    const orders = [
      {
        _id: '1',
        jobNumber: 'JOB001',
        title: 'Plumbing Repair',
        status: 'IN_PROGRESS',
        totalAmount: 150,
        scheduledDate: '2024-12-20',
        vendorId: { firstName: 'John', lastName: 'Doe' },
        category: 'plumbing',
        images: ['sample-image-1.jpg', 'sample-image-2.jpg'], // Sample images for testing
        videos: ['sample-video-1.mp4'], // Sample video for testing
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        jobNumber: 'JOB002',
        title: 'House Cleaning',
        status: 'COMPLETED',
        totalAmount: 120,
        scheduledDate: '2024-12-15',
        vendorId: { firstName: 'Jane', lastName: 'Smith' },
        category: 'cleaning',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '3',
        jobNumber: 'JOB003',
        title: 'Garden Maintenance',
        status: 'PENDING',
        estimatedBudget: 100,
        scheduledDate: '2024-12-22',
        vendorId: null,
        category: 'gardening',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    const stats = {
      activeOrders: orders.filter(o => ['PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      nextAppointment: orders.find(o => ['PENDING', 'ASSIGNED'].includes(o.status))
    };

    setDashboardData({ stats, recentOrders: orders });
  };

  const sidebarNavigation = [
    { 
      name: 'Overview', 
      tab: 'overview',
      icon: Home,
      description: 'Dashboard summary'
    },
    { 
      name: 'My Orders', 
      tab: 'orders',
      icon: Package,
      description: 'View all orders'
    },
    { 
      name: 'Profile', 
      tab: 'profile',
      icon: User,
      description: 'Account settings'
    },
    { 
      name: 'Referrals', 
      tab: 'referrals',
      icon: Gift,
      description: 'Earn rewards'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'ASSIGNED': return <User className="w-4 h-4 text-blue-500" />;
      case 'IN_DISCUSSION': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'QUOTE_SENT': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'QUOTE_ACCEPTED': return <CheckCircle className="w-4 h-4 text-teal-500" />;
      case 'QUOTE_REJECTED': return <X className="w-4 h-4 text-red-500" />;
      case 'PAID': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED': return <X className="w-4 h-4 text-red-500" />;
      case 'REJECTED': return <X className="w-4 h-4 text-red-400" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'ASSIGNED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_DISCUSSION': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUOTE_SENT': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'QUOTE_ACCEPTED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'QUOTE_REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PAID': return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'PENDING': return 'Waiting for admin review';
      case 'ASSIGNED': return 'Assigned to vendor';
      case 'IN_DISCUSSION': return 'Discussing details with vendor';
      case 'QUOTE_SENT': return 'Quote sent for approval';
      case 'QUOTE_ACCEPTED': return 'Quote accepted, vendor can start work';
      case 'QUOTE_REJECTED': return 'Quote rejected, discuss new quote with vendor';
      case 'PAID': return 'Payment completed, work scheduled';
      case 'IN_PROGRESS': return 'Work in progress';
      case 'COMPLETED': return 'Work completed successfully';
      case 'CANCELLED': return 'Job cancelled';
      case 'REJECTED': return 'Vendor rejected assignment';
      default: return 'Unknown status';
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setShowOrderDetails(false);
  };

  const handleCancelOrder = () => {
    setShowCancelConfirmation(true);
  };

  const confirmCancelOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/jobs/${selectedOrder._id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Order cancelled successfully');
        
        // Refresh the dashboard data
        loadDashboardData();
        
        // Close modals and reset state
        setShowCancelConfirmation(false);
        setShowOrderDetails(false);
        setSelectedOrder(null);
        setCancelReason('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleCloseCancelConfirmation = () => {
    setShowCancelConfirmation(false);
    setCancelReason('');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab orders={dashboardData.recentOrders} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getStatusDescription={getStatusDescription} onViewDetails={handleViewDetails} />;
      case 'profile':
        return <ProfileTab user={user} updateUser={updateUser} />;
      case 'referrals':
        return <ReferralsTab />;
      default:
        return <OverviewTab dashboardData={dashboardData} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getStatusDescription={getStatusDescription} onViewDetails={handleViewDetails} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="flex h-[calc(100vh-6rem)]">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-28 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static top-24 lg:top-auto left-0 lg:left-auto z-40 lg:z-auto w-64 bg-white shadow-lg border-r border-gray-200 h-[calc(100vh-6rem)] lg:h-full overflow-y-auto transition-transform duration-300 ease-in-out`}>
          {/* User Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 m-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white border-opacity-30">
                  {user?.firstName?.[0] || user?.name?.[0] || 'U'}
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-lg text-white">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.name || 'User'}
                  </h3>
                  <p className="text-orange-100 text-sm font-medium capitalize">
                    {user?.role || 'Customer'}
                  </p>
                  {user?.status && (
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        user.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className="text-xs text-orange-100">
                        {user.status === 'ACTIVE' ? 'Active Account' : 'Pending Verification'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6">
            
            <nav className="space-y-2">
              {sidebarNavigation.map((item) => {
                const isActive = activeTab === item.tab;
                
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-orange-50 text-orange-700 border-r-4 border-orange-500' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={20} className="mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={handleCloseDetails}
          onCancelOrder={handleCancelOrder}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusDescription={getStatusDescription}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && selectedOrder && (
        <CancelConfirmationModal 
          order={selectedOrder}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          onConfirm={confirmCancelOrder}
          onClose={handleCloseCancelConfirmation}
        />
      )}

    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ dashboardData, getStatusIcon, getStatusColor, getStatusDescription, onViewDetails }) => {
  return (
    <div className="space-y-8">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <div className="flex items-center mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
              <p className="text-orange-100 text-lg">Here's what's happening with your property services</p>
            </div>
          </div>
          
          {/* Quick Stats Preview in Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
              <div className="text-sm text-orange-100">Active Orders</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.completedOrders}</div>
              <div className="text-sm text-orange-100">Completed</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.nextAppointment ? 'Dec 22' : 'None'}</div>
              <div className="text-sm text-orange-100">Next Service</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeOrders}</p>
              <p className="text-sm text-gray-600">Active Orders</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center">
              <div className="p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedOrders}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">
                {dashboardData.stats.nextAppointment ? 'Dec 22' : 'None'}
              </p>
              <p className="text-sm text-gray-600">Next Service</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/order-request"
              className="flex items-center justify-between p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <div className="flex items-center">
                <Plus className="w-5 h-5 mr-3" />
                <span className="font-medium">Request New Service</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
            
            <Link
              to="/services"
              className="w-full flex items-center justify-between p-4 bg-white border rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3 text-gray-600" />
                <span className="font-medium text-gray-900">Browse Services</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            
            <button className="w-full flex items-center justify-between p-4 bg-white border rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-3 text-gray-600" />
                <span className="font-medium text-gray-900">Contact Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>

          {dashboardData.recentOrders.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border">
              {dashboardData.recentOrders.slice(0, 3).map((order, index) => (
                <div
                  key={order._id}
                  className={`p-6 ${index !== Math.min(dashboardData.recentOrders.length, 3) - 1 ? 'border-b' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(order.status)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{order.title}</h3>
                        <p className="text-sm text-gray-600">#{order.jobNumber}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        {/* Vendor Information */}
                        {order.vendorId && (
                          <div className="flex items-center text-sm text-blue-600 mt-1">
                            <User className="w-4 h-4 mr-1" />
                            <span>Assigned to: {order.vendorId.firstName} {order.vendorId.lastName}</span>
                          </div>
                        )}
                        {/* Status Description */}
                        <p className="text-xs text-gray-500 mt-1">{getStatusDescription(order.status)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ${order.totalAmount || order.vendorQuote?.amount || 'TBD'}
                      </p>
                      <button 
                        onClick={() => onViewDetails(order)}
                        className="mt-2 text-orange-600 text-sm hover:text-orange-700"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Get started by requesting your first service</p>
              <Link
                to="/order-request"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Request Service
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, getStatusIcon, getStatusColor, getStatusDescription, onViewDetails }) => {
  return (
    <div className="space-y-6">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                <p className="text-orange-100 text-lg">Track and manage all your service requests</p>
              </div>
            </div>
            
            {/* Order Summary Stats */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.filter(o => ['PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length}</div>
                <div className="text-xs text-orange-100">Active</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.filter(o => o.status === 'COMPLETED').length}</div>
                <div className="text-xs text-orange-100">Completed</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.length}</div>
                <div className="text-xs text-orange-100">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {orders.map((order, index) => (
          <div key={order._id} className={`p-6 ${index !== orders.length - 1 ? 'border-b' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                {getStatusIcon(order.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900">{order.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">#{order.jobNumber}</p>
                  
                  {/* Status Description */}
                  <p className="text-xs text-gray-500 mt-1">{getStatusDescription(order.status)}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    
                    {/* Scheduled Date */}
                    {order.requestedTimeSlot?.date && (
                      <div className="flex items-center text-sm text-orange-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Scheduled: {new Date(order.requestedTimeSlot.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Vendor Information */}
                  {order.vendorId ? (
                    <div className="flex items-center text-sm text-orange-600 mt-2">
                      <User className="w-4 h-4 mr-1" />
                      <span>
                        <strong>Assigned to:</strong> {order.vendorId.firstName} {order.vendorId.lastName}
                      </span>
                      {order.vendorId.phone && (
                        <span className="ml-2 text-gray-500">
                          • {order.vendorId.phone}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-yellow-600 mt-2">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>No vendor assigned yet</span>
                    </div>
                  )}
                  
                  {/* Progress Information */}
                  {order.workProgress?.percentage > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{order.workProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-orange-600 h-1.5 rounded-full" 
                          style={{ width: `${order.workProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quote Information */}
                  {order.vendorQuote?.amount && (
                    <div className="flex items-center text-sm text-green-600 mt-2">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>Quote: ${order.vendorQuote.amount}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${order.totalAmount || order.vendorQuote?.amount || 'TBD'}
                </p>
                <button 
                  onClick={() => onViewDetails(order)}
                  className="mt-2 text-orange-600 text-sm hover:text-orange-700"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ user, updateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || ''
  });

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
        zipCode: user.zipCode || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const response = await api.users.updateProfile(profileData);
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
      if (response.user) {
        updateUser({
          ...user,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          address: response.user.address,
          city: response.user.city,
          state: response.user.state,
          zipCode: response.user.zipCode
        });
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-orange-100 text-lg">Manage your account information</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
            >
              {isEditing ? <X className="w-5 h-5 mr-2" /> : <Edit className="w-5 h-5 mr-2" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          {/* User Info Preview in Banner */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div>
              <div className="text-xl font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-orange-100">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={profileData.state}
              onChange={(e) => setProfileData({...profileData, state: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// Referrals Tab Component
const ReferralsTab = () => {
  useAuth();
  const [referralData, setReferralData] = useState({
    hasReferralCode: false,
    referralCode: '',
    stats: {
      totalReferrals: 0,
      totalPoints: 0,
      pendingPoints: 0,
      tier: 'Bronze'
    },
    referralLink: '',
    shareText: ''
  });
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadReferralData();
    loadWalletData();
  }, []);

  const loadReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
        
        // If user has referral code, get share link
        if (data.hasReferralCode) {
          const linkResponse = await fetch('/api/referral/share-link', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            setReferralData(prev => ({
              ...prev,
              referralLink: linkData.referralLink,
              shareText: linkData.shareText
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
        setRecentActivity(data.recentTransactions || []);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const generateReferralCode = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/referral/generate-code', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralData(prev => ({
          ...prev,
          hasReferralCode: true,
          referralCode: data.referral.code,
          stats: {
            totalReferrals: data.referral.totalReferrals,
            totalPoints: data.referral.totalPointsEarned || 0,
            pendingPoints: data.referral.pendingPoints || 0,
            tier: data.referral.tierName
          }
        }));
        toast.success('Referral code generated successfully!');
        loadReferralData(); // Reload to get share link
      }
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      toast.error('Failed to generate referral code');
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareOnSocial = (platform) => {
    const text = encodeURIComponent(referralData.shareText);
    const url = encodeURIComponent(referralData.referralLink);
    
    let shareUrl = '';
    // eslint-disable-next-line default-case
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="animate-pulse">
            <div className="h-8 bg-white bg-opacity-20 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
                <p className="text-orange-100 text-lg">Earn rewards by referring friends</p>
              </div>
            </div>
            
            {/* Referral Stats Preview */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{referralData.statistics?.totalReferrals || 0}</div>
                <div className="text-xs text-orange-100">Referrals</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">${referralData.statistics?.totalEarned || 0}</div>
                <div className="text-xs text-orange-100">Earned</div>
              </div>
            </div>
          </div>
          
          {/* Quick Referral Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {referralData.hasReferralCode ? (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors flex items-center"
                >
                  📱 Share Link
                </button>
                <button
                  onClick={copyReferralLink}
                  className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors flex items-center"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors flex items-center"
                >
                  💰 Withdraw Earnings
                </button>
              </>
            ) : (
              <button
                onClick={generateReferralCode}
                className="bg-white bg-opacity-20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors flex items-center"
              >
                🎁 Get My Referral Code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {referralData.hasReferralCode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referral Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Referral Code */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{referralData.referralCode}</div>
                  <div className="text-sm text-gray-600 mt-1">Share this code with friends</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralData.referralCode);
                    toast.success('Referral code copied!');
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{referralData.statistics?.totalReferrals || 0}</div>
                  <div className="text-sm text-gray-600">Total Referrals</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{referralData.statistics?.activeReferrals || 0}</div>
                  <div className="text-sm text-gray-600">Active Referrals</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{referralData.currentTier?.name || 'Bronze'}</div>
                  <div className="text-sm text-gray-600">Current Tier</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          activity.status === 'PAID' ? 'bg-green-500' : 
                          activity.status === 'APPROVED' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Commission from {activity.referredUser?.firstName} {activity.referredUser?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        +${activity.commissionAmount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📊</div>
                  <div className="text-sm text-gray-600">No activity yet</div>
                  <div className="text-xs text-gray-500">Start referring friends to see activity here</div>
                </div>
              )}
            </div>
          </div>

          {/* Earnings Sidebar */}
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Earned</span>
                  <span className="font-semibold text-gray-900">${walletData?.wallet?.totalEarnings || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-semibold text-yellow-600">${walletData?.wallet?.pendingEarnings || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-semibold text-green-600">${walletData?.wallet?.availableForPayout || 0}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Withdrawn</span>
                  <span className="font-semibold text-gray-900">${walletData?.wallet?.totalPaid || 0}</span>
                </div>
              </div>
              
              {walletData?.wallet?.availableForPayout >= (walletData?.minimumPayout || 50) && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Request Withdrawal
                </button>
              )}
            </div>

            {/* Tier Progress */}
            {referralData.nextTier && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current: {referralData.currentTier?.name}</span>
                    <span>Next: {referralData.nextTier?.name}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(referralData.nextTier?.progress || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {referralData.statistics?.activeReferrals} / {referralData.nextTier?.requirement} referrals
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">1</span>
                  <span>Share your referral code or link with friends</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">2</span>
                  <span>They sign up and make their first purchase</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-center text-xs font-medium mr-3 mt-0.5">3</span>
                  <span>You earn {referralData.currentTier?.points || 20} points when they complete their first order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started with Referrals</h3>
          <p className="text-gray-600 mb-6">Generate your unique referral code and start earning points</p>
          <button
            onClick={generateReferralCode}
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Gift className="w-5 h-5 mr-2" />
            Generate My Referral Code
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Your Referral Link</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={referralData.referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-4 py-2 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share on Social Media</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="flex items-center justify-center px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                  >
                    🐦 Twitter
                  </button>
                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex items-center justify-center px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                  >
                    💼 LinkedIn
                  </button>
                  <button
                    onClick={() => shareOnSocial('whatsapp')}
                    className="flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Withdrawal</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Available for withdrawal</div>
                <div className="text-2xl font-bold text-green-600">${walletData?.wallet?.availableForPayout || 0}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STORE_CREDIT">Store Credit</option>
                </select>
              </div>
              
              <div className="text-xs text-gray-500">
                Minimum withdrawal amount: ${walletData?.minimumPayout || 50}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Request Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to check if order can be cancelled
const canCancelOrder = (order) => {
  const cancellableStatuses = ['PENDING', 'ASSIGNED', 'IN_DISCUSSION', 'QUOTE_SENT'];
  return cancellableStatuses.includes(order.status);
};

// Order Details Modal Component  
const OrderDetailsModal = ({ order, onClose, onCancelOrder, getStatusIcon, getStatusColor, getStatusDescription }) => {
  const [zoomedImage, setZoomedImage] = useState(null);
  
  const handleImageClick = (imageSrc) => {
    console.log('OrderDetailsModal - Image clicked:', imageSrc);
    setZoomedImage(imageSrc);
  };

  const handleQuoteResponse = async (jobId, response) => {
    try {
      console.log('Responding to quote:', { jobId, response });
      
      const result = await api.customer.respondToQuote(jobId, { response });
      
      // Update the order status locally
      order.status = response;
      
      if (response === 'QUOTE_ACCEPTED') {
        toast.success('Quote accepted! The vendor can now start work.');
      } else {
        toast.success('Quote rejected. You can discuss with the vendor for a new quote.');
      }
      
      // Close the modal and refresh the dashboard
      onClose();
      window.location.reload(); // Simple way to refresh the data
      
    } catch (error) {
      console.error('Error responding to quote:', error);
      toast.error(`Failed to ${response === 'QUOTE_ACCEPTED' ? 'accept' : 'reject'} quote: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.status)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.title}</h2>
              <p className="text-gray-600">#{order.jobNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`rounded-lg p-4 mb-6 border-l-4 ${getStatusColor(order.status)} border-l-current`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{order.status.replace('_', ' ')}</p>
              <p className="text-sm opacity-90">{getStatusDescription(order.status)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${order.totalAmount || order.vendorQuote?.amount || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{order.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900 capitalize">{order.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created Date</label>
                  <p className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                {order.estimatedBudget && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Your Estimated Budget</label>
                    <p className="text-gray-900 text-sm">${order.estimatedBudget} <span className="text-gray-500">(for reference only)</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {order.location && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Location</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{order.location.address}</p>
                    <p className="text-gray-600">
                      {order.location.city}
                      {order.location.state && `, ${order.location.state}`}
                      {order.location.zipCode && ` ${order.location.zipCode}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule */}
            {order.requestedTimeSlot && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Scheduled Time</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-gray-900">
                      {new Date(order.requestedTimeSlot.date).toLocaleDateString()}
                    </p>
                    {order.requestedTimeSlot.startTime && order.requestedTimeSlot.endTime && (
                      <p className="text-gray-600">
                        {order.requestedTimeSlot.startTime} - {order.requestedTimeSlot.endTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files - Always show section if files array exists (even if empty for debugging) */}
            {(order.images !== undefined || order.videos !== undefined) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Uploaded Files
                  {/* Debug info */}
                  <span className="text-xs text-gray-500 ml-2">
                    (Images: {order.images?.length || 0}, Videos: {order.videos?.length || 0})
                  </span>
                </h3>
                
                {/* Images */}
                {console.log('Order images:', order.images)}
                {order.images && order.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      Photos ({order.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {order.images.map((imageName, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={`/uploads/order-attachments/${imageName}`}
                            alt={`Order attachment ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Image clicked:', imageName);
                              handleImageClick(`/uploads/order-attachments/${imageName}`);
                            }}
                            onError={(e) => {
                              // Fallback if image doesn't exist
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDEyLjAxTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQzMgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                              e.target.className = 'w-full h-24 object-contain rounded-lg border border-gray-200 bg-gray-100';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to view full size
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {order.videos && order.videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      Videos ({order.videos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.videos.map((videoName, index) => (
                        <div key={index} className="relative">
                          <video
                            src={`/uploads/order-attachments/${videoName}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            controls
                            preload="metadata"
                            onError={(e) => {
                              // Fallback if video doesn't exist
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center text-gray-500 text-sm hidden">
                            <div className="text-center">
                              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <span>Video not available</span>
                              <div className="text-xs text-gray-400 mt-1">{videoName}</div>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {videoName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No files message */}
                {(!order.images || order.images.length === 0) && (!order.videos || order.videos.length === 0) && (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <Camera className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm">No files were uploaded with this order</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Vendor Information */}
            {order.vendorId ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Vendor</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {order.vendorId.firstName?.[0] || 'V'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {order.vendorId.firstName} {order.vendorId.lastName}
                    </p>
                    {order.vendorId.email && (
                      <p className="text-gray-600 text-sm">{order.vendorId.email}</p>
                    )}
                    {order.vendorId.phone && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        {order.vendorId.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendor Assignment</h3>
                <div className="flex items-center text-yellow-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>No vendor assigned yet</span>
                </div>
              </div>
            )}

            {/* Quote Information */}
            {(order.totalAmount || order.status === 'QUOTE_SENT' || order.status === 'QUOTE_ACCEPTED') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing & Quote
                </h3>
                
                {order.totalAmount ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-800 font-medium">Vendor Quote:</span>
                      <span className="text-2xl font-bold text-blue-600">${order.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    {order.status === 'QUOTE_SENT' && (
                      <div className="mt-4">
                        <p className="text-sm text-blue-600 mb-3">
                          ⏳ Waiting for your approval of this quote
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleQuoteResponse(order._id, 'QUOTE_ACCEPTED')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            ✅ Accept Quote
                          </button>
                          <button
                            onClick={() => handleQuoteResponse(order._id, 'QUOTE_REJECTED')}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            ❌ Reject Quote
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'QUOTE_ACCEPTED' && (
                      <p className="text-sm text-green-600 mt-2">
                        ✅ Quote accepted - Vendor can now start work
                      </p>
                    )}
                    
                    {order.status === 'QUOTE_REJECTED' && (
                      <p className="text-sm text-red-600 mt-2">
                        ❌ Quote rejected - You can discuss a new quote with the vendor
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vendor Quote:</span>
                      <span className="text-gray-500">Pending</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      The vendor is reviewing your request and will provide a quote soon.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Work Progress & Completion */}
            {(order.workProgress?.percentage > 0 || order.status === 'COMPLETED') && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {order.status === 'COMPLETED' ? 'Work Completed' : 'Work Progress'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-medium">
                        {order.status === 'COMPLETED' ? '100' : order.workProgress?.percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${order.status === 'COMPLETED' ? '100' : order.workProgress?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {order.workProgress?.workNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {order.status === 'COMPLETED' ? 'Completion Details' : 'Progress Notes'}
                      </label>
                      <p className="text-gray-900 text-sm">{order.workProgress.workNotes}</p>
                    </div>
                  )}
                  
                  {order.status === 'COMPLETED' && !order.workProgress?.workNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className="text-green-600 text-sm font-medium">✅ Work has been completed successfully</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {order.payment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${
                      order.payment.status === 'PAID' ? 'text-green-600' : 
                      order.payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {order.payment.status}
                    </span>
                  </div>
                  {order.payment.method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="text-gray-900">{order.payment.method}</span>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid On</span>
                      <span className="text-gray-900">
                        {new Date(order.payment.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory.slice().reverse().map((status, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {status.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(status.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {status.notes && (
                      <p className="text-sm text-gray-600">{status.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div>
            {canCancelOrder(order) && (
              <button
                onClick={onCancelOrder}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Zoom Modal - rendered inside OrderDetailsModal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-90"
          onClick={() => setZoomedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <img
              src={zoomedImage}
              alt="Zoomed order attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onLoad={() => console.log('Zoomed image loaded successfully')}
              onError={(e) => console.log('Zoomed image failed to load:', e)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Cancel Confirmation Modal Component
const CancelConfirmationModal = ({ order, reason, onReasonChange, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">Cancel Order #{order.jobNumber}?</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This action cannot be undone. The order will be permanently cancelled.
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{order.title}</p>
          <p className="text-sm text-gray-600">Category: {order.category}</p>
          <p className="text-sm text-gray-600">Status: {order.status.replace('_', ' ')}</p>
        </div>

        {/* Reason Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Please provide a reason for cancelling this order..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;