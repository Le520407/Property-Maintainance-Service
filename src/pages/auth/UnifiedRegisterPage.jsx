import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, Gift, 
  Users, Briefcase, Award, Shield, Settings, Copy
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const UnifiedRegisterPage = () => {
  const [accountType, setAccountType] = useState('customer');
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
    // Validate agent invite code
    if (accountType === 'referral' && !codeValidated) {
      toast.error('Please validate your invite code first');
      return;
    }

    setIsLoading(true);
    try {
      let endpoint;
      let payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country
      };

      // Route to appropriate registration endpoint
      switch (accountType) {
        case 'customer':
          endpoint = '/auth/register';
          payload.role = 'customer';
          if (data.referralCode) {
            payload.referralCode = data.referralCode;
          }
          break;
        
        case 'vendor':
          endpoint = '/auth/register-technician';
          payload.skills = data.skills ? data.skills.split(',').map(s => s.trim()) : [];
          payload.experience = parseInt(data.experience) || 0;
          payload.hourlyRate = parseFloat(data.hourlyRate) || 0;
          break;
        
        case 'referral':
          endpoint = '/auth/register-agent';
          payload.inviteCode = data.inviteCode;
          break;
        
        default:
          throw new Error('Invalid account type');
      }

      const response = await api.post(endpoint, payload);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Choose your account type and join Swift Fix Pro</p>
          </div>

          {/* Account Type Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Account Type</h3>
            <div className="space-y-3">
              {accountTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setAccountType(type.id)}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    accountType === type.id
                      ? `${type.borderColor} ${type.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <type.icon className={`w-6 h-6 ${type.color} mr-3`} />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                        {type.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                            {type.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      accountType === type.id
                        ? `${type.color.replace('text', 'bg')} border-transparent`
                        : 'border-gray-300'
                    }`}>
                      {accountType === type.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <selectedType.icon className={`w-5 h-5 ${selectedType.color} mr-2`} />
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

              {/* Submit Button */}
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