// Global API request cache to prevent duplicate requests
class GlobalRequestCache {
  constructor() {
    this.cache = new Map();
    this.ongoingRequests = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Generate a cache key from URL and params
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((sorted, key) => {
      sorted[key] = params[key];
      return sorted;
    }, {});
    return `${url}_${JSON.stringify(sortedParams)}`;
  }

  // Get cached data if available and not expired
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
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

  // Get or create a request promise to prevent duplicate requests
  async getOrFetch(key, fetchFunction) {
    // Check cache first
    const cached = this.get(key);
    if (cached) {
      console.log(`🎯 Cache HIT for ${key}`);
      return cached;
    }

    // Check if request is already ongoing
    if (this.ongoingRequests.has(key)) {
      console.log(`⏳ Waiting for ongoing request: ${key}`);
      return this.ongoingRequests.get(key);
    }

    // Create new request
    const requestPromise = this.executeRequest(key, fetchFunction);
    this.ongoingRequests.set(key, requestPromise);

    return requestPromise;
  }

  async executeRequest(key, fetchFunction) {
    try {
      console.log(`🌐 Making API request: ${key}`);
      const result = await fetchFunction();
      
      // Cache the result
      this.set(key, result);
      
      return result;
    } catch (error) {
      console.error(`❌ API request failed for ${key}:`, error);
      throw error;
    } finally {
      // Remove from ongoing requests
      this.ongoingRequests.delete(key);
    }
  }

  // Clear specific cache entry
  invalidate(key) {
    this.cache.delete(key);
    this.ongoingRequests.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ongoingRequests.clear();
  }

  // Get cache stats
  getStats() {
    return {
      cacheSize: this.cache.size,
      ongoingRequests: this.ongoingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Create global instance
const globalCache = new GlobalRequestCache();

// Enhanced API wrapper that uses the global cache
export const cachedApi = {
  // Generic cached request method
  async request(url, options = {}, cacheKey = null) {
    const { api } = await import('../services/api');
    const key = cacheKey || globalCache.generateKey(url, options);
    
    return globalCache.getOrFetch(key, async () => {
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE') {
        // Don't cache write operations
        return api.request(url, options);
      }
      
      return api.get(url);
    });
  },

  // Cached conversations request
  async getConversations(userId, userRole, forceRefresh = false) {
    if (forceRefresh) {
      const key = globalCache.generateKey('/messages/conversations', { userId, userRole });
      globalCache.invalidate(key);
    }

    return this.request('/messages/conversations', {}, `conversations_${userId}_${userRole}`);
  },

  // Cached membership request  
  async getMembership(userId, forceRefresh = false) {
    if (forceRefresh) {
      const key = globalCache.generateKey('/users/membership', { userId });
      globalCache.invalidate(key);
    }

    return this.request('/users/membership', {}, `membership_${userId}`);
  },

  // Cached membership tiers request
  async getMembershipTiers(forceRefresh = false) {
    if (forceRefresh) {
      globalCache.invalidate('membership_tiers');
    }

    return this.request('/membership/tiers', {}, 'membership_tiers');
  },

  // Invalidate related caches when membership changes
  invalidateMembershipCache(userId) {
    globalCache.invalidate(`membership_${userId}`);
    globalCache.invalidate('membership_tiers');
  },

  // Invalidate conversation cache when messages change
  invalidateConversationCache(userId, userRole) {
    globalCache.invalidate(`conversations_${userId}_${userRole}`);
  },

  // Get cache statistics
  getCacheStats() {
    return globalCache.getStats();
  }
};

export default globalCache;
