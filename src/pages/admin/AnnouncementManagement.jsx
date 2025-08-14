import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Info,
  Zap,
  TrendingUp,
  Pin,
  PinOff,
  FileText,
  Upload,
  Clock,
  Users,
  Search,
  Grid,
  List,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementManagement = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    category: '',
    targetAudience: '',
    status: ''
  });
  const [stats, setStats] = useState({
    overview: { total: 0, published: 0, urgent: 0, important: 0, expired: 0 },
    priorityStats: [],
    categoryStats: [],
    audienceStats: []
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    priority: 'normal',
    targetAudience: 'all',
    category: 'general',
    serviceAreas: [],
    isPublished: false,
    expiresAt: '',
    isPinned: false,
    sendNotification: false,
    imageUrl: '',
    order: 0
  });

  // Priority options
  const priorityOptions = [
    { value: 'normal', label: 'Normal', icon: Info, color: 'orange' },
    { value: 'important', label: 'Important', icon: AlertTriangle, color: 'yellow' },
    { value: 'urgent', label: 'Urgent', icon: Zap, color: 'red' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'service-update', label: 'Service Update' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'policy-change', label: 'Policy Change' },
    { value: 'new-service', label: 'New Service' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'system', label: 'System' },
    { value: 'emergency', label: 'Emergency' }
  ];

  // Target audience options
  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'customers', label: 'Customers' },
    { value: 'vendors', label: 'Vendors' },
    { value: 'admins', label: 'Admins' }
  ];

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`/api/announcements?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch announcements');
      
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      alert('Failed to fetch announcements: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/announcements/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnnouncements();
      fetchStats();
    }
  }, [user, filters]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle service areas input
  const handleServiceAreasChange = (e) => {
    const areas = e.target.value.split(',').map(area => area.trim()).filter(area => area);
    setFormData(prev => ({ ...prev, serviceAreas: areas }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image (demo using base64)
  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    setUploading(true);
    try {
      return imagePreview;
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to process image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Submit announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title.trim() || !formData.content.trim() || !formData.summary.trim()) {
        alert('Title, content, and summary are required');
        return;
      }

      let imageUrl = formData.imageUrl;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          alert('Failed to upload image. Please try again.');
          return;
        }
      }

      const announcementData = {
        ...formData,
        imageUrl,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };

      const url = editingAnnouncement 
        ? `/api/announcements/${editingAnnouncement._id}`
        : '/api/announcements';
      
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save announcement');
      }

      alert(`Announcement ${editingAnnouncement ? 'updated' : 'created'} successfully!`);
      await fetchAnnouncements();
      await fetchStats();
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement: ' + error.message);
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await fetch(`/api/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete announcement');

        await fetchAnnouncements();
        await fetchStats();
        alert('Announcement deleted successfully!');
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Error deleting announcement: ' + error.message);
      }
    }
  };

  // Toggle publish status
  const togglePublishStatus = async (announcement) => {
    try {
      const response = await fetch(`/api/announcements/${announcement._id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isPublished: !announcement.isPublished })
      });

      if (!response.ok) throw new Error('Failed to update publish status');

      await fetchAnnouncements();
      await fetchStats();
    } catch (error) {
      console.error('Error updating publish status:', error);
      alert('Error updating publish status: ' + error.message);
    }
  };

  // Toggle pin status
  const togglePinStatus = async (announcement) => {
    try {
      const response = await fetch(`/api/announcements/${announcement._id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isPinned: !announcement.isPinned })
      });

      if (!response.ok) throw new Error('Failed to update pin status');

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error updating pin status:', error);
      alert('Error updating pin status: ' + error.message);
    }
  };

  // Start editing
  const startEditing = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      summary: announcement.summary,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      category: announcement.category,
      serviceAreas: announcement.serviceAreas,
      isPublished: announcement.isPublished,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '',
      isPinned: announcement.isPinned,
      sendNotification: announcement.sendNotification,
      imageUrl: announcement.imageUrl || '',
      order: announcement.order || 0
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      priority: 'normal',
      targetAudience: 'all',
      category: 'general',
      serviceAreas: [],
      isPublished: false,
      expiresAt: '',
      isPinned: false,
      sendNotification: false,
      imageUrl: '',
      order: 0
    });
    setEditingAnnouncement(null);
    setShowForm(false);
    setSelectedImage(null);
    setImagePreview(null);
    setUploading(false);
  };

  // Get priority icon and color
  const getPriorityDisplay = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option || priorityOptions[0];
  };

  // Check if announcement is expired
  const isExpired = (announcement) => {
    return announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Announcement Management</h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Keep your users informed with important updates, service announcements, and policy changes
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Announcement
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.published}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgent</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.urgent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Important</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.important}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Priorities</option>
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Announcement Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-6"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {editingAnnouncement ? 'Update announcement details' : 'Share important updates with your users'}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-orange-600" />
                        Basic Information
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          maxLength={200}
                          placeholder="Enter announcement title"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Target Audience <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="targetAudience"
                          value={formData.targetAudience}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {audienceOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Expiration Date
                        </label>
                        <input
                          type="datetime-local"
                          name="expiresAt"
                          value={formData.expiresAt}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Service Areas (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.serviceAreas.join(', ')}
                          onChange={handleServiceAreasChange}
                          placeholder="Kuala Lumpur, Selangor, Penang"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to target all areas, or specify areas separated by commas</p>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Featured Image
                      </label>
                      
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                            <Upload className="w-8 h-8 text-orange-600" />
                            <span className="text-orange-600 font-medium">Upload Image</span>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Summary <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        required
                        maxLength={300}
                        rows={3}
                        placeholder="Brief summary of the announcement"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.summary.length}/300 characters</p>
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        required
                        rows={8}
                        placeholder="Full announcement content"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    {/* Publishing Options */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          name="isPublished"
                          checked={formData.isPublished}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">Publish immediately</label>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          name="isPinned"
                          checked={formData.isPinned}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">Pin to top</label>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          name="sendNotification"
                          checked={formData.sendNotification}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">Send notification</label>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 sm:flex-none bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center font-semibold disabled:opacity-50"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {editingAnnouncement ? 'Update' : 'Create'} Announcement
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-semibold"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Announcements</h2>
                <p className="text-gray-600 mt-1">Manage your system announcements</p>
              </div>
              <div className="text-sm text-gray-500">
                {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
              </div>
            </div>
          </div>

          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No announcements yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Create your first announcement to keep users informed about important updates.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Create Your First Announcement
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement, index) => {
                  const priorityDisplay = getPriorityDisplay(announcement.priority);
                  const PriorityIcon = priorityDisplay.icon;
                  const expired = isExpired(announcement);

                  return (
                    <motion.div
                      key={announcement._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-6 hover:shadow-md transition-all duration-200 ${
                        expired ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <PriorityIcon className={`w-5 h-5 text-${priorityDisplay.color}-600`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${priorityDisplay.color}-100 text-${priorityDisplay.color}-800`}>
                            {priorityDisplay.label}
                          </span>
                          {announcement.isPinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => togglePublishStatus(announcement)}
                            className={`p-1 rounded transition-colors ${
                              announcement.isPublished 
                                ? 'text-green-600 hover:text-green-800' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {announcement.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => togglePinStatus(announcement)}
                            className={`p-1 rounded transition-colors ${
                              announcement.isPinned 
                                ? 'text-yellow-600 hover:text-yellow-800' 
                                : 'text-gray-400 hover:text-yellow-600'
                            }`}
                          >
                            {announcement.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <h3 className={`font-semibold mb-2 ${expired ? 'text-gray-500' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h3>
                      
                      <p className={`text-sm mb-4 line-clamp-3 ${expired ? 'text-gray-400' : 'text-gray-600'}`}>
                        {announcement.summary}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span className={`px-2 py-1 rounded bg-gray-100 ${expired ? 'text-gray-400' : 'text-gray-600'}`}>
                          {categoryOptions.find(cat => cat.value === announcement.category)?.label}
                        </span>
                        <span className={`flex items-center ${expired ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Users className="w-3 h-3 mr-1" />
                          {audienceOptions.find(aud => aud.value === announcement.targetAudience)?.label}
                        </span>
                      </div>

                      {expired && (
                        <div className="flex items-center text-xs text-red-500 mb-4">
                          <Clock className="w-3 h-3 mr-1" />
                          Expired on {new Date(announcement.expiresAt).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>{announcement.views || 0} views</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditing(announcement)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Title</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Priority</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Category</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Audience</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Views</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {announcements.map((announcement, index) => {
                      const priorityDisplay = getPriorityDisplay(announcement.priority);
                      const PriorityIcon = priorityDisplay.icon;
                      const expired = isExpired(announcement);

                      return (
                        <motion.tr
                          key={announcement._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`hover:bg-gray-50 transition-colors ${expired ? 'opacity-60' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {announcement.isPinned && <Pin className="w-4 h-4 text-yellow-600" />}
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">{announcement.title}</h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {announcement.summary}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <PriorityIcon className={`w-4 h-4 text-${priorityDisplay.color}-600`} />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${priorityDisplay.color}-100 text-${priorityDisplay.color}-800`}>
                                {priorityDisplay.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                              {categoryOptions.find(cat => cat.value === announcement.category)?.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {audienceOptions.find(aud => aud.value === announcement.targetAudience)?.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => togglePublishStatus(announcement)}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  announcement.isPublished 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                              >
                                {announcement.isPublished ? (
                                  <><Eye className="w-3 h-3 mr-1" /> Published</>
                                ) : (
                                  <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                )}
                              </button>
                              {expired && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Clock className="w-3 h-3 mr-1" /> Expired
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{announcement.views || 0}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => togglePinStatus(announcement)}
                                className={`transition-colors ${
                                  announcement.isPinned 
                                    ? 'text-yellow-600 hover:text-yellow-800' 
                                    : 'text-gray-400 hover:text-yellow-600'
                                }`}
                              >
                                {announcement.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => startEditing(announcement)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(announcement._id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;