const express = require('express');
const router = express.Router();
const InviteCode = require('../models/InviteCode');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Generate new invite code (Admin only)
router.post('/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      userType = 'referral', 
      maxUses = 1, 
      expiresInDays = 30,
      description,
      campaign,
      tags = [],
      restrictions = {}
    } = req.body;

    // Validate user type
    if (!['referral', 'vendor', 'customer'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

    // Generate unique code
    let code;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      code = InviteCode.generateCode(userType.toUpperCase());
      const existing = await InviteCode.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique invite code'
      });
    }

    const inviteCode = new InviteCode({
      code,
      generatedBy: req.user._id,
      userType,
      maxUses: parseInt(maxUses),
      expiresAt,
      restrictions,
      metadata: {
        description,
        campaign,
        tags
      }
    });

    await inviteCode.save();

    res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        userType: inviteCode.userType,
        maxUses: inviteCode.maxUses,
        expiresAt: inviteCode.expiresAt,
        stats: inviteCode.getStats()
      }
    });

  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invite code',
      error: error.message
    });
  }
});

// Get all invite codes (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (userType) filter.userType = userType;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } },
        { 'metadata.campaign': { $regex: search, $options: 'i' } }
      ];
    }

    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortDirection };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [codes, totalCount] = await Promise.all([
      InviteCode.find(filter)
        .populate('generatedBy', 'firstName lastName email')
        .populate('usedBy.user', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      InviteCode.countDocuments(filter)
    ]);

    // Update expired codes
    await InviteCode.updateExpiredCodes();

    const codesWithStats = codes.map(code => ({
      ...code.toObject(),
      stats: code.getStats()
    }));

    res.json({
      success: true,
      data: codesWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: skip + codes.length < totalCount
      }
    });

  } catch (error) {
    console.error('Get invite codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invite codes',
      error: error.message
    });
  }
});

// Validate invite code (Public endpoint for registration)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const inviteCode = await InviteCode.findOne({ 
      code: code.toUpperCase().trim() 
    });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    const validation = inviteCode.isValid();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    res.json({
      success: true,
      data: {
        code: inviteCode.code,
        userType: inviteCode.userType,
        restrictions: inviteCode.restrictions,
        stats: inviteCode.getStats()
      }
    });

  } catch (error) {
    console.error('Validate invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate invite code',
      error: error.message
    });
  }
});

// Use invite code (Internal endpoint called during registration)
router.post('/use', async (req, res) => {
  try {
    const { code, userId, metadata = {} } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Code and user ID are required'
      });
    }

    const inviteCode = await InviteCode.findOne({ 
      code: code.toUpperCase().trim() 
    });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    await inviteCode.useCode(userId, metadata);

    res.json({
      success: true,
      message: 'Invite code used successfully',
      data: inviteCode.getStats()
    });

  } catch (error) {
    console.error('Use invite code error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update invite code (Admin only)
router.put('/:codeId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { codeId } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    const allowedUpdates = ['maxUses', 'expiresAt', 'status', 'isActive', 'metadata', 'restrictions'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update fields'
      });
    }

    const inviteCode = await InviteCode.findById(codeId);
    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invite code not found'
      });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      inviteCode[key] = updates[key];
    });

    await inviteCode.save();

    res.json({
      success: true,
      data: {
        ...inviteCode.toObject(),
        stats: inviteCode.getStats()
      }
    });

  } catch (error) {
    console.error('Update invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invite code',
      error: error.message
    });
  }
});

// Delete/Deactivate invite code (Admin only)
router.delete('/:codeId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { codeId } = req.params;
    const { permanent = false } = req.query;

    const inviteCode = await InviteCode.findById(codeId);
    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: 'Invite code not found'
      });
    }

    if (permanent === 'true') {
      await InviteCode.findByIdAndDelete(codeId);
      res.json({
        success: true,
        message: 'Invite code permanently deleted'
      });
    } else {
      inviteCode.status = 'DISABLED';
      inviteCode.isActive = false;
      await inviteCode.save();
      
      res.json({
        success: true,
        message: 'Invite code deactivated',
        data: inviteCode.getStats()
      });
    }

  } catch (error) {
    console.error('Delete invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invite code',
      error: error.message
    });
  }
});

// Get invite code statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await InviteCode.aggregate([
      {
        $group: {
          _id: null,
          totalCodes: { $sum: 1 },
          activeCodes: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          expiredCodes: { $sum: { $cond: [{ $eq: ['$status', 'EXPIRED'] }, 1, 0] } },
          exhaustedCodes: { $sum: { $cond: [{ $eq: ['$status', 'EXHAUSTED'] }, 1, 0] } },
          totalUses: { $sum: '$currentUses' },
          totalMaxUses: { $sum: '$maxUses' }
        }
      }
    ]);

    const typeBreakdown = await InviteCode.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          totalUses: { $sum: '$currentUses' },
          avgUses: { $avg: '$currentUses' }
        }
      }
    ]);

    const overview = stats[0] || {
      totalCodes: 0,
      activeCodes: 0,
      expiredCodes: 0,
      exhaustedCodes: 0,
      totalUses: 0,
      totalMaxUses: 0
    };

    overview.utilizationRate = overview.totalMaxUses > 0 ? 
      (overview.totalUses / overview.totalMaxUses) * 100 : 0;

    res.json({
      success: true,
      data: {
        overview,
        typeBreakdown
      }
    });

  } catch (error) {
    console.error('Get invite code stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;