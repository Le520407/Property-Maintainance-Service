import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Phone, 
  Mail,
  Camera,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OrderSubmissionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Service Details
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    isEmergency: false,
    
    // Location
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    
    // Timing
    requestedTimeSlot: {
      date: '',
      startTime: '09:00',
      endTime: '17:00'
    },
    estimatedDuration: 2,
    
    // Budget
    estimatedBudget: '',
    
    // Contact & Special Instructions
    customerContactNumber: user?.phone || '',
    specialInstructions: '',
    accessInstructions: '',
    
    // Attachments
    images: []
  });

  const serviceCategories = [
    { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'cleaning', label: 'Cleaning', icon: '🧽' },
    { value: 'gardening', label: 'Gardening', icon: '🌱' },
    { value: 'painting', label: 'Painting', icon: '🎨' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'hvac', label: 'HVAC', icon: '🌡️' },
    { value: 'general', label: 'General Maintenance', icon: '🛠️' }
  ];

  const priorityLevels = [
    { value: 'LOW', label: 'Low Priority', color: 'text-green-600', desc: 'Can wait a few days' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-yellow-600', desc: 'Within this week' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600', desc: 'Within 1-2 days' },
    { value: 'EMERGENCY', label: 'Emergency', color: 'text-red-600', desc: 'Immediate attention needed' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you'd upload these to a cloud service
    // For now, we'll just store the file names
    const imageNames = files.map(file => file.name);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageNames]
    }));
    toast.success(`${files.length} image(s) uploaded successfully`);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.location.address && formData.location.city;
      case 3:
        return formData.requestedTimeSlot.date;
      case 4:
        return formData.estimatedBudget;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit an order');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the order data
      const orderData = {
        ...formData,
        customerId: user._id,
        estimatedBudget: parseFloat(formData.estimatedBudget),
        totalAmount: parseFloat(formData.estimatedBudget), // Initial estimate
        items: [{
          serviceName: formData.title,
          category: formData.category,
          description: formData.description,
          quantity: 1,
          unitPrice: parseFloat(formData.estimatedBudget),
          totalPrice: parseFloat(formData.estimatedBudget)
        }]
      };

      const response = await api.post('/jobs', orderData);
      
      toast.success('Order submitted successfully! 🎉');
      toast.success('Our admin will review and assign it to the best vendor in your area.');
      
      // Redirect to order tracking or dashboard
      navigate('/dashboard', { 
        state: { 
          message: 'Order submitted successfully!',
          orderId: response.data._id 
        }
      });
      
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Service Details', icon: FileText },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Timing', icon: Calendar },
    { number: 4, title: 'Budget', icon: DollarSign },
    { number: 5, title: 'Review & Submit', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Submit Service Request</h1>
          <p className="text-lg text-gray-600">Tell us what you need, and we'll connect you with the best professionals</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-orange-500 border-orange-500 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className={`mt-2 text-sm ${
                    isActive ? 'text-orange-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-full h-0.5 mt-5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} style={{ position: 'absolute', left: '50%', width: 'calc(100% - 40px)', zIndex: -1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          {/* Step 1: Service Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What service do you need?</h2>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Fix leaking kitchen faucet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {serviceCategories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => handleInputChange('category', category.value)}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        formData.category === category.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-sm font-medium">{category.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="Describe the problem or work needed in detail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="space-y-2">
                  {priorityLevels.map((priority) => (
                    <label key={priority.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="mr-3 text-orange-600"
                      />
                      <div>
                        <div className={`font-medium ${priority.color}`}>{priority.label}</div>
                        <div className="text-sm text-gray-500">{priority.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emergency checkbox */}
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.isEmergency}
                  onChange={(e) => handleInputChange('isEmergency', e.target.checked)}
                  className="mr-3 text-red-600"
                />
                <div>
                  <div className="font-medium text-red-800">Emergency Service</div>
                  <div className="text-sm text-red-600">Check if this requires immediate attention (24/7)</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where is the service needed?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    placeholder="Street address, building name, unit number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Region
                  </label>
                  <input
                    type="text"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    placeholder="State or Region"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.location.zipCode}
                    onChange={(e) => handleInputChange('location.zipCode', e.target.value)}
                    placeholder="Postal code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Access Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Instructions
                </label>
                <textarea
                  value={formData.accessInstructions}
                  onChange={(e) => handleInputChange('accessInstructions', e.target.value)}
                  rows={3}
                  placeholder="How can the vendor access the location? (e.g., gate code, parking instructions, etc.)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Timing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">When do you need this service?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={formData.requestedTimeSlot.date}
                    onChange={(e) => handleInputChange('requestedTimeSlot.date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.requestedTimeSlot.startTime}
                    onChange={(e) => handleInputChange('requestedTimeSlot.startTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.requestedTimeSlot.endTime}
                    onChange={(e) => handleInputChange('requestedTimeSlot.endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (hours)
                </label>
                <select
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={8}>Full day (8 hours)</option>
                  <option value={16}>Multiple days</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <strong>Note:</strong> These are your preferred times. The vendor will contact you to confirm the final schedule after assignment.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What's your budget estimate?</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget (SGD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => handleInputChange('estimatedBudget', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  This is just an estimate. The vendor will provide an exact quote after reviewing your requirements.
                </p>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.customerContactNumber}
                  onChange={(e) => handleInputChange('customerContactNumber', e.target.value)}
                  placeholder="Phone number for vendor to contact you"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  rows={4}
                  placeholder="Any specific requirements, preferences, or important details the vendor should know..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-lg font-medium text-gray-700">Upload Photos</div>
                    <div className="text-sm text-gray-500">Help vendors understand your needs better</div>
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                    <div className="space-y-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{image}</span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Review Your Request</h2>
              
              <div className="space-y-6">
                {/* Service Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {formData.title}</div>
                    <div><strong>Category:</strong> {serviceCategories.find(c => c.value === formData.category)?.label}</div>
                    <div><strong>Priority:</strong> {priorityLevels.find(p => p.value === formData.priority)?.label}</div>
                    <div><strong>Description:</strong> {formData.description}</div>
                  </div>
                </div>

                {/* Location Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="text-sm">
                    <div>{formData.location.address}</div>
                    <div>{formData.location.city}, {formData.location.state} {formData.location.zipCode}</div>
                  </div>
                </div>

                {/* Timing Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Preferred Schedule</h3>
                  <div className="text-sm">
                    <div><strong>Date:</strong> {formData.requestedTimeSlot.date}</div>
                    <div><strong>Time:</strong> {formData.requestedTimeSlot.startTime} - {formData.requestedTimeSlot.endTime}</div>
                    <div><strong>Duration:</strong> {formData.estimatedDuration} hours</div>
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Budget Estimate</h3>
                  <div className="text-lg font-semibold text-orange-600">
                    ${parseFloat(formData.estimatedBudget || 0).toFixed(2)} SGD
                  </div>
                </div>

                {/* What happens next */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Our admin will review your request within 2 hours</li>
                    <li>We'll assign the best-rated vendor in your area</li>
                    <li>The vendor will contact you directly to discuss details</li>
                    <li>You'll receive a detailed quote for approval</li>
                    <li>Once approved, you can pay securely through our platform</li>
                    <li>Work begins as scheduled!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSubmissionPage;