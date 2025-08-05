// 环境配置示例
// 复制此文件为 .env 并修改相应的值

export const config = {
  // API 配置
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // 环境
  ENV: process.env.REACT_APP_ENV || 'development',
  
  // 前端URL
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // 其他配置
  APP_NAME: 'Property Maintenance Service',
  VERSION: '1.0.0'
};

export default config; 