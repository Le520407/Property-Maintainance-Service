import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, Gift, Shield, Award, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const AgentRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const inviteCode = watch('inviteCode');

  // Validate invite code
  const validateInviteCode = async (code) => {
    if (!code || code.length < 6) return;
    
    setIsValidatingCode(true);
    try {
      const response = await api.post('/api/invite-codes/validate', { code });
      if (response.data.success) {
        setCodeValidated(true);
        toast.success('Valid invite code!');
      }
    } catch (error) {
      setCodeValidated(false);
      toast.error(error.response?.data?.message || 'Invalid invite code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const onSubmit = async (data) => {
    if (!codeValidated) {
      toast.error('Please validate your invite code first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/register-agent', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        inviteCode: data.inviteCode
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        toast.success('Agent registration successful! Welcome to Swift Fix Pro');
        navigate('/agent-dashboard');
      }
    } catch (error) {
      console.error('Agent registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="text-white" size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Become a Referral Agent</h2>
            <p className="text-gray-600">Join our exclusive property agent program and earn higher commissions</p>
          </div>

          {/* Agent Benefits Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2" />
              Agent Benefits
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
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
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Invite Code */}
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
                        required: 'Invite code is required for agent registration',
                        minLength: {
                          value: 6,
                          message: 'Invite code must be at least 6 characters'
                        },
                        pattern: {
                          value: /^[A-Z0-9-]+$/,
                          message: 'Invalid invite code format'
                        }
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
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>

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
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      id="firstName"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[\+]?[1-9][\d]{7,15}$/,
                        message: 'Please enter a valid phone number'
                      }
                    })}
                    type="tel"
                    id="phone"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      required: 'Address is required',
                      minLength: {
                        value: 10,
                        message: 'Address must be at least 10 characters'
                      }
                    })}
                    type="text"
                    id="address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Country"
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>

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
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain uppercase, lowercase letters and numbers'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    required: 'You must agree to the terms to register as an agent'
                  })}
                  type="checkbox"
                  id="agreeToTerms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link to="/agent-agreement" className="text-blue-600 hover:text-blue-700">
                    Agent Agreement
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !codeValidated}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Creating agent account...' : 'Become an Agent'}
              </button>
            </form>
          </div>

          {/* Login Links */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in now
              </Link>
            </p>
            <p className="text-gray-600">
              Want to be a customer?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Register as Customer
              </Link>
            </p>
            <p className="text-gray-600">
              Want to provide services?{' '}
              <Link to="/vendor-register" className="text-blue-600 hover:text-blue-700 font-medium">
                Register as Vendor
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentRegisterPage;