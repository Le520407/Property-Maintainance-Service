import React, { useEffect } from 'react';
import { api } from '../../services/api';

const VendorTest = () => {
  useEffect(() => {
    const testVendorAPI = async () => {
      try {
        console.log('Testing vendor dashboard API...');
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        if (token) {
          // Decode token to check role
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('User role:', payload.role);
          console.log('User ID:', payload._id);
        }
        
        const response = await api.get('/vendor/dashboard');
        console.log('API Response:', response);
      } catch (error) {
        console.error('API Error:', error);
        console.error('Error message:', error.message);
      }
    };

    testVendorAPI();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vendor API Test</h1>
      <p>Check the browser console for API test results.</p>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Debug Info:</h2>
        <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
        <p>API URL: http://localhost:5000/api</p>
      </div>
    </div>
  );
};

export default VendorTest;