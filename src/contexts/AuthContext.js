import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, apiUtils } from '../services/api';

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
    // 检查token和用户信息
    const token = apiUtils.getToken();
    const savedUser = localStorage.getItem('user');
    
    if (token && apiUtils.isTokenValid(token) && savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (token && !apiUtils.isTokenValid(token)) {
      // Token过期，清除本地数据
      apiUtils.removeToken();
      localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.auth.login({ email, password });
      
      // 保存token
      apiUtils.setToken(response.token);
      
      // 转换用户数据格式以匹配前端期望
      const userData = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
        status: response.user.status,
        avatar: response.user.avatar,
        phone: response.user.phone,
        address: response.user.city || 'Singapore',
        wallet: {
          balance: response.user.totalSpent || 0,
          currency: 'SGD'
        },
        referralCode: `SF${String(response.user._id || response.user.id).slice(0, 8).toUpperCase()}`,
        referralCount: 0,
        referralEarnings: 0,
        // 管理员特定数据
        ...(response.user.role === 'admin' && {
          permissions: response.user.permissions || [],
          isSuper: response.user.isSuper || false
        }),
        // 技术员特定数据
        ...(response.user.role === 'technician' && {
          skills: response.user.skills || [],
          experience: response.user.experience || 0,
          hourlyRate: response.user.hourlyRate || 0,
          rating: response.user.rating || 0,
          totalReviews: response.user.totalReviews || 0,
          completedJobs: response.user.completedJobs || 0,
          subscriptionPlan: response.user.subscriptionPlan || 'basic'
        }),
        // 客户特定数据
        ...(response.user.role === 'customer' && {
          totalSpent: response.user.totalSpent || 0,
          totalBookings: response.user.totalBookings || 0
        })
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.auth.register({
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: 'customer',
        city: userData.address,
        country: 'Singapore'
      });
      
      // 保存token
      apiUtils.setToken(response.token);
      
      // 转换用户数据格式
      const userDataFormatted = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
        avatar: null,
        phone: userData.phone,
        address: userData.address,
        wallet: {
          balance: 0.00,
          currency: 'SGD'
        },
        referralCode: `SF${String(response.user._id || response.user.id).slice(0, 8).toUpperCase()}`,
        referralCount: 0,
        referralEarnings: 0.00
      };

      setUser(userDataFormatted);
      localStorage.setItem('user', JSON.stringify(userDataFormatted));
      return { success: true, user: userDataFormatted };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const vendorRegister = async (vendorData) => {
    try {
      const response = await api.auth.registerTechnician({
        firstName: vendorData.name.split(' ')[0],
        lastName: vendorData.name.split(' ').slice(1).join(' ') || '',
        email: vendorData.email,
        phone: vendorData.phone,
        password: vendorData.password,
        city: vendorData.address,
        country: 'Singapore',
        skills: vendorData.services || [],
        experience: vendorData.experience || 0,
        hourlyRate: vendorData.hourlyRate || 0
      });
      
      // 保存token
      apiUtils.setToken(response.token);
      
      // 转换技术员数据格式
      const vendorDataFormatted = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: 'technician',
        avatar: null,
        phone: vendorData.phone,
        address: vendorData.address,
        services: vendorData.services || [],
        experience: vendorData.experience || 0,
        status: response.user.status,
        rating: 0,
        totalJobs: 0,
        earnings: 0.00,
        wallet: {
          balance: 0.00,
          currency: 'SGD'
        },
        skills: response.user.skills || [],
        hourlyRate: response.user.hourlyRate || 0
      };

      return { success: true, vendor: vendorDataFormatted };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const logout = async () => {
    try {
      // 调用后端登出API
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // 清除本地数据
      setUser(null);
      apiUtils.removeToken();
      localStorage.removeItem('user');
    }
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