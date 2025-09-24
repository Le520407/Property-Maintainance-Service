const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const User = require('../models/User');
const PointsTransaction = require('../models/PointsTransaction');
const { authenticateToken: auth, requireRole, requireAdmin } = require('../middleware/auth');

// Predefined voucher templates that customers can exchange points for
const VOUCHER_TEMPLATES = [
  {
    id: 'discount_5',
    name: '$5 Off Any Service',
    description: 'Get $5 off any service order',
    pointsCost: 50,
    type: 'FIXED_AMOUNT',
    value: 5,
    minimumOrderAmount: 50,
    validForDays: 30,
    category: 'ALL'
  },
  {
    id: 'discount_10',
    name: '$10 Off Any Service',
    description: 'Get $10 off any service order',
    pointsCost: 100,
    type: 'FIXED_AMOUNT',
    value: 10,
    minimumOrderAmount: 100,
    validForDays: 30,
    category: 'ALL'
  },
  {
    id: 'discount_20',
    name: '$20 Off Any Service',
    description: 'Get $20 off any service order',
    pointsCost: 200,
    type: 'FIXED_AMOUNT',
    value: 20,
    minimumOrderAmount: 150,
    validForDays: 30,
    category: 'ALL'
  },
  {
    id: 'percentage_15',
    name: '15% Off Service',
    description: 'Get 15% off any service (max $25 discount)',
    pointsCost: 150,
    type: 'PERCENTAGE',
    value: 15,
    minimumOrderAmount: 100,
    maximumDiscountAmount: 25,
    validForDays: 30,
    category: 'ALL'
  },
  {
    id: 'plumbing_special',
    name: '$15 Off Plumbing Services',
    description: 'Special discount for plumbing services only',
    pointsCost: 120,
    type: 'FIXED_AMOUNT',
    value: 15,
    minimumOrderAmount: 80,
    validForDays: 45,
    category: 'PLUMBING'
  },
  {
    id: 'electrical_special',
    name: '$15 Off Electrical Services',
    description: 'Special discount for electrical services only',
    pointsCost: 120,
    type: 'FIXED_AMOUNT',
    value: 15,
    minimumOrderAmount: 80,
    validForDays: 45,
    category: 'ELECTRICAL'
  }
];

