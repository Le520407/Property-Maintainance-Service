import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Gift,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import cookieManager from '../../utils/cookieManager';
import toast from 'react-hot-toast';

const CustomerRegisterPage = ({ embedded = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  // Singapore cities list
  const singaporeCities = [
    'Central Singapore',
    'Ang Mo Kio',
    'Bedok',
    'Bishan',
    'Boon Lay',
    'Bukit Batok',
    'Bukit Merah',
    'Bukit Panjang',
    'Bukit Timah',
    'Choa Chu Kang',
    'Clementi',
    'Geylang',
    'Hougang',
    'Jurong East',
    'Jurong West',
    'Kallang',
    'Marine Parade',
    'Novena',
    'Pasir Ris',
    'Punggol',
    'Queenstown',
    'Sembawang',
    'Sengkang',
    'Serangoon',
    'Tampines',
    'Toa Payoh',
    'Woodlands',
    'Yishun'
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const steps = [
    { number: 1, title: 'Personal Information' },
    { number: 2, title: 'Contact Details' },
    { number: 3, title: 'Account Security' }
  ];

  // Handle referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase());
    }
    
    // Track page visit for analytics
    if (cookieManager.consent.hasConsent('analytics')) {
      cookieManager.analytics.trackPageView('/register/customer');
    }
    
    // Restore form data from cookies if available
    if (cookieManager.consent.hasConsent('preferences')) {
      const savedFormData = cookieManager.ux.getFormData('customer-registration');
      if (savedFormData && Object.keys(savedFormData).length > 0) {
        Object.keys(savedFormData).forEach(key => {
          setValue(key, savedFormData[key]);
        });
      }
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Track registration attempt
      if (cookieManager.consent.hasConsent('analytics')) {
        cookieManager.analytics.setConversionData({
          event: 'registration_attempt',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          referralCode: data.referralCode || null
        });
      }
      
      const result = await registerUser({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: 'Singapore',
        role: 'customer',
        referralCode: data.referralCode
      });
      
      if (result.success) {
        // Clear saved form data on successful registration
        if (cookieManager.consent.hasConsent('preferences')) {
          cookieManager.ux.removeFormData('customer-registration');
        }
        
        // Track successful registration
        if (cookieManager.consent.hasConsent('analytics')) {
          cookieManager.analytics.setConversionData({
            event: 'registration_success',
            timestamp: Date.now(),
            userId: result.user?.id,
            role: 'customer'
          });
        }
        
        toast.success('Customer registration successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Track registration failure
      if (cookieManager.consent.hasConsent('analytics')) {
        cookieManager.analytics.setConversionData({
          event: 'registration_failure',
          timestamp: Date.now(),
          error: error.message
        });
      }
      
      toast.error(error.message || 'Registration failed, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      const currentStepData = watch();
      
      if (currentStep === 1) {
        if (!currentStepData.firstName || !currentStepData.lastName) {
          toast.error('Please fill in all required fields in this step');
          return;
        }
      }
      
      if (currentStep === 2) {
        if (!currentStepData.email || !currentStepData.phone || !currentStepData.address) {
          toast.error('Please complete all contact details');
          return;
        }
      }
      
      // Save form progress to cookies
      if (cookieManager.consent.hasConsent('preferences')) {
        cookieManager.ux.setFormData('customer-registration', currentStepData);
      }
      
      // Track step completion for analytics
      if (cookieManager.consent.hasConsent('analytics')) {
        cookieManager.analytics.trackPageView(`/register/customer/step-${currentStep + 1}`);
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

          {/* Customer Benefits Section */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4">Why Choose Swift Fix Pro?</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Access to verified and trusted service providers</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>24/7 customer support and service guarantee</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Easy booking and secure payment processing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Competitive pricing and transparent quotes</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <Home size={48} className="mx-auto mb-2 text-orange-200" />
                      <p className="text-sm text-orange-100">Your Home</p>
                      <p className="text-xs text-orange-200">in safe hands</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
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
                  {index < steps.length - 1 && (
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        {...register('lastName', { required: 'Last name is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <Gift size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('referralCode')}
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="Enter referral code (optional)"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 flex items-center">
                      <Gift size={12} className="mr-1" />
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
                        <div className="relative">
                          <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            {...register('email', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                              }
                            })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            placeholder="Enter your email address"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={16} className="mr-1" />
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            {...register('phone', { required: 'Phone number is required' })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            placeholder="Enter your phone number"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={16} className="mr-1" />
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <div className="relative">
                        <MapPin size={20} className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          {...register('address', { required: 'Address is required' })}
                          rows={3}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                          placeholder="Enter your detailed address"
                        />
                      </div>
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Region *
                        </label>
                        <select
                          {...register('city', { required: 'City is required' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          defaultValue=""
                        >
                          <option value="" disabled>Select your city</option>
                          {singaporeCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={16} className="mr-1" />
                            {errors.city.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          {...register('country')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          value="Singapore"
                          readOnly
                        />
                      </div>
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
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.password.message}
                        </p>
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
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className={`flex items-center ${password && password.length >= 6 ? 'text-green-600' : ''}`}>
                          <CheckCircle size={16} className={`mr-2 ${password && password.length >= 6 ? 'text-green-600' : 'text-gray-300'}`} />
                          At least 6 characters long
                        </li>
                        <li className={`flex items-center ${password && /[A-Za-z]/.test(password) && /\d/.test(password) ? 'text-green-600' : ''}`}>
                          <CheckCircle size={16} className={`mr-2 ${password && /[A-Za-z]/.test(password) && /\d/.test(password) ? 'text-green-600' : 'text-gray-300'}`} />
                          Contains letters and numbers
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors ${
                    currentStep === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={currentStep === 1}
                >
                  Previous
                </button>

                <div className="flex space-x-3">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Already have account */}
            <div className="mt-6 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
