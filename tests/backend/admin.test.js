const axios = require('axios');

describe('Admin User Management API Tests', () => {
  const API_BASE = global.TEST_CONFIG.API_BASE_URL;
  let authToken = null;

  beforeAll(async () => {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: global.TEST_CONFIG.TEST_ADMIN_EMAIL,
        password: global.TEST_CONFIG.TEST_ADMIN_PASSWORD
      });
      authToken = loginResponse.data.token;
    } catch (error) {
      console.error('Failed to login for admin tests:', error.message);
      throw error;
    }
  });

  describe('GET /admin/users', () => {
    test('should fetch all users successfully', async () => {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('users');
      expect(response.data).toHaveProperty('totalPages');
      expect(response.data).toHaveProperty('currentPage');
      expect(response.data).toHaveProperty('total');
      expect(Array.isArray(response.data.users)).toBe(true);
    });

    test('should filter users by role', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?role=vendor`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.users.every(user => user.role === 'vendor')).toBe(true);
    });

    test('should fetch vendors with accurate rating data', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?role=vendor`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const vendorsWithRatings = response.data.users.filter(user => user.accurateRating);
      
      if (vendorsWithRatings.length > 0) {
        vendorsWithRatings.forEach(vendor => {
          expect(vendor.accurateRating).toHaveProperty('averageRating');
          expect(vendor.accurateRating).toHaveProperty('totalRatings');
          expect(vendor.accurateRating).toHaveProperty('ratingDistribution');
          expect(typeof vendor.accurateRating.averageRating).toBe('number');
          expect(typeof vendor.accurateRating.totalRatings).toBe('number');
          expect(vendor.accurateRating.averageRating).toBeGreaterThanOrEqual(0);
          expect(vendor.accurateRating.averageRating).toBeLessThanOrEqual(5);
        });
      }
    });

    test('should support pagination', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.users.length).toBeLessThanOrEqual(5);
      expect(response.data.currentPage).toBe(1);
    });

    test('should support search functionality', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?search=admin`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      // Should find admin user
      const hasAdminUser = response.data.users.some(user => 
        user.email.includes('admin') || 
        user.firstName.toLowerCase().includes('admin') ||
        user.lastName.toLowerCase().includes('admin')
      );
      expect(hasAdminUser).toBe(true);
    });
  });

  describe('PUT /admin/users/:id', () => {
    let testUserId = null;

    beforeAll(async () => {
      // Get a user to update (preferably a vendor)
      const response = await axios.get(`${API_BASE}/admin/users?role=vendor&limit=1`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.users.length > 0) {
        testUserId = response.data.users[0]._id;
      }
    });

    test('should update user information successfully', async () => {
      if (!testUserId) {
        console.log('No test user available, skipping user update test');
        return;
      }

      const updateData = {
        firstName: 'Updated',
        lastName: 'Vendor',
        email: 'updated.vendor@test.com'
      };

      const response = await axios.put(`${API_BASE}/admin/users/${testUserId}`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.firstName).toBe(updateData.firstName);
      expect(response.data.user.lastName).toBe(updateData.lastName);
    });

    test('should update vendor skills', async () => {
      if (!testUserId) {
        console.log('No test user available, skipping vendor skills test');
        return;
      }

      const updateData = {
        skills: ['plumbing', 'electrical']
      };

      const response = await axios.put(`${API_BASE}/admin/users/${testUserId}`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.user.skills).toEqual(expect.arrayContaining(updateData.skills));
    });

    test('should reject invalid user ID', async () => {
      await expect(
        axios.put(`${API_BASE}/admin/users/invalid-id`, { firstName: 'Test' }, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ).rejects.toMatchObject({
        response: { status: 400 }
      });
    });
  });
});
