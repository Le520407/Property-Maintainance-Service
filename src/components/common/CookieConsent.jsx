import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cookie, 
  Shield, 
  BarChart3, 
  Settings, 
  X,
  Check,
  Info
} from 'lucide-react';
import cookieManager from '../../utils/cookieManager';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = cookieManager.consent.getConsent();
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    cookieManager.consent.setConsent(consentData);
    setIsVisible(false);
    
    // Initialize analytics if accepted
    if (consentData.analytics) {
      initializeAnalytics();
    }
  };

  const handleAcceptSelected = () => {
    const consentData = {
      ...preferences,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    cookieManager.consent.setConsent(consentData);
    setIsVisible(false);
    
    // Initialize analytics if accepted
    if (consentData.analytics) {
      initializeAnalytics();
    }
  };

  const handleDeclineAll = () => {
    const consentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    cookieManager.consent.setConsent(consentData);
    setIsVisible(false);
  };

  const initializeAnalytics = () => {
    // Generate or get visitor ID
    let visitorId = cookieManager.analytics.getVisitorId();
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cookieManager.analytics.setVisitorId(visitorId);
    }
    
    // Set session start
    cookieManager.analytics.setSessionStart(Date.now());
    
    // Track initial page view
    cookieManager.analytics.trackPageView(window.location.pathname);
  };

  const togglePreference = (category) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const cookieCategories = [
    {
      id: 'necessary',
      name: 'Necessary Cookies',
      description: 'Essential cookies for website functionality, security, and basic features.',
      icon: Shield,
      required: true,
      examples: 'Authentication, security, basic functionality'
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website to improve user experience.',
      icon: BarChart3,
      required: false,
      examples: 'Page views, user behavior, performance metrics'
    },
    {
      id: 'preferences',
      name: 'Preference Cookies',
      description: 'Remember your settings and preferences for a personalized experience.',
      icon: Settings,
      required: false,
      examples: 'Language, theme, form data, user preferences'
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to track visitors across websites for advertising and marketing purposes.',
      icon: Cookie,
      required: false,
      examples: 'Ad targeting, social media integration, conversion tracking'
    }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto p-6">
          {!showDetails ? (
            // Simple consent banner
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    We use cookies to enhance your browsing experience, serve personalized content, 
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                  </p>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                  >
                    <Info size={14} />
                    Customize preferences
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={handleDeclineAll}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Decline All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Accept All Cookies
                </button>
              </div>
            </div>
          ) : (
            // Detailed preferences
            <div className="max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Cookie className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cookie Preferences
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Choose which cookies you want to accept. You can change these settings at any time.
              </p>

              <div className="space-y-4 mb-6">
                {cookieCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isEnabled = preferences[category.id];
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <IconComponent size={20} className="text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{category.name}</h4>
                              {category.required && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {category.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              <strong>Examples:</strong> {category.examples}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <button
                            onClick={() => togglePreference(category.id)}
                            disabled={category.required}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isEnabled 
                                ? 'bg-orange-600' 
                                : 'bg-gray-200'
                            } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeclineAll}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Decline All
                </button>
                <button
                  onClick={handleAcceptSelected}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Check size={16} />
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;