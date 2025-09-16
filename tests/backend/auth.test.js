const axios = require('axios');

describe('Authentication API Tests', () => {
  const API_BASE = global.TEST_CONFIG.API_BASE_URL;
  let authToken = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('POST /auth/login', () => {
    test('should login with valid admin credentials', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: global.TEST_CONFIG.TEST_ADMIN_EMAIL,
          password: global.TEST_CONFIG.TEST_ADMIN_PASSWORD
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
        expect(response.data.user.role).toBe('admin');
        
        // Store token for other tests
        authToken = response.data.token;
        global.TEST_AUTH_TOKEN = authToken;
      } catch (error) {
        console.error('Login test failed:', error.message);
        if (error.response) {
          console.error('Response:', error.response.data);
        }
        throw error;
      }
    });

    test('should reject invalid credentials', async () => {
      await expect(
        axios.post(`${API_BASE}/auth/login`, {
          email: 'invalid@email.com',
          password: 'wrongpassword'
        })
      ).rejects.toMatchObject({
        response: { status: 401 }
      });
    });

    test('should reject missing credentials', async () => {
      await expect(
        axios.post(`${API_BASE}/auth/login`, {})
      ).rejects.toMatchObject({
        response: { status: 400 }
      });
    });
  });

  describe('Authentication Token Validation', () => {
    test('should accept valid token for protected routes', async () => {
      if (!authToken) {
        throw new Error('No auth token available from login test');
      }

      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('users');
    });

    test('should reject requests without token', async () => {
      await expect(
        axios.get(`${API_BASE}/admin/users`)
      ).rejects.toMatchObject({
        response: { status: 401 }
      });
    });

    test('should reject requests with invalid token', async () => {
      await expect(
        axios.get(`${API_BASE}/admin/users`, {
          headers: { Authorization: 'Bearer invalid-token' }
        })
      ).rejects.toMatchObject({
        response: { status: 401 }
      });
    });
  });
});
