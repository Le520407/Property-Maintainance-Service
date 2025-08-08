require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// 创建超级管理员
const createSuperAdmin = async () => {
  try {
    await connectDB();

    // 检查是否已存在超级管理员
    const existingSuperAdmin = await User.findOne({ isSuper: true });
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // 创建超级管理员
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      email: 'admin@swiftfixpro.sg',
      password: 'admin123456', // 请在生产环境中更改
      role: 'admin',
      isSuper: true,
      permissions: [
        'manage_users',
        'manage_content', 
        'manage_services',
        'manage_payments',
        'view_analytics',
        'manage_system'
      ],
      status: 'ACTIVE'
    });

    await superAdmin.save();
    
    console.log('Super admin created successfully!');
    console.log('Email: admin@swiftfixpro.sg');
    console.log('Password: admin123456');
    console.log('Please change the password after first login.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

// 执行脚本
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;