// Simple API cache utility to prevent excessive requests
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Get cached data if available and not expired
  get(key, maxAge = 300000) { // Default 5 minutes
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Set data in cache
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Remove from cache
  delete(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Debounce API calls - prevents multiple identical requests
  async debounce(key, apiCall, debounceTime = 1000) {
    // If there's already a pending request for this key, return that promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const requestPromise = new Promise(async (resolve, reject) => {
      try {
        // Wait for debounce time
        await new Promise(res => setTimeout(res, debounceTime));
        
        // Make the actual API call
        const result = await apiCall();
        
        // Cache the result
        this.set(key, result);
        
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(key);
      }
    });

    // Store the pending request
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }
}

// Global instance
export const apiCache = new ApiCache();

// Utility functions for specific API calls
export const getCachedConversations = async (userId, userRole, forceRefresh = false) => {
  const cacheKey = `conversations_${userId}_${userRole}`;
  
  // Return cached data if available and not force refresh
  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // If force refresh or no cache, make API call with debounce
  const { api } = await import('../services/api');
  
  return apiCache.debounce(cacheKey, async () => {
    if (userRole === 'admin') {
      return await api.get('/messages/support/conversations');
    } else {
      return await api.messages.getConversations();
    }
  }, 500); // 500ms debounce
};

export default apiCache;
