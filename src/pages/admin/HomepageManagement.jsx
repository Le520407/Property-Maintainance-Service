import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layout,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Smartphone,
  Trash2,
  Type,
  Upload,
  User,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { api } from '../../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const HomepageManagement = () => {
  const [activeTab, setActiveTab] = useState('banners');
  const [banners, setBanners] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');

  // Banner form state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    backgroundImage: '',
    backgroundType: 'image', // 'image', 'gradient', 'video'
    gradientColors: ['#ff6b35', '#f7931e'],
    textColor: '#ffffff',
    position: 'center',
    isActive: true,
    order: 0,
    animation: 'fade',
    displayDuration: 5000
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    setLoading(true);
    try {
      const [bannersRes, servicesRes, statsRes] = await Promise.all([
        api.get('/cms/banners/homepage'),
        api.get('/cms/services/homepage'),
        api.get('/cms/stats/homepage')
      ]);

      console.log('Banners API Response:', bannersRes.data);
      console.log('Services API Response:', servicesRes.data);
      console.log('Stats API Response:', statsRes.data);

      // Handle different API response structures
      const banners = Array.isArray(bannersRes.data) ? bannersRes.data : (bannersRes.data?.data || []);
      const services = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.data || []);
      const stats = Array.isArray(statsRes.data) ? statsRes.data : (statsRes.data?.data || []);

      console.log('Processed banners:', banners);
      console.log('Processed services:', services);
      console.log('Processed stats:', stats);

      setBanners(banners);
      setServices(services);
      setStats(stats);
    } catch (error) {
      console.error('Failed to load homepage data:', error);
      console.error('Error details:', error.response?.data);
      // Load mock data for development
      setBanners([
        {
          _id: '1',
          title: 'Professional Property Maintenance',
          subtitle: 'Swift Fix Pro',
          description: 'Your trusted partner for all property maintenance needs',
          buttonText: 'Get Started',
          buttonLink: '/register',
          backgroundImage: '/api/placeholder/1920/1080',
          isActive: true,
          order: 0
        }
      ]);
      setServices([
        {
          _id: '1',
          name: 'Plumbing Services',
          description: 'Professional plumbing repairs and installations',
          price: 'SGD 80',
          features: ['24/7 Emergency Service', 'Licensed Technicians', 'Warranty Included'],
          isActive: true
        }
      ]);
      setStats([
        { _id: '1', number: '500+', label: 'Happy Customers', isActive: true },
        { _id: '2', number: '50+', label: 'Expert Technicians', isActive: true },
        { _id: '3', number: '24/7', label: 'Support Available', isActive: true },
        { _id: '4', number: '4.9', label: 'Average Rating', isActive: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/cms/upload/banner-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.data.imageUrl;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setBannerForm(prev => ({ ...prev, backgroundImage: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async () => {
    try {
      let imageUrl = bannerForm.backgroundImage;

      // Upload image if a new file was selected
      if (selectedImageFile && bannerForm.backgroundType === 'image') {
        const uploadedUrl = await handleImageUpload(selectedImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const bannerData = {
        ...bannerForm,
        backgroundImage: imageUrl,
        location: 'homepage'
      };

      let response;
      if (editingBanner) {
        response = await api.put(`/cms/banners/homepage/${editingBanner._id}`, bannerData);
        setBanners(prev => prev.map(banner => 
          banner._id === editingBanner._id ? response.data.data : banner
        ));
        toast.success('Banner updated successfully!');
      } else {
        response = await api.post('/cms/banners/homepage', bannerData);
        setBanners(prev => [...prev, response.data.data]);
        toast.success('Banner created successfully!');
      }

      setShowBannerModal(false);
      setEditingBanner(null);
      resetBannerForm();
      resetImageUpload();
    } catch (error) {
      console.error('Failed to save banner:', error);
      toast.error('Failed to save banner');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    console.log('Attempting to delete banner with ID:', bannerId);
    console.log('Delete URL:', `/cms/banners/homepage/${bannerId}`);

    try {
      const response = await api.delete(`/cms/banners/homepage/${bannerId}`);
      console.log('Delete response:', response.data);
      setBanners(prev => prev.filter(banner => banner._id !== bannerId));
      toast.success('Banner deleted successfully!');
    } catch (error) {
      console.error('Failed to delete banner:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to delete banner: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      const response = await api.patch(`/cms/banners/homepage/${bannerId}/toggle`, {
        isActive: !currentStatus
      });
      setBanners(prev => prev.map(banner => 
        banner._id === bannerId ? { ...banner, isActive: !currentStatus } : banner
      ));
      toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Failed to toggle banner status:', error);
      toast.error('Failed to update banner status');
    }
  };

  const handleReorderBanner = async (bannerId, direction) => {
    const currentIndex = banners.findIndex(b => b._id === bannerId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === banners.length - 1)
    ) return;

    try {
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const newBanners = [...banners];
      [newBanners[currentIndex], newBanners[newIndex]] = [newBanners[newIndex], newBanners[currentIndex]];
      
      // Update order values
      newBanners.forEach((banner, index) => {
        banner.order = index;
      });

      setBanners(newBanners);
      
      // Update backend
      await api.patch(`/cms/banners/homepage/${bannerId}/reorder`, {
        newOrder: newBanners[newIndex].order
      });
      
      toast.success('Banner order updated!');
    } catch (error) {
      console.error('Failed to reorder banner:', error);
      toast.error('Failed to reorder banner');
    }
  };

  const resetImageUpload = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setUploadingImage(false);
  };

  const resetBannerForm = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      buttonText: '',
      buttonLink: '',
      backgroundImage: '',
      backgroundType: 'image',
      gradientColors: ['#ff6b35', '#f7931e'],
      textColor: '#ffffff',
      position: 'center',
      isActive: true,
      order: 0,
      animation: 'fade',
      displayDuration: 5000
    });
    resetImageUpload();
  };

  const openBannerModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        buttonText: banner.buttonText || '',
        buttonLink: banner.buttonLink || '',
        backgroundImage: banner.backgroundImage || '',
        backgroundType: banner.backgroundType || 'image',
        gradientColors: banner.gradientColors || ['#ff6b35', '#f7931e'],
        textColor: banner.textColor || '#ffffff',
        position: banner.position || 'center',
        isActive: banner.isActive !== false,
        order: banner.order || 0,
        animation: banner.animation || 'fade',
        displayDuration: banner.displayDuration || 5000
      });
      // Set existing image as preview if available
      if (banner.backgroundImage) {
        setImagePreview(banner.backgroundImage);
      }
    } else {
      setEditingBanner(null);
      resetBannerForm();
    }
    setShowBannerModal(true);
  };

  const tabs = [
    { id: 'banners', name: 'Banners', icon: ImageIcon, count: banners.length },
    { id: 'services', name: 'Services', icon: Settings, count: services.length },
    { id: 'stats', name: 'Statistics', icon: BarChart3, count: stats.length },
    { id: 'layout', name: 'Layout', icon: Layout, count: 0 },
    { id: 'preview', name: 'Preview', icon: Monitor, count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg text-white p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🏠 Homepage Management</h1>
              <p className="text-orange-100 text-lg">Create stunning homepage content that converts visitors into customers</p>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-3 rounded-lg transition-colors ${
                    previewMode === 'desktop' ? 'bg-white text-orange-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-3 rounded-lg transition-colors ${
                    previewMode === 'mobile' ? 'bg-white text-orange-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => window.open('/', '_blank')}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Live Site
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Banners</p>
                <h3 className="text-3xl font-bold">{banners.filter(b => b.isActive).length}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <ImageIcon className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Featured Services</p>
                <h3 className="text-3xl font-bold">{services.filter(s => s.isActive).length}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Settings className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Statistics</p>
                <h3 className="text-3xl font-bold">{stats.filter(s => s.isActive).length}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Last Updated</p>
                <h3 className="text-xl font-bold">{new Date().toLocaleDateString()}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => openBannerModal()}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Add Banner</span>
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
            >
              <Settings className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Manage Services</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
            >
              <BarChart3 className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Update Stats</span>
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
            >
              <Eye className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Preview Site</span>
            </button>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-2">
            <p className="text-sm text-gray-600 font-medium">📋 Content Management</p>
          </div>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center py-4 px-4 font-medium text-sm transition-all duration-200 rounded-t-lg relative ${
                      isActive
                        ? 'text-orange-600 bg-white border-t-2 border-l-2 border-r-2 border-orange-500 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-2 ${isActive ? 'text-orange-500' : ''}`} />
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-1 px-2 rounded-full text-xs font-semibold ${
                        isActive 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Enhanced Loading State */}
          {loading && (
            <div className="p-12 flex flex-col justify-center items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-600 border-t-transparent absolute top-0"></div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🔄 Loading Homepage Data</h3>
                <p className="text-gray-600">Fetching banners, services, and statistics...</p>
              </div>
            </div>
          )}

          {/* Banners Tab */}
          {!loading && activeTab === 'banners' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Homepage Banners</h2>
                  <p className="text-gray-600">Create and manage homepage hero banners</p>
                </div>
                <button
                  onClick={() => openBannerModal()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Banner
                </button>
              </div>

              {/* Enhanced Banners List */}
              <div className="space-y-6">
                {Array.isArray(banners) && banners.filter(banner => banner && banner._id).map((banner, index) => (
                  <motion.div
                    key={banner._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-6">
                      {/* Enhanced Preview */}
                      <div className="relative">
                        <div className="w-32 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                          {banner.backgroundImage ? (
                            <img 
                              src={banner.backgroundImage} 
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ 
                                background: `linear-gradient(135deg, ${banner.gradientColors?.[0] || '#ff6b35'}, ${banner.gradientColors?.[1] || '#f7931e'})` 
                              }}
                            >
                              <ImageIcon className="w-8 h-8 text-white opacity-60" />
                            </div>
                          )}
                        </div>
                        {banner.isActive && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                            LIVE
                          </div>
                        )}
                      </div>

                      {/* Enhanced Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {banner.title || 'Untitled Banner'}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!banner.isActive && (
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                                📴 Inactive
                              </span>
                            )}
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                              #{banner.order || index + 1}
                            </span>
                          </div>
                        </div>
                        
                        {banner.subtitle && (
                          <p className="text-orange-600 font-medium mb-2">{banner.subtitle}</p>
                        )}
                        
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {banner.description || 'No description available'}
                        </p>
                        
                        {banner.buttonText && (
                          <div className="flex items-center mt-2">
                            <span className="text-xs text-gray-500 mr-2">CTA:</span>
                            <span className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                              {banner.buttonText}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Actions */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReorderBanner(banner._id, 'up')}
                            disabled={index === 0}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReorderBanner(banner._id, 'down')}
                            disabled={index === banners.length - 1}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleBannerStatus(banner._id, banner.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              banner.isActive 
                                ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                            }`}
                            title={banner.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openBannerModal(banner)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="Edit banner"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner._id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            title="Delete banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!Array.isArray(banners) || banners.length === 0) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-dashed border-orange-200"
                  >
                    <div className="bg-gradient-to-br from-orange-100 to-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ImageIcon className="w-12 h-12 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">🎨 No banners yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Transform your homepage with eye-catching banners that convert visitors into customers
                    </p>
                    <button
                      onClick={() => openBannerModal()}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg"
                    >
                      ✨ Create Your First Banner
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Other Tabs */}
          {!loading && activeTab !== 'banners' && (
            <div className="p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-200"
              >
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  {(() => {
                    const currentTab = tabs.find(tab => tab.id === activeTab);
                    const Icon = currentTab?.icon || Settings;
                    return <Icon className="w-12 h-12 text-blue-500" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🚧 {tabs.find(tab => tab.id === activeTab)?.name} Management
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  This powerful feature is currently under development. 
                  Get ready for an amazing content management experience!
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveTab('banners')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-semibold"
                  >
                    🏠 Manage Banners
                  </button>
                  <button
                    onClick={() => window.open('/', '_blank')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
                  >
                    👀 View Homepage
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h3>
                <button
                  onClick={() => setShowBannerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter banner title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Enter banner subtitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter banner description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="e.g., Get Started"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={bannerForm.buttonLink}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, buttonLink: e.target.value }))}
                    placeholder="e.g., /register"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Background Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setBannerForm(prev => ({ ...prev, backgroundType: 'image' }))}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      bannerForm.backgroundType === 'image'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => setBannerForm(prev => ({ ...prev, backgroundType: 'gradient' }))}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      bannerForm.backgroundType === 'gradient'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {bannerForm.backgroundType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image
                  </label>
                  
                  {/* Image Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Banner preview"
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                        <div className="flex justify-center space-x-2">
                          <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                            <Upload className="w-4 h-4 mr-2 inline" />
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setSelectedImageFile(null);
                              setBannerForm(prev => ({ ...prev, backgroundImage: '' }));
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          {uploadingImage ? 'Uploading image...' : 'Click to upload banner image'}
                        </p>
                        <label className="cursor-pointer bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingImage ? 'Uploading...' : 'Select Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Supports: JPG, PNG, GIF (Max: 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bannerForm.backgroundType === 'gradient' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gradient Start Color
                    </label>
                    <input
                      type="color"
                      value={bannerForm.gradientColors[0]}
                      onChange={(e) => setBannerForm(prev => ({
                        ...prev,
                        gradientColors: [e.target.value, prev.gradientColors[1]]
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gradient End Color
                    </label>
                    <input
                      type="color"
                      value={bannerForm.gradientColors[1]}
                      onChange={(e) => setBannerForm(prev => ({
                        ...prev,
                        gradientColors: [prev.gradientColors[0], e.target.value]
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Preview
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="h-48 flex items-center justify-center relative"
                    style={{
                      background: bannerForm.backgroundType === 'image' 
                        ? `url(${imagePreview || bannerForm.backgroundImage || '/api/placeholder/800/400'}) center/cover`
                        : `linear-gradient(135deg, ${bannerForm.gradientColors[0]}, ${bannerForm.gradientColors[1]})`
                    }}
                  >
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">{bannerForm.title || 'Banner Title'}</h2>
                      {bannerForm.subtitle && (
                        <p className="text-lg opacity-90 mb-2">{bannerForm.subtitle}</p>
                      )}
                      {bannerForm.description && (
                        <p className="opacity-80 mb-4">{bannerForm.description}</p>
                      )}
                      {bannerForm.buttonText && (
                        <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-medium">
                          {bannerForm.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowBannerModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBanner}
                disabled={uploadingImage}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {uploadingImage ? 'Uploading...' : editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageManagement;