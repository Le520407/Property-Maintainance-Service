import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  FileText,
  Info,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SERVICE_CATEGORIES_SIMPLE } from '../../constants/serviceCategories';
import VendorCalendar from '../../components/vendor/VendorCalendar';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Helper function to construct proper image URLs
const getImageUrl = (relativeUrl) => {
  console.log('🔍 Processing image URL:', relativeUrl);
  
  // Handle empty or undefined URLs
  if (!relativeUrl) {
    console.warn('⚠️ Empty or undefined image URL');
    return null;
  }
  
  // Handle complete URLs
  if (relativeUrl.startsWith('http')) {
    console.log('✅ Using complete URL:', relativeUrl);
    return relativeUrl;
  }
  
  // Skip blob URLs (these are from old data and can't be accessed)
  if (relativeUrl.startsWith('blob:')) {
    console.warn('⚠️ Skipping blob URL (old data):', relativeUrl);
    return null;
  }
  
  // Get the base server URL without /api
  const serverBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
  const fullUrl = `${serverBaseUrl}${relativeUrl}`;
  console.log('🖼️ Image URL Construction:', { relativeUrl, serverBaseUrl, fullUrl });
  return fullUrl;
};

const ProfileTab = ({ vendor, onUpdate, activeSection: initialSection }) => {
  const [activeSection, setActiveSection] = useState(initialSection || 'profile');
  const [servicePackages, setServicePackages] = useState(vendor.servicePackages || []);
  const [priceLists, setPriceLists] = useState(vendor.priceLists || []);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Vendor profile editing states
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    serviceCategories: vendor.serviceCategories || [],
    serviceArea: vendor.serviceArea || '',
    companyName: vendor.companyName || '',
    description: vendor.description || ''
  });

  const serviceCategories = SERVICE_CATEGORIES_SIMPLE;

  // Category migration mapping - old categories to new categories
  const categoryMigrationMap = {
    'home-repairs': 'maintenance',
    'painting-services': 'painting',
    'electrical-services': 'electrical',
    'plumbing-services': 'plumbing',
    'carpentry-services': 'maintenance',
    'flooring-services': 'flooring',
    'appliance-installation': 'installation',
    'furniture-assembly': 'assembly',
    'moving-services': 'moving',
    'safety-security': 'security',
    'cleaning-services': 'cleaning',
    'general': 'maintenance',
    'gardening': 'maintenance',
    'hvac': 'maintenance'
  };

  // Function to migrate and validate categories
  const migrateCategories = (categories) => {
    if (!Array.isArray(categories)) return [];
    
    const migratedCategories = categories
      .map(category => categoryMigrationMap[category] || category)
      .filter(category => serviceCategories.includes(category));
    
    // Remove duplicates
    return [...new Set(migratedCategories)];
  };

  const saveProfile = async (updatedData) => {
    try {
      setLoading(true);
      
      // Migrate and validate categories before sending
      const migratedData = {
        ...updatedData,
        serviceCategories: migrateCategories(updatedData.serviceCategories)
      };
      
      console.log('Original categories:', updatedData.serviceCategories); // Debug log
      console.log('Migrated categories:', migratedData.serviceCategories); // Debug log
      console.log('Available categories:', serviceCategories); // Debug available categories
      
      await api.vendor.updateProfile(migratedData);
      toast.success('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Profile data that failed:', updatedData); // Debug log
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddServicePackage = () => {
    const newPackage = {
      id: Date.now(),
      name: '',
      description: '',
      category: 'general',
      price: 0,
      duration: 1,
      isActive: true
    };
    setEditingPackage(newPackage);
  };

  const handleSaveServicePackage = async () => {
    if (!editingPackage.name || !editingPackage.description || editingPackage.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedPackages = editingPackage.id && servicePackages.find(p => p.id === editingPackage.id)
      ? servicePackages.map(p => p.id === editingPackage.id ? editingPackage : p)
      : [...servicePackages, { ...editingPackage, id: editingPackage._id || Date.now() }];

    setServicePackages(updatedPackages);
    await saveProfile({ servicePackages: updatedPackages });
    setEditingPackage(null);
  };

  const handleDeleteServicePackage = async (packageId) => {
    const updatedPackages = servicePackages.filter(p => (p.id || p._id) !== packageId);
    setServicePackages(updatedPackages);
    await saveProfile({ servicePackages: updatedPackages });
  };

  const handleAddPriceList = () => {
    const newPriceList = {
      id: Date.now(),
      category: 'general',
      baseRate: 0,
      emergencyRate: 0,
      weekendRate: 0,
      nightRate: 0
    };
    setEditingPrice(newPriceList);
  };

  const handleSavePriceList = async () => {
    if (editingPrice.baseRate <= 0) {
      toast.error('Base rate must be greater than 0');
      return;
    }

    const updatedPriceLists = editingPrice.id && priceLists.find(p => p.id === editingPrice.id)
      ? priceLists.map(p => p.id === editingPrice.id ? editingPrice : p)
      : [...priceLists, { ...editingPrice, id: editingPrice._id || Date.now() }];

    setPriceLists(updatedPriceLists);
    await saveProfile({ priceLists: updatedPriceLists });
    setEditingPrice(null);
  };

  const handleDeletePriceList = async (priceId) => {
    const updatedPriceLists = priceLists.filter(p => (p.id || p._id) !== priceId);
    setPriceLists(updatedPriceLists);
    await saveProfile({ priceLists: updatedPriceLists });
  };

  // Handle profile form submission
  const handleSaveProfile = async () => {
    if (profileForm.serviceCategories.length === 0) {
      toast.error('Please select at least one service category');
      return;
    }

    await saveProfile(profileForm);
    setEditingProfile(false);
  };

  // Handle service category toggle
  const handleServiceCategoryToggle = (category) => {
    setProfileForm(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter(c => c !== category)
        : [...prev.serviceCategories, category]
    }));
  };

  const sections = [
    { id: 'profile', name: 'Profile & Categories', icon: User },
    { id: 'services', name: 'Service Packages', icon: FileText },
    { id: 'pricing', name: 'Price Lists', icon: DollarSign },
    { id: 'schedule', name: 'Availability', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile & Categories Section */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Profile & Service Categories</h3>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {!editingProfile ? (
            <div className="space-y-6">
              {/* Current Service Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Service Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {(vendor.serviceCategories || []).map((category) => (
                    <span
                      key={category}
                      className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  ))}
                  {(!vendor.serviceCategories || vendor.serviceCategories.length === 0) && (
                    <p className="text-gray-500 italic">No service categories selected</p>
                  )}
                </div>
              </div>

              {/* Other Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Service Area</h4>
                  <p className="text-gray-900">{vendor.serviceArea || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Company Name</h4>
                  <p className="text-gray-900">{vendor.companyName || 'Not specified'}</p>
                </div>
              </div>

              {vendor.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900">{vendor.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Service Categories Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Categories * (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {serviceCategories.map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.serviceCategories.includes(category)}
                        onChange={() => handleServiceCategoryToggle(category)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These categories determine which jobs you'll be assigned to
                </p>
              </div>

              {/* Other Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Area
                  </label>
                  <input
                    type="text"
                    value={profileForm.serviceArea}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, serviceArea: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Singapore, Kuala Lumpur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Brief description of your services"
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Packages Section */}
      {activeSection === 'services' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Service Packages</h3>
            <button
              onClick={handleAddServicePackage}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </button>
          </div>

          <div className="space-y-4">
            {servicePackages.map((pkg) => (
              <div key={pkg.id || pkg._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">Category: {pkg.category}</span>
                      <span className="text-sm text-gray-500">Price: ${pkg.price}</span>
                      <span className="text-sm text-gray-500">Duration: {pkg.duration}h</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPackage(pkg)}
                      className="p-2 text-gray-400 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServicePackage(pkg.id || pkg._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {servicePackages.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No service packages yet</p>
              </div>
            )}
          </div>

          {/* Edit Service Package Modal */}
          {editingPackage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingPackage._id ? 'Edit Service Package' : 'Add Service Package'}
                  </h3>
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={editingPackage.name}
                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Basic Plumbing Service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={editingPackage.description}
                      onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Describe what's included in this package"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={editingPackage.category}
                        onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        {serviceCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        value={editingPackage.price}
                        onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      value={editingPackage.duration}
                      onChange={(e) => setEditingPackage({ ...editingPackage, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      min="0.5"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveServicePackage}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Package'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Lists Section */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Price Lists</h3>
            <button
              onClick={handleAddPriceList}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Price List
            </button>
          </div>

          <div className="space-y-4">
            {priceLists.map((priceList) => (
              <div key={priceList.id || priceList._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">{priceList.category} Services</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Base Rate:</span>
                        <span className="ml-2 font-medium">${priceList.baseRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Emergency:</span>
                        <span className="ml-2 font-medium">${priceList.emergencyRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Weekend:</span>
                        <span className="ml-2 font-medium">${priceList.weekendRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Night:</span>
                        <span className="ml-2 font-medium">${priceList.nightRate}/hr</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPrice(priceList)}
                      className="p-2 text-gray-400 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePriceList(priceList.id || priceList._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {priceLists.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No price lists yet</p>
              </div>
            )}
          </div>

          {/* Edit Price List Modal */}
          {editingPrice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingPrice._id ? 'Edit Price List' : 'Add Price List'}
                  </h3>
                  <button
                    onClick={() => setEditingPrice(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Category *
                    </label>
                    <select
                      value={editingPrice.category}
                      onChange={(e) => setEditingPrice({ ...editingPrice, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Rate ($/hr) *
                      </label>
                      <input
                        type="number"
                        value={editingPrice.baseRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, baseRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.emergencyRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, emergencyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekend Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.weekendRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, weekendRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Night Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.nightRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, nightRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingPrice(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePriceList}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Price List'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Availability Calendar Section */}
      {activeSection === 'schedule' && (
        <VendorCalendar vendor={vendor} onUpdate={onUpdate} />
      )}
    </div>
  );
};

// Reviews Component
const ReviewsComponent = () => {
  const [ratingsData, setRatingsData] = useState({
    ratings: [],
    loading: true,
    stats: {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setRatingsData(prev => ({ ...prev, loading: true }));
      
      const response = await api.vendor.getRatings();
      console.log('📊 Ratings data received:', response);
      
      // Calculate statistics
      const ratings = response.ratings || [];
      const totalRatings = ratings.length;
      
      if (totalRatings > 0) {
        const averageRating = ratings.reduce((sum, rating) => sum + rating.overallRating, 0) / totalRatings;
        
        // Calculate distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(rating => {
          const rounded = Math.round(rating.overallRating);
          if (distribution[rounded] !== undefined) {
            distribution[rounded]++;
          }
        });
        
        setRatingsData({
          ratings,
          loading: false,
          stats: {
            averageRating,
            totalRatings,
            distribution
          }
        });
      } else {
        setRatingsData({
          ratings: [],
          loading: false,
          stats: {
            averageRating: 0,
            totalRatings: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching ratings:', error);
      setRatingsData(prev => ({ ...prev, loading: false }));
      toast.error('Failed to load ratings');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (ratingsData.loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Rating Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {ratingsData.stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(ratingsData.stats.averageRating))}
            </div>
            <div className="text-sm text-gray-500">
              Based on {ratingsData.stats.totalRatings} reviews
            </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingsData.stats.distribution[stars];
                const percentage = ratingsData.stats.totalRatings > 0 
                  ? (count / ratingsData.stats.totalRatings) * 100 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center">
                    <div className="flex items-center w-12">
                      <span className="text-sm text-gray-600">{stars}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current ml-1" />
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-yellow-400 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Customer Reviews</h3>
        
        {ratingsData.ratings.length > 0 ? (
          <div className="space-y-6">
            {ratingsData.ratings.map((rating) => (
              <div key={rating._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex mr-3">
                      {renderStars(rating.overallRating)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {rating.isAnonymous ? 'Anonymous Customer' : rating.customerId?.name || 'Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Job: {rating.jobId?.title || 'Service'}
                  </div>
                </div>
                
                {rating.title && (
                  <h4 className="font-medium text-gray-900 mb-2">{rating.title}</h4>
                )}
                
                {rating.comment && (
                  <p className="text-gray-700 mb-3">{rating.comment}</p>
                )}
                
                {/* Criteria Breakdown */}
                {rating.criteria && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    {Object.entries(rating.criteria).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-500 capitalize mb-1">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                        <div className="flex justify-center">
                          {renderStars(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Positive/Negative Aspects */}
                {(rating.positiveAspects?.length > 0 || rating.negativeAspects?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rating.positiveAspects?.map((aspect, index) => (
                      <span
                        key={`pos-${index}`}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        + {aspect.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    ))}
                    {rating.negativeAspects?.map((aspect, index) => (
                      <span
                        key={`neg-${index}`}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                      >
                        - {aspect.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Customer Photos */}
                {rating.images && rating.images.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Customer Photos</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {rating.images.map((image, index) => {
                        const imageUrl = getImageUrl(image.url);
                        console.log('🖼️ Rendering image:', { image, imageUrl });
                        
                        // Skip images with invalid URLs
                        if (!imageUrl) {
                          console.warn('⚠️ Skipping image with invalid URL:', image);
                          return null;
                        }
                        
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={image.caption || `Photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => setSelectedImage({...image, url: imageUrl})}
                              onError={(e) => {
                                console.error('❌ Image failed to load:', imageUrl, e);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log('✅ Image loaded successfully:', imageUrl)}
                            />
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                {image.caption}
                              </div>
                            )}
                          {image.type && image.type !== 'GENERAL' && (
                            <div className="absolute top-1 right-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded text-white font-medium ${
                                image.type === 'BEFORE' ? 'bg-blue-500' :
                                image.type === 'AFTER' ? 'bg-green-500' :
                                image.type === 'ISSUE' ? 'bg-red-500' : 'bg-gray-500'
                              }`}>
                                {image.type}
                              </span>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {rating.wouldRecommend !== undefined && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-2">Would recommend:</span>
                    <span className={rating.wouldRecommend ? 'text-green-600' : 'text-red-600'}>
                      {rating.wouldRecommend ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                
                {/* Vendor Response */}
                {rating.vendorResponse && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-sm font-medium text-gray-900">Your Response</div>
                      <div className="text-xs text-gray-500 ml-2">
                        {new Date(rating.vendorResponse.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{rating.vendorResponse.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400">
              Complete some jobs to start receiving customer reviews
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={selectedImage.url}
              alt={selectedImage.caption || 'Customer Photo'}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedImage.caption && (
              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                <p className="text-sm">{selectedImage.caption}</p>
                {selectedImage.type && selectedImage.type !== 'GENERAL' && (
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded font-medium ${
                    selectedImage.type === 'BEFORE' ? 'bg-blue-500' :
                    selectedImage.type === 'AFTER' ? 'bg-green-500' :
                    selectedImage.type === 'ISSUE' ? 'bg-red-500' : 'bg-gray-500'
                  }`}>
                    {selectedImage.type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Customer List Component
const CustomerListComponent = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0
  });

  const fetchCustomers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.vendor.getCustomers({ 
        page, 
        limit: 10, 
        search: searchTerm 
      });
      
      setCustomers(response.customers || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 500); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchCustomers]);

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">No ratings</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Customer List</h3>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {customers.length > 0 ? (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{customer.name}</h4>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Jobs</div>
                      <div className="font-medium">{customer.totalJobs}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Completed</div>
                      <div className="font-medium text-green-600">{customer.completedJobs}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Spent</div>
                      <div className="font-medium">${customer.totalSpent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Job</div>
                      <div className="font-medium">
                        {new Date(customer.lastJobDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="mt-2">
                    {renderStars(customer.averageRating)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {customers.length} of {pagination.totalCustomers} customers
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchCustomers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchCustomers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">No customers found</p>
        </div>
      )}
    </div>
  );
};

// Feedback Component (same as Reviews but focuses on feedback management)
const FeedbackComponent = () => {
  return <ReviewsComponent showFeedbackActions={true} />;
};

const VendorDashboardPage = () => {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Handle URL parameters for navigation
  const searchParams = new URLSearchParams(location.search);
  const sectionFromUrl = searchParams.get('section');
  const tabFromUrl = searchParams.get('tab');
  
  const [activeSection, setActiveSection] = useState(sectionFromUrl || 'dashboard');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching vendor dashboard data...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (token) {
        // Decode token to check user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 User info:', { id: payload._id, role: payload.role, email: payload.email });
      }
      
      const response = await api.vendor.getDashboard();
      console.log('✅ Dashboard data received:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('📝 Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      toast.error(`Failed to load dashboard: ${error.message}`);
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
          <p className="text-gray-600 mb-4">Check the browser console for detailed error information</p>
          <div className="space-x-4">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { vendor, stats, recentJobs } = dashboardData;

  const mainNavigation = [
    { 
      name: 'Dashboard', 
      section: 'dashboard',
      icon: BarChart3,
      description: 'Business Overview',
      tabs: [
        { name: 'Overview', tab: 'overview' },
        { name: 'Analytics', tab: 'analytics' },
        { name: 'Performance', tab: 'performance' }
      ]
    },
    { 
      name: 'Job Assignments', 
      section: 'assignments',
      icon: AlertCircle,
      description: 'Job Management & History',
      tabs: [
        { name: 'Pending Assignments', tab: 'pending' },
        { name: 'Active Jobs', tab: 'active' },
        { name: 'Job History', tab: 'history' },
        { name: 'Completed Jobs', tab: 'completed' }
      ]
    },
    { 
      name: 'Business', 
      section: 'business',
      icon: FileText,
      description: 'Services & Operations'
    },
    { 
      name: 'Earnings', 
      section: 'earnings',
      icon: DollarSign,
      description: 'Revenue & Payments',
      tabs: [
        { name: 'Overview', tab: 'earnings-overview' },
        { name: 'Transactions', tab: 'transactions' },
        { name: 'Payouts', tab: 'payouts' },
        { name: 'Tax Reports', tab: 'tax-reports' }
      ]
    },
    { 
      name: 'Customer Relations', 
      section: 'customers',
      icon: Star,
      description: 'Reviews & Feedback',
      tabs: [
        { name: 'Reviews', tab: 'reviews' },
        { name: 'Customer List', tab: 'customer-list' },
        { name: 'Feedback', tab: 'feedback' },
        { name: 'Communication', tab: 'communication' }
      ]
    },
    { 
      name: 'Account', 
      section: 'account',
      icon: User,
      description: 'Profile & Settings',
      tabs: [
        { name: 'Profile', tab: 'profile' },
        { name: 'Verification', tab: 'verification' },
        { name: 'Settings', tab: 'settings' }
      ]
    }
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
                      <span className={`text-sm font-medium ${
                        job.totalAmount ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {job.totalAmount ? `$${job.totalAmount.toLocaleString()}` : 'Price not set'}
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

      {/* Service Areas */}
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
  );

  const renderContent = () => {
    // Dashboard Section
    if (activeSection === 'dashboard') {
      if (activeTab === 'overview') return <OverviewTab />;
      if (activeTab === 'analytics') return (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Business Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Jobs"
                value={stats.jobs.completed || 0}
                change="+12% this month"
                changeType="positive"
                icon={FileText}
                color="orange"
              />
              <StatCard
                title="Total Earnings"
                value={`$${stats.earnings.total?.toLocaleString() || '0'}`}
                change="+18% this month"
                changeType="positive"
                icon={DollarSign}
                color="orange"
              />
              <StatCard
                title="Average Rating"
                value={stats.ratings.averageRating?.toFixed(1) || '0.0'}
                change="★ from ratings"
                icon={Star}
                color="orange"
              />
              <StatCard
                title="Active Jobs"
                value={stats.jobs.in_progress || 0}
                icon={Activity}
                color="orange"
              />
            </div>
          </div>
          
          {/* Additional Analytics Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h4>
            <p className="text-gray-600">Advanced analytics and trends coming soon...</p>
          </div>
        </div>
      );
      if (activeTab === 'performance') return (
        <div className="space-y-6">
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
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${vendor.onTimePercentage}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium">{vendor.customerSatisfactionScore}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${(vendor.customerSatisfactionScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Strong Performance</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    Your overall performance is excellent. Keep up the good work!
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Growth Opportunity</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    Focus on improving response time to get more job assignments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Performance Tracking</h4>
            <p className="text-gray-600">Advanced performance analytics and historical trends coming soon...</p>
          </div>
        </div>
      );
    }

    // Job Assignments Section
    if (activeSection === 'assignments') {
      // Pending assignments: Jobs assigned to vendor but not yet accepted
      if (activeTab === 'pending') return <VendorJobAssignments status="ASSIGNED" />;
      
      // Active jobs: Jobs that vendor has accepted and are in progress
      if (activeTab === 'active') return <VendorJobAssignments status="IN_DISCUSSION,QUOTE_SENT,QUOTE_ACCEPTED,PAID,IN_PROGRESS" />;
      
      // History: All completed, cancelled, or rejected jobs
      if (activeTab === 'history') return <VendorJobAssignments status="COMPLETED,CANCELLED,REJECTED" />;
      
      // Completed: Only successfully completed jobs
      if (activeTab === 'completed') return <VendorJobAssignments status="COMPLETED" />;
    }

    // Business Section
    if (activeSection === 'business') {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Management</h3>
          <p className="text-gray-600">Business management features coming soon...</p>
        </div>
      );
    }

    // Earnings Section
    if (activeSection === 'earnings') {
      if (activeTab === 'earnings-overview') return <EarningsOverview />;
      if (activeTab === 'transactions') return <TransactionHistory />;
      if (activeTab === 'payouts') return <PayoutManagement />;
      if (activeTab === 'tax-reports') return <TaxReports />;
    }

    // Customer Relations Section
    if (activeSection === 'customers') {
      if (activeTab === 'reviews') return <ReviewsComponent />;
      if (activeTab === 'customer-list') return <CustomerListComponent />;
      if (activeTab === 'feedback') return <FeedbackComponent />;
      if (activeTab === 'communication') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Communication</h3>
          <p className="text-gray-600">Communication tools coming soon...</p>
        </div>
      );
    }

    // Account Section  
    if (activeSection === 'account') {
      if (activeTab === 'profile') return <ProfileTab vendor={vendor} onUpdate={fetchDashboardData} activeSection="profile" />;
      if (activeTab === 'verification') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Verification</h3>
          <p className="text-gray-600">Verification status and documents...</p>
        </div>
      );
      if (activeTab === 'settings') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
          <p className="text-gray-600">Settings and preferences coming soon...</p>
        </div>
      );
    }

    return <OverviewTab />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Vendor Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-6">
              Welcome back, {vendor.userId?.firstName || 'Vendor'}!
            </p>
            <div className="flex items-center justify-center space-x-6 text-orange-100">
              {vendor.verificationStatus === 'VERIFIED' && (
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span className="text-lg font-medium">Verified Vendor</span>
                </div>
              )}
              <div className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">{vendor.currentRating || '5.0'} Rating</span>
              </div>
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">{vendor.totalJobsCompleted || 0} Jobs Completed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-12 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              ${dashboardData?.stats?.totalEarnings ? dashboardData.stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </h3>
            <p className="text-gray-600">Total Earnings</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.activeJobs || 0}
            </h3>
            <p className="text-gray-600">Active Jobs</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.ratings?.averageRating ? dashboardData.stats.ratings.averageRating.toFixed(1) : '0.0'}
            </h3>
            <p className="text-gray-600">Customer Rating</p>
          </motion.div>
        </div>

        {/* Main Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.section}
                    onClick={() => {
                      setActiveSection(item.section);
                      // Only set activeTab if the section has tabs
                      if (item.tabs && item.tabs.length > 0) {
                        setActiveTab(item.tabs[0].tab);
                      }
                    }}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeSection === item.section
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Sub Navigation */}
          {activeSection && mainNavigation.find(item => item.section === activeSection)?.tabs && (
            <div className="px-6 py-3 bg-gray-50">
              <nav className="flex space-x-6">
                {mainNavigation.find(item => item.section === activeSection)?.tabs?.map((tab) => (
                  <button
                    key={tab.tab}
                    onClick={() => setActiveTab(tab.tab)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.tab
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
};

// Vendor Job Assignments Component
const VendorJobAssignments = ({ status }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  // Frontend-only price override until backend is fixed
  // eslint-disable-next-line no-unused-vars
  const [localPriceOverrides, setLocalPriceOverrides] = useState({});
  const [showJobDetails, setShowJobDetails] = useState(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState({ isOpen: false, job: null });
  const navigate = useNavigate();

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading jobs with status:', status); // Debug log
      
      // Pass status as parameter object to API
      const params = status ? { status } : {};
      const response = await api.vendor.getJobs(params);
      
      console.log('📋 Jobs API response:', response); // Debug log
      const jobsArray = response.jobs || [];
      console.log('💼 Jobs loaded:', jobsArray.length, 'jobs'); // Debug log
      
      // Log job prices for debugging  
      jobsArray.forEach(job => {
        if (job.status === 'QUOTE_SENT' || job.totalAmount) {
          console.log(`💰 JOB DEBUG:`, {
            jobNumber: job.jobNumber,
            jobId: job._id,
            status: job.status, 
            totalAmount: job.totalAmount,
            estimatedBudget: job.estimatedBudget,
            fullJobData: job
          });
        }
      });
      
      // Apply local price overrides to jobs (frontend-only fix)
      const jobsWithOverrides = jobsArray.map(job => {
        if (localPriceOverrides[job._id]) {
          return { ...job, totalAmount: localPriceOverrides[job._id] };
        }
        return job;
      });
      
      setJobs(jobsWithOverrides);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [status, localPriceOverrides]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleJobResponse = async (jobId, response, reason = '') => {
    // If rejecting, ask for a reason
    if (response === 'REJECTED' && !reason) {
      const userReason = window.prompt('Please provide a reason for rejecting this job:');
      if (!userReason) {
        return; // User cancelled
      }
      reason = userReason;
    }

    try {
      console.log('Sending response:', { response, reason, jobId }); // Debug log
      
      // Update job status without price (price comes later via Update Status)
      const updateData = { 
        response, 
        reason
      };
      
      const result = await api.vendor.respondToJob(jobId, updateData);
      console.log('Response result:', result); // Debug log
      
      if (response === 'ACCEPTED') {
        toast.success('Job accepted! You can now communicate with the customer and set your price using the "Update Status" button.');
      } else {
        toast.success(`Job ${response.toLowerCase()} successfully!`);
      }
      
      loadJobs(); // Reload jobs
    } catch (error) {
      console.error('Error responding to job:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to ${response.toLowerCase()} job: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {status === 'ASSIGNED' ? 'Pending Assignments' : 
             status.includes('IN_DISCUSSION') ? 'Active Jobs' :
             status.includes('COMPLETED,CANCELLED,REJECTED') ? 'Job History' :
             status === 'COMPLETED' ? 'Completed Jobs' : 'Jobs'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {status === 'ASSIGNED' ? 'Jobs assigned to you that need your response' : 
             status.includes('IN_DISCUSSION') ? 'Jobs you have accepted and are working on' :
             status.includes('COMPLETED,CANCELLED,REJECTED') ? 'All completed, cancelled, and rejected jobs' :
             status === 'COMPLETED' ? 'Successfully completed jobs only' : 
             `Status filter: ${status} | Found: ${jobs.length} jobs`}
          </p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            {status === 'ASSIGNED' ? 'No jobs have been assigned to you yet. Check back later for new assignments.' :
             status.includes('IN_DISCUSSION') ? 'No active jobs at the moment. Accepted jobs will appear here.' :
             status.includes('COMPLETED,CANCELLED,REJECTED') ? 'No job history available yet. Completed and ended jobs will appear here.' :
             status === 'COMPLETED' ? 'No completed jobs yet. Successfully finished jobs will appear here.' : 'No jobs available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      Job #{job.jobNumber}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{job.customerId?.firstName} {job.customerId?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium capitalize">{job.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{job.location?.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preferred Date</p>
                      <p className="font-medium">
                        {job.preferredTimeSlots?.[0] ? 
                          new Date(job.preferredTimeSlots[0].date).toLocaleDateString() : 'Flexible'}
                      </p>
                    </div>
                  </div>

                  {job.status === 'ASSIGNED' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate('/messages')}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </button>
                      <button
                        onClick={() => handleJobResponse(job._id, 'ACCEPTED')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Job
                      </button>
                      <button
                        onClick={() => handleJobResponse(job._id, 'REJECTED')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Job
                      </button>
                    </div>
                  )}

                  {(job.status === 'ACCEPTED' || job.status === 'QUOTED' || job.status === 'IN_PROGRESS' || job.status === 'PAID' || job.status === 'IN_DISCUSSION' || job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED') && (
                    <div className="space-y-3">
                      {/* Price Display */}
                      <div className={`border rounded-lg p-3 ${
                        job.totalAmount ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            job.totalAmount ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            Job Price:
                          </span>
                          <span className={`text-lg font-bold ${
                            job.totalAmount ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {job.totalAmount ? `$${job.totalAmount.toLocaleString()}` : 'Not set yet'}
                          </span>
                        </div>
                        {job.status === 'IN_DISCUSSION' && !job.totalAmount && (
                          <p className="text-xs text-gray-500 mt-1">
                            Use "Send Quote & Price" to set the job price
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => navigate('/messages')}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </button>
                        
                        {/* Update Job Status Button */}
                        <button
                          onClick={() => setStatusUpdateModal({ isOpen: true, job })}
                          className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Update Job
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}


      {/* Job Details Modal */}
      {showJobDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-5/6 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Job #{showJobDetails.jobNumber} - Details
              </h3>
              <button
                onClick={() => setShowJobDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Job Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Job Title</h4>
                <p className="text-gray-700">{showJobDetails.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{showJobDetails.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                  <p className="text-gray-700 capitalize">{showJobDetails.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    showJobDetails.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    showJobDetails.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {showJobDetails.priority}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
                <p className="text-gray-700">
                  {showJobDetails.customerId?.firstName} {showJobDetails.customerId?.lastName}
                </p>
                <p className="text-gray-600 text-sm">{showJobDetails.customerId?.email}</p>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                <p className="text-gray-700">
                  {showJobDetails.location?.address}, {showJobDetails.location?.city}
                </p>
                {showJobDetails.location?.zipCode && (
                  <p className="text-gray-600 text-sm">{showJobDetails.location.zipCode}</p>
                )}
              </div>

              {/* Timing */}
              {showJobDetails.requestedTimeSlot && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requested Time</h4>
                  <p className="text-gray-700">
                    {new Date(showJobDetails.requestedTimeSlot.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {showJobDetails.requestedTimeSlot.startTime} - {showJobDetails.requestedTimeSlot.endTime}
                  </p>
                </div>
              )}

              {/* Pricing */}
              {showJobDetails.vendorQuote && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Your Quote</h4>
                  <p className="text-gray-700 text-lg font-semibold">
                    ${showJobDetails.vendorQuote.amount}
                  </p>
                  {showJobDetails.vendorQuote.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {showJobDetails.vendorQuote.description}
                    </p>
                  )}
                </div>
              )}

              {/* Special Instructions */}
              {showJobDetails.specialInstructions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-gray-700">{showJobDetails.specialInstructions}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowJobDetails(null)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Status Update Modal */}
      {statusUpdateModal.isOpen && (
        <JobStatusUpdateModal 
          job={statusUpdateModal.job}
          onClose={() => setStatusUpdateModal({ isOpen: false, job: null })}
          onUpdate={() => {
            setStatusUpdateModal({ isOpen: false, job: null });
            loadJobs();
          }}
        />
      )}
    </div>
  );
};

// Job Status Update Modal Component
const JobStatusUpdateModal = ({ job, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [workDetails, setWorkDetails] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(job.workProgress?.percentage || 0);
  const [completionNotes, setCompletionNotes] = useState('');
  const [priceAmount, setPriceAmount] = useState(job.totalAmount || '');
  const [loading, setLoading] = useState(false);

  // Get available status options based on current status
  const getStatusOptions = () => {
    switch (job.status) {
      case 'ACCEPTED':
        return [{ value: 'IN_DISCUSSION', label: 'Start Discussion', description: 'Begin discussing job requirements with customer' }];
      case 'IN_DISCUSSION':
        return [{ value: 'QUOTE_SENT', label: 'Send Quote & Price', description: 'Send pricing quote to customer' }];
      case 'QUOTE_SENT':
        return [{ value: 'QUOTE_SENT', label: 'Update Quote Price', description: 'Update the quote amount' }];
      case 'QUOTE_ACCEPTED':
      case 'PAID':
        return [{ value: 'IN_PROGRESS', label: 'Start Work', description: 'Begin working on the job' }];
      case 'IN_PROGRESS':
        return [
          { value: 'IN_PROGRESS', label: 'Update Progress', description: 'Update work progress and details' },
          { value: 'COMPLETED', label: 'Mark Complete', description: 'Mark job as completed' }
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedStatus === 'QUOTE_SENT') {
        // Handle quote updates
        if (!priceAmount || parseFloat(priceAmount) <= 0) {
          toast.error('Please provide a valid quote amount');
          setLoading(false);
          return;
        }
        
        await api.vendor.updateJobStatus(job._id, {
          status: selectedStatus,
          totalAmount: parseFloat(priceAmount),
          notes: workDetails || `Quote ${job.status === 'QUOTE_SENT' ? 'updated' : 'sent'}: $${priceAmount}`
        });
        
        toast.success(`Quote ${job.status === 'QUOTE_SENT' ? 'updated' : 'sent'} successfully!`);
        
      } else if (selectedStatus === 'IN_PROGRESS' && job.status === 'IN_PROGRESS') {
        // Handle progress updates
        await api.vendor.updateJobProgress(job._id, {
          percentage: parseInt(progressPercentage),
          notes: workDetails,
          status: 'IN_PROGRESS'
        });
        
        toast.success('Work progress updated successfully!');
        
      } else if (selectedStatus === 'COMPLETED') {
        // Handle job completion
        if (!completionNotes.trim()) {
          toast.error('Please provide completion details');
          setLoading(false);
          return;
        }
        
        await api.vendor.updateJobStatus(job._id, {
          status: selectedStatus,
          notes: completionNotes
        });
        
        await api.vendor.updateJobProgress(job._id, {
          percentage: 100,
          notes: completionNotes,
          status: 'COMPLETED'
        });
        
        toast.success('Job marked as completed!');
        
      } else {
        // Handle other status updates
        await api.vendor.updateJobStatus(job._id, {
          status: selectedStatus,
          notes: workDetails || `Status updated to ${selectedStatus.replace('_', ' ').toLowerCase()}`
        });
        
        toast.success('Job status updated successfully!');
      }
      
      onUpdate();
      
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(`Failed to update job: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = getStatusOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Update Job Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Job: {job.jobNumber}</h3>
          <p className="text-gray-600">{job.title}</p>
          <p className="text-sm text-gray-500">Current Status: <span className="font-medium">{job.status.replace('_', ' ')}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Action</label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-start">
                  <input
                    type="radio"
                    id={option.value}
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <label htmlFor={option.value} className="block text-sm font-medium text-gray-900 cursor-pointer">
                      {option.label}
                    </label>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote Amount (for quote-related statuses) */}
          {selectedStatus === 'QUOTE_SENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quote Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quote amount"
                required
              />
            </div>
          )}

          {/* Progress Percentage (for progress updates) */}
          {selectedStatus === 'IN_PROGRESS' && job.status === 'IN_PROGRESS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Progress (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-medium">{progressPercentage}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Work Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedStatus === 'COMPLETED' ? 'Completion Details' : 'Work Details / Notes'}
            </label>
            <textarea
              value={selectedStatus === 'COMPLETED' ? completionNotes : workDetails}
              onChange={(e) => {
                if (selectedStatus === 'COMPLETED') {
                  setCompletionNotes(e.target.value);
                } else {
                  setWorkDetails(e.target.value);
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                selectedStatus === 'COMPLETED' 
                  ? 'Describe what was completed, any important notes for the customer...'
                  : 'Add any notes or details about this update...'
              }
              required={selectedStatus === 'COMPLETED'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStatus || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Earnings Overview Component
const EarningsOverview = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all'); // all, month, week

  useEffect(() => {
    const loadEarningsData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard data (same as main overview)
        const dashboardResponse = await api.vendor.getDashboard();
        setStats(dashboardResponse.stats);
        
        // Fetch all jobs to calculate earnings
        const jobsResponse = await api.vendor.getJobs();
        const allJobs = jobsResponse.data || [];
        
        setJobs(allJobs);
      } catch (error) {
        console.error('Error loading earnings data:', error);
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    loadEarningsData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Frame Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Earnings Overview</h3>
          <div className="flex items-center space-x-3">
            {/* Debug Button */}
            <button
              onClick={() => {
                console.log('=== MANUAL DEBUG TRIGGER ===');
                console.log('Jobs state:', jobs);
                console.log('Stats state:', stats);
                console.log('Loading state:', loading);
              }}
              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              Debug Data
            </button>
            {/* Refresh Button */}
            <button
              onClick={async () => {
                console.log('=== MANUAL REFRESH TRIGGERED ===');
                setLoading(true);
                try {
                  const dashboardResponse = await api.vendor.getDashboard();
                  setStats(dashboardResponse.stats);
                  
                  const jobsResponse = await api.vendor.getJobs();
                  const allJobs = jobsResponse.data || [];
                  console.log('Refreshed data:', { stats: dashboardResponse.stats, jobs: allJobs });
                  setJobs(allJobs);
                  toast.success('Data refreshed successfully');
                } catch (error) {
                  console.error('Refresh error:', error);
                  toast.error('Failed to refresh data');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Refresh Data
            </button>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Total Earnings</p>
                <p className="text-2xl font-bold text-orange-900">
                  ${stats?.earnings?.total?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Completed Jobs</p>
                <p className="text-2xl font-bold text-orange-900">{stats?.jobs?.completed || '0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Job Value</p>
                <p className="text-2xl font-bold text-orange-900">
                  ${stats?.earnings?.averagePerJob?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Pending Payout</p>
                <p className="text-2xl font-bold text-orange-900">
                  ${stats?.earnings?.pending?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Completed Jobs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Completed Jobs</h4>
        <div className="space-y-4">
          {jobs
            .filter(job => (job.status === 'COMPLETED' || job.status === 'PAID') && job.totalAmount)
            .slice(0, 5)
            .map((job) => (
              <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-medium text-gray-900">Job #{job.jobNumber}</h5>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'PAID' ? 'bg-orange-100 text-orange-800' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.customerId?.firstName} {job.customerId?.lastName} • {job.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    ${job.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(job.completedAt || job.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          
          {jobs.filter(job => (job.status === 'COMPLETED' || job.status === 'PAID') && job.totalAmount).length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed jobs with earnings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Transaction History Component
const TransactionHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, paid

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.vendor.getJobs();
        const allJobs = response.data || [];
        setJobs(allJobs.filter(job => job.totalAmount)); // Only jobs with set amounts
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'completed') return job.status === 'COMPLETED';
    if (filter === 'paid') return job.status === 'PAID';
    return ['COMPLETED', 'PAID', 'QUOTE_ACCEPTED', 'IN_PROGRESS'].includes(job.status);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Transactions</option>
          <option value="completed">Completed Jobs</option>
          <option value="paid">Paid Jobs</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const getStatusColor = (status) => {
            switch (status) {
              case 'PAID': return 'bg-orange-100 text-orange-800';
              case 'COMPLETED': return 'bg-orange-50 text-orange-600';
              case 'IN_PROGRESS': return 'bg-orange-50 text-orange-600';
              case 'QUOTE_ACCEPTED': return 'bg-orange-50 text-orange-600';
              default: return 'bg-gray-100 text-gray-800';
            }
          };

          return (
            <div key={job._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">Job #{job.jobNumber}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{job.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{job.customerId?.firstName} {job.customerId?.lastName}</span>
                    <span>{job.category}</span>
                    <span>{new Date(job.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${job.totalAmount.toLocaleString()}
                  </p>
                  {job.status === 'COMPLETED' && (
                    <p className="text-xs text-orange-600 font-medium">Pending Payout</p>
                  )}
                  {job.status === 'PAID' && (
                    <p className="text-xs text-orange-600 font-medium">Paid Out</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              {filter === 'completed' ? 'No completed jobs yet.' :
               filter === 'paid' ? 'No paid transactions yet.' :
               'No jobs with pricing set yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Payout Management Component
const PayoutManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayoutData = async () => {
      try {
        setLoading(true);
        const response = await api.vendor.getJobs();
        const allJobs = response.data || [];
        setJobs(allJobs.filter(job => job.totalAmount));
      } catch (error) {
        console.error('Error loading payout data:', error);
        toast.error('Failed to load payout information');
      } finally {
        setLoading(false);
      }
    };

    loadPayoutData();
  }, []);

  const pendingPayouts = jobs.filter(job => job.status === 'COMPLETED' && job.totalAmount);
  const completedPayouts = jobs.filter(job => job.status === 'PAID' && job.totalAmount);
  
  const totalPending = pendingPayouts.reduce((sum, job) => sum + job.totalAmount, 0);
  const totalPaid = completedPayouts.reduce((sum, job) => sum + job.totalAmount, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payout Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Payout Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-orange-900">${totalPending.toLocaleString()}</p>
                <p className="text-xs text-orange-700">{pendingPayouts.length} completed jobs</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-orange-900">${totalPaid.toLocaleString()}</p>
                <p className="text-xs text-orange-700">{completedPayouts.length} paid jobs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Pending Payouts</h4>
          <div className="space-y-4">
            {pendingPayouts.map((job) => (
              <div key={job._id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900">Job #{job.jobNumber}</h5>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        AWAITING PAYOUT
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{job.description}</p>
                    <p className="text-xs text-gray-500">
                      Completed: {new Date(job.completedAt || job.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-700">
                      ${job.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600">Processing...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Payout Information</h4>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
            <div>
              <h5 className="font-medium text-orange-900 mb-2">How Payouts Work</h5>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Payouts are processed weekly on Fridays</li>
                <li>• Jobs must be marked as "COMPLETED" to be eligible for payout</li>
                <li>• Funds typically arrive 3-5 business days after processing</li>
                <li>• Platform fee of 10% is deducted from each payout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tax Reports Component
const TaxReports = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadTaxData = async () => {
      try {
        setLoading(true);
        const response = await api.vendor.getJobs();
        const allJobs = response.data || [];
        setJobs(allJobs.filter(job => job.totalAmount && job.status === 'PAID'));
      } catch (error) {
        console.error('Error loading tax data:', error);
        toast.error('Failed to load tax information');
      } finally {
        setLoading(false);
      }
    };

    loadTaxData();
  }, []);

  // Filter jobs by selected year
  const yearlyJobs = jobs.filter(job => {
    const jobYear = new Date(job.completedAt || job.updatedAt).getFullYear();
    return jobYear === selectedYear;
  });

  const totalIncome = yearlyJobs.reduce((sum, job) => sum + job.totalAmount, 0);
  const totalJobs = yearlyJobs.length;

  // Group by month
  const monthlyData = Array.from({length: 12}, (_, i) => {
    const month = i + 1;
    const monthJobs = yearlyJobs.filter(job => {
      const jobMonth = new Date(job.completedAt || job.updatedAt).getMonth() + 1;
      return jobMonth === month;
    });
    const monthIncome = monthJobs.reduce((sum, job) => sum + job.totalAmount, 0);
    return {
      month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
      jobs: monthJobs.length,
      income: monthIncome
    };
  });

  const availableYears = [...new Set(jobs.map(job => 
    new Date(job.completedAt || job.updatedAt).getFullYear()
  ))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tax Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Tax Reports</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Total Income ({selectedYear})</p>
                <p className="text-2xl font-bold text-orange-900">${totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Jobs Completed</p>
                <p className="text-2xl font-bold text-orange-900">{totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Monthly Income</p>
                <p className="text-2xl font-bold text-orange-900">
                  ${(totalIncome / 12).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jobs Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((data, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {data.month} {selectedYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.jobs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${data.income.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h4>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
            <div>
              <h5 className="font-medium text-orange-900 mb-2">Important Tax Notes</h5>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• This report shows your total income from completed jobs</li>
                <li>• You are responsible for reporting this income on your tax returns</li>
                <li>• Consider consulting with a tax professional for guidance</li>
                <li>• Keep records of business expenses for potential deductions</li>
                <li>• 1099 forms will be provided for earnings over $600 annually</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default VendorDashboardPage;