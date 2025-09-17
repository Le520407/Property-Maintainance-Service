import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const TACLogin = ({ onBackToRegular, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: credentials, 2: TAC code
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { requestTAC, verifyTAC } = useAuth();

  // Countdown timer for resend
  React.useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(c => c - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleRequestTAC = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestTAC(email, password);
      if (result.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
        setCountdown(60); // 60 second countdown for resend
      } else {
        toast.error(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTAC = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyTAC(email, code);
      if (result.success) {
        toast.success('Login successful!');
        onSuccess?.(result.user);
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await requestTAC(email, password);
      if (result.success) {
        toast.success('New verification code sent!');
        setCountdown(60);
        setCode(''); // Clear previous code
      } else {
        toast.error(result.error || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {step === 1 ? 'Secure Login' : 'Enter Verification Code'}
        </h2>
        <p className="text-gray-600 mt-2">
          {step === 1 
            ? 'Enhanced security with Two-Factor Authentication' 
            : `Enter the 6-digit code sent to ${email}`
          }
        </p>
      </div>

      {step === 1 ? (
        // Step 1: Email and Password
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleRequestTAC}
          className="space-y-6"
        >
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </motion.form>
      ) : (
        // Step 2: Verification Code
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleVerifyTAC}
          className="space-y-6"
        >
          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Code expires in 10 minutes
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || isLoading}
              className="text-orange-600 hover:text-orange-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Back to Step 1 */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change Email/Password
            </button>
          </div>
        </motion.form>
      )}

      {/* Back to Regular Login */}
      <div className="mt-6 text-center">
        <button
          onClick={onBackToRegular}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Regular Login
        </button>
      </div>

      {/* Security Info */}
      <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-orange-800">Enhanced Security</h4>
            <p className="text-sm text-orange-700 mt-1">
              Two-Factor Authentication provides an extra layer of security for your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TACLogin;
