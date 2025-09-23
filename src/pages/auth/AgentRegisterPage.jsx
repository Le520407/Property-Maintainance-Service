import { Award, CheckCircle, Eye, EyeOff, Lock, Mail, Shield, TrendingUp, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const AgentRegisterPage = ({ embedded = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm();
  
  const password = watch('password');
  const ceaRegistrationNumber = watch('ceaRegistrationNumber');

  const agentSteps = [
    { number: 1, title: "CEA Registration", icon: Shield },
    { number: 2, title: "Personal Info", icon: User },
    { number: 3, title: "Contact Details", icon: Mail },
    { number: 4, title: "Account Security", icon: Lock }
  ];

  // Validate CEA registration number
  const validateCEARegistration = async (ceaNumber) => {
    if (!ceaNumber || ceaNumber.length < 6) return;
    
    setIsValidatingCode(true);
    try {
      const response = await api.post('/auth/validate-cea', { 
        ceaRegistrationNumber: ceaNumber.toUpperCase() 
      });
      
      if (response.valid) {
        setCodeValidated(true);
        toast.success('Valid CEA registration number!');
      } else {
        throw new Error(response.message || 'Invalid CEA registration number');
      }
    } catch (error) {
      setCodeValidated(false);
      toast.error(error.message || 'Invalid or already registered CEA number');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (currentStep === 1) {
      if (!codeValidated) {
        toast.error('Please validate your CEA registration number first');
        return;
      }
      fieldsToValidate = ['ceaRegistrationNumber', 'ceaExpiryDate'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['firstName', 'lastName'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['email', 'phone'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      toast.success(`Step ${currentStep} completed!`);
    } else {
      toast.error('Please fill in all required fields correctly');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data) => {
    if (!codeValidated) {
      toast.error('Please validate your CEA registration number first');
      return;
    }

    if (!data.ceaRegistrationNumber) {
      toast.error('CEA registration number is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register-agent', {
        ...data,
        role: 'referral'
      });

      if (response.token) {
        toast.success('Agent registration successful! Please verify your email.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 py-12"}>
      <div className={embedded ? "" : "container mx-auto px-4"}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={embedded ? "" : "max-w-4xl mx-auto"}
        >
          {/* Header */}
          <div className="text-center mb-8">
          </div>

          {/* Agent Benefits Section */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp size={24} className="mr-2" />
                  Agent Benefits
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>15% commission on every successful referral</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Higher earning potential for property agents</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Bronze to Platinum tier progression system</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Exclusive agent dashboard and analytics</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <Award size={48} className="mx-auto mb-2 text-orange-200" />
                      <p className="text-sm text-orange-100">Grow Your Network</p>
                      <p className="text-xs text-orange-200">earn more commissions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {agentSteps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      currentStep >= step.number 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle size={20} />
                      ) : (
                        <span className="text-sm font-bold">{step.number}</span>
                      )}
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      {step.title}
                    </div>
                  </div>
                  {index < agentSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-orange-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: CEA Registration Validation */}
              {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Shield className="mr-2" />
                  CEA Registration Verification
                </h2>
                
                <div className="space-y-6">
                  {/* Information Panel */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="mr-2 text-blue-600 mt-0.5" size={16} />
                      <div className="text-sm">
                        <p className="text-blue-800 font-medium">CEA Registration Required</p>
                        <p className="text-blue-700 mt-1">
                          All property agents must be registered with the Council for Estate Agencies (CEA) in Singapore.
                          Your registration number will be verified during the approval process.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEA Registration Number *
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          {...register('ceaRegistrationNumber', {
                            required: 'CEA registration number is required for agent registration',
                            pattern: {
                              value: /^[A-Z]{1,2}\d{6,8}[A-Z]?$/,
                              message: 'Please enter a valid CEA registration number (e.g., R123456A)'
                            }
                          })}
                          type="text"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                            codeValidated 
                              ? 'border-green-500 focus:ring-green-500' 
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                          placeholder="e.g., R123456A"
                          style={{ textTransform: 'uppercase' }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            e.target.value = value;
                            setValue('ceaRegistrationNumber', value);
                            setCodeValidated(false);
                          }}
                        />
                        {codeValidated && (
                          <CheckCircle size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => validateCEARegistration(ceaRegistrationNumber)}
                        disabled={isValidatingCode || !ceaRegistrationNumber}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isValidatingCode ? 'Validating...' : 'Validate'}
                      </button>
                    </div>
                    {errors.ceaRegistrationNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.ceaRegistrationNumber.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      This will be verified through the{' '}
                      <a 
                        href="https://eservices.cea.gov.sg/aceas/public-register/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        CEA Public Register
                      </a>
                    </p>
                  </div>

                  {/* CEA Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEA Registration Expiry Date *
                    </label>
                    <input
                      type="date"
                      {...register('ceaExpiryDate', { 
                        required: 'CEA expiry date is required' 
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.ceaExpiryDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.ceaExpiryDate.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Enter the expiry date of your CEA registration
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <User className="mr-2" />
                  Personal Information
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Mail className="mr-2" />
                  Contact Information
                </h2>
                
                <div className="space-y-6">
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
                          message: 'Please enter a valid email address'
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
              </motion.div>
            )}

            {/* Step 4: Account Security */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Lock className="mr-2" />
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

                  {/* Terms Agreement */}
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

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < agentSteps.length ? (
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
                    'Create Agent Account'
                  )}
                </button>
              )}
            </div>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in now
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentRegisterPage;