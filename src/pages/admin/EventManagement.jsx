import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  Settings,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Star,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const EventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    averageAttendance: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    location: {
      type: 'physical',
      address: '',
      virtualLink: '',
      instructions: ''
    },
    category: 'training',
    visibility: 'public',
    status: 'published',
    capacity: 50,
    pricing: {
      isFree: true,
      price: 0,
      currency: 'SGD'
    },
    tags: [],
    prerequisites: [],
    cpdPoints: 0,
    imageUrl: ''
  });

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'training', label: 'Training', icon: '🎓', color: 'bg-blue-100 text-blue-800' },
    { value: 'workshop', label: 'Workshop', icon: '🔧', color: 'bg-green-100 text-green-800' },
    { value: 'networking', label: 'Networking', icon: '🤝', color: 'bg-purple-100 text-purple-800' },
    { value: 'community', label: 'Community', icon: '🏘️', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'product_launch', label: 'Product Launch', icon: '🚀', color: 'bg-red-100 text-red-800' },
    { value: 'awards', label: 'Awards', icon: '🏆', color: 'bg-orange-100 text-orange-800' },
    { value: 'certification', label: 'Certification', icon: '📜', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public', color: 'bg-green-100 text-green-800' },
    { value: 'vendor_only', label: 'Vendors Only', color: 'bg-blue-100 text-blue-800' },
    { value: 'agent_only', label: 'Agents Only', color: 'bg-purple-100 text-purple-800' },
    { value: 'customer_only', label: 'Customers Only', color: 'bg-orange-100 text-orange-800' },
    { value: 'admin_only', label: 'Admin Only', color: 'bg-red-100 text-red-800' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status', color: 'bg-gray-100 text-gray-800' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' }
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEvents();
    }
  }, [user, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);

      const response = await api.get(`/events?${queryParams}`);

      if (response && response.events) {
        let filteredEvents = response.events || [];
        if (filters.status) {
          filteredEvents = filteredEvents.filter(event => event.status === filters.status);
        }

        setEvents(filteredEvents);

        // Calculate stats
        const now = new Date();
        const published = filteredEvents.filter(e => e.status === 'published');
        const drafts = filteredEvents.filter(e => e.status === 'draft');
        const upcoming = filteredEvents.filter(e => new Date(e.startDate) > now);
        const totalRegistrations = filteredEvents.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
        const avgAttendance = filteredEvents.length > 0 ? totalRegistrations / filteredEvents.length : 0;

        setStats({
          totalEvents: filteredEvents.length,
          publishedEvents: published.length,
          draftEvents: drafts.length,
          totalRegistrations,
          averageAttendance: Math.round(avgAttendance),
          upcomingEvents: upcoming.length
        });
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      location: {
        type: 'physical',
        address: '',
        virtualLink: '',
        instructions: ''
      },
      category: 'training',
      visibility: 'public',
      status: 'published',
      capacity: 50,
      pricing: {
        isFree: true,
        price: 0,
        currency: 'SGD'
      },
      tags: [],
      prerequisites: [],
      cpdPoints: 0,
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setUploading(false);
  };

  // Image upload function
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.imageUrl || response.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleCreate = async () => {
    try {
      let finalFormData = { ...formData };

      // Upload image if selected
      if (imageFile) {
        setUploading(true);
        try {
          const imageUrl = await uploadImage(imageFile);
          finalFormData.imageUrl = imageUrl;
        } catch (error) {
          toast.error('Failed to upload image. Event will be created without image.');
        } finally {
          setUploading(false);
        }
      }

      await api.post('/events', finalFormData);
      toast.success('Event created successfully! 🎉');
      setShowCreateModal(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleEdit = async () => {
    try {
      let finalFormData = { ...formData };

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        try {
          const imageUrl = await uploadImage(imageFile);
          finalFormData.imageUrl = imageUrl;
        } catch (error) {
          toast.error('Failed to upload new image. Event will be updated with existing image.');
        } finally {
          setUploading(false);
        }
      }

      await api.put(`/events/${selectedEvent._id}`, finalFormData);
      toast.success('Event updated successfully! ✨');
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Update event error:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully! 🗑️');
      fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      ...event,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '',
      tags: event.tags || [],
      prerequisites: event.prerequisites || [],
      imageUrl: event.imageUrl || ''
    });

    // Set image preview if event has an image
    if (event.imageUrl) {
      setImagePreview(event.imageUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setUploading(false);

    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(s => s.value === status) || statusOptions[1];
    return {
      label: option.label,
      color: option.color
    };
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const getVisibilityInfo = (visibility) => {
    return visibilityOptions.find(v => v.value === visibility) || visibilityOptions[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header Section */}
      <section className="relative bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black opacity-20"></div>

        <div className="relative container mx-auto px-6 py-16 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4 backdrop-blur-sm">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2">Event Management</h1>
                    <p className="text-xl text-orange-100 opacity-90">
                      Create, manage and track community events with ease
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap gap-6 mt-8"
              >
                <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Target className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{stats.totalEvents} Total Events</span>
                </div>
                <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{stats.publishedEvents} Published</span>
                </div>
                <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Users className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{stats.totalRegistrations} Registrations</span>
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={fetchEvents}
                className="flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="flex items-center px-8 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalEvents}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Published</p>
                  <p className="text-3xl font-bold text-green-900">{stats.publishedEvents}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Registrations</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalRegistrations}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.upcomingEvents}</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search events by title, description..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white text-sm min-w-[140px]"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white text-sm min-w-[140px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(filters.search || filters.status || filters.category) && (
                <button
                  onClick={() => setFilters({ status: '', category: '', search: '' })}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing <span className="font-semibold text-gray-900">{events.length}</span> events
                {filters.search && <span className="font-medium"> for "{filters.search}"</span>}
                {filters.status && <span className="font-medium"> • Status: {statusOptions.find(s => s.value === filters.status)?.label}</span>}
                {filters.category && <span className="font-medium"> • Category: {categories.find(c => c.value === filters.category)?.label}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Events Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Events Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filters.search || filters.status || filters.category
                  ? "No events match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first event for the community."
                }
              </p>
              {!(filters.search || filters.status || filters.category) && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const statusBadge = getStatusBadge(event.status);
                const categoryInfo = getCategoryInfo(event.category);
                const visibilityInfo = getVisibilityInfo(event.visibility);

                return (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Event Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.shortDescription || event.description?.substring(0, 100)}
                            {event.description?.length > 100 && '...'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} ml-4`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Event Tags */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          <span className="mr-1">{categoryInfo.icon}</span>
                          {categoryInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${visibilityInfo.color}`}>
                          {visibilityInfo.label}
                        </span>
                        {event.pricing?.isFree ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Free
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${event.pricing?.price}
                          </span>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-orange-500" />
                          {formatDate(event.startDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                          {event.location?.type === 'virtual' ? 'Virtual Event' : event.location?.address || 'Location TBD'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-orange-500" />
                          {event.attendees?.length || 0} / {event.capacity} registered
                          {event.waitlist?.length > 0 && (
                            <span className="ml-2 text-orange-600">
                              ({event.waitlist.length} waitlisted)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/events/${event._id}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="View Event"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-2">
                            {event.capacity - (event.attendees?.length || 0) > 0
                              ? `${event.capacity - (event.attendees?.length || 0)} spots left`
                              : 'Full'}
                          </span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {showCreateModal ? '✨ Create New Event' : '📝 Edit Event'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {showCreateModal ? 'Fill in the details to create an amazing community event' : 'Update the event information and settings'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedEvent(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-orange-500" />
                      Basic Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter a compelling event title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          {categories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.icon} {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Brief description for event cards (optional)"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Provide detailed information about the event, what attendees can expect, and any special requirements"
                      />
                    </div>
                  </div>

                  {/* Event Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-orange-500" />
                      Event Image
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Event preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                            <p className="text-sm text-gray-600">
                              {imageFile ? 'New image selected' : 'Current image'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <div className="space-y-2">
                              <label className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-sm text-gray-600">
                                Upload a high-quality image for your event (optional)
                              </p>
                              <p className="text-xs text-gray-500">
                                Recommended: 1200x600px, JPEG or PNG, max 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-500" />
                      Date & Time
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Registration Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.registrationDeadline}
                          onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-orange-500" />
                      Event Settings
                    </h3>
                    <div className="grid md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status *
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          {statusOptions.filter(option => option.value !== '').map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Visibility *
                        </label>
                        <select
                          value={formData.visibility}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          {visibilityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacity *
                        </label>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          min="1"
                          placeholder="Max attendees"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CPD Points
                        </label>
                        <input
                          type="number"
                          value={formData.cpdPoints}
                          onChange={(e) => setFormData(prev => ({ ...prev, cpdPoints: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                      Location Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Type
                        </label>
                        <select
                          value={formData.location.type}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: { ...prev.location, type: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="physical">🏢 In-Person</option>
                          <option value="virtual">💻 Virtual</option>
                          <option value="hybrid">🔄 Hybrid</option>
                        </select>
                      </div>

                      {formData.location.type !== 'virtual' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <textarea
                            value={formData.location.address}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              location: { ...prev.location, address: e.target.value }
                            }))}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Full address of the event venue"
                          />
                        </div>
                      )}

                      {formData.location.type !== 'physical' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Virtual Link
                          </label>
                          <input
                            type="url"
                            value={formData.location.virtualLink}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              location: { ...prev.location, virtualLink: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Instructions
                        </label>
                        <textarea
                          value={formData.location.instructions}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: { ...prev.location, instructions: e.target.value }
                          }))}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Parking info, building access, dress code, what to bring, etc."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-orange-500" />
                      Pricing
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.pricing.isFree}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                pricing: { ...prev.pricing, isFree: e.target.checked, price: e.target.checked ? 0 : prev.pricing.price }
                              }))}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">This is a free event</span>
                          </label>
                        </div>

                        {!formData.pricing.isFree && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price
                              </label>
                              <input
                                type="number"
                                value={formData.pricing.price}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  pricing: { ...prev.pricing, price: parseFloat(e.target.value) || 0 }
                                }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Currency
                              </label>
                              <select
                                value={formData.pricing.currency}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  pricing: { ...prev.pricing, currency: e.target.value }
                                }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="SGD">SGD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreate : handleEdit}
                  disabled={!formData.title || !formData.description || !formData.startDate || !formData.endDate || uploading}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading Image...
                    </>
                  ) : showCreateModal ? (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Event
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Update Event
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventManagement;