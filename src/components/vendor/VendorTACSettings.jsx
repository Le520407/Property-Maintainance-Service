import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VendorTACSettings = () => {
  const { user, updateTACPreference } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tacEnabled, setTacEnabled] = useState(user?.tacEnabled || false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newTacEnabled = !tacEnabled;
      const result = await updateTACPreference(newTacEnabled);
      
      if (result.success) {
        setTacEnabled(newTacEnabled);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to update TAC preference');
      }
    } catch (error) {
      toast.error('An error occurred while updating TAC preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                Two-Factor Authentication (2FA)
                {tacEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400 ml-2" />
                )}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Add an extra layer of security to your vendor account by enabling Two-Factor Authentication.
              </p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Protection against unauthorized access</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Secure email verification for each login</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Enhanced security for vendor operations</span>
                </div>
              </div>

              {tacEnabled && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Two-Factor Authentication is enabled
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You will need to verify your email each time you log in to your vendor account.
                  </p>
                </div>
              )}

              {!tacEnabled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Two-Factor Authentication is disabled
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    We recommend enabling 2FA to protect your vendor account and client information.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className={`${
                tacEnabled ? 'bg-orange-600' : 'bg-gray-200'
              } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              role="switch"
              aria-checked={tacEnabled}
              onClick={handleToggle}
              disabled={isLoading}
            >
              <span className="sr-only">
                {tacEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
              </span>
              <span
                aria-hidden="true"
                className={`${
                  tacEnabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Vendor Security Best Practices
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Enable Two-Factor Authentication for maximum account security</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Use a strong, unique password for your vendor account</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Regularly update your contact information and security preferences</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Log out from shared or public devices after use</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VendorTACSettings;
