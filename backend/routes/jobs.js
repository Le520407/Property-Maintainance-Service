const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Message = require('../models/Message');
const VendorAssignmentService = require('../services/vendorAssignment');
const { auth, requireRole } = require('../middleware/auth');

// Create a new job (Customer submits order)
router.post('/', auth, async (req, res) => {
  try {
    const customerId = req.user._id;
    
    // Ensure user is a customer or creating a support request
    if (req.user.role !== 'customer' && !req.body.isSupport) {
      return res.status(403).json({ message: 'Only customers can submit job requests' });
    }

    const jobData = {
      ...req.body,
      customerId: customerId,
      status: 'PENDING'
    };

    const job = new Job(jobData);
    await job.save();

    // Populate customer details
    await job.populate('customerId', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Job request submitted successfully',
      job: job
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to submit job request',
      error: error.message 
    });
  }
});

// Get all jobs (Admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'customerId', select: 'firstName lastName email phone' },
        { path: 'vendorId', select: 'firstName lastName email phone' },
        { path: 'vendorDetails', select: 'companyName serviceCategories' }
      ]
    };

    const jobs = await Job.paginate(query, options);

    res.json({
      jobs: jobs.docs,
      pagination: {
        page: jobs.page,
        pages: jobs.totalPages,
        total: jobs.totalDocs,
        limit: jobs.limit
      }
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get jobs for current customer
router.get('/my-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view their orders' });
    }

    // Build query with optional status filter
    const query = { customerId: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const jobs = await Job.find(query)
      .populate('vendorId', 'firstName lastName email phone')
      .populate('vendorDetails', 'companyName serviceCategories')
      .sort({ createdAt: -1 });

    res.json({ jobs });

  } catch (error) {
    console.error('Error fetching customer jobs:', error);
    res.status(500).json({ message: 'Failed to fetch your orders' });
  }
});

// Get jobs for current vendor
router.get('/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can view their jobs' });
    }

    const jobs = await Job.find({ vendorId: req.user._id })
      .populate('customerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ jobs });

  } catch (error) {
    console.error('Error fetching vendor jobs:', error);
    res.status(500).json({ message: 'Failed to fetch your jobs' });
  }
});

// Get single job details
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vendorId', 'firstName lastName email phone')
      .populate('vendorDetails', 'companyName serviceCategories');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions
    const isOwner = job.customerId._id.toString() === req.user._id.toString();
    const isAssignedVendor = job.vendorId && job.vendorId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedVendor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ job });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Failed to fetch job details' });
  }
});

// Assign job to vendor (Admin only)
router.patch('/:id/assign', auth, requireRole('admin'), async (req, res) => {
  try {
    const { vendorId } = req.body;
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'PENDING') {
      return res.status(400).json({ message: 'Job is not in pending status' });
    }

    // Verify vendor exists and is active
    const vendor = await User.findById(vendorId);
    const vendorProfile = await Vendor.findOne({ userId: vendorId });
    
    if (!vendor || vendor.role !== 'vendor' || !vendorProfile || !vendorProfile.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive vendor' });
    }

    // Assign the job
    await job.assignToVendor(vendorId);
    await job.populate(['customerId', 'vendorId', 'vendorDetails']);

    // Send system messages to both customer and vendor
    try {
      // Message to customer
      await Message.createSystemMessage(
        job._id,
        null, // System message
        job.customerId._id,
        'JOB_ASSIGNED',
        { vendorName: `${vendor.firstName} ${vendor.lastName}`, jobNumber: job.jobNumber }
      );

      // Message to vendor
      await Message.createSystemMessage(
        job._id,
        null, // System message
        job.vendorId,
        'JOB_ASSIGNED',
        { customerName: `${job.customerId.firstName} ${job.customerId.lastName}`, jobNumber: job.jobNumber }
      );
    } catch (messageError) {
      console.error('Error sending system messages:', messageError);
      // Don't fail the assignment if message sending fails
    }

    res.json({
      message: 'Job assigned successfully',
      job: job
    });

  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ message: 'Failed to assign job' });
  }
});

// Vendor response to job assignment
router.patch('/:id/respond', auth, async (req, res) => {
  try {
    const { response, reason } = req.body; // response: 'ACCEPTED' or 'REJECTED'
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can respond to job assignments' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this job' });
    }

    if (job.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'Job is not in assigned status' });
    }

    await job.vendorResponse(req.user._id, response, reason);
    await job.populate(['customerId', 'vendorId']);

    res.json({
      message: `Job ${response.toLowerCase()} successfully`,
      job: job
    });

  } catch (error) {
    console.error('Error responding to job:', error);
    res.status(500).json({ message: 'Failed to respond to job' });
  }
});

