import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, Gift, 
  Users, Briefcase, Award, Shield, Settings, Copy, Building, FileText,
  Upload, TrendingUp, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const AllInOneRegisterPage = () => {
  const [accountType, setAccountType] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const inviteCode = watch('inviteCode');

  // Set account type based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/vendor-register') {
      setAccountType('vendor');
    } else if (path === '/agent-register') {
      setAccountType('referral');
    } else {
      setAccountType('customer');
    }
  }, [location.pathname]);

  // Handle referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase());
    }
  }, [searchParams, setValue]);

  // Reset code validation when account type changes
  useEffect(() => {
    setCodeValidated(false);
    setValue('inviteCode', '');
  }, [accountType, setValue]);

  // Account type options
  const accountTypes = [
    {
      id: 'customer',
      name: 'Customer',
      description: 'Book services and maintenance',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'vendor',
      name: 'Service Provider',
      description: 'Provide maintenance services',
      icon: Briefcase,
      color: 'green'
    },
    {
      id: 'referral',
      name: 'Property Agent',
      description: 'Earn higher commissions (15%)',
      icon: Award,
      color: 'purple',
      badge: 'Invite Only'
    }
  ];

  // Service categories for vendors
  const serviceCategories = [
    { id: 'home-repairs', name: 'Home Repairs' },
    { id: 'painting-services', name: 'Painting Services' },
    { id: 'electrical-services', name: 'Electrical Services' },
    { id: 'plumbing-services', name: 'Plumbing Services' },
    { id: 'carpentry-services', name: 'Carpentry Services' },
    { id: 'flooring-services', name: 'Flooring Services' },
    { id: 'appliance-installation', name: 'Appliance Installation' },
    { id: 'furniture-assembly', name: 'Furniture Assembly' },
    { id: 'moving-services', name: 'Moving Services' },
    { id: 'renovation', name: 'Renovation' },
    { id: 'safety-security', name: 'Safety and Security' },
    { id: 'cleaning-services', name: 'Cleaning Services' }
  ];

  // Validate invite code for agents
  const validateInviteCode = async (code) => {
    if (!code || code.length < 6) return;
    
    setIsValidatingCode(true);
    try {
      const response = await api.post('/invite-codes/validate', { code });
      if (response.success) {
        setCodeValidated(true);
        toast.success('Valid invite code!');
      }
    } catch (error) {
      setCodeValidated(false);
      toast.error(error.message || 'Invalid invite code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // File upload handler
  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`${fileType} uploaded:`, file.name);
      toast.success('File uploaded successfully');
    }
  };

  const onSubmit = async (data) => {
    // Validate agent invite code
    if (accountType === 'referral' && !codeValidated) {
      toast.error('Please validate your invite code first');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      
      if (accountType === 'customer') {
        const customerData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          address: data.address,
          role: 'customer'
        };
        if (data.referralCode) {
          customerData.referralCode = data.referralCode;
        }
        response = await api.post('/auth/register', customerData);
        
      } else if (accountType === 'vendor') {
        const vendorData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          city: data.serviceArea || 'Singapore',
          country: 'Singapore',
          skills: Array.isArray(data.services) ? data.services : [data.services].filter(Boolean),
          experience: parseInt(data.teamSize?.split('-')[0]) || 0,
          hourlyRate: 0,
          companyName: data.companyName,
          businessLicense: data.businessLicense,
          address: data.address,
          description: data.description
        };
        response = await api.auth.registerTechnician(vendorData);
        
      } else if (accountType === 'referral') {
        const agentData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country,
          inviteCode: data.inviteCode
        };
        response = await api.post('/auth/register-agent', agentData);
      }

      if (response?.data?.token || response?.token) {
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        const messages = {
          customer: 'Customer registration successful! Welcome to Swift Fix Pro',
          vendor: 'Vendor registration successful! Your account is pending approval.',
          referral: 'Agent registration successful! Welcome to Swift Fix Pro'
        };
        
        toast.success(messages[accountType]);
        
        // Navigate to appropriate dashboard
        const dashboards = {
          customer: '/dashboard',
          vendor: '/login',
          referral: '/agent-dashboard'
        };
        
        navigate(dashboards[accountType] || '/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = accountTypes.find(type => type.id === accountType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Choose your account type and join Swift Fix Pro</p>
          </div>

          {/* Account Type Selection - Horizontal Buttons */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accountTypes.map((type) => (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAccountType(type.id)}
                  className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all shadow-md ${
                    accountType === type.id
                      ? `border-${type.color}-500 bg-${type.color}-50 shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full bg-${type.color}-100 flex items-center justify-center mx-auto mb-3`}>
                      <type.icon className={`w-6 h-6 text-${type.color}-600`} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{type.name}</h4>
                      {type.badge && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 ${
                    accountType === type.id
                      ? `bg-${type.color}-600 border-transparent`
                      : 'border-gray-300'
                  }`}>
                    {accountType === type.id && (
                      <CheckCircle className="w-3 h-3 text-white m-0.5" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Agent Benefits Card - Only show for referral type */}
          <AnimatePresence>
            {accountType === 'referral' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-8 shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2" />
                  Agent Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <CheckCircle size={16} className="mr-2 text-green-300" />
                    <span>15% commission on every successful referral</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={16} className="mr-2 text-green-300" />
                    <span>Higher earning potential for property agents</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={16} className="mr-2 text-green-300" />
                    <span>Bronze to Platinum tier progression system</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={16} className="mr-2 text-green-300" />
                    <span>Exclusive agent dashboard and analytics</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <selectedType.icon className={`w-5 h-5 text-${selectedType.color}-600 mr-2`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedType.name} Registration
              </h3>
              {selectedType.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                  {selectedType.badge}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Invite Code for Agents */}
              <AnimatePresence>
                {accountType === 'referral' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield size={16} className="inline mr-1" />
                      Admin Invite Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Gift size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          {...register('inviteCode', {
                            required: 'Invite code is required for agent registration'
                          })}
                          type="text"
                          id="inviteCode"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                            codeValidated 
                              ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                              : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                          }`}
                          placeholder="Enter your invite code"
                          style={{ textTransform: 'uppercase' }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            e.target.value = value;
                            setValue('inviteCode', value);
                            setCodeValidated(false);
                          }}
                        />
                        {codeValidated && (
                          <CheckCircle size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => validateInviteCode(inviteCode)}
                        disabled={isValidatingCode || !inviteCode}
                        className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isValidatingCode ? 'Validating...' : 'Validate'}
                      </button>
                    </div>
                    {errors.inviteCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.inviteCode.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Contact admin to obtain your exclusive agent invite code
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="mr-2" />
                  Basic Information
                </h4>
                
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('firstName', {
                          required: 'First name is required',
                          minLength: {
                            value: 2,
                            message: 'First name must be at least 2 characters'
                          }
                        })}
                        type="text"
                        id="firstName"
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="First name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('lastName', {
                          required: 'Last name is required',
                          minLength: {
                            value: 2,
                            message: 'Last name must be at least 2 characters'
                          }
                        })}
                        type="text"
                        id="lastName"
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('email', {
                          required: 'Email address is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        type="email"
                        id="email"
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[\+]?[1-9][\d]{7,15}$/,
                            message: 'Please enter a valid phone number'
                          }
                        })}
                        type="tel"
                        id="phone"
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      {...register('address', {
                        required: 'Address is required',
                        minLength: {
                          value: 10,
                          message: 'Address must be at least 10 characters'
                        }
                      })}
                      id="address"
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                      placeholder="Enter your address"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                {/* City & Country - Only for non-vendor */}
                {accountType !== 'vendor' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('city', {
                          required: 'City is required'
                        })}
                        type="text"
                        id="city"
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="City"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('country', {
                          required: 'Country is required'
                        })}
                        type="text"
                        id="country"
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Country"
                      />
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Vendor-specific fields */}
              <AnimatePresence>
                {accountType === 'vendor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* Company Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Building className="mr-2" />
                        Company Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...register('companyName', { required: 'Company name is required' })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                            placeholder="Enter company name"
                          />
                          {errors.companyName && (
                            <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business License Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('businessLicense', { required: 'Business license is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                              placeholder="Enter business license number"
                            />
                            {errors.businessLicense && (
                              <p className="text-red-500 text-sm mt-1">{errors.businessLicense.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Establishment Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('establishDate', { required: 'Establishment date is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                            />
                            {errors.establishDate && (
                              <p className="text-red-500 text-sm mt-1">{errors.establishDate.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Description
                          </label>
                          <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                            placeholder="Briefly introduce your company..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FileText className="mr-2" />
                        Service Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Service Categories <span className="text-red-500">*</span> (Select Multiple)
                          </label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {serviceCategories.map((category) => (
                              <label key={category.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  value={category.id}
                                  {...register('services', { required: 'Please select at least one service' })}
                                  className="mr-3 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-lg mr-2">{category.icon}</span>
                                <span className="text-sm">{category.name}</span>
                              </label>
                            ))}
                          </div>
                          {errors.services && (
                            <p className="text-red-500 text-sm mt-1">{errors.services.message}</p>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service Area <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('serviceArea', { required: 'Service area is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                              placeholder="e.g. Singapore, Jurong, etc."
                            />
                            {errors.serviceArea && (
                              <p className="text-red-500 text-sm mt-1">{errors.serviceArea.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Team Size <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register('teamSize', { required: 'Team size is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Select team size</option>
                              <option value="1-5">1-5 people</option>
                              <option value="6-10">6-10 people</option>
                              <option value="11-20">11-20 people</option>
                              <option value="21-50">21-50 people</option>
                              <option value="50+">50+ people</option>
                            </select>
                            {errors.teamSize && (
                              <p className="text-red-500 text-sm mt-1">{errors.teamSize.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Uploads */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Shield className="mr-2" />
                        Certification Documents
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business License Document <span className="text-red-500">*</span>
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="business-license" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Choose File
                              </label>
                              <input
                                id="business-license"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, 'Business License')}
                                className="hidden"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Supports JPG, PNG, PDF. Max size: 10MB
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ID Card (Front and Back) <span className="text-red-500">*</span>
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="id-card" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Choose Files
                              </label>
                              <input
                                id="id-card"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileUpload(e, 'ID Card')}
                                className="hidden"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Please upload front and back photos of your ID card
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Customer Referral Code */}
              <AnimatePresence>
                {accountType === 'customer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <Gift size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('referralCode')}
                        type="text"
                        id="referralCode"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter referral code (optional)"
                        style={{ textTransform: 'uppercase' }}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Have a referral code? Enter it to get special benefits!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Fields */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="mr-2" />
                  Account Security
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters'
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Password must contain uppercase, lowercase letters and numbers'
                          }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: value => value === password || 'Passwords do not match'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-${selectedType.color}-500 focus:ring-${selectedType.color}-500`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    {...register('agreeToTerms', {
                      required: 'You must agree to the terms to continue'
                    })}
                    type="checkbox"
                    id="agreeToTerms"
                    className={`h-4 w-4 text-${selectedType.color}-600 focus:ring-${selectedType.color}-500 border-gray-300 rounded mt-1`}
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className={`text-${selectedType.color}-600 hover:text-${selectedType.color}-700`}>
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className={`text-${selectedType.color}-600 hover:text-${selectedType.color}-700`}>
                      Privacy Policy
                    </Link>
                    {accountType === 'referral' && (
                      <>
                        {' '}and{' '}
                        <Link to="/agent-agreement" className={`text-${selectedType.color}-600 hover:text-${selectedType.color}-700`}>
                          Agent Agreement
                        </Link>
                      </>
                    )}
                    {accountType === 'vendor' && (
                      <>
                        {' '}and{' '}
                        <Link to="/vendor-agreement" className={`text-${selectedType.color}-600 hover:text-${selectedType.color}-700`}>
                          Vendor Service Agreement
                        </Link>
                      </>
                    )}
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (accountType === 'referral' && !codeValidated)}
                className={`w-full text-white py-4 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl ${
                  selectedType.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                  selectedType.color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                  'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating {selectedType.name.toLowerCase()} account...
                  </div>
                ) : (
                  `Create ${selectedType.name} Account`
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
                Sign in now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AllInOneRegisterPage;