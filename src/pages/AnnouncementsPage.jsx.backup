import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  AlertTriangle,
  Info,
  Zap,
  Pin,
  Calendar,
  Eye,
  User,
  Filter,
  Search,
  ChevronDown,
  X,
  ZoomIn
} from 'lucide-react';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'service-update', label: 'Service Updates' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'policy-change', label: 'Policy Changes' },
    { value: 'new-service', label: 'New Services' },
    { value: 'pricing', label: 'Pricing Updates' },
    { value: 'system', label: 'System Updates' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'general', label: 'General' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'important', label: 'Important' },
    { value: 'normal', label: 'Normal' }
  ];

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/cms/announcements/published?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch announcements');
      
      const data = await response.json();
      setAnnouncements(data.announcements);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError('Failed to load announcements');
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, filters]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (selectedAnnouncement) {
          closeAnnouncementModal();
        } else if (selectedImage) {
          closeImageModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [selectedImage, selectedAnnouncement]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAnnouncements();
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return AlertTriangle;
      case 'important': return Zap;
      default: return Info;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'important': return 'orange';
      default: return 'orange';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryDisplay = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const closeAnnouncementModal = () => {
    setSelectedAnnouncement(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <section className="bg-gradient-to-r from-orange-600 to-orange-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Announcements</h1>
              </div>
              <p className="text-orange-100 text-lg max-w-3xl mx-auto mb-6">
                Stay updated with the latest news, updates, and important information about our services.
              </p>
              <div className="flex items-center justify-center space-x-8 text-orange-100">
                <div className="text-center">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="text-sm">Loading...</div>
                </div>
                <div className="text-center">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="text-sm">Loading...</div>
                </div>
                <div className="text-center">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="text-sm">Loading...</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Skeleton */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="animate-pulse">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="hidden lg:flex gap-4">
                  <div className="h-12 w-40 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 w-40 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 w-24 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Skeleton */}
          <div className="space-y-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="animate-pulse">
                  {/* Header Skeleton */}
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="px-6 py-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    
                    {/* Image Skeleton */}
                    {index % 2 === 0 && (
                      <div className="h-48 bg-gray-200 rounded-xl mb-6"></div>
                    )}
                    
                    {/* Footer Skeleton */}
                    <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-2 bg-gray-200 rounded w-10"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-2 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Announcements</h1>
            </div>
            <p className="text-orange-100 text-lg max-w-3xl mx-auto mb-6">
              Stay updated with the latest news, updates, and important information about our services.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search announcements by title, content..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </form>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {(filters.category || filters.priority || filters.search) && (
                <button
                  onClick={() => {
                    setFilters({ category: '', priority: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="lg:hidden mt-6 pt-6 border-t border-gray-200 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              {(filters.category || filters.priority || filters.search) && (
                <button
                  onClick={() => {
                    setFilters({ category: '', priority: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Enhanced Announcements List */}
        {announcements.length > 0 ? (
          <div className="space-y-8">
            {announcements.map((announcement, index) => {
              const PriorityIcon = getPriorityIcon(announcement.priority);
              const priorityColor = getPriorityColor(announcement.priority);
              const isUrgent = announcement.priority === 'urgent';
              const isImportant = announcement.priority === 'important';

              return (
                <motion.div
                  key={announcement._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => openAnnouncementModal(announcement)}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
                    announcement.isPinned 
                      ? 'ring-2 ring-orange-300 border-l-4 border-l-orange-500' 
                      : isUrgent 
                      ? 'border-l-4 border-l-red-500'
                      : isImportant
                      ? 'border-l-4 border-l-orange-500'
                      : 'border border-gray-200'
                  }`}
                >
                  {/* Header with gradient background */}
                  <div className={`px-6 py-4 ${
                    announcement.isPinned
                      ? 'bg-gradient-to-r from-orange-50 to-indigo-50'
                      : isUrgent
                      ? 'bg-gradient-to-r from-red-50 to-pink-50'
                      : isImportant
                      ? 'bg-gradient-to-r from-orange-50 to-yellow-50'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {announcement.isPinned && (
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Pin className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <div className={`p-2 rounded-full ${
                          isUrgent ? 'bg-red-100' : isImportant ? 'bg-orange-100' : 'bg-orange-100'
                        }`}>
                          <PriorityIcon className={`w-4 h-4 text-${priorityColor}-600`} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isUrgent 
                              ? 'bg-red-100 text-red-800'
                              : isImportant
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                            {getCategoryDisplay(announcement.category)}
                          </span>
                        </div>
                      </div>
                      
                      {announcement.isPinned && (
                        <div className="flex items-center text-orange-600 text-sm font-medium">
                          <Pin className="w-4 h-4 mr-1" />
                          Pinned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
                      {announcement.title}
                    </h2>

                    <p className="text-gray-600 mb-6 leading-relaxed text-base">
                      {announcement.summary}
                    </p>

                    {/* Enhanced Image Display */}
                    {announcement.imageUrl && (
                      <div className="mb-6">
                        <div 
                          className="relative group cursor-pointer"
                          onClick={() => openImageModal(announcement.imageUrl)}
                        >
                          <img
                            src={announcement.imageUrl}
                            alt={announcement.title}
                            className="w-full max-w-2xl mx-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-xl flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                              <ZoomIn className="w-6 h-6 text-gray-700" />
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 text-center mt-3 flex items-center justify-center">
                          <ZoomIn className="w-3 h-3 mr-1" />
                          Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* Enhanced Footer */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-xs font-semibold">
                                {announcement.authorId?.firstName?.[0]}{announcement.authorId?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {announcement.authorId?.firstName} {announcement.authorId?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">Author</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <div>
                                <p className="font-medium">{formatDate(announcement.createdAt)}</p>
                                <p className="text-xs text-gray-500">Published</p>
                              </div>
                            </div>
                            
                            {announcement.views > 0 && (
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                <div>
                                  <p className="font-medium">{announcement.views}</p>
                                  <p className="text-xs text-gray-500">Views</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    {announcement.content !== announcement.summary && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Details</h3>
                        <div className="prose max-w-none text-gray-700 leading-relaxed">
                          {announcement.content.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-3 text-base">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No announcements found</h3>
              <p className="text-gray-600 leading-relaxed">
                {filters.search || filters.category || filters.priority
                  ? 'Try adjusting your filters to see more announcements.'
                  : 'There are no announcements available at the moment. Check back later for updates!'}
              </p>
              {(filters.search || filters.category || filters.priority) && (
                <button
                  onClick={() => {
                    setFilters({ category: '', priority: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages} 
                  <span className="hidden sm:inline">({announcements.length} announcements)</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  
                  <div className="hidden sm:flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                      return pageNum <= totalPages ? (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-xl transition-colors font-medium ${
                            currentPage === pageNum
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    })}
                  </div>
                  
                  {/* Mobile page indicator */}
                  <div className="sm:hidden px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Announcement Modal */}
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={closeAnnouncementModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {selectedAnnouncement.isPinned && (
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Pin className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <div className={`p-2 rounded-full ${
                        selectedAnnouncement.priority === 'urgent' ? 'bg-red-100' 
                        : selectedAnnouncement.priority === 'important' ? 'bg-orange-100' 
                        : 'bg-orange-100'
                      }`}>
                        {selectedAnnouncement.priority === 'urgent' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : selectedAnnouncement.priority === 'important' ? (
                          <Zap className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Info className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedAnnouncement.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : selectedAnnouncement.priority === 'important'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedAnnouncement.priority.charAt(0).toUpperCase() + selectedAnnouncement.priority.slice(1)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          {getCategoryDisplay(selectedAnnouncement.category)}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                      {selectedAnnouncement.title}
                    </h2>
                  </div>
                  <button
                    onClick={closeAnnouncementModal}
                    className="ml-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Summary */}
                <div className="mb-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedAnnouncement.summary}
                  </p>
                </div>

                {/* Image */}
                {selectedAnnouncement.imageUrl && (
                  <div className="mb-6">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => openImageModal(selectedAnnouncement.imageUrl)}
                    >
                      <img
                        src={selectedAnnouncement.imageUrl}
                        alt={selectedAnnouncement.title}
                        className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-xl flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                          <ZoomIn className="w-6 h-6 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Content */}
                {selectedAnnouncement.content !== selectedAnnouncement.summary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Details</h3>
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                      {selectedAnnouncement.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-3 text-base">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Info */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-semibold">
                            {selectedAnnouncement.authorId?.firstName?.[0]}{selectedAnnouncement.authorId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedAnnouncement.authorId?.firstName} {selectedAnnouncement.authorId?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Author</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <p className="font-medium">{formatDate(selectedAnnouncement.createdAt)}</p>
                            <p className="text-xs text-gray-500">Published</p>
                          </div>
                        </div>
                        
                        {selectedAnnouncement.views > 0 && (
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <p className="font-medium">{selectedAnnouncement.views}</p>
                              <p className="text-xs text-gray-500">Views</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
                <p className="text-sm text-gray-500 text-center">
                  Press ESC or click outside to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Image Modal */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-6xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeImageModal}
                className="absolute -top-12 right-0 z-10 bg-white bg-opacity-20 text-white rounded-full p-3 hover:bg-opacity-30 transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged announcement image"
                className="max-w-full max-h-screen object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 rounded-b-xl">
                <p className="text-white text-sm text-center">Press ESC or click outside to close</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;