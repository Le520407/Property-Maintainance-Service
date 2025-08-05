# 前后端连接指南

## 🚀 快速开始

### **步骤 1: 启动后端服务器**

#### **MongoDB 版本:**
```bash
cd backend
npm run dev
```

#### **PostgreSQL 版本:**
```bash
cd backend
npm run dev:postgres
```

### **步骤 2: 启动前端服务器**
```bash
npm start
```

### **步骤 3: 测试连接**
访问: `http://localhost:3000/api-test`

## 🔧 配置说明

### **环境变量配置**

在前端项目根目录创建 `.env` 文件：
```env
# API 配置
REACT_APP_API_URL=http://localhost:5000/api

# 环境
REACT_APP_ENV=development

# 前端URL
REACT_APP_FRONTEND_URL=http://localhost:3000
```

### **API 基础URL**
- 开发环境: `http://localhost:5000/api`
- 生产环境: `https://your-domain.com/api`

## 📡 API 端点

### **认证相关**
```
POST /api/auth/register          # 用户注册
POST /api/auth/register-technician  # 技术员注册
POST /api/auth/login             # 用户登录
POST /api/auth/logout            # 用户登出
GET  /api/auth/me                # 获取当前用户
POST /api/auth/refresh           # 刷新token
```

### **用户管理**
```
GET    /api/users/profile                    # 获取用户资料
PUT    /api/users/profile                    # 更新用户资料
PUT    /api/users/password                   # 修改密码
GET    /api/users/technicians                # 获取技术员列表
GET    /api/users/technicians/:id            # 获取技术员详情
```

### **健康检查**
```
GET /api/health                # 服务器健康检查
```

## 🔐 认证流程

### **1. 用户注册**
```javascript
import { api } from '../services/api';

const registerUser = async (userData) => {
  try {
    const response = await api.auth.register({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'Password123',
      role: 'customer'
    });
    
    // 自动保存token
    console.log('注册成功:', response.user);
  } catch (error) {
    console.error('注册失败:', error.message);
  }
};
```

### **2. 用户登录**
```javascript
const loginUser = async (email, password) => {
  try {
    const response = await api.auth.login({ email, password });
    
    // 自动保存token
    console.log('登录成功:', response.user);
  } catch (error) {
    console.error('登录失败:', error.message);
  }
};
```

### **3. 获取用户信息**
```javascript
const getCurrentUser = async () => {
  try {
    const response = await api.auth.getCurrentUser();
    console.log('当前用户:', response.user);
  } catch (error) {
    console.error('获取用户信息失败:', error.message);
  }
};
```

## 🛠️ 前端集成

### **AuthContext 使用**
```javascript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      console.log('登录成功');
    } else {
      console.error('登录失败:', result.error);
    }
  };

  return (
    <div>
      {loading ? (
        <p>加载中...</p>
      ) : user ? (
        <div>
          <p>欢迎, {user.name}!</p>
          <button onClick={logout}>登出</button>
        </div>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  );
};
```

### **API 服务使用**
```javascript
import { api } from '../services/api';

// 获取技术员列表
const getTechnicians = async () => {
  try {
    const response = await api.users.getTechnicians({
      skills: 'plumbing,electrical',
      city: 'Singapore',
      minRating: 4.0
    });
    console.log('技术员列表:', response.technicians);
  } catch (error) {
    console.error('获取技术员失败:', error.message);
  }
};

// 更新用户资料
const updateProfile = async (profileData) => {
  try {
    const response = await api.users.updateProfile(profileData);
    console.log('资料更新成功:', response.user);
  } catch (error) {
    console.error('更新资料失败:', error.message);
  }
};
```

## 🔍 错误处理

### **API 错误处理**
```javascript
import { apiUtils } from '../services/api';

try {
  const response = await api.auth.login(credentials);
  // 处理成功响应
} catch (error) {
  const errorMessage = apiUtils.handleError(error);
  console.error('API错误:', errorMessage);
  
  // 自动处理401错误（重定向到登录页）
  if (error.message.includes('401')) {
    // 已自动处理
  }
}
```

### **Token 管理**
```javascript
import { apiUtils } from '../services/api';

// 检查token是否有效
const isTokenValid = apiUtils.isTokenValid(apiUtils.getToken());

// 手动清除token
apiUtils.removeToken();
```

## 🧪 测试

### **API 测试页面**
访问 `http://localhost:3000/api-test` 进行API连接测试。

### **手动测试**
```bash
# 健康检查
curl http://localhost:5000/api/health

# 用户注册
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "Password123"
  }'

# 用户登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

## 🔧 故障排除

### **常见问题**

1. **CORS 错误**
   - 确保后端CORS配置正确
   - 检查前端URL是否在后端允许列表中

2. **连接被拒绝**
   - 确保后端服务器正在运行
   - 检查端口是否正确（默认5000）

3. **认证失败**
   - 检查token是否正确保存
   - 验证token是否过期

4. **API 404错误**
   - 检查API端点路径是否正确
   - 确保后端路由已正确配置

### **调试技巧**

1. **浏览器开发者工具**
   - 查看Network标签页的API请求
   - 检查Console标签页的错误信息

2. **后端日志**
   - 查看后端控制台输出
   - 检查错误日志

3. **API测试工具**
   - 使用Postman或Insomnia测试API
   - 使用前端测试页面

## 📚 更多资源

- [React 官方文档](https://reactjs.org/)
- [Express.js 官方文档](https://expressjs.com/)
- [JWT 认证指南](https://jwt.io/)
- [CORS 配置指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)