// Submit quote (Vendor only)
router.patch('/:id/quote', auth, async (req, res) => {
  try {
    const { amount, description, validUntil } = req.body;
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can submit quotes' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this job' });
    }

    if (!['ASSIGNED', 'IN_DISCUSSION', 'QUOTE_REJECTED'].includes(job.status)) {
      return res.status(400).json({ message: 'Cannot submit quote at this stage' });
    }

    // Update job with quote
    job.vendorQuote = {
      amount: parseFloat(amount),
      description,
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      quotedAt: new Date(),
      quotedBy: req.user._id
    };
    job.status = 'QUOTE_SENT';
    
    job.statusHistory.push({
      status: 'QUOTE_SENT',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: `Quote submitted: $${amount}`
    });

    await job.save();
    await job.populate(['customerId', 'vendorId']);

    res.json({
      message: 'Quote submitted successfully',
      job: job
    });

  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({ message: 'Failed to submit quote' });
  }
});

// Accept quote (Customer only)
router.patch('/:id/accept-quote', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can accept quotes' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only accept quotes for your own jobs' });
    }

    if (job.status !== 'QUOTE_SENT') {
      return res.status(400).json({ message: 'No quote available to accept' });
    }

    // Accept the quote
    job.totalAmount = job.vendorQuote.amount;
    job.status = 'QUOTE_ACCEPTED';
    
    job.statusHistory.push({
      status: 'QUOTE_ACCEPTED',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: `Quote accepted: $${job.vendorQuote.amount}`
    });

    await job.save();
    await job.populate(['customerId', 'vendorId']);

    res.json({
      message: 'Quote accepted successfully',
      job: job
    });

  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ message: 'Failed to accept quote' });
  }
});

// Respond to quote (Customer only - Accept or Reject)
router.patch('/:id/quote-response', auth, async (req, res) => {
  try {
    const { response } = req.body; // 'QUOTE_ACCEPTED' or 'QUOTE_REJECTED'
    
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can respond to quotes' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only respond to quotes for your own jobs' });
    }

    if (job.status !== 'QUOTE_SENT') {
      return res.status(400).json({ message: 'No quote available to respond to' });
    }

    if (!['QUOTE_ACCEPTED', 'QUOTE_REJECTED'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response. Must be QUOTE_ACCEPTED or QUOTE_REJECTED' });
    }

    // Update job status
    job.status = response;
    job.statusHistory.push({
      status: response,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: response === 'QUOTE_ACCEPTED' ? 'Quote accepted by customer' : 'Quote rejected by customer'
    });

    await job.save();
    await job.populate(['customerId', 'vendorId']);

    console.log(`${response === 'QUOTE_ACCEPTED' ? '✅' : '❌'} Quote ${response.toLowerCase().replace('quote_', '')} for job ${job.jobNumber}`);

    res.json({
      message: `Quote ${response.toLowerCase().replace('quote_', '')} successfully`,
      job: job
    });

  } catch (error) {
    console.error('Error responding to quote:', error);
    res.status(500).json({ message: 'Failed to respond to quote' });
  }
});

