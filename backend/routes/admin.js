const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

// 创建用户（管理员权限）
router.post('/create-user', auth, async (req, res) => {
  try {
    // 检查权限
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city,
      country,
      role = 'customer',
      skills = [],
      experience = 0,
      hourlyRate = 0,
      permissions = [],
      isSuper = false,
      status = 'ACTIVE'
    } = req.body;

    // 验证必填字段
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // 验证角色
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be customer, vendor, or admin' 
      });
    }

    // 只有超级管理员可以创建管理员账户
    if (role === 'admin' && !req.user.isSuper) {
      return res.status(403).json({ 
        message: 'Super admin privileges required to create admin users' 
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 创建用户数据对象
    const userData = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      city,
      country,
      role,
      status,
    };

    // 根据角色设置特定字段
    if (role === 'vendor') {
      userData.skills = skills;
      userData.experience = experience;
      userData.hourlyRate = hourlyRate;
    }

    if (role === 'admin') {
      userData.permissions = permissions.filter(p => 
        ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system'].includes(p)
      );
      userData.isSuper = isSuper && req.user.isSuper; // 只有超级管理员才能创建其他超级管理员
    }

    const newUser = new User(userData);
    await newUser.save();

    // 返回用户信息（不包含密码）
    const userResponse = newUser.toJSON();
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 创建管理员账户（需要超级管理员权限） - 保留向后兼容性
router.post('/create-admin', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    if (!req.user.isSuper && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Super admin privileges required.' 
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      permissions = [],
      isSuper = false 
    } = req.body;

    // 验证必填字段
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 创建管理员用户
    const adminUser = new User({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      role: 'admin',
      permissions: permissions.filter(p => ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system'].includes(p)),
      isSuper: isSuper && req.user.isSuper, // 只有超级管理员才能创建其他超级管理员
      status: 'ACTIVE'
    });

    await adminUser.save();

    // 返回用户信息（不包含密码）
    const userResponse = adminUser.toJSON();
    res.status(201).json({
      message: 'Admin user created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 获取所有用户（管理员权限）
router.get('/users', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // 构建查询条件
    const query = {};
    if (role && ['customer', 'vendor', 'admin'].includes(role)) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新用户状态（管理员权限）
router.patch('/users/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 防止非超级管理员修改其他管理员状态
    if (user.role === 'admin' && !req.user.isSuper) {
      return res.status(403).json({ message: 'Cannot modify admin user' });
    }

    user.status = status;
    await user.save();

    res.json({ message: 'User status updated successfully', user: user.toJSON() });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新用户角色（超级管理员权限）
router.patch('/users/:id/role', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    const { role } = req.body;
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    
    // 如果改为管理员，设置默认权限
    if (role === 'admin') {
      user.permissions = ['manage_content', 'view_analytics'];
    } else {
      user.permissions = [];
      user.isSuper = false;
    }
    
    await user.save();

    res.json({ message: 'User role updated successfully', user: user.toJSON() });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取系统统计（管理员权限）
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'PENDING' })
    ]);

    res.json({
      totalCustomers: stats[0],
      totalVendors: stats[1],
      totalAdmins: stats[2],
      activeUsers: stats[3],
      pendingUsers: stats[4],
      totalUsers: stats[0] + stats[1] + stats[2]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除用户（超级管理员权限）
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 防止删除自己
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;