import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  HelpCircle,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FAQManagement = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    isActive: true,
    keywords: '',
    slug: '',
    order: 0
  });

  // FAQ分类选项 - Updated to match our comprehensive categories
  const categoryOptions = [
    { value: 'general', label: 'General Services', icon: '🏠' },
    { value: 'account', label: 'Account & Registration', icon: '👤' },
    { value: 'agent-program', label: 'Agent Referral Program', icon: '⭐' },
    { value: 'cea-verification', label: 'CEA Verification Process', icon: '🛡️' },
    { value: 'privacy-cookies', label: 'Privacy & Cookies', icon: '🍪' },
    { value: 'payments', label: 'Payments & Billing', icon: '💳' },
    { value: 'technical', label: 'Technical Support', icon: '⚙️' },
    { value: 'contact-support', label: 'Contact & Support', icon: '🎧' }
  ];

  // 获取所有FAQ
  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/cms/faq-file?admin=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFAQs();
    }
  }, [user]);

  // Generate slug from question
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Auto-generate slug when question changes and slug is empty
      if (name === 'question' && (!prev.slug || prev.slug === generateSlug(prev.question))) {
        updated.slug = generateSlug(newValue);
      }
      
      return updated;
    });
  };

  // 提交FAQ（创建或更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const faqData = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        slug: formData.slug || generateSlug(formData.question)
      };

      let url, method;
      
      if (editingFAQ) {
        // Update existing FAQ
        url = `/api/cms/faq-file/${editingFAQ.category}/${editingFAQ.id}`;
        method = 'PUT';
      } else {
        // Create new FAQ
        url = '/api/cms/faq-file';
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(faqData)
      });

      if (response.ok) {
        await fetchFAQs();
        resetForm();
        alert(editingFAQ ? 'FAQ updated successfully!' : 'FAQ created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error saving FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error saving FAQ');
    }
  };

  // 删除FAQ
  const handleDelete = async (faq) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const response = await fetch(`/api/cms/faq-file/${faq.category}/${faq.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchFAQs();
          alert('FAQ deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Error deleting FAQ');
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('Error deleting FAQ');
      }
    }
  };

  // Remove the toggleFAQStatus function since static data doesn't have isActive status

  // 编辑FAQ
  const startEditing = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: true, // Default for static data
      keywords: '', // Static data doesn't have keywords
      slug: faq.id || '',
      order: 0 // Static data doesn't have order
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      isActive: true,
      keywords: '',
      slug: '',
      order: 0
    });
    setEditingFAQ(null);
    setShowForm(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading FAQs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">FAQ Management</h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Efficiently manage frequently asked questions to help your customers find answers quickly and improve support experience
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add FAQ
              </button>
              
              <button
                onClick={fetchFAQs}
                className="flex items-center px-6 py-3 bg-orange-800 bg-opacity-80 text-white rounded-lg hover:bg-orange-900 transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        {/* Enhanced Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-orange-600" />
              Search & Filter FAQs
            </h2>
            <p className="text-sm text-gray-600 mt-1">Find and filter FAQs by category and status</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Questions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQ questions..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="services">Services</option>
                <option value="pricing">Pricing</option>
                <option value="booking">Booking</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* FAQ表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>


            {/* 关键词和排序 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="plumbing, repair, emergency"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order (for sorting)
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Slug field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug * (URL-friendly identifier)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                placeholder="unique-identifier-for-this-faq"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Used for unique identification. Will be auto-generated from question if left empty.</p>
            </div>
            </div>

            {/* 问题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="What is the question customers frequently ask?"
              />
            </div>

            {/* 答案 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer *
              </label>
              <textarea
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Provide a clear and helpful answer..."
              />
            </div>

            {/* 表单按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingFAQ ? 'Update' : 'Create'} FAQ
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

        {/* Enhanced FAQ List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">All FAQs</h2>
                <div className="text-sm text-gray-500">
                  {faqs.length} {faqs.length === 1 ? 'FAQ' : 'FAQs'}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {faqs.length} Total
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Export Button */}
                <button
                  className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
          
            {faqs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <HelpCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Create your first FAQ to help customers find answers to common questions.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                >
                  Create Your First FAQ
                </button>
              </div>
            ) : (
            <div className="space-y-4">
              {/* 按分类分组显示FAQ */}
              {categoryOptions.map(category => {
                const categoryFAQs = faqs.filter(faq => faq.category === category.value);
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category.value} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-orange-600" />
                        {category.label}
                        <span className="ml-2 text-sm font-normal text-gray-500">({categoryFAQs.length})</span>
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {categoryFAQs.map((faq, index) => (
                          <motion.div 
                            key={faq._id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {/* Question */}
                                <div className="flex items-start gap-2 mb-3">
                                  <div className="flex items-center gap-2 flex-1">
                                    <h4 className="font-semibold text-gray-900 text-lg">{faq.question}</h4>
                                  </div>
                                </div>

                                {/* Answer */}
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                  {faq.answer}
                                </p>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() => startEditing(faq)}
                                    className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Edit FAQ"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(faq)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete FAQ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQManagement;