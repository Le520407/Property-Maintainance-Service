import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, EyeOff, User, Phone, Mail, Users, Briefcase, Award, Gift,
  Building, FileText, Shield, Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState('customer');
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth();
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
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { id: 'gardening', name: 'Gardening', icon: '🌱' },
    { id: 'painting', name: 'Painting', icon: '🎨' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'hvac', name: 'HVAC', icon: '❄️' },
    { id: 'general', name: 'General Maintenance', icon: '🛠️' }
  ];

  // Handle referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase());
    }
  }, [searchParams, setValue]);

  // Reset form when account type changes
  useEffect(() => {
    reset();
    // Re-apply referral code if it exists
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase());
    }
  }, [accountType, reset, setValue, searchParams]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File uploaded:', file.name);
      toast.success('File uploaded successfully');
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (accountType === 'vendor') {
        // Vendor registration
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
        
        await api.auth.registerTechnician(vendorData);
        toast.success('Vendor registration successful! Your account is pending approval.');
        navigate('/login');
      } else {
        // Customer and referral registration
        const result = await registerUser({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: data.password,
          phone: data.phone,
          address: data.address,
          role: accountType,
          referralCode: data.referralCode
        });
        
        if (result.success) {
          toast.success(`${accountType === 'referral' ? 'Agent' : 'Customer'} registration successful!`);
          navigate('/dashboard');
        } else {
          toast.error(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Choose your account type and join Swift Fix Pro</p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Select Account Type</h3>
            <div className="space-y-4">
              {accountTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setAccountType(type.id)}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    accountType === type.id
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <type.icon className={`w-6 h-6 text-${type.color}-600 mr-4`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                        {type.badge && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {type.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      accountType === type.id
                        ? `bg-${type.color}-600 border-transparent`
                        : 'border-gray-300'
                    }`}>
                      {accountType === type.id && (
                        <div className="w-3 h-3 bg-white rounded-full m-px"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* Basic Information */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <User className="mr-2" />
                  Basic Information
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
                      placeholder="Enter first name"
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
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

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
                      placeholder="Enter email address"
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
                      placeholder="Enter phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Referral Code for Customers */}
                {accountType === 'customer' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <Gift size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('referralCode')}
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter referral code (optional)"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Have a referral code? Enter it to get special benefits!
                    </p>
                  </div>
                )}
              </div>

              {/* Company Information (Vendors Only) */}
              {accountType === 'vendor' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <Building className="mr-2" />
                    Company Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        {...register('companyName', { required: accountType === 'vendor' ? 'Company name is required' : false })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business License Number *
                        </label>
                        <input
                          type="text"
                          {...register('businessLicense', { required: accountType === 'vendor' ? 'Business license is required' : false })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter business license number"
                        />
                        {errors.businessLicense && (
                          <p className="text-red-500 text-sm mt-1">{errors.businessLicense.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Establishment Date *
                        </label>
                        <input
                          type="date"
                          {...register('establishDate', { required: accountType === 'vendor' ? 'Establishment date is required' : false })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {errors.establishDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.establishDate.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Address *
                      </label>
                      <textarea
                        {...register('address', { required: accountType === 'vendor' ? 'Address is required' : false })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter detailed company address"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Briefly introduce your company..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Service Information (Vendors Only) */}
              {accountType === 'vendor' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <FileText className="mr-2" />
                    Service Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Service Categories * (Select Multiple)
                      </label>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {serviceCategories.map((category) => (
                          <label key={category.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              value={category.id}
                              {...register('services', { required: accountType === 'vendor' ? 'Please select at least one service' : false })}
                              className="mr-3"
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

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Area *
                        </label>
                        <input
                          type="text"
                          {...register('serviceArea', { required: accountType === 'vendor' ? 'Service area is required' : false })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="e.g. Singapore, Jurong, etc."
                        />
                        {errors.serviceArea && (
                          <p className="text-red-500 text-sm mt-1">{errors.serviceArea.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Size *
                        </label>
                        <select
                          {...register('teamSize', { required: accountType === 'vendor' ? 'Team size is required' : false })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Experience *
                      </label>
                      <textarea
                        {...register('experience', { required: accountType === 'vendor' ? 'Service experience is required' : false })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Describe your service experience, successful cases, etc..."
                      />
                      {errors.experience && (
                        <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Uploads (Vendors Only) */}
              {accountType === 'vendor' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <Shield className="mr-2" />
                    Certification Documents
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business License Document *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="business-license" className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                            Choose File
                          </label>
                          <input
                            id="business-license"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
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
                        ID Card (Front and Back) *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="id-card" className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                            Choose Files
                          </label>
                          <input
                            id="id-card"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Please upload front and back photos of your ID card
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Account Security & Agreement */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Shield className="mr-2" />
                  Account Security
                </h2>
                
                <div className="space-y-6">
                  {/* Address for non-vendors */}
                  {accountType !== 'vendor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        {...register('address', { required: 'Address is required' })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your address"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                      )}
                    </div>
                  )}

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', { 
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'Password must contain uppercase, lowercase, and numbers'
                            }
                          })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
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
                            required: 'Please confirm password',
                            validate: value => value === password || 'Passwords do not match'
                          })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Agreement */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        {...register('agreeToTerms', { required: 'Please agree to terms' })}
                        className="mt-1 mr-3"
                      />
                      <label className="text-sm text-gray-600">
                        I agree to the{' '}
                        <Link to="/terms" className="text-orange-600 hover:underline">Terms of Service</Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms.message}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        {...register('agreeToContract', { required: 'Please agree to service contract' })}
                        className="mt-1 mr-3"
                      />
                      <label className="text-sm text-gray-600">
                        I agree to the{' '}
                        {accountType === 'vendor' ? 'Vendor Service Agreement' : 
                         accountType === 'referral' ? 'Agent Partnership Agreement' : 
                         'Customer Service Agreement'}
                      </label>
                    </div>
                    {errors.agreeToContract && (
                      <p className="text-red-500 text-sm mt-1">{errors.agreeToContract.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    `Create ${accountTypes.find(t => t.id === accountType)?.name} Account`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
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

export default RegisterPage;