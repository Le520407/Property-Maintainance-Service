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
  CheckCircle
} from 'lucide-react';

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
        const response = await fetch('/api/cms/faqs');
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
          setFilteredFaqs(data);
        }
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
      const response = await fetch(`/api/cms/faqs/${faqId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful: isHelpful })
      });

      if (response.ok) {
        const updatedFaq = await response.json();
        
        // 更新本地状态
        setFaqs(prevFaqs => 
          prevFaqs.map(faq => 
            faq._id === faqId ? updatedFaq : faq
          )
        );

        // 标记为已投票
        setVotedFaqs(prev => new Set(prev).add(faqId));
      }
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
      {/* 页面头部 */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <HelpCircle className="w-16 h-16 mx-auto mb-4 text-orange-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                Find answers to common questions about our services, booking process, and more
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 搜索和筛选区域 */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 分类筛选 */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 搜索结果统计 */}
            {(searchQuery || selectedCategory) && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCategory && ` in ${categoryOptions.find(cat => cat.value === selectedCategory)?.label}`}
              </div>
            )}
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
                          {categoryFaqs
                            .sort((a, b) => a.order - b.order)
                            .map((faq) => (
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

      {/* 联系支持区域 */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <MessageSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our customer support team is here to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                Contact Support
              </button>
              <button className="border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-600 hover:text-white transition-colors">
                Request Callback
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;