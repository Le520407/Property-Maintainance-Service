const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get messages for a specific job (conversation)
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user has access to this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const isAuthorized = 
      job.customerId.toString() === req.user._id.toString() ||
      (job.vendorId && job.vendorId.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get messages with pagination
    const messages = await Message.find({
      jobId,
      isDeleted: false
    })
    .populate('senderId', 'firstName lastName role')
    .populate('receiverId', 'firstName lastName role')
    .populate('replyTo', 'content messageType senderId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    // Mark messages as read for current user
    await Message.updateMany(
      {
        jobId,
        receiverId: req.user._id,
        status: { $ne: 'READ' }
      },
      {
        status: 'READ',
        readAt: new Date(),
        readBy: req.user._id
      }
    );
    
    // Get conversation summary
    const summary = await Message.getConversationSummary(jobId);
    
    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: summary.totalMessages
      }
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      content, 
      messageType = 'TEXT', 
      receiverId, 
      quoteData, 
      contactInfo, 
      scheduleInfo,
      replyTo,
      priority = 'NORMAL'
    } = req.body;
    
    // Verify job exists and user has access
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const isAuthorized = 
      job.customerId.toString() === req.user._id.toString() ||
      (job.vendorId && job.vendorId.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Determine receiver if not specified
    let finalReceiverId = receiverId;
    if (!finalReceiverId) {
      if (req.user._id.toString() === job.customerId.toString()) {
        finalReceiverId = job.vendorId;
      } else {
        finalReceiverId = job.customerId;
      }
    }
    
    if (!finalReceiverId) {
      return res.status(400).json({ message: 'No vendor assigned to this job yet' });
    }
    
    // Create message
    const messageData = {
      jobId,
      senderId: req.user._id,
      receiverId: finalReceiverId,
      messageType,
      content,
      priority
    };
    
    // Add type-specific data
    if (messageType === 'QUOTE' && quoteData) {
      messageData.quoteData = quoteData;
      // Update job with vendor quote
      await Job.findByIdAndUpdate(jobId, {
        'vendorQuote.amount': quoteData.amount,
        'vendorQuote.description': quoteData.description,
        'vendorQuote.validUntil': quoteData.validUntil,
        'vendorQuote.quotedAt': new Date(),
        'vendorQuote.quotedBy': req.user._id,
        status: 'QUOTE_SENT'
      });
    }
    
    if (messageType === 'CONTACT_INFO' && contactInfo) {
      messageData.contactInfo = contactInfo;
    }
    
    if (messageType === 'SCHEDULE' && scheduleInfo) {
      messageData.scheduleInfo = scheduleInfo;
    }
    
    if (replyTo) {
      messageData.replyTo = replyTo;
    }
    
    const message = await Message.create(messageData);
    await message.populate(['senderId', 'receiverId', 'replyTo']);
    
    // Update job status based on message type
    if (messageType === 'QUOTE_ACCEPTED') {
      await Job.findByIdAndUpdate(jobId, { status: 'QUOTE_ACCEPTED' });
    } else if (messageType === 'QUOTE_REJECTED') {
      await Job.findByIdAndUpdate(jobId, { status: 'IN_DISCUSSION' });
    }
    
    console.log(`💬 Message sent: ${req.user.firstName} → Job ${job.jobNumber}`);
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    // Build job query
    const jobQuery = {};
    if (req.user.role === 'customer') {
      jobQuery.customerId = req.user._id;
    } else if (req.user.role === 'vendor') {
      jobQuery.vendorId = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (status) {
      jobQuery.status = status;
    }
    
    // Get jobs with latest message for each
    const conversations = await Job.aggregate([
      { $match: jobQuery },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'jobId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          lastMessage: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$messages',
                  sortBy: { createdAt: -1 }
                }
              },
              0
            ]
          },
          messageCount: { $size: '$messages' },
          unreadCount: {
            $size: {
              $filter: {
                input: '$messages',
                cond: {
                  $and: [
                    { $eq: ['$$this.receiverId', req.user._id] },
                    { $ne: ['$$this.status', 'READ'] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
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
        $addFields: {
          customer: { $arrayElemAt: ['$customer', 0] },
          vendor: { $arrayElemAt: ['$vendor', 0] }
        }
      },
      {
        $project: {
          jobNumber: 1,
          title: 1,
          status: 1,
          category: 1,
          priority: 1,
          location: 1,
          estimatedBudget: 1,
          lastMessage: 1,
          messageCount: 1,
          unreadCount: 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'customer.email': 1,
          'vendor.firstName': 1,
          'vendor.lastName': 1,
          'vendor.email': 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.json({
      conversations,
      totalUnread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Accept a quote
router.post('/job/:jobId/accept-quote', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { messageId } = req.body; // The quote message being accepted
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Only customer can accept quotes
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the customer can accept quotes' });
    }
    
    if (job.status !== 'QUOTE_SENT') {
      return res.status(400).json({ message: 'No active quote to accept' });
    }
    
    // Get the quote message
    const quoteMessage = await Message.findById(messageId);
    if (!quoteMessage || quoteMessage.messageType !== 'QUOTE') {
      return res.status(400).json({ message: 'Invalid quote message' });
    }
    
    // Update job with accepted quote
    job.totalAmount = quoteMessage.quoteData.amount;
    job.status = 'QUOTE_ACCEPTED';
    await job.save();
    
    // Send acceptance message
    const acceptanceMessage = await Message.create({
      jobId,
      senderId: req.user._id,
      receiverId: job.vendorId,
      messageType: 'QUOTE_ACCEPTED',
      content: `Quote accepted! Amount: $${quoteMessage.quoteData.amount.toFixed(2)}`,
      replyTo: messageId,
      priority: 'HIGH'
    });
    
    await acceptanceMessage.populate(['senderId', 'receiverId']);
    
    console.log(`✅ Quote accepted for job ${job.jobNumber}`);
    
    res.json({
      message: 'Quote accepted successfully',
      job: job,
      acceptanceMessage
    });
    
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ message: 'Failed to accept quote' });
  }
});

// Reject a quote
router.post('/job/:jobId/reject-quote', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { messageId, reason } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Only customer can reject quotes
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the customer can reject quotes' });
    }
    
    // Update job status
    job.status = 'IN_DISCUSSION';
    await job.save();
    
    // Send rejection message
    const rejectionMessage = await Message.create({
      jobId,
      senderId: req.user._id,
      receiverId: job.vendorId,
      messageType: 'QUOTE_REJECTED',
      content: reason || 'Quote has been rejected. Please revise and send a new quote.',
      replyTo: messageId,
      priority: 'HIGH'
    });
    
    await rejectionMessage.populate(['senderId', 'receiverId']);
    
    console.log(`❌ Quote rejected for job ${job.jobNumber}`);
    
    res.json({
      message: 'Quote rejected successfully',
      job: job,
      rejectionMessage
    });
    
  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({ message: 'Failed to reject quote' });
  }
});

// Mark conversation as read
router.patch('/job/:jobId/mark-read', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    await Message.updateMany(
      {
        jobId,
        receiverId: req.user._id,
        status: { $ne: 'READ' }
      },
      {
        status: 'READ',
        readAt: new Date(),
        readBy: req.user._id
      }
    );
    
    res.json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Get message statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const fromDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    let matchQuery = {
      createdAt: { $gte: fromDate }
    };
    
    // Filter by user role
    if (req.user.role === 'customer') {
      matchQuery.$or = [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ];
    } else if (req.user.role === 'vendor') {
      matchQuery.$or = [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ];
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = await Message.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          textMessages: { $sum: { $cond: [{ $eq: ['$messageType', 'TEXT'] }, 1, 0] } },
          quotes: { $sum: { $cond: [{ $eq: ['$messageType', 'QUOTE'] }, 1, 0] } },
          quotesAccepted: { $sum: { $cond: [{ $eq: ['$messageType', 'QUOTE_ACCEPTED'] }, 1, 0] } },
          quotesRejected: { $sum: { $cond: [{ $eq: ['$messageType', 'QUOTE_REJECTED'] }, 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalMessages: 0,
      textMessages: 0,
      quotes: 0,
      quotesAccepted: 0,
      quotesRejected: 0
    };
    
    // Calculate quote success rate
    result.quoteSuccessRate = result.quotes > 0 
      ? (result.quotesAccepted / result.quotes * 100).toFixed(1)
      : 0;
    
    res.json({
      timeframe: `${daysAgo} days`,
      stats: result
    });
    
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({ message: 'Failed to fetch message statistics' });
  }
});

// Delete a message (soft delete)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender can delete their message
    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();
    
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Get messages for a specific conversation (job-based)
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user has access to this conversation (job)
    const job = await Job.findById(conversationId);
    if (!job) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const isAuthorized = 
      job.customerId.toString() === req.user._id.toString() ||
      (job.vendorId && job.vendorId.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get messages with pagination
    const messages = await Message.find({
      jobId: conversationId,
      isDeleted: false
    })
    .populate('senderId', 'firstName lastName role')
    .populate('receiverId', 'firstName lastName role')
    .sort({ createdAt: 1 }) // Ascending order - oldest first, newest last
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    // Mark messages as read for current user
    await Message.updateMany(
      {
        jobId: conversationId,
        receiverId: req.user._id,
        status: { $ne: 'READ' }
      },
      {
        status: 'READ',
        readAt: new Date(),
        readBy: req.user._id
      }
    );
    
    res.json({
      success: true,
      messages: messages, // Keep chronological order - oldest to newest
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ jobId: conversationId, isDeleted: false })
      }
    });
    
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send message in a specific conversation (job-based)
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', attachments = [] } = req.body;
    
    console.log('Send message request - conversationId:', conversationId, 'userId:', req.user._id, 'content:', content); // Debug log
    
    if (!content || content.trim().length === 0) {
      console.log('Message content is empty');
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Verify user has access to this conversation (job)
    const job = await Job.findById(conversationId);
    if (!job) {
      console.log('Job not found for conversationId:', conversationId);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    console.log('Job found - customerId:', job.customerId, 'vendorId:', job.vendorId, 'currentUserId:', req.user._id);
    
    const isAuthorized = 
      job.customerId.toString() === req.user._id.toString() ||
      (job.vendorId && job.vendorId.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';
    
    console.log('User authorized:', isAuthorized);
    
    if (!isAuthorized) {
      console.log('Access denied for user:', req.user._id);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Determine receiver based on sender
    let receiverId;
    if (req.user._id.toString() === job.customerId.toString()) {
      receiverId = job.vendorId;
      console.log('Sender is customer, receiver is vendor:', receiverId);
    } else if (job.vendorId && req.user._id.toString() === job.vendorId.toString()) {
      receiverId = job.customerId;
      console.log('Sender is vendor, receiver is customer:', receiverId);
    } else if (req.user.role === 'admin') {
      // Admin can message either party, but let's default to customer
      receiverId = job.customerId;
      console.log('Sender is admin, receiver is customer:', receiverId);
    }
    
    if (!receiverId) {
      console.log('Unable to determine receiver for job:', conversationId);
      return res.status(400).json({ message: 'Unable to determine message recipient' });
    }
    
    console.log('Creating message - senderId:', req.user._id, 'receiverId:', receiverId, 'jobId:', conversationId);
    
    // Create the message
    const message = new Message({
      senderId: req.user._id,
      receiverId,
      jobId: conversationId,
      content: content.trim(),
      messageType: type.toUpperCase(), // Convert to uppercase to match enum
      attachments,
      status: 'SENT'
    });
    
    console.log('Saving message...');
    await message.save();
    console.log('Message saved, populating...');
    
    await message.populate('senderId', 'firstName lastName role');
    await message.populate('receiverId', 'firstName lastName role');
    
    console.log('Updating job last activity...');
    // Update job's last activity
    await Job.findByIdAndUpdate(conversationId, {
      lastActivity: new Date()
    });
    
    console.log('Message created successfully');
    res.status(201).json({
      success: true,
      message: message
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Mark conversation as read
router.patch('/conversations/:conversationId/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify user has access to this conversation (job)
    const job = await Job.findById(conversationId);
    if (!job) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const isAuthorized = 
      job.customerId.toString() === req.user._id.toString() ||
      (job.vendorId && job.vendorId.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Message.updateMany(
      {
        jobId: conversationId,
        receiverId: req.user._id,
        status: { $ne: 'READ' }
      },
      {
        status: 'READ',
        readAt: new Date(),
        readBy: req.user._id
      }
    );
    
    res.json({ message: 'Conversation marked as read' });
    
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
});

// Create support conversation
router.post('/support/create', auth, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Create a simple support job with minimal required fields
    const supportJobData = {
      title: 'Customer Support Request',
      description: description || `Support request from ${req.user.firstName} ${req.user.lastName}`,
      category: 'Support',
      priority: 'HIGH',
      location: {
        address: 'Online Support',
        city: 'Digital',
        state: 'Online',
        zipCode: '00000'
      },
      customerId: req.user._id,
      items: [],
      subtotal: 0,
      totalAmount: 0,
      isSupport: true,
      status: 'SUPPORT_PENDING'
    };

    const supportJob = new Job(supportJobData);
    await supportJob.save();
    
    // Find an admin to receive the support message
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return res.status(500).json({ message: 'No admin users available for support' });
    }
    
    // Create initial support message
    const initialMessage = await Message.create({
      jobId: supportJob._id,
      senderId: req.user._id,
      receiverId: adminUser._id, // Assign to an admin
      messageType: 'TEXT',
      content: description || 'Hello! I need assistance. Please help.',
      priority: 'HIGH'
    });
    
    await initialMessage.populate(['senderId']);
    await supportJob.populate('customerId', 'firstName lastName email phone');

    console.log(`🆘 Support request created: ${supportJob.jobNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Support request created successfully',
      job: supportJob,
      initialMessage: initialMessage
    });

  } catch (error) {
    console.error('Error creating support request:', error);
    res.status(500).json({ 
      message: 'Failed to create support request',
      error: error.message 
    });
  }
});

// Get support conversations for admin users
router.get('/support/conversations', auth, async (req, res) => {
  try {
    // Only admins can access support conversations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { limit = 20 } = req.query;
    
    // Get all support conversations (jobs marked as support requests)
    const conversations = await Job.aggregate([
      {
        $match: {
          isSupport: true // Only support jobs
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'jobId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          lastMessage: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$messages',
                  sortBy: { createdAt: -1 }
                }
              },
              0
            ]
          },
          messageCount: { $size: '$messages' },
          unreadCount: {
            $size: {
              $filter: {
                input: '$messages',
                cond: {
                  $and: [
                    { $ne: ['$$this.senderId', req.user._id] }, // Messages not sent by admin
                    { $ne: ['$$this.status', 'READ'] } // Unread messages
                  ]
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
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
        $addFields: {
          customer: { $arrayElemAt: ['$customer', 0] },
          vendor: { $arrayElemAt: ['$vendor', 0] }
        }
      },
      {
        $project: {
          jobNumber: 1,
          title: 1,
          status: 1,
          category: 1,
          priority: 1,
          lastMessage: 1,
          messageCount: 1,
          unreadCount: 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'customer.email': 1,
          'vendor.firstName': 1,
          'vendor.lastName': 1,
          'vendor.email': 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.json({
      conversations,
      totalUnread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    });
    
  } catch (error) {
    console.error('Error fetching support conversations:', error);
    res.status(500).json({ message: 'Failed to fetch support conversations' });
  }
});

// Send support message (admin responding to support requests)
router.post('/support', auth, async (req, res) => {
  try {
    // Only admins can send support messages
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { content, type = 'text', conversationId } = req.body;
    
    if (!content || !conversationId) {
      return res.status(400).json({ message: 'Content and conversation ID are required' });
    }
    
    // Extract job ID from conversation ID (support conversations use job IDs)
    const jobId = conversationId.replace('support_', '');
    
    // Find the job to get customer and vendor info
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Create support message (admin to customer)
    const message = await Message.create({
      jobId: job._id,
      senderId: req.user._id,
      receiverId: job.customerId, // Support messages go to customer
      messageType: type.toUpperCase(),
      content: content.trim(),
      priority: 'HIGH' // Support messages are high priority
    });
    
    await message.populate(['senderId', 'receiverId']);
    
    console.log(`🛡️ Support message sent by admin to customer for job ${job.jobNumber}`);
    
    res.status(201).json({
      success: true,
      message: message
    });
    
  } catch (error) {
    console.error('Error sending support message:', error);
    res.status(500).json({ message: 'Failed to send support message' });
  }
});

module.exports = router;