// @desc    Get available voucher templates
// @route   GET /api/vouchers/templates
// @access  Private (Customer)
router.get('/templates', auth, requireRole(['customer', 'admin']), async (req, res) => {
  try {
    const { pointsBalance } = await User.findById(req.user._id).select('pointsBalance');

    // Add affordability information to templates
    const templatesWithAffordability = VOUCHER_TEMPLATES.map(template => ({
      ...template,
      canAfford: pointsBalance >= template.pointsCost,
      pointsNeeded: Math.max(0, template.pointsCost - pointsBalance)
    }));

    res.json({
      success: true,
      data: templatesWithAffordability,
      userPointsBalance: pointsBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Exchange points for voucher
// @route   POST /api/vouchers/exchange
// @access  Private (Customer)
router.post('/exchange', auth, requireRole(['customer', 'admin']), async (req, res) => {
  try {
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    // Find the voucher template
    const template = VOUCHER_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Invalid voucher template'
      });
    }

    // Check user's points balance
    const user = await User.findById(req.user._id);
    if (user.pointsBalance < template.pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
        pointsNeeded: template.pointsCost - user.pointsBalance
      });
    }

    // Create voucher options
    const voucherOptions = {
      type: template.type,
      value: template.value,
      minimumOrderAmount: template.minimumOrderAmount,
      maximumDiscountAmount: template.maximumDiscountAmount,
      description: template.description,
      validUntil: new Date(Date.now() + (template.validForDays * 24 * 60 * 60 * 1000)),
      category: template.category,
      usageLimit: 1
    };

    // Create voucher from points
    const voucher = await Voucher.createFromPoints(req.user._id, template.pointsCost, voucherOptions);

    // Populate owner info for response
    await voucher.populate('owner', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: `Voucher ${voucher.code} created successfully!`,
      data: voucher,
      newPointsBalance: user.pointsBalance - template.pointsCost
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user's vouchers
// @route   GET /api/vouchers/my-vouchers
// @access  Private (Customer)
router.get('/my-vouchers', auth, requireRole(['customer', 'admin']), async (req, res) => {
  try {
    const { status = 'all', limit = 10, page = 1 } = req.query;

    let query = { owner: req.user._id };

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.validUntil = { $gt: new Date() };
    } else if (status === 'used') {
      query.$or = [
        { isActive: false, usageCount: { $gte: 1 } },
        { usageCount: { $gte: 1 } }
      ];
    } else if (status === 'expired') {
      query.validUntil = { $lte: new Date() };
    }

    const vouchers = await Voucher.find(query)
      .populate('usedBy.user', 'firstName lastName')
      .populate('usedBy.order', 'jobNumber totalAmount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalVouchers = await Voucher.countDocuments(query);

    // Get voucher statistics
    const stats = await Voucher.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: null,
          totalVouchers: { $sum: 1 },
          activeVouchers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $gt: ['$validUntil', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          usedVouchers: {
            $sum: {
              $cond: [{ $gte: ['$usageCount', 1] }, 1, 0]
            }
          },
          totalSaved: {
            $sum: {
              $reduce: {
                input: '$usedBy',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.discountAmount'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: vouchers,
      stats: stats[0] || {
        totalVouchers: 0,
        activeVouchers: 0,
        usedVouchers: 0,
        totalSaved: 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalVouchers / parseInt(limit)),
        total: totalVouchers
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Validate voucher for order
// @route   POST /api/vouchers/validate
// @access  Private (Customer)
router.post('/validate', auth, requireRole(['customer', 'admin']), async (req, res) => {
  try {
    const { code, orderAmount, category = 'ALL' } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code and order amount are required'
      });
    }

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      owner: req.user._id
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    const validation = voucher.canApplyToOrder(orderAmount, req.user._id, category);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    const discountAmount = voucher.calculateDiscount(orderAmount);

    res.json({
      success: true,
      message: 'Voucher is valid',
      data: {
        code: voucher.code,
        discountAmount,
        finalAmount: orderAmount - discountAmount,
        description: voucher.description,
        type: voucher.type,
        value: voucher.value
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Apply voucher to order (called during checkout)
// @route   POST /api/vouchers/apply
// @access  Private (Customer)
router.post('/apply', auth, requireRole(['customer', 'admin']), async (req, res) => {
  try {
    const { code, orderId, orderAmount, category = 'ALL' } = req.body;

    if (!code || !orderId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code, order ID, and order amount are required'
      });
    }

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      owner: req.user._id
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    const result = await voucher.applyToOrder(orderId, req.user._id, orderAmount, category);

    res.json({
      success: true,
      message: `Voucher ${voucher.code} applied successfully`,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ADMIN ROUTES

// @desc    Get all vouchers (Admin)
// @route   GET /api/vouchers/admin/all
// @access  Private (Admin)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, owner, search } = req.query;

    let query = {};

    if (status === 'active') {
      query.isActive = true;
      query.validUntil = { $gt: new Date() };
    } else if (status === 'expired') {
      query.validUntil = { $lte: new Date() };
    } else if (status === 'used') {
      query.usageCount = { $gte: 1 };
    }

    if (owner) {
      query.owner = owner;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const vouchers = await Voucher.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('usedBy.user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Voucher.countDocuments(query);

    // Get admin statistics
    const adminStats = await Voucher.aggregate([
      {
        $group: {
          _id: null,
          totalVouchers: { $sum: 1 },
          activeVouchers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $gt: ['$validUntil', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          usedVouchers: {
            $sum: {
              $cond: [{ $gte: ['$usageCount', 1] }, 1, 0]
            }
          },
          totalPointsSpent: { $sum: '$pointsCost' },
          totalDiscountGiven: {
            $sum: {
              $reduce: {
                input: '$usedBy',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.discountAmount'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      },
      stats: adminStats[0] || {
        totalVouchers: 0,
        activeVouchers: 0,
        usedVouchers: 0,
        totalPointsSpent: 0,
        totalDiscountGiven: 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Deactivate voucher (Admin)
// @route   PATCH /api/vouchers/admin/:id/deactivate
// @access  Private (Admin)
router.patch('/admin/:id/deactivate', auth, requireAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate('owner', 'firstName lastName email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.json({
      success: true,
      message: `Voucher ${voucher.code} deactivated`,
      data: voucher
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;