const express = require('express');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Job = require('../models/Job');
const Rating = require('../models/Rating');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Register vendor with extended profile
router.post('/register', async (req, res) => {
  try {
    const { 
      // Basic information
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      country,
      
      // Company information
      companyName,
      businessLicense,
      establishDate,
      address,
      description,
      
      // Service information
      serviceCategories = [],
      serviceArea,
      teamSize,
      experience,
      
      // Initial service packages and price lists
      servicePackages = [],
      priceLists = [],
      
      // Availability
      availabilitySchedule = [],
      providesEmergencyService = false,
      emergencyContactNumber
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    if (!serviceCategories.length) {
      return res.status(400).json({ 
        message: 'At least one service category is required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user first
    const user = await User.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      city,
      country,
      role: 'vendor',
      status: 'PENDING' // Vendors need approval
    });

    // Create vendor profile
    const vendor = await Vendor.create({
      userId: user._id,
      companyName,
      businessLicense,
      establishDate: establishDate ? new Date(establishDate) : undefined,
      address,
      description,
      serviceCategories,
      serviceArea,
      teamSize,
      servicePackages: servicePackages.map(pkg => ({
        ...pkg,
        isActive: true
      })),
      priceLists,
      availabilitySchedule,
      providesEmergencyService,
      emergencyContactNumber,
      verificationStatus: 'PENDING'
    });

    // Update user with vendor-specific fields
    await User.findByIdAndUpdate(user._id, {
      skills: serviceCategories,
      experience: parseInt(teamSize?.split('-')[0]) || 0
    });

    res.status(201).json({
      message: 'Vendor registration successful! Your account is pending approval.',
      userId: user._id,
      vendorId: vendor._id,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor profile
router.get('/profile', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phone city country role status');
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vendor profile
router.put('/profile', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'companyName', 'description', 'serviceCategories', 'serviceArea', 
      'teamSize', 'servicePackages', 'priceLists', 'availabilitySchedule',
      'providesEmergencyService', 'emergencyContactNumber', 'portfolioImages'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        vendor[field] = req.body[field];
      }
    });

    await vendor.save();

    // Update user skills if service categories changed
    if (req.body.serviceCategories) {
      await User.findByIdAndUpdate(req.user._id, {
        skills: req.body.serviceCategories
      });
    }

    res.json({ message: 'Profile updated successfully', vendor });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor dashboard data
router.get('/dashboard', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Get job statistics
    const jobStats = await Job.aggregate([
      { $match: { vendorId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get recent jobs
    const recentJobs = await Job.find({ vendorId: req.user._id })
      .populate('customerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly earnings
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = await Job.aggregate([
      {
        $match: {
          vendorId: req.user._id,
          status: 'COMPLETED',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          earnings: { $sum: '$totalAmount' },
          jobCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get ratings summary
    const ratingStats = await Rating.getVendorStats(req.user._id);

    const dashboardData = {
      vendor,
      stats: {
        jobs: jobStats.reduce((acc, stat) => {
          acc[stat._id.toLowerCase()] = stat.count;
          return acc;
        }, {}),
        earnings: {
          total: vendor.totalEarnings,
          monthly: monthlyEarnings
        },
        ratings: ratingStats
      },
      recentJobs
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get vendor dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor jobs
router.get('/jobs', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { vendorId: req.user._id };
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate('customerId', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Get vendor jobs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update job status
router.patch('/jobs/:jobId/status', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, notes } = req.body;

    const job = await Job.findOne({ _id: jobId, vendorId: req.user._id });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await job.updateStatus(status, req.user._id, notes);

    // Update vendor stats if job is completed
    if (status === 'COMPLETED') {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      await vendor.completeJob();
      await vendor.addEarnings(job.totalAmount);
    }

    res.json({ message: 'Job status updated successfully', job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Accept/Reject job assignment
router.patch('/jobs/:jobId/respond', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { response, reason } = req.body; // response: 'ACCEPTED' or 'REJECTED'

    const job = await Job.findOne({ _id: jobId, vendorId: req.user._id });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'Job is not in assigned status' });
    }

    await job.vendorResponse(req.user._id, response, reason);

    res.json({ message: `Job ${response.toLowerCase()} successfully`, job });
  } catch (error) {
    console.error('Respond to job error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update job progress
router.patch('/jobs/:jobId/progress', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { percentage, notes, images } = req.body;

    const job = await Job.findOne({ _id: jobId, vendorId: req.user._id });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await job.updateProgress(percentage, notes, images);

    res.json({ message: 'Job progress updated successfully', job });
  } catch (error) {
    console.error('Update job progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor ratings
router.get('/ratings', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ 
      vendorId: req.user._id, 
      isPublic: true,
      'adminReview.status': { $ne: 'REJECTED' }
    })
    .populate('customerId', 'firstName lastName')
    .populate('jobId', 'title jobNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ 
      vendorId: req.user._id, 
      isPublic: true,
      'adminReview.status': { $ne: 'REJECTED' }
    });

    const stats = await Rating.getVendorStats(req.user._id);

    res.json({
      ratings,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRatings: total
      }
    });
  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Respond to rating
router.post('/ratings/:ratingId/respond', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { comment, isPublic = true } = req.body;

    const rating = await Rating.findOne({ _id: ratingId, vendorId: req.user._id });
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (rating.vendorResponse.comment) {
      return res.status(400).json({ message: 'You have already responded to this rating' });
    }

    await rating.addVendorResponse(comment, isPublic);

    res.json({ message: 'Response added successfully', rating });
  } catch (error) {
    console.error('Respond to rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor analytics
router.get('/analytics', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const vendor = await Vendor.findOne({ userId: req.user._id });
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Get monthly ratings
    const monthlyRatings = await Rating.getMonthlyStats(req.user._id, year);
    
    // Get job completion stats
    const jobStats = await Job.aggregate([
      {
        $match: {
          vendorId: req.user._id,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          completed: { 
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } 
          },
          cancelled: { 
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } 
          },
          total: { $sum: 1 },
          earnings: { 
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$totalAmount', 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      vendor: {
        currentRating: vendor.currentRating,
        totalJobsCompleted: vendor.totalJobsCompleted,
        totalEarnings: vendor.totalEarnings,
        monthlyRatings: vendor.monthlyRatings
      },
      analytics: {
        monthlyRatings,
        jobStats
      }
    });
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;