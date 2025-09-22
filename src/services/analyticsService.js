import cookieManager from '../utils/cookieManager';

/**
 * Analytics and Business Intelligence Service
 * Tracks user behavior, conversion funnels, and business metrics
 */
class AnalyticsService {
  constructor() {
    this.sessionId = null;
    this.isInitialized = false;
    this.eventQueue = [];
  }

  /**
   * Initialize analytics tracking
   */
  initialize() {
    if (!cookieManager.consent.hasConsent('analytics')) {
      console.log('Analytics tracking disabled - no consent');
      return false;
    }

    // Generate session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get or create visitor ID
    let visitorId = cookieManager.analytics.getVisitorId();
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cookieManager.analytics.setVisitorId(visitorId);
    }

    // Set session start
    cookieManager.analytics.setSessionStart(Date.now());

    this.isInitialized = true;
    
    // Process any queued events
    this.processEventQueue();

    console.log('Analytics initialized:', { sessionId: this.sessionId, visitorId });
    return true;
  }

  /**
   * Process queued events
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.trackEvent(event.type, event.data);
    }
  }

  /**
   * Track custom events
   */
  trackEvent(eventType, eventData = {}) {
    if (!this.isInitialized) {
      this.eventQueue.push({ type: eventType, data: eventData });
      return;
    }

    if (!cookieManager.consent.hasConsent('analytics')) {
      return;
    }

    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      visitorId: cookieManager.analytics.getVisitorId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Store in cookies (last 50 events)
    const events = cookieManager.get('analytics_events', []);
    events.push(event);
    const recentEvents = events.slice(-50);
    cookieManager.set('analytics_events', recentEvents, { expires: 7 });

    console.log('Analytics event tracked:', event);
  }

  /**
   * Track page views
   */
  trackPageView(page = window.location.pathname, title = document.title) {
    cookieManager.analytics.trackPageView(page);
    this.trackEvent('page_view', {
      page,
      title,
      timestamp: Date.now()
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(element, action, details = {}) {
    this.trackEvent('user_interaction', {
      element,
      action,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Track business conversions
   */
  trackConversion(conversionType, value = 0, currency = 'SGD', details = {}) {
    const conversionData = {
      type: conversionType,
      value,
      currency,
      details,
      timestamp: Date.now()
    };

    cookieManager.analytics.setConversionData(conversionData);
    this.trackEvent('conversion', conversionData);
  }

  /**
   * Track user registration funnel
   */
  trackRegistrationFunnel(step, role = 'customer', details = {}) {
    this.trackEvent('registration_funnel', {
      step,
      role,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Track form interactions
   */
  trackFormEvent(formId, action, fieldName = null, details = {}) {
    this.trackEvent('form_interaction', {
      formId,
      action, // 'start', 'field_change', 'validation_error', 'submit', 'complete'
      fieldName,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Track search behavior
   */
  trackSearch(query, resultsCount = 0, filters = {}) {
    this.trackEvent('search', {
      query,
      resultsCount,
      filters,
      timestamp: Date.now()
    });
  }

  /**
   * Track service bookings
   */
  trackServiceBooking(step, serviceType, amount = 0, details = {}) {
    this.trackEvent('service_booking', {
      step, // 'initiated', 'service_selected', 'details_filled', 'payment_started', 'completed'
      serviceType,
      amount,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Track user engagement metrics
   */
  trackEngagement() {
    const sessionStart = cookieManager.analytics.getSessionStart();
    const sessionDuration = Date.now() - sessionStart;

    this.trackEvent('engagement', {
      sessionDuration,
      pageViews: cookieManager.analytics.getPageViews().length,
      timestamp: Date.now()
    });
  }

  /**
   * Track errors and performance issues
   */
  trackError(errorType, errorMessage, stackTrace = null) {
    this.trackEvent('error', {
      type: errorType,
      message: errorMessage,
      stack: stackTrace,
      timestamp: Date.now()
    });
  }

  /**
   * Get analytics data for reporting
   */
  getAnalyticsData() {
    if (!cookieManager.consent.hasConsent('analytics')) {
      return null;
    }

    return {
      visitorId: cookieManager.analytics.getVisitorId(),
      sessionId: this.sessionId,
      sessionStart: cookieManager.analytics.getSessionStart(),
      pageViews: cookieManager.analytics.getPageViews(),
      conversionData: cookieManager.analytics.getConversionData(),
      events: cookieManager.get('analytics_events', [])
    };
  }

  /**
   * Clear analytics data (GDPR compliance)
   */
  clearAnalyticsData() {
    cookieManager.remove('visitor_id');
    cookieManager.remove('session_start');
    cookieManager.remove('page_views');
    cookieManager.remove('conversion_data');
    cookieManager.remove('analytics_events');
    
    this.sessionId = null;
    this.isInitialized = false;
    this.eventQueue = [];
  }

  /**
   * Get user journey data
   */
  getUserJourney() {
    const pageViews = cookieManager.analytics.getPageViews();
    const events = cookieManager.get('analytics_events', []);
    
    return {
      pageViews,
      events,
      sessionStart: cookieManager.analytics.getSessionStart(),
      totalDuration: Date.now() - cookieManager.analytics.getSessionStart()
    };
  }

  /**
   * Track A/B test participation
   */
  trackABTest(testName, variant, details = {}) {
    this.trackEvent('ab_test', {
      testName,
      variant,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Track business KPIs
   */
  trackKPI(kpiName, value, unit = null, context = {}) {
    this.trackEvent('kpi', {
      name: kpiName,
      value,
      unit,
      context,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();

// Auto-initialize if consent is given
if (cookieManager.consent.hasConsent('analytics')) {
  analyticsService.initialize();
}

export default analyticsService;