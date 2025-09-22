import Cookies from 'js-cookie';

/**
 * CookieManager - Centralized cookie management utility
 * Provides secure, consistent cookie operations across the application
 */
class CookieManager {
  constructor() {
    this.defaultOptions = {
      expires: 7, // 7 days default
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      path: '/'
    };
  }

  /**
   * Set a cookie with optional custom options
   * @param {string} name - Cookie name
   * @param {string|object} value - Cookie value (objects will be JSON stringified)
   * @param {object} options - Custom cookie options
   */
  set(name, value, options = {}) {
    try {
      const finalValue = typeof value === 'object' ? JSON.stringify(value) : value;
      const finalOptions = { ...this.defaultOptions, ...options };
      
      Cookies.set(name, finalValue, finalOptions);
      return true;
    } catch (error) {
      console.error('CookieManager: Error setting cookie', name, error);
      return false;
    }
  }

  /**
   * Get a cookie value with automatic JSON parsing
   * @param {string} name - Cookie name
   * @param {any} defaultValue - Default value if cookie doesn't exist
   * @returns {any} Cookie value or default value
   */
  get(name, defaultValue = null) {
    try {
      const value = Cookies.get(name);
      
      if (value === undefined) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('CookieManager: Error getting cookie', name, error);
      return defaultValue;
    }
  }

  /**
   * Remove a cookie
   * @param {string} name - Cookie name
   * @param {object} options - Cookie options (path, domain)
   */
  remove(name, options = {}) {
    try {
      const finalOptions = { path: '/', ...options };
      Cookies.remove(name, finalOptions);
      return true;
    } catch (error) {
      console.error('CookieManager: Error removing cookie', name, error);
      return false;
    }
  }

  /**
   * Check if a cookie exists
   * @param {string} name - Cookie name
   * @returns {boolean}
   */
  exists(name) {
    return Cookies.get(name) !== undefined;
  }

  /**
   * Get all cookies as an object
   * @returns {object} All cookies
   */
  getAll() {
    try {
      return Cookies.get();
    } catch (error) {
      console.error('CookieManager: Error getting all cookies', error);
      return {};
    }
  }

  /**
   * Clear all cookies (use with caution)
   */
  clearAll() {
    try {
      const allCookies = this.getAll();
      Object.keys(allCookies).forEach(name => {
        this.remove(name);
      });
      return true;
    } catch (error) {
      console.error('CookieManager: Error clearing all cookies', error);
      return false;
    }
  }

  // Predefined cookie categories for better organization
  
  /**
   * Authentication related cookies
   */
  auth = {
    setToken: (token, rememberMe = false) => {
      const expires = rememberMe ? 30 : 1; // 30 days if remember me, 1 day otherwise
      return this.set('auth_token', token, { expires, httpOnly: false });
    },
    
    getToken: () => this.get('auth_token'),
    
    removeToken: () => this.remove('auth_token'),
    
    setUserPreferences: (preferences) => {
      return this.set('user_preferences', preferences, { expires: 365 });
    },
    
    getUserPreferences: () => this.get('user_preferences', {}),
    
    setRememberMe: (remember) => {
      return this.set('remember_me', remember, { expires: 365 });
    },
    
    getRememberMe: () => this.get('remember_me', false)
  };

  /**
   * User experience and preferences
   */
  ux = {
    setLanguage: (language) => {
      return this.set('preferred_language', language, { expires: 365 });
    },
    
    getLanguage: () => this.get('preferred_language', 'en'),
    
    setTheme: (theme) => {
      return this.set('theme_preference', theme, { expires: 365 });
    },
    
    getTheme: () => this.get('theme_preference', 'light'),
    
    setFormData: (formId, data) => {
      return this.set(`form_data_${formId}`, data, { expires: 1 });
    },
    
    getFormData: (formId) => this.get(`form_data_${formId}`, {}),
    
    removeFormData: (formId) => this.remove(`form_data_${formId}`)
  };

  /**
   * Analytics and tracking
   */
  analytics = {
    setVisitorId: (visitorId) => {
      return this.set('visitor_id', visitorId, { expires: 365 });
    },
    
    getVisitorId: () => this.get('visitor_id'),
    
    setSessionStart: (timestamp) => {
      return this.set('session_start', timestamp, { expires: 1 });
    },
    
    getSessionStart: () => this.get('session_start'),
    
    trackPageView: (page) => {
      const views = this.get('page_views', []);
      views.push({ page, timestamp: Date.now() });
      // Keep only last 50 page views
      const recentViews = views.slice(-50);
      return this.set('page_views', recentViews, { expires: 7 });
    },
    
    getPageViews: () => this.get('page_views', []),
    
    setConversionData: (data) => {
      return this.set('conversion_data', data, { expires: 30 });
    },
    
    getConversionData: () => this.get('conversion_data', {})
  };

  /**
   * GDPR Compliance
   */
  consent = {
    setConsent: (consentData) => {
      return this.set('cookie_consent', consentData, { expires: 365 });
    },
    
    getConsent: () => this.get('cookie_consent', null),
    
    hasConsent: (category = 'necessary') => {
      const consent = this.get('cookie_consent', null);
      if (!consent) return category === 'necessary';
      return consent[category] === true;
    },
    
    revokeConsent: () => {
      this.remove('cookie_consent');
      // Remove non-essential cookies
      this.remove('visitor_id');
      this.remove('page_views');
      this.remove('conversion_data');
    }
  };
}

// Export singleton instance
const cookieManager = new CookieManager();
export default cookieManager;

// Named exports for specific use cases
export const { auth, ux, analytics, consent } = cookieManager;