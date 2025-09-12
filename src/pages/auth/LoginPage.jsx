import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TACLogin from '../../components/auth/TACLogin';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useTAC, setUseTAC] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,  
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        // Check if TAC is required for this user
        if (result.error && result.error.includes('Two-Factor Authentication is required')) {
          toast.error('This account requires Two-Factor Authentication. Please use the TAC login option below.');
          setUseTAC(true); // Automatically switch to TAC mode
        } else {
          toast.error(result.error || 'Login failed, please check your email and password');
        }
      }
    } catch (error) {
      toast.error('An error occurred during login, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTACSuccess = (user) => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {useTAC ? (
            <TACLogin 
              onBackToRegular={() => setUseTAC(false)}
              onSuccess={handleTACSuccess}
            />
          ) : (
            <>
              {/* Header */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">S</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your account to continue</p>
              </div>

              {/* Login Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
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

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>

            {/* Demo Login */}
            <div className="mt-6">
              <button
                onClick={() => {
                  // Demo login
                  login('demo@swiftfixpro.sg', 'password123');
                  toast.success('Demo login successful!');
                  navigate('/');
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Demo Login
              </button>
            </div>
          </div>

          {/* TAC Login Option */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setUseTAC(true)}
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center mx-auto"
            >
              <Shield className="w-4 h-4 mr-2" />
              Use Secure Login (TAC)
            </button>
            <p className="text-sm text-gray-500 mt-1">Enhanced security with email verification</p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign up now
              </Link>
            </p>
          </div>

          {/* Vendor Registration */}
          <div className="mt-8 bg-orange-50 rounded-xl p-6">
            <div className="text-center">
              <User size={32} className="mx-auto mb-3 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you a vendor?</h3>
              <p className="text-gray-600 mb-4">
                Register as our vendor and start accepting job orders
              </p>
              <Link
                to="/vendor-register"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center"
              >
                Vendor Registration
                <Phone size={16} className="ml-2" />
              </Link>
            </div>
          </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 