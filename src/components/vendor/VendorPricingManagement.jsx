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

const VendorPricingManagement = () => {
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

  // Currency options
  const currencyOptions = [
    { value: 'SGD', label: 'SGD' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' }
  ];

  // Billing period options
  const billingPeriodOptions = [
    { value: 'hour', label: 'Per Hour' },
    { value: 'day', label: 'Per Day' },
    { value: 'week', label: 'Per Week' },
    { value: 'month', label: 'Per Month' },
    { value: 'year', label: 'Per Year' },
    { value: 'one-time', label: 'One-time' }
  ];

  // Category options - these should match vendor's service categories
  const categoryOptions = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'aircon', label: 'Air Conditioning' },
    { value: 'painting', label: 'Painting' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'locksmith', label: 'Locksmith' },
    { value: 'appliance', label: 'Appliance Repair' }
  ];

  // Fetch vendor's pricing plans
  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/vendor/pricing', {
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
    if (user?.role === 'vendor') {
      fetchPricingPlans();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle nested object input changes
  const handleNestedInputChange = (field, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value
      }
    }));
  };

  // Handle features list
  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index][field] = value;
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

  // Handle array changes (inclusions/exclusions)
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

  // Submit pricing plan (create or update)
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
        ? `/api/vendor/pricing/${editingPlan._id}`
        : '/api/vendor/pricing';
      
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
        alert(editingPlan ? 'Service pricing updated successfully!' : 'Service pricing created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error saving service pricing');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      alert('Error saving service pricing');
    }
  };

  // Delete pricing plan
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service pricing?')) {
      try {
        const response = await fetch(`/api/vendor/pricing/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchPricingPlans();
          alert('Service pricing deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting pricing plan:', error);
        alert('Error deleting service pricing');
      }
    }
  };

  // Toggle pricing plan status
  const togglePlanStatus = async (plan) => {
    try {
      const response = await fetch(`/api/vendor/pricing/${plan._id}`, {
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

  // Edit pricing plan
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

  // Reset form
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

  if (user?.role !== 'vendor') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Vendor privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading your service pricing...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Service Pricing</h2>
          <p className="text-gray-600">Manage your service rates and packages</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service Pricing
        </button>
      </div>

      {/* Pricing plan form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 max-h-screen overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {editingPlan ? 'Edit Service Pricing' : 'Add New Service Pricing'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic information */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium mb-3">Basic Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Service name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Basic Plumbing Service"
                  />
                </div>

                {/* Description */}
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe what this service includes..."
                  />
                </div>

                {/* Price */}
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Period *
                  </label>
                  <select
                    name="billingPeriod"
                    value={formData.billingPeriod}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {billingPeriodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium mb-3">What's Included</h4>
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={inclusion}
                    onChange={(e) => handleArrayChange('inclusions', index, e.target.value)}
                    placeholder="What's included in this service"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="text-orange-600 hover:text-orange-800 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Inclusion
              </button>
            </div>

            {/* What's NOT included */}
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium mb-3">What's NOT Included</h4>
              {formData.exclusions.map((exclusion, index) => (
                <div key={index} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={exclusion}
                    onChange={(e) => handleArrayChange('exclusions', index, e.target.value)}
                    placeholder="What's not included"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="text-orange-600 hover:text-orange-800 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Exclusion
              </button>
            </div>

            {/* Status options */}
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            {/* Form buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPlan ? 'Update' : 'Create'} Service Pricing
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

      {/* Pricing plans list */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Your Service Pricing</h3>
          
          {pricingPlans.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No service pricing found. Create your first service pricing to get started!</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pricingPlans
                .sort((a, b) => a.order - b.order)
                .map((plan) => (
                  <div key={plan._id} className="border rounded-lg p-4 relative">
                    {/* Status indicator */}
                    {!plan.isActive && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Inactive
                        </span>
                      </div>
                    )}

                    {/* Plan header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold">{plan.name}</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                          {categoryOptions.find(cat => cat.value === plan.category)?.label}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-orange-600">
                          {plan.currency} {plan.price}
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingPeriodOptions.find(bp => bp.value === plan.billingPeriod)?.label}
                        </span>
                      </div>
                    </div>

                    {/* Inclusions */}
                    {plan.inclusions && plan.inclusions.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 text-sm">Includes:</h5>
                        <ul className="space-y-1">
                          {plan.inclusions.slice(0, 3).map((inclusion, index) => (
                            <li key={index} className="flex items-center text-xs">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                              <span>{inclusion}</span>
                            </li>
                          ))}
                          {plan.inclusions.length > 3 && (
                            <li className="text-xs text-gray-500">
                              +{plan.inclusions.length - 3} more items
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePlanStatus(plan)}
                          className={`p-1 rounded ${plan.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                          title="Toggle Active Status"
                        >
                          {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(plan)}
                          className="p-1 text-orange-600 hover:text-orange-800"
                          title="Edit Pricing"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Pricing"
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

export default VendorPricingManagement;