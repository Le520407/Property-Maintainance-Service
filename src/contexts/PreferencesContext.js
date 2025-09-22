import React, { createContext, useContext, useState, useEffect } from 'react';
import cookieManager from '../utils/CookieManager';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false
    },
    privacy: {
      allowAnalytics: false,
      allowMarketing: false,
      shareData: false
    }
  });

  // Load preferences from cookies on mount
  useEffect(() => {
    if (cookieManager.consent.hasConsent('preferences')) {
      const savedPrefs = cookieManager.ux.getUserPreferences();
      if (savedPrefs && Object.keys(savedPrefs).length > 0) {
        setPreferences(prev => ({ ...prev, ...savedPrefs }));
      }
    }
  }, []);

  // Save preferences to cookies whenever they change
  useEffect(() => {
    if (cookieManager.consent.hasConsent('preferences')) {
      cookieManager.ux.setUserPreferences(preferences);
    }
  }, [preferences]);

  const updateLanguage = (language) => {
    setPreferences(prev => ({ ...prev, language }));
    cookieManager.ux.setLanguage(language);
    
    // Track language change
    if (cookieManager.consent.hasConsent('analytics')) {
      cookieManager.analytics.trackPageView(`/language-changed/${language}`);
    }
  };

  const updateTheme = (theme) => {
    setPreferences(prev => ({ ...prev, theme }));
    cookieManager.ux.setTheme(theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Track theme change
    if (cookieManager.consent.hasConsent('analytics')) {
      cookieManager.analytics.trackPageView(`/theme-changed/${theme}`);
    }
  };

  const updateNotificationPreferences = (notificationPrefs) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notificationPrefs }
    }));
  };

  const updateAccessibilityPreferences = (accessibilityPrefs) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, ...accessibilityPrefs }
    }));
    
    // Apply accessibility settings
    if (accessibilityPrefs.fontSize) {
      document.documentElement.style.fontSize = 
        accessibilityPrefs.fontSize === 'small' ? '14px' :
        accessibilityPrefs.fontSize === 'large' ? '18px' : '16px';
    }
    
    if (accessibilityPrefs.highContrast !== undefined) {
      document.documentElement.classList.toggle('high-contrast', accessibilityPrefs.highContrast);
    }
    
    if (accessibilityPrefs.reduceMotion !== undefined) {
      document.documentElement.classList.toggle('reduce-motion', accessibilityPrefs.reduceMotion);
    }
  };

  const updatePrivacyPreferences = (privacyPrefs) => {
    setPreferences(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...privacyPrefs }
    }));
    
    // Update cookie consent based on privacy preferences
    if (privacyPrefs.allowAnalytics !== undefined || privacyPrefs.allowMarketing !== undefined) {
      const currentConsent = cookieManager.consent.getConsent() || {};
      const newConsent = {
        ...currentConsent,
        analytics: privacyPrefs.allowAnalytics ?? currentConsent.analytics,
        marketing: privacyPrefs.allowMarketing ?? currentConsent.marketing
      };
      cookieManager.consent.setConsent(newConsent);
    }
  };

  const resetPreferences = () => {
    const defaultPrefs = {
      language: 'en',
      theme: 'light',
      notifications: {
        email: true,
        sms: false,
        push: true,
        marketing: false
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false
      },
      privacy: {
        allowAnalytics: false,
        allowMarketing: false,
        shareData: false
      }
    };
    
    setPreferences(defaultPrefs);
    
    // Clear preferences from cookies
    if (cookieManager.consent.hasConsent('preferences')) {
      cookieManager.auth.setUserPreferences({});
    }
  };

  const exportPreferences = () => {
    return {
      preferences,
      timestamp: Date.now(),
      version: '1.0'
    };
  };

  const importPreferences = (importedData) => {
    if (importedData && importedData.preferences) {
      setPreferences(importedData.preferences);
    }
  };

  // Get current preferences for specific categories
  const getLanguage = () => preferences.language;
  const getTheme = () => preferences.theme;
  const getNotificationPreferences = () => preferences.notifications;
  const getAccessibilityPreferences = () => preferences.accessibility;
  const getPrivacyPreferences = () => preferences.privacy;

  const value = {
    preferences,
    updateLanguage,
    updateTheme,
    updateNotificationPreferences,
    updateAccessibilityPreferences,
    updatePrivacyPreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    // Getters
    getLanguage,
    getTheme,
    getNotificationPreferences,
    getAccessibilityPreferences,
    getPrivacyPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};