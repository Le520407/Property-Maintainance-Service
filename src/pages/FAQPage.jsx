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
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [votedFaqs, setVotedFaqs] = useState(new Set()); // 跟踪已投票的FAQ

  // FAQ分类选项
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'services', label: 'Services' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'booking', label: 'Booking' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' }
  ];

  // 获取FAQ数据
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const data = await api.get('/cms/faqs');
        setFaqs(data);
        setFilteredFaqs(data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // 筛选FAQ
  useEffect(() => {
    let filtered = faqs;

    // 按分类筛选
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, selectedCategory, searchQuery]);

  // 展开/折叠FAQ
  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  // 投票功能
  const handleVote = async (faqId, isHelpful) => {
    // 防止重复投票
    if (votedFaqs.has(faqId)) {
      return;
    }

    try {
      const updatedFaq = await api.post(`/cms/faqs/${faqId}/vote`, { helpful: isHelpful });
      
      // 更新本地状态
      setFaqs(prevFaqs => 
        prevFaqs.map(faq => 
          faq._id === faqId ? updatedFaq : faq
        )
      );

      // 标记为已投票
      setVotedFaqs(prev => new Set(prev).add(faqId));
    } catch (error) {
      console.error('Error voting on FAQ:', error);
    }
  };

  // 按分类分组FAQ
  const groupedFaqs = filteredFaqs.reduce((groups, faq) => {
    const category = faq.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(faq);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section - Matching HomePage Style */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-orange-400 rounded-full opacity-10 transform rotate-45"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-30 rounded-full text-orange-100 text-sm font-medium mb-4 backdrop-blur-sm">
                Help & Support
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              Frequently Asked
              <span className="block text-orange-200">Questions</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Find answers to common questions about our services, booking process, pricing, 
              and everything you need to know about Swift Fix Pro.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a
                href="#search"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center text-lg"
              >
                <Search className="mr-2 w-5 h-5" />
                Search FAQs
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors text-lg"
              >
                Contact Support
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Search and Filter Section */}
      <section id="search" className="py-12 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Enhanced Search Box */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Enhanced Category Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-12 pr-8 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white text-lg min-w-[200px]"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Search Results Info */}
              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <div>
                  Showing {filteredFaqs.length} of {faqs.length} questions
                  {searchQuery && <span className="font-medium"> for "{searchQuery}"</span>}
                  {selectedCategory && <span className="font-medium"> in {categoryOptions.find(cat => cat.value === selectedCategory)?.label}</span>}
                </div>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('');
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ内容 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-8">
                {/* 如果没有搜索，按分类显示 */}
                {!searchQuery && !selectedCategory ? (
                  categoryOptions.slice(1).map(category => {
                    const categoryFaqs = groupedFaqs[category.value] || [];
                    if (categoryFaqs.length === 0) return null;

                    return (
                      <motion.div
                        key={category.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        {/* 分类头部 */}
                        <div className="bg-gray-50 px-6 py-4 border-b">
                          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <HelpCircle className="w-5 h-5 mr-2 text-orange-600" />
                            {category.label}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({categoryFaqs.length} question{categoryFaqs.length !== 1 ? 's' : ''})
                            </span>
                          </h2>
                        </div>

                        {/* FAQ列表 */}
                        <div className="divide-y">
                          {categoryFaqs.map((faq) => (
                              <div key={faq._id} className="px-6 py-4">
                                <button
                                  onClick={() => toggleFaq(faq._id)}
                                  className="w-full flex items-center justify-between text-left hover:text-orange-600 transition-colors"
                                >
                                  <h3 className="text-lg font-medium text-gray-900 pr-4">
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
                                      className="mt-4"
                                    >
                                      <div className="prose prose-gray max-w-none">
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                          {faq.answer}
                                        </p>
                                      </div>

                                      {/* 投票和统计 */}
                                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm text-gray-500">Was this helpful?</span>
                                          
                                          {votedFaqs.has(faq._id) ? (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                              <CheckCircle className="w-4 h-4" />
                                              Thanks for your feedback!
                                            </div>
                                          ) : (
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleVote(faq._id, true)}
                                                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                              >
                                                <ThumbsUp className="w-4 h-4" />
                                                Yes ({faq.helpful?.yes || 0})
                                              </button>
                                              <button
                                                onClick={() => handleVote(faq._id, false)}
                                                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                              >
                                                <ThumbsDown className="w-4 h-4" />
                                                No ({faq.helpful?.no || 0})
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        <div className="text-xs text-gray-400">
                                          {faq.views || 0} views
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  // 搜索结果显示
                  <div className="bg-white rounded-lg shadow-md divide-y">
                    {filteredFaqs.map((faq, index) => (
                      <motion.div
                        key={faq._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-6 py-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            {categoryOptions.find(cat => cat.value === faq.category)?.label}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleFaq(faq._id)}
                          className="w-full flex items-center justify-between text-left hover:text-orange-600 transition-colors"
                        >
                          <h3 className="text-lg font-medium text-gray-900 pr-4">
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
                              className="mt-4"
                            >
                              <div className="prose prose-gray max-w-none">
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500">Was this helpful?</span>
                                  
                                  {votedFaqs.has(faq._id) ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Thanks for your feedback!
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleVote(faq._id, true)}
                                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                        Yes ({faq.helpful?.yes || 0})
                                      </button>
                                      <button
                                        onClick={() => handleVote(faq._id, false)}
                                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <ThumbsDown className="w-4 h-4" />
                                        No ({faq.helpful?.no || 0})
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="text-xs text-gray-400">
                                  {faq.views || 0} views
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
              // 无结果状态
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No FAQs Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory
                    ? "No FAQs match your search criteria. Try adjusting your search terms or category filter."
                    : "No FAQs are available at the moment."
                  }
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('');
                    }}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Support Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-orange-500 rotate-45 opacity-30"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-16">
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-6">
                Need More Help?
              </span>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Still Have Questions?
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                Can't find what you're looking for? Our customer support team is here to help you with any questions or concerns.
              </p>
            </div>

            {/* Enhanced CTA Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Get Instant Support</h3>
              <p className="text-orange-100 mb-8 text-lg">
                Our expert team is available 24/7 to assist you with any questions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-300 flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Request Callback
                </button>
              </div>
            </div>

            {/* Additional Support Options */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {[
                {
                  icon: "📧",
                  title: "Email Support",
                  description: "Get detailed help via email",
                  action: "Send Email"
                },
                {
                  icon: "💬",
                  title: "Live Chat",
                  description: "Chat with our support team",
                  action: "Start Chat"
                },
                {
                  icon: "📞",
                  title: "Phone Support",
                  description: "Speak directly with an expert",
                  action: "Call Now"
                }
              ].map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{option.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h4>
                  <p className="text-gray-600 mb-4">{option.description}</p>
                  <button className="text-orange-600 font-medium hover:text-orange-700 transition-colors">
                    {option.action} →
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;