import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle,
  Phone,
  Mail,
  Star,
  Filter,
  Shield,
  Home,
  User,
  CreditCard,
  Settings,
  HeadphonesIcon,
  Cookie
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { faqCategories } from '../data/faqData';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Convert icon strings to JSX components
  const iconMap = useMemo(() => ({
    '🏠': <Home size={24} />,
    '👤': <User size={24} />,
    '⭐': <Star size={24} />,
    '🛡️': <Shield size={24} />,
    '🍪': <Cookie size={24} />,
    '💳': <CreditCard size={24} />,
    '⚙️': <Settings size={24} />,
    '🎧': <HeadphonesIcon size={24} />
  }), []);

  // Process faqCategories to replace icon strings with JSX
  const processedFaqCategories = useMemo(() => 
    faqCategories.map(category => ({
      ...category,
      icon: iconMap[category.icon] || <Home size={24} />
    })), [iconMap]);

  // Use static FAQ categories from faqData.js

  // Get FAQ by ID
  const getFAQById = (categoryId, faqId) => {
    const category = processedFaqCategories.find(cat => cat.id === categoryId);
    if (!category) return null;
    return category.faqs.find(faq => faq.id === faqId);
  };

  // Popular FAQs - first FAQ from each category
  const popularFAQs = useMemo(() => {
    return processedFaqCategories.slice(0, 8).map(category => ({
      categoryId: category.id,
      faqId: category.faqs[0]?.id
    })).filter(item => item.faqId);
  }, [processedFaqCategories]);

  // Handle search
  useEffect(() => {
    const searchFAQs = (searchTerm) => {
      const results = [];
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      processedFaqCategories.forEach(category => {
        category.faqs.forEach(faq => {
          if (
            faq.question.toLowerCase().includes(lowerSearchTerm) ||
            faq.answer.toLowerCase().includes(lowerSearchTerm)
          ) {
            results.push({
              ...faq,
              categoryTitle: category.title,
              categoryId: category.id
            });
          }
        });
      });
      
      return results;
    };

    if (searchTerm.trim()) {
      const results = searchFAQs(searchTerm);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, [searchTerm, processedFaqCategories]);

  const toggleFAQ = (categoryId, faqId) => {
    const faqKey = `${categoryId}-${faqId}`;
    setExpandedFAQ(expandedFAQ === faqKey ? null : faqKey);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about Swift Fix Pro services, agent program, and more
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>

        {/* Category Filter */}
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Filter size={18} className="inline mr-2" />
              All Categories
            </button>
            {processedFaqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                {category.icon}
                <span className="ml-2">{category.title}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Popular FAQs */}
        {!showSearchResults && selectedCategory === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Popular Questions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularFAQs.map((popular, index) => {
                const faq = getFAQById(popular.categoryId, popular.faqId);
                if (!faq) return null;
                
                return (
                  <motion.div
                    key={`${popular.categoryId}-${popular.faqId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedCategory(popular.categoryId);
                      toggleFAQ(popular.categoryId, popular.faqId);
                    }}
                  >
                    <div className="flex items-start">
                      <Star className="text-yellow-500 mr-2 mt-1" size={16} />
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {faq.question}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {showSearchResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 text-lg">No FAQs found for "{searchTerm}"</p>
                  <p className="text-gray-500">Try different keywords or browse categories below</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((faq) => (
                    <motion.div
                      key={`search-${faq.categoryId}-${faq.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl p-6 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {faq.question}
                        </h3>
                        <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                          {faq.categoryTitle}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ Categories */}
        {!showSearchResults && (
          <div className="space-y-8">
            {processedFaqCategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Available</h3>
                <p className="text-gray-600 mb-4">
                  We're working on adding helpful FAQs. Please check back soon or contact our support team.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <MessageCircle size={20} className="mr-2" />
                  Contact Support
                </Link>
              </div>
            ) : (
              processedFaqCategories
                .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                .map((category, categoryIndex) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
                  <div className="flex items-center">
                    <div className="text-white mr-4">
                      {category.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {category.title}
                    </h2>
                    <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                      {category.faqs.length} questions
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => {
                      const faqKey = `${category.id}-${faq.id}`;
                      const isExpanded = expandedFAQ === faqKey;
                      
                      return (
                        <motion.div
                          key={faq.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: faqIndex * 0.05 }}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFAQ(category.id, faq.id)}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-900 pr-4">
                              {faq.question}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="text-orange-600 flex-shrink-0" size={20} />
                            ) : (
                              <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                            )}
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 pt-0 border-t border-gray-100">
                                  <p className="text-gray-700 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
            )}
          </div>
        )}

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Our support team is here to help you 24/7. Get in touch and we'll respond as quickly as possible.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <MessageCircle size={20} className="mr-2" />
              Contact Support
            </Link>
            
            <a
              href="tel:+6561234567"
              className="inline-flex items-center px-6 py-3 bg-orange-700 text-white rounded-lg font-medium hover:bg-orange-800 transition-colors"
            >
              <Phone size={20} className="mr-2" />
              Call Us
            </a>
            
            <a
              href="mailto:support@swiftfixpro.sg"
              className="inline-flex items-center px-6 py-3 bg-orange-700 text-white rounded-lg font-medium hover:bg-orange-800 transition-colors"
            >
              <Mail size={20} className="mr-2" />
              Email Us
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;