import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Phone, MapPin, Globe, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const GoogleRegistrationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { completeGoogleRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleData = location.state?.googleData;

  useEffect(() => {
    // Redirect if no Google data is available
    if (!googleData) {
      toast.error('Invalid registration data. Please try again.');
      navigate('/login');
    }
  }, [googleData, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      country: 'Singapore'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await completeGoogleRegistration(googleData, data);
      if (result.success) {
        toast.success('Registration completed successfully!');
        navigate('/');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  if (!googleData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Registration</h2>
            <p className="text-gray-600">Just a few more details to get started</p>
          </div>

          {/* Google Account Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              {googleData.profilePicture && (
                <img 
                  src={googleData.profilePicture} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{googleData.fullName}</h3>
                <p className="text-gray-600 text-sm flex items-center">
                  <CheckCircle size={16} className="text-green-500 mr-1" />
                  {googleData.email}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[+]?[\d\s-()]+$/,
                        message: 'Please enter a valid phone number'
                      }
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

              {/* Address Field */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('address')}
                    type="text"
                    id="address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              {/* City Field */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City (Optional)
                </label>
                <input
                  {...register('city')}
                  type="text"
                  id="city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter your city"
                />
              </div>

              {/* State Field */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State (Optional)
                </label>
                <input
                  {...register('state')}
                  type="text"
                  id="state"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter your state"
                />
              </div>

              {/* Zip Code Field */}
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code (Optional)
                </label>
                <input
                  {...register('zipCode')}
                  type="text"
                  id="zipCode"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter your zip code"
                />
              </div>

              {/* Country Field */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <Globe size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    {...register('country', { required: 'Country is required' })}
                    id="country"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Completing Registration...' : 'Complete Registration'}
              </button>
            </form>

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By completing registration, you agree to our{' '}
                <a href="/terms" className="text-orange-600 hover:text-orange-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-orange-600 hover:text-orange-700">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GoogleRegistrationPage;