// API 基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 请求拦截器
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // 处理非2xx响应
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

// API 方法
export const api = {
  // 认证相关
  auth: {
    // 用户注册
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
    // 技术员注册
    registerTechnician: (technicianData) => request('/auth/register-technician', {
      method: 'POST',
      body: JSON.stringify(technicianData),
    }),
    
    // 用户登录
    login: (credentials) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    
    // 获取当前用户
    getCurrentUser: () => request('/auth/me'),
    
    // 刷新token
    refreshToken: () => request('/auth/refresh', {
      method: 'POST',
    }),
    
    // 登出
    logout: () => request('/auth/logout', {
      method: 'POST',
    }),
    
    // 忘记密码
    forgotPassword: (email) => request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    
    // 重置密码
    resetPassword: (token, newPassword) => request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  },
  
  // 用户相关
  users: {
    // 获取用户资料
    getProfile: () => request('/users/profile'),
    
    // 更新用户资料
    updateProfile: (profileData) => request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    
    // 修改密码
    changePassword: (passwordData) => request('/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),
    
    // 获取技术员列表
    getTechnicians: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/users/technicians?${queryString}`);
    },
    
    // 获取技术员详情
    getTechnician: (id) => request(`/users/technicians/${id}`),
    
    // 更新技术员时薪
    updateHourlyRate: (hourlyRate) => request('/users/technician/rate', {
      method: 'PUT',
      body: JSON.stringify({ hourlyRate }),
    }),
    
    // 更新技术员技能
    updateSkills: (skills) => request('/users/technician/skills', {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    }),
  },
  
  // 管理功能
  admin: {
    // 获取所有用户
    getAllUsers: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/users/admin/all?${queryString}`);
    },
    
    // 更新用户状态
    updateUserStatus: (userId, status) => request(`/users/admin/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    
    // 删除用户
    deleteUser: (userId) => request(`/users/admin/${userId}`, {
      method: 'DELETE',
    }),
  },
  
  // 服务相关
  services: {
    // 获取服务列表
    getServices: () => request('/services'),
    
    // 获取服务详情
    getService: (id) => request(`/services/${id}`),
  },
};

// 工具函数
export const apiUtils = {
  // 设置token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // 获取token
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // 移除token
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  // 检查token是否有效
  isTokenValid: (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  },
  
  // 处理API错误
  handleError: (error) => {
    if (error.message.includes('401')) {
      // 未授权，清除token并重定向到登录页
      apiUtils.removeToken();
      window.location.href = '/login';
    }
    return error.message;
  },
};

export default api;