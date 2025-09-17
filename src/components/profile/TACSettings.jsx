import React, { useState } from 'react';
import { Shield, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const TACSettings = () => {
  const { user, updateTACPreference } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tacEnabled, setTacEnabled] = useState(user?.tacEnabled || false);

  const handleToggle = async (enabled) => {
    setIsLoading(true);
    try {
      const result = await updateTACPreference(enabled);
      if (result.success) {
        setTacEnabled(enabled);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to update TAC preference');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          tacEnabled ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <Shield className={`w-6 h-6 ${tacEnabled ? 'text-green-600' : 'text-gray-600'}`} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-gray-600 mt-1">
                Add an extra layer of security to your account with email verification codes.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex flex-col items-end space-y-2">
              <button
                onClick={() => handleToggle(!tacEnabled)}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tacEnabled ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tacEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
              <span className={`text-sm font-medium ${
                tacEnabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {tacEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Status and Details */}
          <div className="mt-4">
            {tacEnabled ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">TAC is Active</h4>
                    <p className="text-sm text-green-700 mt-1">
                      When logging in, you'll receive a 6-digit verification code via email. 
                      This provides enhanced security for your account.
                    </p>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-green-700 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                        Email verification required for login
                      </p>
                      <p className="text-sm text-green-700 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                        Codes expire in 10 minutes
                      </p>
                      <p className="text-sm text-green-700 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                        Single-use verification codes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">TAC is Disabled</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your account is using standard email and password authentication. 
                      Enable TAC for enhanced security.
                    </p>
                    <div className="mt-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Benefits of enabling TAC:</strong>
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-yellow-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></span>
                          Protection against unauthorized access
                        </p>
                        <p className="text-sm text-yellow-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></span>
                          Real-time login notifications
                        </p>
                        <p className="text-sm text-yellow-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></span>
                          Enhanced account security
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
            
            {isLoading && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin mr-2"></div>
                Updating...
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>How it works:</strong> When TAC is enabled, you'll be asked to enter your email and password, 
              then check your email for a 6-digit code to complete the login process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TACSettings;
