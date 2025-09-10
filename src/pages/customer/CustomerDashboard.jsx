import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  Package,
  DollarSign,
  ArrowRight,
  MapPin,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MembershipCard from '../../components/customer/MembershipCard';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuth();
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
      // Enhanced demo data with more realistic information
      setDashboardData({
        recentJobs: [
          {
            id: 1,
            jobNumber: 'JOB1755221424634BA9G',
            title: 'Kitchen Sink Repair',
            description: 'Fixed leaking kitchen sink and replaced faulty faucet',
            status: 'completed',
            date: '2024-01-15',
            amount: 150,
            category: 'plumbing',
            location: {
              address: '123 Main Street',
              city: 'Singapore'
            }
          },
          {
            id: 2,
            jobNumber: 'JOB1755221424634BA9H',
            title: 'Bathroom Deep Cleaning',
            description: 'Professional deep cleaning service for bathroom',
            status: 'in_progress',
            date: '2024-01-20',
            amount: 80,
            category: 'cleaning',
            location: {
              address: '456 Oak Avenue',
              city: 'Singapore'
            }
          },
          {
            id: 3,
            jobNumber: 'JOB1755221424634BA9I',
            title: 'Garden Maintenance',
            description: 'Lawn mowing and garden landscaping',
            status: 'pending',
            date: '2024-01-25',
            amount: 120,
            category: 'gardening',
            location: {
              address: '789 Pine Street',
              city: 'Singapore'
            }
          }
        ],
        stats: {
          totalJobs: 8,
          activeJobs: 2,
          completedJobs: 6,
          totalSpent: 650
        }
      });
      
      // Show success message
      toast.success('Dashboard loaded successfully!', { duration: 2000 });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
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

  const stats = [
    { 
      title: 'Total Jobs', 
      value: dashboardData.stats.totalJobs, 
      icon: Package, 
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Active Jobs', 
      value: dashboardData.stats.activeJobs, 
      icon: Clock, 
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      title: 'Completed', 
      value: dashboardData.stats.completedJobs, 
      icon: CheckCircle, 
      color: 'from-emerald-500 to-green-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      title: 'Total Spent', 
      value: `$${dashboardData.stats.totalSpent}`, 
      icon: DollarSign, 
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

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
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome back, {user?.firstName || user?.name || 'Customer'}! 👋
            </h1>
            <p className="text-xl text-orange-100 mb-6">
              Track your service requests, manage your property maintenance, and stay updated with your orders.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/order-request"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                <Package className="mr-2 w-5 h-5" />
                Request New Service
              </Link>
              <Link
                to="/services"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                Browse Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

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

      {/* Enhanced Recent Jobs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-orange-50 p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recent Jobs</h2>
              <p className="text-gray-600">Track your latest service requests and their progress</p>
            </div>
            <Link
              to="/jobs"
              className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {dashboardData.recentJobs.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl hover:from-orange-50 hover:to-gray-50 transition-all duration-300 border border-gray-200 hover:border-orange-200 hover:shadow-md group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Job Number</p>
                        <p className="font-mono text-sm font-medium text-gray-900">{job.jobNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service</p>
                        <p className="font-semibold text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-gray-700 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date & Amount</p>
                        <p className="text-gray-700 flex items-center mb-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {job.date}
                        </p>
                        <p className="text-xl font-bold text-gray-900">${job.amount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No jobs yet</h3>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/services"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block text-white group relative overflow-hidden"
            >
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