// Cancel order (Customer only)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can cancel their orders' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'ASSIGNED', 'IN_DISCUSSION', 'QUOTE_SENT'];
    if (!cancellableStatuses.includes(job.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel order with status: ${job.status}. Orders can only be cancelled when they are: ${cancellableStatuses.join(', ')}`
      });
    }

    // Update job status to cancelled
    job.status = 'CANCELLED';
    job.cancellationReason = reason || 'Cancelled by customer';
    job.cancelledBy = req.user._id;
    job.cancelledAt = new Date();
    
    job.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: reason || 'Order cancelled by customer'
    });

    await job.save();
    await job.populate(['customerId', 'vendorId']);

    res.json({
      message: 'Order cancelled successfully',
      job: job
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// Update job status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions based on status change
    const isCustomer = job.customerId.toString() === req.user._id.toString();
    const isVendor = job.vendorId && job.vendorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await job.updateStatus(status, req.user._id, notes);
    await job.populate(['customerId', 'vendorId']);

    res.json({
      message: 'Job status updated successfully',
      job: job
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: 'Failed to update job status' });
  }
});

// Get recommended vendors for a job (Admin only)
router.get('/:id/recommended-vendors', auth, requireRole('admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const { limit = 10, includeUnavailable = false } = req.query;
    
    const recommendedVendors = await VendorAssignmentService.findBestVendors(job, {
      limit: parseInt(limit),
      includeUnavailable: includeUnavailable === 'true'
    });

    res.json({
      job: {
        id: job._id,
        jobNumber: job.jobNumber,
        title: job.title,
        category: job.category,
        location: job.location,
        priority: job.priority
      },
      recommendedVendors,
      totalFound: recommendedVendors.length,
      message: recommendedVendors.length > 0 
        ? `Found ${recommendedVendors.length} recommended vendors`
        : 'No suitable vendors found for this job'
    });

  } catch (error) {
    console.error('Error getting recommended vendors:', error);
    res.status(500).json({ message: 'Failed to get vendor recommendations' });
  }
});

// Auto-assign job to best vendor (Admin only)
router.post('/:id/auto-assign', auth, requireRole('admin'), async (req, res) => {
  try {
    console.log(`🤖 Auto-assign request for job ID: ${req.params.id}`);
    
    // Check if job exists first
    const job = await Job.findById(req.params.id);
    if (!job) {
      console.log(`❌ Job not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log(`📋 Job found: ${job.jobNumber}, Status: ${job.status}, Category: ${job.category}`);
    
    const result = await VendorAssignmentService.autoAssignJob(req.params.id);
    
    console.log(`✅ Auto-assignment successful for job ${job.jobNumber}`);
    
    res.json({
      message: 'Job auto-assigned successfully',
      job: result.job,
      assignedVendor: result.assignedVendor,
      assignmentScore: result.assignedVendor.totalScore,
      recommendationReason: result.assignedVendor.recommendationReason
    });

  } catch (error) {
    console.error('❌ Error auto-assigning job:', error);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to auto-assign job',
      error: error.message 
    });
  }
});

// Delete job (Admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Allow deletion of any status for now (admin override)
    // const deletableStatuses = ['PENDING', 'CANCELLED', 'REJECTED'];
    // if (!deletableStatuses.includes(job.status)) {
    //   return res.status(400).json({ 
    //     message: `Cannot delete job with status: ${job.status}. Only jobs with status ${deletableStatuses.join(', ')} can be deleted.`
    //   });
    // }

    // Store job info for logging before deletion
    const jobInfo = {
      jobNumber: job.jobNumber,
      title: job.title,
      customerId: job.customerId,
      status: job.status
    };

    // Delete related messages first
    await Message.deleteMany({ jobId: job._id });

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Job deleted successfully',
      deletedJob: jobInfo
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ 
      message: 'Failed to delete job',
      error: error.message 
    });
  }
});

