import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Package,
  Settings,
  TrendingUp,
  Users,
  Shield,
  Star,
  Eye,
  UserPlus,
  ShoppingCart
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    recentUsers: [],
    systemHealth: {},
    analytics: {}
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch multiple API endpoints in parallel
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/jobs?limit=5&sortBy=createdAt&sortOrder=desc', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/admin/users?limit=5&sort=newest', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const stats = statsRes.ok ? await statsRes.json() : { data: {} };
      const orders = ordersRes.ok ? await ordersRes.json() : { jobs: [] };
      const users = usersRes.ok ? await usersRes.json() : { users: [] };

      setDashboardData({
        stats: stats.data || {},
        recentOrders: orders.jobs || [],
        recentUsers: users.users || [],
        systemHealth: {
          database: 'healthy',
          api: 'healthy',
          uptime: '99.9%'
        },
        analytics: {
          todayRevenue: stats.data?.todayRevenue || 0,
          monthlyGrowth: stats.data?.monthlyGrowth || 0,
          activeServices: stats.data?.activeServices || 0
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Quick action cards data
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/admin/users',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Order Management',
      description: 'View and manage service orders',
      href: '/admin/orders',
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Event Management',
      description: 'Create and manage events',
      href: '/admin/events',
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Homepage Settings',
      description: 'Manage homepage content and layout',
      href: '/admin/homepage',
      icon: Settings,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'FAQ Management',
      description: 'Manage frequently asked questions',
      href: '/admin/faqs',
      icon: FileText,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      title: 'CEA Verification',
      description: 'Manage vendor verification requests',
      href: '/admin/cea-verification',
      icon: Shield,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Users',
      value: dashboardData.stats.totalUsers || 0,
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Orders',
      value: dashboardData.stats.totalOrders || 0,
      change: '+8%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Revenue (Month)',
      value: `$${dashboardData.stats.monthlyRevenue || 0}`,
      change: '+15%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-emerald-500'
    },
    {
      title: 'Active Services',
      value: dashboardData.analytics.activeServices || 0,
      change: '+5%',
      changeType: 'increase',
      icon: Star,
      color: 'bg-yellow-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="mt-1 text-orange-100">Welcome back, {user?.firstName}! Here's what's happening today.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-orange-100">System Status</p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-white">All Systems Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className={`inline-flex items-center text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.change} from last month
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-gray-600">Access your most used admin tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Link to={action.href} className="block">
                  <div className={`${action.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${action.textColor}`}>
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/admin/orders" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent orders found</p>
              ) : (
                dashboardData.recentOrders.map((order, index) => (
                  <div key={order._id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Job #{order.jobNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.totalAmount || 0}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status ? order.status.replace('_', ' ') : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Users</h3>
              <Link to="/admin/users" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.recentUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent users found</p>
              ) : (
                dashboardData.recentUsers.map((user, index) => (
                  <div key={user._id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email} • {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'customer' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'vendor' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'customer'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.status || 'active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* System Health Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">System Health</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-green-600">Healthy</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">API Services</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Uptime</p>
                <p className="text-sm text-green-600">99.9%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;