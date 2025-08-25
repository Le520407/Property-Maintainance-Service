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
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import MembershipWidget from '../customer/MembershipWidget';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    recentJobs: [],
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalSpent: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data - replace with your actual API endpoints
      const [jobsResponse, statsResponse] = await Promise.all([
        api.get('/jobs/my-jobs?limit=5'),
        api.get('/jobs/my-stats')
      ]);

      setDashboardData({
        recentJobs: jobsResponse.data.jobs || [],
        stats: statsResponse.data.stats || dashboardData.stats
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Demo data for development
      setDashboardData({
        recentJobs: [
          {
            _id: '1',
            title: 'Fix Leaking Faucet',
            status: 'in_progress',
            createdAt: '2024-01-15T10:30:00Z',
            vendor: { name: 'John Plumber' },
            totalAmount: 85,
            membershipDiscount: 8.5
          },
          {
            _id: '2',
            title: 'Electrical Outlet Repair',
            status: 'completed',
            createdAt: '2024-01-10T14:20:00Z',
            vendor: { name: 'Mike Electric' },
            totalAmount: 120,
            membershipDiscount: 12
          }
        ],
        stats: {
          totalJobs: 8,
          activeJobs: 2,
          completedJobs: 6,
          totalSpent: 650
        }
      });
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
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalJobs}</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeJobs}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedJobs}</p>
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
                    <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors">
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
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">${job.totalAmount}</p>
                          </div>
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
          {/* Membership Widget */}
          <MembershipWidget />

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
            </div>
          </motion.div>

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
    </div>
  );
};

export default CustomerDashboard;