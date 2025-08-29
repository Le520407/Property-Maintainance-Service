import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Edit3,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Type,
  Layout,
  Monitor,
  Smartphone,
  Palette,
  Settings,
  RotateCcw,
  Copy,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { api } from '../../services/api';
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

      setBanners(bannersRes.data?.data || []);
      setServices(servicesRes.data?.data || []);
      setStats(statsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load homepage data:', error);
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

    try {
      await api.delete(`/cms/banners/${bannerId}`);
      setBanners(prev => prev.filter(banner => banner._id !== bannerId));
      toast.success('Banner deleted successfully!');
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      const response = await api.patch(`/cms/banners/${bannerId}/toggle`, {
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
      await api.patch(`/cms/banners/${bannerId}/reorder`, {
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Homepage Management</h1>
              <p className="text-gray-600 mt-2">Manage your homepage content, banners, and layout</p>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'desktop' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'mobile' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => window.open('/', '_blank')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Live Site
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Loading State */}
          {loading && (
            <div className="p-6 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
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

              {/* Banners List */}
              <div className="space-y-4">
                {Array.isArray(banners) && banners.filter(banner => banner && banner._id).map((banner, index) => (
                  <motion.div
                    key={banner._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Preview */}
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100">
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
                            <ImageIcon className="w-6 h-6 text-white opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{banner.title || 'Untitled Banner'}</h3>
                          <div className="flex items-center space-x-2">
                            {!banner.isActive && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              Order: {banner.order || index + 1}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {banner.description || banner.subtitle || 'No description'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReorderBanner(banner._id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorderBanner(banner._id, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBannerStatus(banner._id, banner.isActive)}
                          className={`p-2 transition-colors ${
                            banner.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openBannerModal(banner)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!Array.isArray(banners) || banners.length === 0) && (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
                    <p className="text-gray-600 mb-6">Create your first homepage banner to get started</p>
                    <button
                      onClick={() => openBannerModal()}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Create First Banner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content would go here */}
          {!loading && activeTab !== 'banners' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tabs.find(tab => tab.id === activeTab)?.name} Management
                </h3>
                <p className="text-gray-600">This section is coming soon...</p>
              </div>
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