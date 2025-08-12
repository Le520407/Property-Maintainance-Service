const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      city, 
      country, 
      avatar 
    } = req.body;

    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (firstName || lastName) {
      updateData.fullName = `${firstName || req.user.firstName} ${lastName || req.user.lastName}`;
    }
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, select: '-password' }
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user._id, {
      password: hashedNewPassword
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get technicians list
router.get('/technicians', async (req, res) => {
  try {
    const { 
      skill, 
      city, 
      minRating = 0, 
      maxRate,
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {
      role: 'TECHNICIAN',
      status: 'ACTIVE'
    };

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (parseFloat(minRating) > 0) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }

    const technicians = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await User.countDocuments(query);

    res.json({
      technicians,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get technician details
router.get('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const technician = await User.findOne({
      _id: id,
      role: 'TECHNICIAN',
      status: 'ACTIVE'
    }).select('-password');

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.json({ technician });

  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update technician hourly rate
router.put('/technician/rate', authenticateToken, requireRole(['TECHNICIAN']), async (req, res) => {
  try {
    const { hourlyRate } = req.body;

    if (!hourlyRate || hourlyRate < 0) {
      return res.status(400).json({ message: 'Valid hourly rate is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { hourlyRate: parseFloat(hourlyRate) },
      { new: true, select: 'hourlyRate' }
    );

    res.json({
      message: 'Hourly rate updated successfully',
      hourlyRate: updatedUser.hourlyRate
    });

  } catch (error) {
    console.error('Update hourly rate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update technician skills
router.put('/technician/skills', authenticateToken, requireRole(['TECHNICIAN']), async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { skills },
      { new: true, select: 'skills' }
    );

    res.json({
      message: 'Skills updated successfully',
      skills: updatedUser.skills
    });

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes
router.get('/admin/all', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    
    if (role) query.role = role.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user status (admin only)
router.put('/admin/:userId/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, select: 'fullName email status' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;