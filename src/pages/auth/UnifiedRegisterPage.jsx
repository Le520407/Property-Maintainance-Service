import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, Gift, 
  Users, Briefcase, Award, Shield
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const UnifiedRegisterPage = () => {
  const [accountType, setAccountType] = useState('customer'); // Always customer for this page
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [searchParams] = useSearchParams();
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'vendor',
      name: 'Service Provider',
      description: 'Provide maintenance services',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'referral',
      name: 'Property Agent',
      description: 'Earn higher commissions (15%)',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      badge: 'Invite Only'
    }
  ];

  // Customer steps definition
  const customerSteps = [
    { number: 1, title: 'Personal Information' },
    { number: 2, title: 'Contact Details' },
    { number: 3, title: 'Account Security' }
  ];

  // Step navigation functions
  const nextStep = () => {
    const maxSteps = accountType === 'customer' ? 3 : 1;
    if (currentStep < maxSteps) {
      // Basic validation for each customer step
      if (accountType === 'customer') {
        const currentStepData = watch();
        
        if (currentStep === 1) {
          if (!currentStepData.firstName || !currentStepData.lastName) {
            toast.error('Please fill in all required fields in this step');
            return;
          }
        }
        
        if (currentStep === 2) {
          if (!currentStepData.email || !currentStepData.phone || !currentStepData.address) {
            toast.error('Please fill in all required contact details');
            return;
          }
        }
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset form and step when account type changes
  useEffect(() => {
    reset();
    setCurrentStep(1);
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase());
    }
  }, [accountType, reset, setValue, searchParams]);

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

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        role: 'customer'
      };

      if (data.referralCode) {
        payload.referralCode = data.referralCode;
      }

      const response = await api.post('/auth/register', payload);

      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        const messages = {
          customer: 'Registration successful! Welcome to Swift Fix Pro',
          vendor: 'Vendor application submitted! Account pending approval.',
          referral: 'Agent registration successful! Welcome to Swift Fix Pro'
        };
        
        toast.success(messages[accountType]);
        
        // Navigate to appropriate dashboard
        const dashboards = {
          customer: '/dashboard',
          vendor: '/vendor-dashboard',
          referral: '/dashboard'
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Customer Registration
            </h1>
            <p className="text-gray-600">
              Join Swift Fix Pro to book quality maintenance services
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {customerSteps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number 
                      ? 'bg-orange-600 border-orange-600 text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span className="text-sm font-medium">{step.number}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < customerSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-orange-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <User className="mr-2" />
                    Personal Information
                  </h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            {...register('firstName', { required: 'First name is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter your first name"
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            {...register('lastName', { required: 'Last name is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter your last name"
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Referral Code */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referral Code (Optional)
                        </label>
                        <input
                          {...register('referralCode')}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter referral code (optional)"
                          style={{ textTransform: 'uppercase' }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Have a referral code? Enter it to get special benefits!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Contact Details */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-6 flex items-center">
                        <Phone className="mr-2" />
                        Contact Details
                      </h2>
                      
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              {...register('email', { 
                                required: 'Email is required',
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Invalid email address'
                                }
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Enter your email address"
                            />
                            {errors.email && (
                              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              {...register('phone', { required: 'Phone number is required' })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Enter your phone number"
                            />
                            {errors.phone && (
                              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <textarea
                            {...register('address', { required: 'Address is required' })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            placeholder="Enter your detailed address"
                          />
                          {errors.address && (
                            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Account Security */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-semibold mb-6 flex items-center">
                        <Shield className="mr-2" />
                        Account Security
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              {...register('password', { 
                                required: 'Password is required',
                                minLength: {
                                  value: 6,
                                  message: 'Password must be at least 6 characters'
                                }
                              })}
                              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Create a strong password"
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
                            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              {...register('confirmPassword', { 
                                required: 'Please confirm your password',
                                validate: value => value === password || 'Passwords do not match'
                              })}
                              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                          )}
                        </div>

                        {/* Terms & Agreement */}
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            {...register('agreeToTerms', { required: 'Please agree to the terms of service' })}
                            className="mt-1 mr-3"
                          />
                          <label className="text-sm text-gray-600">
                            I have read and agree to the{' '}
                            <Link to="/terms" className="text-orange-600 hover:underline">Terms of Service</Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>
                          </label>
                        </div>
                        {errors.agreeToTerms && (
                          <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
              {/* Invite Code for Agents */}
              {accountType === 'referral' && (
                <div>
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
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-1 ${
                          codeValidated 
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
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
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isValidatingCode ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                  {errors.inviteCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.inviteCode.message}</p>
                  )}
                </div>
              )}

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('firstName', {
                        required: 'First name is required'
                      })}
                      type="text"
                      id="firstName"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                        required: 'Last name is required'
                      })}
                      type="text"
                      id="lastName"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('phone', {
                      required: 'Phone number is required'
                    })}
                    type="tel"
                    id="phone"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('address', {
                      required: 'Address is required'
                    })}
                    type="text"
                    id="address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter your address"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Country"
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>

              {/* Vendor-specific fields */}
              {accountType === 'vendor' && (
                <>
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                      Skills (comma-separated)
                    </label>
                    <input
                      {...register('skills')}
                      type="text"
                      id="skills"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="e.g., Plumbing, Electrical, HVAC"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (years)
                      </label>
                      <input
                        {...register('experience')}
                        type="number"
                        id="experience"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate ($)
                      </label>
                      <input
                        {...register('hourlyRate')}
                        type="number"
                        id="hourlyRate"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Referral Code for Customers */}
              {accountType === 'customer' && (
                <div>
                  <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <Gift size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('referralCode')}
                      type="text"
                      id="referralCode"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Enter referral code (optional)"
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
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
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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

              {/* Confirm Password */}
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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms to continue'
                  })}
                  type="checkbox"
                  id="agreeToTerms"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-orange-600 hover:text-orange-700">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-orange-600 hover:text-orange-700">
                    Privacy Policy
                  </Link>
                  {accountType === 'referral' && (
                    <>
                      {' '}and{' '}
                      <Link to="/agent-agreement" className="text-orange-600 hover:text-orange-700">
                        Agent Agreement
                      </Link>
                    </>
                  )}
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit Button for Non-Customers */}
              <button
                type="submit"
                disabled={isLoading || (accountType === 'referral' && !codeValidated)}
                className={`w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  selectedType.color.includes('blue') ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                  selectedType.color.includes('green') ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                  'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                }`}
              >
                {isLoading ? `Creating ${selectedType.name.toLowerCase()} account...` : `Create ${selectedType.name} Account`}
              </button>
                </>
              )}

              {/* Customer Multi-Step Navigation */}
              {accountType === 'customer' && (
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {currentStep < customerSteps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Account...
                        </>
                      ) : (
                        'Create Customer Account'
                      )}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign in now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UnifiedRegisterPage;