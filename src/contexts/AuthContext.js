import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中是否有用户信息
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // 模拟API调用
      // 在实际应用中，这里会调用后端API
      const mockUser = {
        id: 1,
        name: '张三',
        email: email,
        role: 'customer', // customer, vendor, admin
        avatar: null,
        phone: '+60 12-345 6789',
        address: '马来西亚吉隆坡',
        wallet: {
          balance: 150.00,
          currency: 'MYR'
        },
        referralCode: 'SF123456',
        referralCount: 5,
        referralEarnings: 50.00
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // 模拟API调用
      const mockUser = {
        id: 2,
        name: userData.name,
        email: userData.email,
        role: 'customer',
        avatar: null,
        phone: userData.phone,
        address: userData.address,
        wallet: {
          balance: 0.00,
          currency: 'MYR'
        },
        referralCode: `SF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        referralCount: 0,
        referralEarnings: 0.00
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const vendorRegister = async (vendorData) => {
    try {
      // 模拟API调用
      const mockVendor = {
        id: 3,
        name: vendorData.name,
        email: vendorData.email,
        role: 'vendor',
        avatar: null,
        phone: vendorData.phone,
        address: vendorData.address,
        services: vendorData.services,
        experience: vendorData.experience,
        status: 'pending', // pending, approved, rejected
        rating: 0,
        totalJobs: 0,
        earnings: 0.00,
        wallet: {
          balance: 0.00,
          currency: 'MYR'
        }
      };

      return { success: true, vendor: mockVendor };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    vendorRegister,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 