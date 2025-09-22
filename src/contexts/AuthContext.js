import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, apiUtils } from '../services/api';
import cookieManager from '../utils/cookieManager';

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

  const refreshUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.user) {
        // Convert server user data to frontend format
        const userData = {
          id: response.user._id || response.user.id,
          name: response.user.fullName,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role,
          status: response.user.status,
          avatar: response.user.avatar,
          phone: response.user.phone,
          address: response.user.address || '',
          city: response.user.city || '',
          state: response.user.state || '',
          zipCode: response.user.zipCode || '',
          country: response.user.country || 'Singapore',
          tacEnabled: response.user.tacEnabled || false,
          wallet: {
            balance: response.user.totalSpent || 0,
            currency: 'SGD'
          },
          referralCode: `SF${String(response.user._id || response.user.id).slice(0, 8).toUpperCase()}`,
          referralCount: 0,
          referralEarnings: 0,
          // Admin specific data
          ...(response.user.role === 'admin' && {
            permissions: response.user.permissions || [],
            isSuper: response.user.isSuper || false
          }),
          // Technician/vendor specific data
          ...((['technician', 'vendor'].includes(response.user.role)) && {
            skills: response.user.skills || [],
            experience: response.user.experience || 0,
            hourlyRate: response.user.hourlyRate || 0,
            rating: response.user.rating || 0,
            totalReviews: response.user.totalReviews || 0,
            completedJobs: response.user.completedJobs || 0,
            subscriptionPlan: response.user.subscriptionPlan || 'basic'
          }),
          // Customer specific data
          ...(response.user.role === 'customer' && {
            totalBookings: response.user.totalBookings || 0,
            subscriptionPlan: response.user.subscriptionPlan || 'BASIC'
          })
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check token and user info
    const token = apiUtils.getToken() || cookieManager.auth.getToken();
    const savedUser = localStorage.getItem('user');
    
    if (token && apiUtils.isTokenValid(token)) {
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      // Refresh user data from server to get latest preferences
      refreshUserData().catch(console.error);
    } else if (token && !apiUtils.isTokenValid(token)) {
      // Token expired, clear local data
      apiUtils.removeToken();
      cookieManager.auth.removeToken();
      localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.auth.login({ email, password });
      
      // Save tokens with remember me preference
      apiUtils.setToken(response.token);
      if (cookieManager.consent.hasConsent('preferences')) {
        cookieManager.auth.setToken(response.token, rememberMe);
        cookieManager.auth.setRememberMe(rememberMe);
      }
      
      if (response.refreshToken) {
        apiUtils.setRefreshToken(response.refreshToken);
      }
      
      // 转换用户数据格式以匹配前端期望
      const userData = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: response.user.role,
        status: response.user.status,
        avatar: response.user.avatar,
        phone: response.user.phone,
        address: response.user.address || '',
        city: response.user.city || '',
        state: response.user.state || '',
        zipCode: response.user.zipCode || '',
        country: response.user.country || 'Malaysia',
        tacEnabled: response.user.tacEnabled || false,
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
        // 技术员/供应商特定数据
        ...((['technician', 'vendor'].includes(response.user.role)) && {
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
      
      // Save user preferences to cookies if consent given
      if (cookieManager.consent.hasConsent('preferences')) {
        cookieManager.auth.setUserPreferences({
          ...userData,
          lastLogin: Date.now()
        });
      }
      
      return { success: true, user: userData };
    } catch (error) {
      // Check if it's a TAC requirement error
      const errorMessage = apiUtils.handleError(error);
      if (error.message && error.message.includes('Two-Factor Authentication is required')) {
        return { success: false, error: errorMessage, requiresTAC: true };
      }
      return { success: false, error: errorMessage };
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
        address: userData.address,
        country: 'Malaysia',
        referralCode: userData.referralCode
      });
      
      // 保存token
      apiUtils.setToken(response.token);
      
      // 转换用户数据格式
      const userDataFormatted = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
        status: response.user.status || 'ACTIVE',
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
        address: vendorData.address,
        country: 'Malaysia',
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
      // 清除本地数据和cookies
      setUser(null);
      apiUtils.removeToken();
      cookieManager.auth.removeToken();
      localStorage.removeItem('user');
      
      // Clear user preferences from cookies
      if (cookieManager.consent.hasConsent('preferences')) {
        const currentPrefs = cookieManager.auth.getUserPreferences();
        cookieManager.auth.setUserPreferences({
          ...currentPrefs,
          loggedOut: true,
          lastLogout: Date.now()
        });
      }
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // TAC methods
  const requestTAC = async (email, password) => {
    try {
      const response = await api.post('/auth/tac/request', { email, password });
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const verifyTAC = async (email, code) => {
    try {
      const response = await api.post('/auth/tac/verify', { email, code });
      
      // Store token and user data
      apiUtils.setToken(response.token);
      
      // Use similar user data transformation as login
      const userData = {
        id: response.user._id || response.user.id,
        name: response.user.fullName,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: response.user.role,
        status: response.user.status,
        avatar: response.user.avatar,
        phone: response.user.phone,
        tacEnabled: response.user.tacEnabled || false,
        // Add other fields as needed
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const updateTACPreference = async (tacEnabled) => {
    try {
      const response = await api.put('/auth/tac-preference', { tacEnabled });
      updateUser({ tacEnabled });
      
      // Also refresh user data from server to ensure consistency
      await refreshUserData();
      
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    vendorRegister,
    logout,
    updateUser,
    refreshUserData,
    requestTAC,
    verifyTAC,
    updateTACPreference
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 