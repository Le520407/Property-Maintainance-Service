import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Upload,
  Video,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OrderSubmissionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const hasShownPrefilledToast = useRef(false);
  const [formData, setFormData] = useState({
    // Service Details
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    isEmergency: false,
    
    // Location
    location: {
      streetAddress: '',
      building: '',
      unit: '',
      city: '',
      state: '',
      zipCode: '',
      address: '', // Keep for backward compatibility
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
    images: [],
    videos: []
  });

  // Handle pre-filled data from service detail page and auto-fill address
  useEffect(() => {
    if (location.state?.prefilledData && !hasShownPrefilledToast.current) {
      const { prefilledData } = location.state;
      
      // Map categories that don't exist in backend to valid ones
      const categoryMapping = {
        'maintenance': 'general', // Map maintenance to general since backend doesn't accept maintenance
      };
      
      const mappedCategory = categoryMapping[prefilledData.category] || prefilledData.category;
      
      setFormData(prev => ({
        ...prev,
        title: prefilledData.title || prev.title,
        category: mappedCategory || prev.category,
        description: prefilledData.description || prev.description,
        estimatedBudget: prefilledData.estimatedBudget?.toString() || prev.estimatedBudget
      }));
      
      // Show success message only once
      toast.success(`Pre-filled with ${prefilledData.title} service details`);
      hasShownPrefilledToast.current = true;
    }

    // Auto-fill address from user profile on component mount
    if (user && user.address) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          streetAddress: user.address || prev.location.streetAddress,
          city: user.city || prev.location.city,
          state: user.state || prev.location.state,
          zipCode: user.zipCode || prev.location.zipCode,
          address: user.address || prev.location.address, // For backward compatibility
        }
      }));
    }
  }, [location.state, user]);

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


  const handleInputChange = (field, value) => {
    // Prevent selecting past dates
    if (field === 'requestedTimeSlot.date') {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < today) {
        toast.error('Cannot select a date in the past. Please choose today or a future date.');
        return;
      }
    }

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

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // File size validation
      const maxSize = type === 'images' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is ${type === 'images' ? '10MB' : '50MB'}.`);
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = {
          file: file,
          preview: event.target.result,
          name: file.name,
          size: file.size
        };

        setFormData(prev => ({
          ...prev,
          [type]: [...prev[type], fileData]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (files.length > 0) {
      toast.success(`${files.length} ${type === 'images' ? 'image(s)' : 'video(s)'} uploaded successfully`);
    }
  };

  const removeFile = (index, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
    toast.success(`${type === 'images' ? 'Image' : 'Video'} removed successfully`);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.location.streetAddress && formData.location.city && formData.location.zipCode;
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
      
      // Generate a unique job number
      const jobNumber = `JOB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const budgetAmount = parseFloat(formData.estimatedBudget);
      
      // Create complete address string for backend compatibility
      const completeAddress = [
        formData.location.unit && `Unit ${formData.location.unit}`,
        formData.location.building,
        formData.location.streetAddress,
        formData.location.zipCode && formData.location.city && `${formData.location.zipCode} ${formData.location.city}`,
        formData.location.state
      ].filter(Boolean).join(', ');

      // Prepare the order data
      const orderData = {
        ...formData,
        customerId: user.id || user._id,
        jobNumber: jobNumber,
        estimatedBudget: budgetAmount,
        subtotal: budgetAmount,
        totalAmount: budgetAmount, // Initial estimate
        location: {
          ...formData.location,
          address: completeAddress || formData.location.streetAddress // Ensure backward compatibility
        },
        items: [{
          serviceName: formData.title,
          category: formData.category,
          description: formData.description,
          quantity: 1,
          unitPrice: budgetAmount,
          totalPrice: budgetAmount
        }]
      };

      const response = await api.jobs.create(orderData);
      
      toast.success('Order submitted successfully! 🎉');
      toast.success('Our admin will review and assign it to the best vendor in your area.');
      
      // Redirect to order tracking or dashboard
      navigate('/dashboard', { 
        state: { 
          message: 'Order submitted successfully!',
          orderId: response.job?._id || response.job?.id
        }
      });
      
    } catch (error) {
      console.error('Order submission error:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to submit order';
      if (error.message.includes('401')) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.message.includes('400')) {
        errorMessage = error.response?.data?.message || 'Invalid request data';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
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
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📝 What to include for {formData.category === 'general' ? 'General Maintenance' : serviceCategories.find(c => c.value === formData.category)?.label || 'your'} services:</h4>
                  <div className="text-sm text-blue-700">
                    {formData.category === 'general' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Please describe the maintenance work needed</li>
                        <li>Type of repair or maintenance required</li>
                        <li>Location and extent of work</li>
                        <li>Current condition or problem</li>
                        <li>Any safety concerns</li>
                        <li>Timeline requirements</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Specific problem or issue you're experiencing</li>
                        <li>When the problem started</li>
                        <li>Location and extent of the issue</li>
                        <li>Any attempted fixes or troubleshooting</li>
                        <li>Safety concerns (if any)</li>
                        <li>Preferred timeline</li>
                      </ul>
                    )}
                  </div>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  placeholder="Professional carpentry and woodwork services with custom solutions, quality materials, and expert craftsmanship for all your woodworking needs."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Photo & Video Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Photos & Videos (Optional)</h3>
                <p className="text-sm text-gray-600">Help us understand the issue better by uploading photos or videos.</p>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="inline w-4 h-4 mr-1" />
                    Photos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'images')}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Photo Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'images')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video className="inline w-4 h-4 mr-1" />
                    Videos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'videos')}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">MP4, WebM, MOV up to 50MB each</p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Video Preview */}
                  {formData.videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {formData.videos.map((video, index) => (
                        <div key={index} className="relative">
                          <video
                            src={video.preview}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'videos')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {video.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where is the service needed?</h2>
              
              {/* Auto-fill notification */}
              {user?.address && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-800">
                      Address auto-filled from your profile!
                    </div>
                    <div className="text-sm text-green-600">
                      We've pre-filled your saved address. You can edit it below if needed, or update your profile address for future orders.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Auto-fill from user profile
                      if (user.address) {
                        handleInputChange('location.streetAddress', user.address);
                        handleInputChange('location.address', user.address); // For backward compatibility
                      }
                      if (user.city) {
                        handleInputChange('location.city', user.city);
                      }
                      if (user.state) {
                        handleInputChange('location.state', user.state);
                      }
                      if (user.zipCode) {
                        handleInputChange('location.zipCode', user.zipCode);
                      }
                      toast.success('Address auto-filled from your profile');
                    }}
                    className="ml-3 text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Manage Profile →
                  </button>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.location.streetAddress}
                    onChange={(e) => handleInputChange('location.streetAddress', e.target.value)}
                    placeholder="e.g., Jalan Permas 16/1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City/Area *
                    </label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleInputChange('location.city', e.target.value)}
                      placeholder="e.g., Masai"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      value={formData.location.state}
                      onChange={(e) => handleInputChange('location.state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select State</option>
                      <option value="Johor">Johor</option>
                      <option value="Kedah">Kedah</option>
                      <option value="Kelantan">Kelantan</option>
                      <option value="Kuala Lumpur">Kuala Lumpur</option>
                      <option value="Labuan">Labuan</option>
                      <option value="Melaka">Melaka</option>
                      <option value="Negeri Sembilan">Negeri Sembilan</option>
                      <option value="Pahang">Pahang</option>
                      <option value="Penang">Penang</option>
                      <option value="Perak">Perak</option>
                      <option value="Perlis">Perlis</option>
                      <option value="Putrajaya">Putrajaya</option>
                      <option value="Sabah">Sabah</option>
                      <option value="Sarawak">Sarawak</option>
                      <option value="Selangor">Selangor</option>
                      <option value="Terengganu">Terengganu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={formData.location.zipCode}
                      onChange={(e) => handleInputChange('location.zipCode', e.target.value)}
                      placeholder="e.g., 81750"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address Preview
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {[
                      formData.location.unit && `Unit ${formData.location.unit}`,
                      formData.location.building,
                      formData.location.streetAddress,
                      formData.location.zipCode && formData.location.city && `${formData.location.zipCode} ${formData.location.city}`,
                      formData.location.state
                    ].filter(Boolean).join(', ') || 'Address will appear here as you fill in the fields above'}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Step 3: Timing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">When do you need this service?</h2>
              
              <div className="space-y-6">
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
                  <p className="mt-1 text-sm text-gray-500">Please select from today onwards to allow proper scheduling</p>
                </div>

                {/* Time Sessions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Time Session
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="timeSession"
                        value="morning"
                        checked={formData.requestedTimeSlot.startTime === '08:00' && formData.requestedTimeSlot.endTime === '12:00'}
                        onChange={() => {
                          handleInputChange('requestedTimeSlot.startTime', '08:00');
                          handleInputChange('requestedTimeSlot.endTime', '12:00');
                        }}
                        className="mr-3 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Morning Session</div>
                        <div className="text-sm text-gray-500">8:00 AM - 12:00 PM</div>
                        <div className="text-sm text-gray-400">Good for most services and appointments</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="timeSession"
                        value="afternoon"
                        checked={formData.requestedTimeSlot.startTime === '12:00' && formData.requestedTimeSlot.endTime === '16:00'}
                        onChange={() => {
                          handleInputChange('requestedTimeSlot.startTime', '12:00');
                          handleInputChange('requestedTimeSlot.endTime', '16:00');
                        }}
                        className="mr-3 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Afternoon Session</div>
                        <div className="text-sm text-gray-500">12:00 PM - 4:00 PM</div>
                        <div className="text-sm text-gray-400">Good for most services and appointments</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="timeSession"
                        value="evening"
                        checked={formData.requestedTimeSlot.startTime === '16:00' && formData.requestedTimeSlot.endTime === '20:00'}
                        onChange={() => {
                          handleInputChange('requestedTimeSlot.startTime', '16:00');
                          handleInputChange('requestedTimeSlot.endTime', '20:00');
                        }}
                        className="mr-3 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Evening Session</div>
                        <div className="text-sm text-gray-500">4:00 PM - 8:00 PM</div>
                        <div className="text-sm text-gray-400">Perfect for after work hours</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="timeSession"
                        value="flexible"
                        checked={formData.requestedTimeSlot.startTime === '09:00' && formData.requestedTimeSlot.endTime === '17:00'}
                        onChange={() => {
                          handleInputChange('requestedTimeSlot.startTime', '09:00');
                          handleInputChange('requestedTimeSlot.endTime', '17:00');
                        }}
                        className="mr-3 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Flexible Timing</div>
                        <div className="text-sm text-gray-500">Any time during business hours</div>
                        <div className="text-sm text-gray-400">Let vendor choose the best time</div>
                      </div>
                    </label>
                  </div>
                </div>
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
                    onChange={(e) => handleFileUpload(e, 'images')}
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
                            onClick={() => removeFile(index, 'images')}
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
                    <div><strong>Description:</strong> {formData.description}</div>
                  </div>
                </div>

                {/* Location Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Location</h3>
                  <div className="text-sm space-y-1">
                    {formData.location.unit && <div><strong>Unit:</strong> {formData.location.unit}</div>}
                    {formData.location.building && <div><strong>Building:</strong> {formData.location.building}</div>}
                    {formData.location.streetAddress && <div><strong>Street:</strong> {formData.location.streetAddress}</div>}
                    <div><strong>Area:</strong> {formData.location.city}, {formData.location.state} {formData.location.zipCode}</div>
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