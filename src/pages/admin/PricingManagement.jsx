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
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Tag,
  TrendingUp,
  Calendar,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PricingManagement = () => {
  const { user } = useAuth();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'SGD',
    billingPeriod: 'hour',
    category: 'plumbing',
    features: [{ name: '', included: true, description: '' }],
    isPopular: false,
    isActive: true,
    order: 0,
    priceRange: { min: '', max: '' },
    inclusions: [''],
    exclusions: [''],
    discount: { percentage: '', validUntil: '', description: '' }
  });

  // 货币选项
  const currencyOptions = [
    { value: 'SGD', label: 'SGD' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' }
  ];

  // 计费周期选项
  const billingPeriodOptions = [
    { value: 'hour', label: 'Per Hour' },
    { value: 'day', label: 'Per Day' },
    { value: 'week', label: 'Per Week' },
    { value: 'month', label: 'Per Month' },
    { value: 'year', label: 'Per Year' },
    { value: 'one-time', label: 'One-time' }
  ];

  // 分类选项
  const categoryOptions = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'subscription', label: 'Subscription' }
  ];

  // 获取所有价格方案
  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/cms/pricing?admin=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPricingPlans(data);
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPricingPlans();
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

  // 处理嵌套对象输入
  const handleNestedInputChange = (field, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value
      }
    }));
  };

  // 处理功能列表
  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...formData.features];
    if (field === 'included') {
      updatedFeatures[index][field] = value;
    } else {
      updatedFeatures[index][field] = value;
    }
    setFormData(prev => ({ ...prev, features: updatedFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', included: true, description: '' }]
    }));
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    }
  };

  // 处理包含/排除项目列表
  const handleArrayChange = (field, index, value) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // 提交价格方案（创建或更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pricingData = {
        ...formData,
        price: parseFloat(formData.price),
        priceRange: {
          min: formData.priceRange.min ? parseFloat(formData.priceRange.min) : undefined,
          max: formData.priceRange.max ? parseFloat(formData.priceRange.max) : undefined
        },
        inclusions: formData.inclusions.filter(item => item.trim()),
        exclusions: formData.exclusions.filter(item => item.trim()),
        discount: {
          percentage: formData.discount.percentage ? parseFloat(formData.discount.percentage) : undefined,
          validUntil: formData.discount.validUntil || undefined,
          description: formData.discount.description || undefined
        }
      };

      const url = editingPlan 
        ? `/api/cms/pricing/${editingPlan._id}`
        : '/api/cms/pricing';
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(pricingData)
      });

      if (response.ok) {
        await fetchPricingPlans();
        resetForm();
        alert(editingPlan ? 'Pricing plan updated successfully!' : 'Pricing plan created successfully!');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      alert('Error saving pricing plan');
    }
  };

  // 删除价格方案
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing plan?')) {
      try {
        const response = await fetch(`/api/cms/pricing/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchPricingPlans();
          alert('Pricing plan deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting pricing plan:', error);
        alert('Error deleting pricing plan');
      }
    }
  };

  // 切换价格方案状态
  const togglePlanStatus = async (plan) => {
    try {
      const response = await fetch(`/api/cms/pricing/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...plan, isActive: !plan.isActive })
      });

      if (response.ok) {
        await fetchPricingPlans();
      }
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };

  // 切换热门状态
  const togglePopularStatus = async (plan) => {
    try {
      const response = await fetch(`/api/cms/pricing/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...plan, isPopular: !plan.isPopular })
      });

      if (response.ok) {
        await fetchPricingPlans();
      }
    } catch (error) {
      console.error('Error updating popular status:', error);
    }
  };

  // 编辑价格方案
  const startEditing = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      category: plan.category,
      features: plan.features.length > 0 ? plan.features : [{ name: '', included: true, description: '' }],
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      order: plan.order,
      priceRange: {
        min: plan.priceRange?.min?.toString() || '',
        max: plan.priceRange?.max?.toString() || ''
      },
      inclusions: plan.inclusions.length > 0 ? plan.inclusions : [''],
      exclusions: plan.exclusions.length > 0 ? plan.exclusions : [''],
      discount: {
        percentage: plan.discount?.percentage?.toString() || '',
        validUntil: plan.discount?.validUntil ? new Date(plan.discount.validUntil).toISOString().split('T')[0] : '',
        description: plan.discount?.description || ''
      }
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'SGD',
      billingPeriod: 'hour',
      category: 'plumbing',
      features: [{ name: '', included: true, description: '' }],
      isPopular: false,
      isActive: true,
      order: 0,
      priceRange: { min: '', max: '' },
      inclusions: [''],
      exclusions: [''],
      discount: { percentage: '', validUntil: '', description: '' }
    });
    setEditingPlan(null);
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
    return <div className="text-center py-8">Loading pricing plans...</div>;
  }

  return (
    <div className="pt-24 space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing Plan
        </button>
      </div>

      {/* 价格方案表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 max-h-screen overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-3">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* 方案名称 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Basic Plumbing Service"
                  />
                </div>

                {/* 描述 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this pricing plan includes..."
                  />
                </div>

                {/* 价格 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 货币 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 计费周期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Period *
                  </label>
                  <select
                    name="billingPeriod"
                    value={formData.billingPeriod}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {billingPeriodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
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

                {/* 价格范围 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range Min
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceRange.min}
                    onChange={(e) => handleNestedInputChange('priceRange', 'min', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range Max
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceRange.max}
                    onChange={(e) => handleNestedInputChange('priceRange', 'max', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 功能特性 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-3">Features</h3>
              {formData.features.map((feature, index) => (
                <div key={index} className="grid md:grid-cols-5 gap-2 items-end mb-2">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                      placeholder="Feature name"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={feature.description}
                      onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={feature.included}
                        onChange={(e) => handleFeatureChange(index, 'included', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-sm">Included</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Feature
              </button>
            </div>

            {/* 包含项目 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-3">Inclusions</h3>
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={inclusion}
                    onChange={(e) => handleArrayChange('inclusions', index, e.target.value)}
                    placeholder="What's included"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('inclusions', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('inclusions')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Inclusion
              </button>
            </div>

            {/* 不包含项目 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-3">Exclusions</h3>
              {formData.exclusions.map((exclusion, index) => (
                <div key={index} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={exclusion}
                    onChange={(e) => handleArrayChange('exclusions', index, e.target.value)}
                    placeholder="What's not included"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('exclusions', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('exclusions')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Exclusion
              </button>
            </div>

            {/* 折扣信息 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-3">Discount (Optional)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount.percentage}
                    onChange={(e) => handleNestedInputChange('discount', 'percentage', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.discount.validUntil}
                    onChange={(e) => handleNestedInputChange('discount', 'validUntil', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.discount.description}
                    onChange={(e) => handleNestedInputChange('discount', 'description', e.target.value)}
                    placeholder="e.g., Early bird special"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 状态选项 */}
            <div className="flex gap-6">
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
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Mark as popular
                </label>
              </div>
            </div>

            {/* 表单按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPlan ? 'Update' : 'Create'} Pricing Plan
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

      {/* 价格方案列表 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">All Pricing Plans</h2>
          
          {pricingPlans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pricing plans found. Create your first pricing plan!</p>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pricingPlans
                .sort((a, b) => a.order - b.order)
                .map((plan) => (
                  <div key={plan._id} className="border rounded-lg p-4 relative">
                    {/* 热门标签 */}
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-4">
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </span>
                      </div>
                    )}

                    {/* 状态指示器 */}
                    {!plan.isActive && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Inactive
                        </span>
                      </div>
                    )}

                    {/* 方案头部 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {categoryOptions.find(cat => cat.value === plan.category)?.label}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      
                      {/* 价格 */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-orange-600">
                          {plan.currency} {plan.price}
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingPeriodOptions.find(bp => bp.value === plan.billingPeriod)?.label}
                        </span>
                      </div>

                      {/* 价格范围 */}
                      {(plan.priceRange?.min || plan.priceRange?.max) && (
                        <div className="text-sm text-gray-500 mt-1">
                          Range: {plan.currency} {plan.priceRange.min || '0'} - {plan.currency} {plan.priceRange.max || '∞'}
                        </div>
                      )}

                      {/* 折扣信息 */}
                      {plan.discount?.percentage && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center text-green-800">
                            <Tag className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">
                              {plan.discount.percentage}% OFF
                            </span>
                          </div>
                          {plan.discount.description && (
                            <p className="text-xs text-green-600 mt-1">{plan.discount.description}</p>
                          )}
                          {plan.discount.validUntil && (
                            <p className="text-xs text-green-600 flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              Until {new Date(plan.discount.validUntil).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 功能列表 */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-sm">Features:</h4>
                        <ul className="space-y-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center text-xs">
                              {feature.included ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-2" />
                              )}
                              <span className={feature.included ? '' : 'line-through text-gray-500'}>
                                {feature.name}
                              </span>
                            </li>
                          ))}
                          {plan.features.length > 3 && (
                            <li className="text-xs text-gray-500">
                              +{plan.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePlanStatus(plan)}
                          className={`p-1 rounded ${plan.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                          title="Toggle Active Status"
                        >
                          {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => togglePopularStatus(plan)}
                          className={`p-1 rounded ${plan.isPopular ? 'text-orange-500 hover:text-orange-700' : 'text-gray-400 hover:text-orange-500'}`}
                          title="Toggle Popular Status"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(plan)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;