// Get vendor assignment analytics (Admin only)
router.get('/analytics/vendor-performance', auth, requireRole('admin'), async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const daysAgo = parseInt(timeframe);
    const fromDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get assignment statistics
    const assignmentStats = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate },
          vendorId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $unwind: '$vendor'
      },
      {
        $group: {
          _id: '$vendorId',
          vendorName: { $first: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] } },
          vendorEmail: { $first: '$vendor.email' },
          totalAssigned: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $in: ['$status', ['ASSIGNED', 'IN_PROGRESS', 'PAID']] }, 1, 0] } },
          avgJobValue: { $avg: '$totalAmount' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalAssigned', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$totalAssigned'] }, 100] }
            ]
          },
          successRate: {
            $cond: [
              { $eq: ['$totalAssigned', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', { $add: ['$completed', '$cancelled'] }] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { totalAssigned: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get category performance
    const categoryStats = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalJobs: { $sum: 1 },
          assigned: { $sum: { $cond: [{ $exists: ['$vendorId', true] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          avgTimeToAssign: { 
            $avg: {
              $cond: [
                { $exists: ['$assignedAt', true] },
                { $subtract: ['$assignedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          assignmentRate: {
            $multiply: [{ $divide: ['$assigned', '$totalJobs'] }, 100]
          }
        }
      },
      {
        $sort: { totalJobs: -1 }
      }
    ]);

    res.json({
      timeframe: `${daysAgo} days`,
      vendorPerformance: assignmentStats,
      categoryPerformance: categoryStats,
      summary: {
        totalVendors: assignmentStats.length,
        avgCompletionRate: assignmentStats.reduce((sum, v) => sum + v.completionRate, 0) / assignmentStats.length || 0,
        totalRevenue: assignmentStats.reduce((sum, v) => sum + v.totalRevenue, 0)
      }
    });

  } catch (error) {
    console.error('Error getting vendor analytics:', error);
    res.status(500).json({ message: 'Failed to get vendor analytics' });
  }
});

// Submit rating/feedback for completed job (Customer only)
router.post('/:id/rating', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can rate jobs' });
    }

    const job = await Job.findById(req.params.id).populate('vendorId', '_id');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only rate your own jobs' });
    }

    if (job.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Job must be completed to submit a rating' });
    }

    if (!job.vendorId) {
      return res.status(400).json({ message: 'No vendor assigned to this job' });
    }

    // Check if rating already exists
    const Rating = require('../models/Rating');
    const existingRating = await Rating.findOne({ 
      jobId: job._id, 
      customerId: req.user._id 
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this job' });
    }

    const {
      overallRating,
      criteria = {},
      title,
      comment,
      wouldRecommend,
      positiveAspects = [],
      negativeAspects = [],
      images = [],
      isAnonymous = false
    } = req.body;

    // Validate required fields
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ message: 'Overall rating must be between 1 and 5' });
    }

    if (wouldRecommend === undefined || wouldRecommend === null) {
      return res.status(400).json({ message: 'Recommendation field is required' });
    }

    // Create rating
    const ratingData = {
      jobId: job._id,
      customerId: req.user._id,
      vendorId: job.vendorId._id,
      overallRating: parseInt(overallRating),
      criteria: {
        quality: criteria.quality || overallRating,
        timeliness: criteria.timeliness || overallRating,
        professionalism: criteria.professionalism || overallRating,
        communication: criteria.communication || overallRating,
        cleanliness: criteria.cleanliness || overallRating
      },
      title: title || '',
      comment: comment || '',
      wouldRecommend: Boolean(wouldRecommend),
      positiveAspects: Array.isArray(positiveAspects) ? positiveAspects : [],
      negativeAspects: Array.isArray(negativeAspects) ? negativeAspects : [],
      images: Array.isArray(images) ? images.map(img => ({
        url: img.url || img,
        caption: img.caption || '',
        type: img.type || 'GENERAL'
      })) : [],
      isAnonymous: Boolean(isAnonymous),
      isPublic: true,
      adminReview: {
        status: 'APPROVED' // Auto-approve for now
      }
    };

    const rating = new Rating(ratingData);
    await rating.save();

    // Populate the rating for response
    await rating.populate([
      { path: 'customerId', select: 'firstName lastName' },
      { path: 'vendorId', select: 'firstName lastName' },
      { path: 'jobId', select: 'jobNumber title' }
    ]);

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: rating
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ 
      message: 'Failed to submit rating',
      error: error.message 
    });
  }
});

// Get rating for a specific job (if exists)
router.get('/:id/rating', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions
    const isCustomer = job.customerId.toString() === req.user._id.toString();
    const isVendor = job.vendorId && job.vendorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Rating = require('../models/Rating');
    const rating = await Rating.findOne({ jobId: job._id })
      .populate('customerId', 'firstName lastName')
      .populate('vendorId', 'firstName lastName')
      .populate('jobId', 'jobNumber title');

    if (!rating) {
      return res.status(404).json({ message: 'No rating found for this job' });
    }

    res.json({ rating });

  } catch (error) {
    console.error('Error fetching job rating:', error);
    res.status(500).json({ message: 'Failed to fetch rating' });
  }
});

// Create support conversation (accessible by all authenticated users)
router.post('/support', auth, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Create support job
    const supportJobData = {
      title: 'Customer Support Request',
      description: description || `Support request from ${req.user.firstName} ${req.user.lastName}`,
      category: 'Support',
      priority: 'HIGH',
      location: {
        address: 'Support Request',
        city: 'Online',
        state: '',
        zipCode: ''
      },
      items: [], // Empty items for support request
      subtotal: 0,
      totalAmount: 0,
      customerId: req.user._id,
      isSupport: true,
      status: 'SUPPORT_PENDING'
    };

    const supportJob = new Job(supportJobData);
    await supportJob.save();
    
    // Populate customer details
    await supportJob.populate('customerId', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Support request created successfully',
      job: supportJob
    });

  } catch (error) {
    console.error('Error creating support request:', error);
    res.status(500).json({ 
      message: 'Failed to create support request',
      error: error.message 
    });
  }
});

module.exports = router;