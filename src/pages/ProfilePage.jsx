import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile data state
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

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
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

  const handleProfileSave = async () => {
    try {
      setLoading(true);
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
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.users.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      {/* Header */}
      <div className="bg-orange-600 text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">Profile Settings</h1>
            <p className="text-2xl text-orange-100 mb-8 max-w-4xl mx-auto">
              Manage your account information, security settings, and personal details
            </p>
            
            {/* Tab Navigation */}
            <div className="flex justify-center space-x-8 mt-8">
              {['profile', 'security'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-orange-600'
                      : 'bg-orange-700 text-orange-100 hover:bg-orange-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl p-10 mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Profile Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center px-6 py-3 rounded-lg font-bold transition-colors ${
                  isEditing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isEditing ? <X className="w-5 h-5 mr-2" /> : <Edit className="w-5 h-5 mr-2" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* User Info Preview */}
            <div className="flex items-center space-x-6 mb-8 p-6 bg-orange-50 rounded-lg">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</div>
                <div className="text-lg text-gray-600">{user?.email}</div>
                <div className="text-sm text-orange-600 font-medium">{user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)} Account</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>
              
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-bold text-gray-700 mb-4">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">State</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">ZIP Code</label>
                <input
                  type="text"
                  value={profileData.zipCode}
                  onChange={(e) => setProfileData({...profileData, zipCode: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg disabled:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-10 flex justify-end space-x-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Password Change Section */}
            <div className="bg-white rounded-xl shadow-xl p-10">
              <div className="flex items-center mb-8">
                <Shield className="w-10 h-10 text-orange-600 mr-4" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Change Password</h2>
                  <p className="text-lg text-gray-600">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-4">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-4 top-5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-4">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-4 top-5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-4">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-4 top-5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="w-full flex items-center justify-center px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-white rounded-xl shadow-xl p-10">
              <div className="flex items-center mb-8">
                <CheckCircle className="w-10 h-10 text-green-600 mr-4" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Account Security</h2>
                  <p className="text-lg text-gray-600">Your account security status and recommendations</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Email Verified</h3>
                    <p className="text-gray-600">Your email address has been verified</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Account Active</h3>
                    <p className="text-gray-600">Your account is active and in good standing</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>

                <div className="p-6 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Security Recommendations</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></span>
                      Use a strong password with at least 8 characters
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></span>
                      Change your password regularly
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></span>
                      Don't share your login credentials with anyone
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;