import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  Package,
  Calendar, 
  DollarSign,
  Settings,
  Bell,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  LogOut,
  ChevronRight,
  Gift,
  FileText,
  MessageSquare,
  TrendingUp,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const SimpleDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      nextAppointment: null
    },
    recentOrders: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Sample data - replace with API call
    const orders = [
      {
        _id: '1',
        jobNumber: 'JOB001',
        title: 'Plumbing Repair',
        status: 'IN_PROGRESS',
        totalAmount: 150,
        scheduledDate: '2024-12-20',
        vendor: 'John\'s Plumbing',
        category: 'plumbing',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        jobNumber: 'JOB002',
        title: 'House Cleaning',
        status: 'COMPLETED',
        totalAmount: 120,
        scheduledDate: '2024-12-15',
        vendor: 'Clean Pro',
        category: 'cleaning',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '3',
        jobNumber: 'JOB003',
        title: 'Garden Maintenance',
        status: 'PENDING',
        totalAmount: 80,
        scheduledDate: '2024-12-22',
        vendor: 'Green Thumb',
        category: 'gardening',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    const stats = {
      activeOrders: orders.filter(o => ['PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      totalSpent: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0),
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
      name: 'Messages', 
      tab: 'messages',
      icon: MessageSquare,
      description: 'Communication'
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
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab orders={dashboardData.recentOrders} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} />;
      case 'profile':
        return <ProfileTab user={user} updateUser={updateUser} />;
      case 'messages':
        return <MessagesTab />;
      case 'referrals':
        return <ReferralsTab />;
      default:
        return <OverviewTab dashboardData={dashboardData} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} />;
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-gray-600">Customer</p>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
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
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ dashboardData, getStatusIcon, getStatusColor }) => {
  return (
    <div className="space-y-8">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-8 right-16 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-4 right-8 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-12 left-12 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
              <div className="text-sm text-orange-100">Active Orders</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.completedOrders}</div>
              <div className="text-sm text-orange-100">Completed</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">${dashboardData.stats.totalSpent}</div>
              <div className="text-sm text-orange-100">Total Spent</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{dashboardData.stats.nextAppointment ? 'Dec 22' : 'None'}</div>
              <div className="text-sm text-orange-100">Next Service</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
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
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">${dashboardData.stats.totalSpent}</p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                      <div>
                        <h3 className="font-medium text-gray-900">{order.title}</h3>
                        <p className="text-sm text-gray-600">#{order.jobNumber}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">${order.totalAmount}</p>
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
const OrdersTab = ({ orders, getStatusIcon, getStatusColor }) => {
  return (
    <div className="space-y-6">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-16 left-16 w-6 h-6 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                <p className="text-blue-100 text-lg">Track and manage all your service requests</p>
              </div>
            </div>
            
            {/* Order Summary Stats */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.filter(o => ['PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length}</div>
                <div className="text-xs text-blue-100">Active</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.filter(o => o.status === 'COMPLETED').length}</div>
                <div className="text-xs text-blue-100">Completed</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{orders.length}</div>
                <div className="text-xs text-blue-100">Total</div>
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
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    {order.vendor && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {order.vendor}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">${order.totalAmount}</p>
                <button className="mt-2 text-orange-600 text-sm hover:text-orange-700">
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
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-12 w-18 h-18 bg-white rounded-full"></div>
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute bottom-6 left-12 w-14 h-14 bg-white rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-20 left-20 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-purple-100 text-lg">Manage your account information</p>
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
              <div className="text-purple-100">{user?.email}</div>
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

// Messages Tab Component
const MessagesTab = () => {
  return (
    <div className="space-y-6">
      {/* Decorative Banner */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 right-10 w-22 h-22 bg-white rounded-full"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-6 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute top-16 left-24 w-10 h-10 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Messages</h1>
                <p className="text-green-100 text-lg">Communication with service providers</p>
              </div>
            </div>
            
            {/* Message Status Indicators */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">0</div>
                <div className="text-xs text-green-100">Unread</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">0</div>
                <div className="text-xs text-green-100">Total</div>
              </div>
            </div>
          </div>
          
          {/* Quick Message Actions */}
          <div className="mt-6 flex space-x-3">
            <button className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors">
              ✉️ Contact Support
            </button>
            <button className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors">
              📞 Emergency Contact
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-gray-600">Messages from vendors will appear here</p>
      </div>
    </div>
  );
};

// Referrals Tab Component
const ReferralsTab = () => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState({
    hasReferralCode: false,
    referralCode: '',
    stats: {
      totalReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
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
            totalEarnings: data.referral.totalCommissionEarned,
            pendingEarnings: data.referral.pendingCommission,
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
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg">
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
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-6 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-6 left-8 w-18 h-18 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white rounded-full"></div>
          <div className="absolute top-20 left-20 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute top-12 right-20 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
                <p className="text-yellow-100 text-lg">Earn rewards by referring friends</p>
              </div>
            </div>
            
            {/* Referral Stats Preview */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{referralData.statistics?.totalReferrals || 0}</div>
                <div className="text-xs text-yellow-100">Referrals</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">${referralData.statistics?.totalEarned || 0}</div>
                <div className="text-xs text-yellow-100">Earned</div>
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
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{referralData.currentTier?.name || 'Bronze'}</div>
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
                  <span>You earn {referralData.currentTier?.rate || 5}% commission on their orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started with Referrals</h3>
          <p className="text-gray-600 mb-6">Generate your unique referral code and start earning commissions</p>
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

export default SimpleDashboard;