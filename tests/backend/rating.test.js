const axios = require('axios');

describe('Rating System Tests', () => {
  const API_BASE = global.TEST_CONFIG.API_BASE_URL;
  let authToken = null;
  let testVendorId = null;

  beforeAll(async () => {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: global.TEST_CONFIG.TEST_ADMIN_EMAIL,
        password: global.TEST_CONFIG.TEST_ADMIN_PASSWORD
      });
      authToken = loginResponse.data.token;

      // Get a vendor for testing
      const vendorsResponse = await axios.get(`${API_BASE}/admin/users?role=vendor&limit=1`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (vendorsResponse.data.users.length > 0) {
        testVendorId = vendorsResponse.data.users[0]._id;
      }
    } catch (error) {
      console.error('Failed to setup rating tests:', error.message);
      throw error;
    }
  });

  describe('Rating Integration in User Management', () => {
    test('should include rating data for vendors', async () => {
      if (!testVendorId) {
        console.log('No test vendor available, skipping rating integration test');
        return;
      }

      const response = await axios.get(`${API_BASE}/admin/users?role=vendor`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      // Find our test vendor
      const testVendor = response.data.users.find(user => user._id === testVendorId);
      
      if (testVendor) {
        // Check if vendor has accurate rating data (may be null if no ratings)
        if (testVendor.accurateRating) {
          expect(testVendor.accurateRating).toHaveProperty('averageRating');
          expect(testVendor.accurateRating).toHaveProperty('totalRatings');
          expect(testVendor.accurateRating).toHaveProperty('ratingDistribution');
          
          // Validate rating values
          expect(testVendor.accurateRating.averageRating).toBeGreaterThanOrEqual(0);
          expect(testVendor.accurateRating.averageRating).toBeLessThanOrEqual(5);
          expect(testVendor.accurateRating.totalRatings).toBeGreaterThanOrEqual(0);
          
          // Check rating distribution structure
          const distribution = testVendor.accurateRating.ratingDistribution;
          expect(distribution).toHaveProperty('1');
          expect(distribution).toHaveProperty('2');
          expect(distribution).toHaveProperty('3');
          expect(distribution).toHaveProperty('4');
          expect(distribution).toHaveProperty('5');
        }
      }
    });

    test('should handle vendors without ratings gracefully', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?role=vendor`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      // Test should pass even if vendors don't have ratings
      response.data.users.forEach(vendor => {
        // Either has accurate rating or doesn't, both are valid
        if (vendor.accurateRating) {
          expect(typeof vendor.accurateRating.averageRating).toBe('number');
          expect(typeof vendor.accurateRating.totalRatings).toBe('number');
        }
        // If no accurateRating, that's also fine - means no ratings yet
      });
    });
  });

  describe('Rating Calculation Accuracy', () => {
    test('should calculate ratings correctly when ratings exist', async () => {
      const response = await axios.get(`${API_BASE}/admin/users?role=vendor`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const vendorsWithRatings = response.data.users.filter(vendor => 
        vendor.accurateRating && vendor.accurateRating.totalRatings > 0
      );

      vendorsWithRatings.forEach(vendor => {
        const rating = vendor.accurateRating;
        
        // Average rating should be between 1-5 if there are ratings
        expect(rating.averageRating).toBeGreaterThanOrEqual(1);
        expect(rating.averageRating).toBeLessThanOrEqual(5);
        
        // Total ratings should be positive
        expect(rating.totalRatings).toBeGreaterThan(0);
        
        // Rating distribution should sum to total ratings
        const distributionSum = Object.values(rating.ratingDistribution)
          .reduce((sum, count) => sum + count, 0);
        expect(distributionSum).toBe(rating.totalRatings);
      });
    });
  });
});
