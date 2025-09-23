import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingUp,
  Eye,
  Plus,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [votedFaqs, setVotedFaqs] = useState(new Set());

  // FAQ Statistics
  const [stats, setStats] = useState({
    totalFaqs: 0,
    mostViewed: 0,
    helpfulRating: 0,
    totalViews: 0
  });

  // Category options matching order management style
  const categoryOptions = [
    { value: '', label: 'All Categories', icon: '📋' },
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'services', label: 'Services', icon: '🔧' },
    { value: 'pricing', label: 'Pricing', icon: '💰' },
    { value: 'booking', label: 'Booking', icon: '📅' },
    { value: 'technical', label: 'Technical', icon: '⚙️' },
    { value: 'billing', label: 'Billing', icon: '🧾' }
  ];

  // Fetch FAQ data
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const data = await api.get('/cms/faqs');

        // Handle response safely
        const faqData = data?.data || data || [];
        setFaqs(faqData);
        setFilteredFaqs(faqData);

        // Calculate stats
        const totalViews = faqData.reduce((sum, faq) => sum + (faq.views || 0), 0);
        const totalHelpful = faqData.reduce((sum, faq) => sum + (faq.helpful?.yes || 0), 0);
        const totalVotes = faqData.reduce((sum, faq) => sum + ((faq.helpful?.yes || 0) + (faq.helpful?.no || 0)), 0);

        setStats({
          totalFaqs: faqData.length,
          mostViewed: Math.max(...faqData.map(faq => faq.views || 0), 0),
          helpfulRating: totalVotes > 0 ? ((totalHelpful / totalVotes) * 100) : 0,
          totalViews: totalViews
        });

      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast.error('Failed to load FAQs');
        setFaqs([]);
        setFilteredFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Filter FAQs
  useEffect(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question?.toLowerCase().includes(query) ||
        faq.answer?.toLowerCase().includes(query) ||
        faq.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, selectedCategory, searchQuery]);

  // Toggle FAQ expansion
  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  // Handle voting
  const handleVote = async (faqId, isHelpful) => {
    if (votedFaqs.has(faqId)) {
      return;
    }

    try {
      const updatedFaq = await api.post(`/cms/faqs/${faqId}/vote`, { helpful: isHelpful });

      setFaqs(prevFaqs =>
        prevFaqs.map(faq =>
          faq._id === faqId ? updatedFaq : faq
        )
      );

      setVotedFaqs(prev => new Set(prev).add(faqId));
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error voting on FAQ:', error);
      toast.error('Failed to submit feedback');
    }
  };

  // Refresh data
  const refreshFaqs = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section - Matching Order Management Style */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">FAQ Management</h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Find answers to common questions about our services, booking process, and more
              </p>
              {stats.totalFaqs > 0 && (
                <div className="flex items-center mt-4 px-4 py-3 bg-orange-800 bg-opacity-80 text-orange-100 rounded-lg backdrop-blur-sm inline-flex">
                  <HelpCircle className="w-5 h-5 mr-3" />
                  <span className="font-semibold">
                    {stats.totalFaqs} FAQ{stats.totalFaqs !== 1 ? 's' : ''} available to help you
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={refreshFaqs}
                className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Matching Order Management Style */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total FAQs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalFaqs}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Views</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Helpful Rating</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.helpfulRating.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Most Viewed</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.mostViewed}</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Box */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white text-lg min-w-[200px]"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Results Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing <span className="font-semibold text-gray-900">{filteredFaqs.length}</span> of <span className="font-semibold text-gray-900">{faqs.length}</span> FAQs
                {searchQuery && <span className="font-medium"> for "{searchQuery}"</span>}
                {selectedCategory && <span className="font-medium"> in {categoryOptions.find(cat => cat.value === selectedCategory)?.label}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-6">
              {/* Group by category if no search/filter */}
              {!searchQuery && !selectedCategory ? (
                categoryOptions.slice(1).map(category => {
                  const categoryFaqs = filteredFaqs.filter(faq => faq.category === category.value);
                  if (categoryFaqs.length === 0) return null;

                  return (
                    <motion.div
                      key={category.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                          <span className="mr-3 text-2xl">{category.icon}</span>
                          {category.label}
                          <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                            {categoryFaqs.length}
                          </span>
                        </h2>
                      </div>

                      {/* FAQ List */}
                      <div className="divide-y divide-gray-200">
                        {categoryFaqs.map((faq, index) => (
                          <motion.div
                            key={faq._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-6 py-6 hover:bg-gray-50 transition-colors"
                          >
                            <button
                              onClick={() => toggleFaq(faq._id)}
                              className="w-full flex items-center justify-between text-left group"
                            >
                              <h3 className="text-lg font-medium text-gray-900 pr-4 group-hover:text-orange-600 transition-colors">
                                {faq.question}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">{faq.views || 0} views</span>
                                {expandedFaq === faq._id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedFaq === faq._id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-6"
                                >
                                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <div className="prose prose-gray max-w-none">
                                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                      </p>
                                    </div>

                                    {/* Voting Section */}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300">
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-gray-600">Was this helpful?</span>

                                        {votedFaqs.has(faq._id) ? (
                                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Thanks for your feedback!
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleVote(faq._id, true)}
                                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-gray-300 hover:border-green-300"
                                            >
                                              <ThumbsUp className="w-4 h-4" />
                                              Yes ({faq.helpful?.yes || 0})
                                            </button>
                                            <button
                                              onClick={() => handleVote(faq._id, false)}
                                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 hover:border-red-300"
                                            >
                                              <ThumbsDown className="w-4 h-4" />
                                              No ({faq.helpful?.no || 0})
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Search Results Display
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-200">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={faq._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {categoryOptions.find(cat => cat.value === faq.category)?.icon}
                          {categoryOptions.find(cat => cat.value === faq.category)?.label}
                        </span>
                        <span className="text-sm text-gray-500">{faq.views || 0} views</span>
                      </div>

                      <button
                        onClick={() => toggleFaq(faq._id)}
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <h3 className="text-lg font-medium text-gray-900 pr-4 group-hover:text-orange-600 transition-colors">
                          {faq.question}
                        </h3>
                        {expandedFaq === faq._id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedFaq === faq._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                          >
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                              <div className="prose prose-gray max-w-none">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-gray-600">Was this helpful?</span>

                                  {votedFaqs.has(faq._id) ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                      <CheckCircle className="w-4 h-4" />
                                      Thanks for your feedback!
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleVote(faq._id, true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-gray-300 hover:border-green-300"
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                        Yes ({faq.helpful?.yes || 0})
                                      </button>
                                      <button
                                        onClick={() => handleVote(faq._id, false)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 hover:border-red-300"
                                      >
                                        <ThumbsDown className="w-4 h-4" />
                                        No ({faq.helpful?.no || 0})
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // No Results State
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <HelpCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No FAQs Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery || selectedCategory
                  ? "No FAQs match your search criteria. Try adjusting your search terms or category filter."
                  : "No FAQs are available at the moment. Check back soon for helpful information."
                }
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-orange-200 p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Can't find what you're looking for? Our customer support team is here to help you with any questions or concerns.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </button>
                <button className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-orange-600 text-orange-600 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <ArrowRight className="w-5 h-5" />
                  Request Callback
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;