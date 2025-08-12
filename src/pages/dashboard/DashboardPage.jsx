import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
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

// Dashboard Components
const CustomerDashboard = () => {
  const stats = [
    { title: 'Total Orders', value: '12', icon: Package, color: 'bg-blue-500' },
    { title: 'Pending', value: '3', icon: Calendar, color: 'bg-yellow-500' },
    { title: 'Completed', value: '9', icon: Star, color: 'bg-green-500' },
    { title: 'Total Spent', value: '$2,450', icon: DollarSign, color: 'bg-purple-500' }
  ];

  const recentOrders = [
    { id: 1, service: 'Plumbing Repair', status: 'Completed', date: '2024-01-15', amount: '$350' },
    { id: 2, service: 'Electrical Inspection', status: 'In Progress', date: '2024-01-18', amount: '$200' },
    { id: 3, service: 'Cleaning Service', status: 'Pending', date: '2024-01-20', amount: '$150' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      
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

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Service</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{order.service}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3">{order.date}</td>
                  <td className="py-3">{order.amount}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:underline">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
          <div>
            <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
            <p className="text-orange-50">Current Plan: {subscriptionInfo.plan}</p>
            <p className="text-orange-50">Next Billing: {subscriptionInfo.nextBilling}</p>
          </div>
          <div className="text-right">
            <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
              {subscriptionInfo.status}
            </span>
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
              to="/admin/banners"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Banner Management
            </Link>
            <Link
              to="/admin/blogs"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Blog Management
            </Link>
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
    city: user?.address || user?.city || '', // Use address from AuthContext first, then city
    country: user?.country || ''
  });
  
  // Update profile data when user context changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.address || user.city || '',
        country: user.country || ''
      });
    }
  }, [user]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    console.log('🔄 Starting profile update with data:', profileData);
    try {
      const response = await api.users.updateProfile(profileData);
      console.log('✅ Profile update successful, response:', response);
      
      setIsEditing(false);
      toast.success('Profile updated successfully! ✅');
      
      // Update the profileData state with the response to reflect any server changes
      if (response.user) {
        const updatedProfileData = {
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          city: response.user.city || '',
          country: response.user.country || ''
        };
        setProfileData(updatedProfileData);
        
        // Update the AuthContext with new user data so it's reflected everywhere
        updateUser({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          name: response.user.fullName || `${response.user.firstName} ${response.user.lastName}`,
          phone: response.user.phone,
          address: response.user.city || user.address, // Keep existing address if city not provided
          // Keep all other user properties unchanged
          ...user
        });
        console.log('✅ AuthContext updated with new profile data');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  const handlePasswordChange = async () => {
    console.log('🔄 Starting password change...');
    
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
      console.log('✅ Password change successful:', response);
      
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profileData.city}
                onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={profileData.country}
              onChange={(e) => setProfileData({...profileData, country: e.target.value})}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
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
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <a href="/" className="block mb-6">
              <h1 className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors">Swift Fix Pro</h1>
            </a>
            
            <nav className="space-y-4">
              {mainNavigation.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                    >
                      <item.icon size={20} className="mr-3" />
                      {item.name}
                    </a>
                  );
                }

                const isActiveSection = item.section === activeSection;
                
                return (
                  <div key={item.name} className="space-y-1">
                    <div 
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        isActiveSection ? 'bg-orange-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setActiveSection(item.section);
                        setActiveTab(item.tabs[0].tab);
                        navigate(item.tabs[0].href);
                      }}
                    >
                      <item.icon size={20} className={`mr-3 ${isActiveSection ? 'text-orange-600' : 'text-gray-500'}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${isActiveSection ? 'text-orange-700' : 'text-gray-900'}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                    
                    {/* Sub-navigation tabs */}
                    {isActiveSection && item.tabs && (
                      <div className="ml-8 space-y-1">
                        {item.tabs.map((tab) => (
                          <Link
                            key={tab.tab}
                            to={tab.href}
                            onClick={() => setActiveTab(tab.tab)}
                            className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                              activeTab === tab.tab
                                ? 'bg-orange-50 text-orange-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full"
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>{getCurrentSection()?.name}</span>
              {getCurrentSection()?.tabs?.find(t => t.tab === activeTab) && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-700">{getCurrentSection()?.tabs?.find(t => t.tab === activeTab)?.name}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getCurrentSection()?.tabs?.find(t => t.tab === activeTab)?.name || getCurrentSection()?.name}
            </h1>
          </div>

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
  );
};

export default DashboardPage; 