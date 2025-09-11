// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Request interceptor
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  console.log('🔍 API Debug - Endpoint:', endpoint);
  console.log('🔍 API Debug - Token exists:', !!token);
  console.log('🔍 API Debug - Options:', options);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log('🔍 API Debug - Final config:', config);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API methods
export const api = {
  // Generic HTTP methods
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (endpoint, data) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => request(endpoint, {
    method: 'DELETE',
  }),

  // File upload with multipart/form-data
  uploadFiles: (endpoint, formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  // Authentication related
  auth: {
    // User registration
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
    // Technician registration
    registerTechnician: (technicianData) => request('/auth/register-technician', {
      method: 'POST',
      body: JSON.stringify(technicianData),
    }),
    
    // User login
    login: (credentials) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    
    // Get current user
    getCurrentUser: () => request('/auth/me'),
    
    // Refresh token
    refreshToken: () => request('/auth/refresh', {
      method: 'POST',
    }),
    
    // Logout
    logout: () => request('/auth/logout', {
      method: 'POST',
    }),
    
    // Forgot password
    forgotPassword: (email) => request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    
    // Reset password
    resetPassword: (token, newPassword) => request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  },
  
  // User related
  users: {
    // Get user profile
    getProfile: () => request('/users/profile'),
    
    // Update user profile
    updateProfile: (profileData) => request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    
    // Change password
    changePassword: (passwordData) => request('/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),
    
    // Get technicians list
    getTechnicians: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/users/technicians?${queryString}`);
    },
    
    // Get technician details
    getTechnician: (id) => request(`/users/technicians/${id}`),
    
    // Update technician hourly rate
    updateHourlyRate: (hourlyRate) => request('/users/technician/rate', {
      method: 'PUT',
      body: JSON.stringify({ hourlyRate }),
    }),
    
    // Update technician skills
    updateSkills: (skills) => request('/users/technician/skills', {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    }),
  },
  
  // Admin functions
  admin: {
    // Get all users
    getAllUsers: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/admin/users?${queryString}`);
    },
    
    // Create user
    createUser: (userData) => request('/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
    // Update user status
    updateUserStatus: (userId, status) => request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    
    // Update user role
    updateUserRole: (userId, role) => request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
    
    // Delete user
    deleteUser: (userId) => request(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
    
    // Get system statistics
    getStats: () => request('/admin/stats'),
    
    // Referral system management
    referrals: {
      // Get referral system overview
      getOverview: () => request('/admin/referrals/overview'),
      
      // Get all referrals
      getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/referrals?${queryString}`);
      },
      
      // Get referral details
      getDetails: (id) => request(`/admin/referrals/${id}`),
      
      // Get commission list
      getCommissions: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/commissions?${queryString}`);
      },
      
      // Update commission status
      updateCommissionStatus: (id, statusData) => request(`/admin/commissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),
      
      // Get payout requests
      getPayouts: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/payouts?${queryString}`);
      },
      
      // Update payout status
      updatePayoutStatus: (id, statusData) => request(`/admin/payouts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),
      
      // Update referral tier
      updateTier: (id, tier) => request(`/admin/referrals/${id}/tier`, {
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      }),
      
      // Toggle referral status
      toggleStatus: (id) => request(`/admin/referrals/${id}/toggle-status`, {
        method: 'PATCH',
      }),
    },
    
    // Vendor verification management
    vendors: {
      // Get pending vendors
      getPending: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/vendors/pending?${queryString}`);
      },
      
      // Get all vendors
      getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/vendors?${queryString}`);
      },
      
      // Get vendor details
      getDetails: (vendorId) => request(`/admin/vendors/${vendorId}`),
      
      // Verify/reject vendor
      verify: (vendorId, verificationData) => request(`/admin/vendors/${vendorId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(verificationData),
      }),
      
      // Suspend/resume vendor
      suspend: (vendorId, suspendData) => request(`/admin/vendors/${vendorId}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify(suspendData),
      }),
      
      // Get verification statistics
      getVerificationStats: () => request('/admin/vendors/stats/verification'),
      
      // Get vendor job records
      getJobs: (vendorId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/vendors/${vendorId}/jobs?${queryString}`);
      },
      
      // Get vendor rating records
      getRatings: (vendorId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/admin/vendors/${vendorId}/ratings?${queryString}`);
      },
    },
  },
  
  // Referral system - User side
  referral: {
    // Generate referral code
    generateCode: () => request('/referral/generate-code', {
      method: 'POST',
    }),
    
    // Apply referral code
    applyCode: (referralCode, userId) => request('/referral/apply-code', {
      method: 'POST',
      body: JSON.stringify({ referralCode, userId }),
    }),
    
    // Get referral dashboard
    getDashboard: () => request('/referral/dashboard'),
    
    // Process commission
    processCommission: (commissionData) => request('/referral/process-commission', {
      method: 'POST',
      body: JSON.stringify(commissionData),
    }),
    
    // Get commission history
    getCommissions: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/referral/commissions?${queryString}`);
    },
    
    // Request payout
    requestPayout: (payoutData) => request('/referral/request-payout', {
      method: 'POST',
      body: JSON.stringify(payoutData),
    }),
    
    // Get payout history
    getPayouts: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/referral/payouts?${queryString}`);
    },
    
    // Get share link
    getShareLink: () => request('/referral/share-link'),

    // Get wallet information
    getWallet: () => request('/referral/wallet'),

    // Get fraud alerts
    getFraudAlerts: () => request('/referral/fraud-alerts'),

    // Generate advanced referral link
    generateAdvancedLink: (linkData) => request('/referral/generate-link', {
      method: 'POST',
      body: JSON.stringify(linkData),
    }),

    // Get referral links
    getLinks: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/referral/links?${queryString}`);
    },

    // Update referral link
    updateLink: (linkId, updateData) => request(`/referral/links/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),

    // Get link clicks
    getLinkClicks: (linkId, params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/referral/links/${linkId}/clicks?${queryString}`);
    },

    // Get analytics
    getAnalytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/referral/analytics?${queryString}`);
    },
  },
  
  // Service related
  services: {
    // Get services list
    getServices: () => request('/services'),
    
    // Get service details
    getService: (id) => request(`/services/${id}`),
  },

  // Job/Order related
  jobs: {
    // Create job/order
    create: (jobData) => request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
    
    // Get user's jobs
    getUserJobs: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/jobs/my-orders?${queryString}`);
    },
    
    // Get job details (backward compatibility)
    getJob: (id) => request(`/jobs/${id}`),
    
    // Get job by ID
    getById: (id) => request(`/jobs/${id}`),
    
    // Update job
    updateJob: (id, jobData) => request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    }),
    
    // Cancel job
    cancelJob: (id, reason) => request(`/jobs/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
    
    // Submit rating for a job
    submitRating: (jobId, ratingData) => request(`/jobs/${jobId}/rating`, {
      method: 'POST',
      body: JSON.stringify(ratingData),
    }),
    
    // Get rating for a job
    getRating: (jobId) => request(`/jobs/${jobId}/rating`),
    
    // Upload rating images
    uploadRatingImages: (images) => {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', image.file || image);
      });
      return api.uploadFiles('/upload/rating-images', formData);
    },
  },
  
  // Vendor related
  vendor: {
    // Register vendor
    register: (vendorData) => request('/vendor/register', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    }),
    
    // Get vendor profile
    getProfile: () => request('/vendor/profile'),
    
    // Update vendor profile
    updateProfile: (profileData) => request('/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    
    // Get vendor dashboard data
    getDashboard: () => request('/vendor/dashboard'),
    
    // Get vendor job list
    getJobs: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/vendor/jobs?${queryString}`);
    },
    
    // Update job status
    updateJobStatus: (jobId, statusData) => request(`/vendor/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
    
    // Accept/reject job assignment
    respondToJob: (jobId, responseData) => request(`/vendor/jobs/${jobId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(responseData),
    }),
    
    // Update job progress
    updateJobProgress: (jobId, progressData) => request(`/vendor/jobs/${jobId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(progressData),
    }),
    
    // Get vendor ratings
    getRatings: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/vendor/ratings?${queryString}`);
    },
    
    // Respond to rating
    respondToRating: (ratingId, responseData) => request(`/vendor/ratings/${ratingId}/respond`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    }),
    
    // Get analytics data
    getAnalytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/vendor/analytics?${queryString}`);
    },
    
    // Get customer list
    getCustomers: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/vendor/customers?${queryString}`);
    },
    
    // Get customer details
    getCustomerDetails: (customerId) => request(`/vendor/customers/${customerId}`),
  },

  // CMS related
  cms: {
    // Blog management
    blogs: {
      // Get all blogs (for admin)
      getAll: () => request('/cms/blogs'),
      
      // Get published blogs (public API)
      getPublished: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/cms/blogs/published?${queryString}`);
      },
      
      // Get blog by slug
      getBySlug: (slug) => request(`/cms/blogs/slug/${slug}`),
      
      // Create blog
      create: (blogData) => request('/cms/blogs', {
        method: 'POST',
        body: JSON.stringify(blogData),
      }),
      
      // Update blog
      update: (id, blogData) => request(`/cms/blogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(blogData),
      }),
      
      // Delete blog
      delete: (id) => request(`/cms/blogs/${id}`, {
        method: 'DELETE',
      }),
    },
    
    // FAQ management
    faqs: {
      // Get all FAQs
      getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/cms/faqs?${queryString}`);
      },
      
      // Create FAQ
      create: (faqData) => request('/cms/faqs', {
        method: 'POST',
        body: JSON.stringify(faqData),
      }),
      
      // Update FAQ
      update: (id, faqData) => request(`/cms/faqs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(faqData),
      }),
      
      // Delete FAQ
      delete: (id) => request(`/cms/faqs/${id}`, {
        method: 'DELETE',
      }),
      
      // FAQ voting
      vote: (id, helpful) => request(`/cms/faqs/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful }),
      }),
    },
  },

  // Messages related
  messages: {
    // Get conversations for current user
    getConversations: () => request('/messages/conversations'),
    
    // Get messages for a conversation
    getMessages: (conversationId) => request(`/messages/conversations/${conversationId}/messages`),
    
    // Send a message
    sendMessage: (conversationId, messageData) => request(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
    
    // Create a new conversation
    createConversation: (conversationData) => request('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    }),
    
    // Mark messages as read
    markAsRead: (conversationId) => request(`/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),
  },

  // Cart API methods
  cart: {
    // Get user's cart
    get: () => request('/cart'),
    
    // Add item to cart
    add: (item) => request('/cart/add', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
    
    // Update item quantity
    updateQuantity: (productId, quantity) => request(`/cart/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
    
    // Remove item from cart
    remove: (productId) => request(`/cart/remove/${productId}`, {
      method: 'DELETE',
    }),
    
    // Clear entire cart
    clear: () => request('/cart/clear', {
      method: 'DELETE',
    }),
    
    // Sync cart from localStorage
    sync: (items) => request('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  },

  // Customer related
  customer: {
    // Respond to quote (accept/reject)
    respondToQuote: (jobId, response) => request(`/jobs/${jobId}/quote-response`, {
      method: 'PATCH',
      body: JSON.stringify(response),
    }),
    
    // Get customer jobs
    getJobs: (status) => {
      const params = status ? `?status=${status}` : '';
      return request(`/jobs/my-orders${params ? `${params}` : ''}`);
    },
  },
};

// Utility functions
export const apiUtils = {
  // Set token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Remove token
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  // Check if token is valid
  isTokenValid: (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  },
  
  // Handle API errors
  handleError: (error) => {
    if (error.message.includes('401')) {
      // Unauthorized, clear token and redirect to login page
      apiUtils.removeToken();
      window.location.href = '/login';
    }
    return error.message;
  },
};

export default api;