import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Shield
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SERVICE_CATEGORIES_OBJECT_FORMAT } from '../../constants/serviceCategories';

const VendorRegisterPage = ({ embedded = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
    formState: { errors },
    setValue
  } = useForm();

  const password = watch('password');

  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Company Information' },
    { number: 3, title: 'Service Information' },
    { number: 4, title: 'Certification' }
  ];

  const serviceCategories = SERVICE_CATEGORIES_OBJECT_FORMAT;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file.name);
      toast.success('File uploaded successfully');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Ensure all required fields are present
      if (!data.firstName || !data.lastName || !data.email || !data.password || !data.phone) {
        toast.error('Please fill in all required fields');
        return;
      }

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
        hourlyRate: 0
      };
      
      console.log('Submitting vendor data:', vendorData); // Debug log
      
      const result = await api.auth.registerTechnician(vendorData);
      toast.success('Vendor registration successful! Your account is pending approval.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      toast.error(error.message || 'Registration failed, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      // Basic validation for each step
      const currentStepData = watch();
      
      if (currentStep === 1) {
        if (!currentStepData.firstName || !currentStepData.lastName || !currentStepData.email || !currentStepData.phone) {
          toast.error('Please fill in all required fields in this step');
          return;
        }
      }
      
      if (currentStep === 2) {
        if (!currentStepData.companyName || !currentStepData.businessLicense || !currentStepData.establishDate || !currentStepData.address) {
          toast.error('Please fill in all required company information');
          return;
        }
      }
      
      if (currentStep === 3) {
        if (!currentStepData.services || currentStepData.services.length === 0 || !currentStepData.serviceArea || !currentStepData.teamSize || !currentStepData.experience) {
          toast.error('Please complete all service information');
          return;
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

          {/* Vendor Benefits Section */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4">Why Join Our Network?</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Access to thousands of potential customers</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Secure payment processing and protection</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Marketing support and business tools</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={20} className="mr-3 text-orange-200 flex-shrink-0" />
                    <span>Professional certification verification</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <Building size={48} className="mx-auto mb-2 text-orange-200" />
                      <p className="text-sm text-orange-100">Build Your Business</p>
                      <p className="text-xs text-orange-200">with our platform</p>
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
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
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
                        {...register('firstName', { required: 'Please enter first name' })}
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
                        {...register('lastName', { required: 'Please enter last name' })}
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
                          required: 'Please enter email address',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email address'
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
                        {...register('phone', { 
                          required: 'Please enter phone number',
                          pattern: {
                            value: /^[+]?[\d\s\-\(\)]+$/,
                            message: 'Please enter a valid phone number'
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
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
                        {...register('companyName', { required: 'Please enter company name' })}
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
                          {...register('businessLicense', { required: 'Please enter business license number' })}
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
                          {...register('establishDate', { required: 'Please select establishment date' })}
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
                        {...register('address', { required: 'Please enter company address' })}
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

              {/* Step 3: Service Information */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <FileText className="mr-2" />
                    Service Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Service Categories * (Multiple)
                      </label>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {serviceCategories.map((category) => (
                          <label key={category.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              value={category.id}
                              {...register('services', { required: 'Please select at least one service category' })}
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
                        <select
                          {...register('serviceArea', { required: 'Please select service area' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          defaultValue=""
                        >
                          <option value="" disabled>Select your service area</option>
                          {singaporeCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {errors.serviceArea && (
                          <p className="text-red-500 text-sm mt-1">{errors.serviceArea.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Size *
                        </label>
                        <select
                          {...register('teamSize', { required: 'Please select team size' })}
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
                        {...register('experience', { required: 'Please describe your service experience' })}
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

              {/* Step 4: Certification */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <Shield className="mr-2" />
                    Certification
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', { 
                              required: 'Please enter password',
                              minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters'
                              },
                              pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain uppercase and lowercase letters and numbers'
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
                            placeholder="Enter password again"
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

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business License *
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
                          ID Card Front and Back *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="id-card" className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                              Choose File
                            </label>
                            <input
                              id="id-card"
                              type="file"
                              accept="image/*"
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

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        {...register('agreeTerms', { required: 'Please agree to the terms of service' })}
                        className="mt-1 mr-3"
                      />
                      <label className="text-sm text-gray-600">
                        I have read and agree to the 
                        <Link to="/terms" className="text-orange-600 hover:underline"> Terms of Service</Link> 
                        and 
                        <Link to="/privacy" className="text-orange-600 hover:underline"> Privacy Policy</Link>
                      </label>
                    </div>
                    {errors.agreeTerms && (
                      <p className="text-red-500 text-sm mt-1">{errors.agreeTerms.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentStep < 4 ? (
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
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account? 
              <Link to="/login" className="text-orange-600 hover:underline">
                Log in now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorRegisterPage;