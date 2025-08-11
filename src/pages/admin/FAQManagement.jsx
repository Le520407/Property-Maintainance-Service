import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Search,
  ArrowUp,
  ArrowDown
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
    order: 0,
    keywords: ''
  });

  // FAQ分类选项
  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'services', label: 'Services' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'booking', label: 'Booking' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' }
  ];

  // 获取所有FAQ
  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/cms/faqs?admin=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFaqs(data);
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

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 提交FAQ（创建或更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const faqData = {
        ...formData,
        keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
      };

      const url = editingFAQ 
        ? `/api/cms/faqs/${editingFAQ._id}`
        : '/api/cms/faqs';
      
      const method = editingFAQ ? 'PUT' : 'POST';
      
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
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error saving FAQ');
    }
  };

  // 删除FAQ
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const response = await fetch(`/api/cms/faqs/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchFAQs();
          alert('FAQ deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('Error deleting FAQ');
      }
    }
  };

  // 切换FAQ状态
  const toggleFAQStatus = async (faq) => {
    try {
      const response = await fetch(`/api/cms/faqs/${faq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...faq, isActive: !faq.isActive })
      });

      if (response.ok) {
        await fetchFAQs();
      }
    } catch (error) {
      console.error('Error updating FAQ status:', error);
    }
  };

  // 更新FAQ顺序
  const updateOrder = async (faq, newOrder) => {
    try {
      const response = await fetch(`/api/cms/faqs/${faq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...faq, order: newOrder })
      });

      if (response.ok) {
        await fetchFAQs();
      }
    } catch (error) {
      console.error('Error updating FAQ order:', error);
    }
  };

  // 编辑FAQ
  const startEditing = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
      order: faq.order,
      keywords: faq.keywords.join(', ')
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
      order: 0,
      keywords: ''
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
    <div className="pt-24 space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </button>
      </div>

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
            <div className="grid md:grid-cols-2 gap-4">
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 关键词 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="plumbing, repair, emergency"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a clear and helpful answer..."
              />
            </div>

            {/* 激活状态 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>

            {/* 表单按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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

      {/* FAQ列表 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">All FAQs</h2>
          
          {faqs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No FAQs found. Create your first FAQ!</p>
          ) : (
            <div className="space-y-4">
              {/* 按分类分组显示FAQ */}
              {categoryOptions.map(category => {
                const categoryFAQs = faqs.filter(faq => faq.category === category.value);
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category.value} className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                      {category.label} ({categoryFAQs.length})
                    </h3>
                    
                    <div className="space-y-3">
                      {categoryFAQs
                        .sort((a, b) => a.order - b.order)
                        .map((faq) => (
                          <div key={faq._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {/* 问题 */}
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <h4 className="font-medium text-gray-900">{faq.question}</h4>
                                    {!faq.isActive && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 排序控制 */}
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => updateOrder(faq, faq.order - 1)}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs text-gray-500 px-1">{faq.order}</span>
                                    <button
                                      onClick={() => updateOrder(faq, faq.order + 1)}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* 答案 */}
                                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                                  {faq.answer}
                                </p>

                                {/* 关键词和统计 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* 关键词 */}
                                    {faq.keywords && faq.keywords.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-gray-400" />
                                        <div className="flex gap-1">
                                          {faq.keywords.slice(0, 3).map((keyword, index) => (
                                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                              {keyword}
                                            </span>
                                          ))}
                                          {faq.keywords.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                              +{faq.keywords.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* 统计信息 */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {faq.views || 0}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <ThumbsUp className="w-3 h-3 text-green-600" />
                                        {faq.helpful?.yes || 0}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <ThumbsDown className="w-3 h-3 text-red-600" />
                                        {faq.helpful?.no || 0}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 操作按钮 */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleFAQStatus(faq)}
                                      className={`${faq.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                                      title="Toggle Active Status"
                                    >
                                      {faq.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => startEditing(faq)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit FAQ"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(faq._id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete FAQ"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
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
  );
};

export default FAQManagement;