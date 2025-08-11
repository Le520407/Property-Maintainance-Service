import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Award, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Activity,
  BarChart3,
  Users,
  MapPin
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const VendorDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendor/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { vendor, stats, recentJobs } = dashboardData;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'jobs', name: 'Jobs', icon: FileText },
    { id: 'earnings', name: 'Earnings', icon: DollarSign },
    { id: 'ratings', name: 'Ratings', icon: Star },
    { id: 'profile', name: 'Profile', icon: User }
  ];

  const StatCard = ({ title, value, change, changeType, icon: Icon, color = 'orange' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats.jobs.completed || 0}
          change="+12% this month"
          changeType="positive"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Total Earnings"
          value={`$${stats.earnings.total?.toLocaleString() || '0'}`}
          change="+18% this month"
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Average Rating"
          value={stats.ratings.averageRating?.toFixed(1) || '0.0'}
          change="★ from ratings"
          icon={Star}
          color="yellow"
        />
        <StatCard
          title="Active Jobs"
          value={stats.jobs.in_progress || 0}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Verification Status */}
      {vendor.verificationStatus !== 'VERIFIED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            vendor.verificationStatus === 'PENDING' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            {vendor.verificationStatus === 'PENDING' ? (
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            )}
            <div>
              <h3 className={`font-medium ${
                vendor.verificationStatus === 'PENDING' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                Account {vendor.verificationStatus === 'PENDING' ? 'Pending Verification' : 'Verification Required'}
              </h3>
              <p className={`text-sm ${
                vendor.verificationStatus === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {vendor.verificationStatus === 'PENDING' 
                  ? 'Your account is under review. You will be able to receive job assignments once approved.'
                  : 'Your account verification was not successful. Please contact support for assistance.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs.length > 0 ? (
            recentJobs.slice(0, 5).map((job) => (
              <div key={job._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Customer: {job.customerId?.firstName} {job.customerId?.lastName}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        ${job.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No jobs yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Score</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quality Score</span>
              <span className="text-sm font-medium">{vendor.qualityScore}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${(vendor.qualityScore / 5) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On-Time Performance</span>
              <span className="text-sm font-medium">{vendor.onTimePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${vendor.onTimePercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium">{vendor.customerSatisfactionScore}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(vendor.customerSatisfactionScore / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Areas</h3>
          <div className="space-y-3">
            {vendor.serviceCategories?.map((category) => (
              <div key={category} className="flex items-center">
                <div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 capitalize">
                  {category.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              Service Area
            </div>
            <p className="text-sm font-medium text-gray-900">{vendor.serviceArea}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {vendor.userId?.firstName}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {vendor.verificationStatus === 'VERIFIED' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Management</h3>
            <p className="text-gray-600">Job management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Analytics</h3>
            <p className="text-gray-600">Earnings analytics interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'ratings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h3>
            <p className="text-gray-600">Reviews and ratings interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
            <p className="text-gray-600">Profile management interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboardPage;