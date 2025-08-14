const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateToken: auth } = require('../middleware/auth');

// Get all announcements (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      page = 1, 
      limit = 10, 
      search, 
      priority, 
      category, 
      targetAudience,
      status,
      isPublished 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    // Handle status filter (active, expired, draft)
    if (status === 'active') {
      query.isPublished = true;
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ];
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const announcements = await Announcement.find(query)
      .populate('authorId', 'firstName lastName email')
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get announcement statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Announcement.getStats();
    
    // Get priority distribution
    const priorityStats = await Announcement.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category distribution
    const categoryStats = await Announcement.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get target audience distribution
    const audienceStats = await Announcement.aggregate([
      {
        $group: {
          _id: '$targetAudience',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        published: 0,
        urgent: 0,
        important: 0,
        expired: 0
      },
      priorityStats,
      categoryStats,
      audienceStats
    });

  } catch (error) {
    console.error('Get announcement stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single announcement
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const announcement = await Announcement.findById(req.params.id)
      .populate('authorId', 'firstName lastName email')
      .populate('acknowledgments.userId', 'firstName lastName email');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcement);

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create announcement
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      content,
      summary,
      priority = 'normal',
      targetAudience = 'all',
      category = 'general',
      serviceAreas = [],
      isPublished = false,
      expiresAt,
      isPinned = false,
      sendNotification = false,
      imageUrl,
      order = 0
    } = req.body;

    // Validate required fields
    if (!title || !content || !summary) {
      return res.status(400).json({ 
        message: 'Title, content, and summary are required' 
      });
    }

    const announcement = new Announcement({
      title,
      content,
      summary,
      priority,
      targetAudience,
      category,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      isPublished,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isPinned,
      sendNotification,
      imageUrl,
      order,
      authorId: req.user._id
    });

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('authorId', 'firstName lastName email');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: populatedAnnouncement
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update announcement
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      content,
      summary,
      priority,
      targetAudience,
      category,
      serviceAreas,
      isPublished,
      expiresAt,
      isPinned,
      sendNotification,
      imageUrl,
      order
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (summary !== undefined) announcement.summary = summary;
    if (priority !== undefined) announcement.priority = priority;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (category !== undefined) announcement.category = category;
    if (serviceAreas !== undefined) announcement.serviceAreas = Array.isArray(serviceAreas) ? serviceAreas : [];
    if (isPublished !== undefined) announcement.isPublished = isPublished;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (sendNotification !== undefined) announcement.sendNotification = sendNotification;
    if (imageUrl !== undefined) announcement.imageUrl = imageUrl;
    if (order !== undefined) announcement.order = order;

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('authorId', 'firstName lastName email');

    res.json({
      message: 'Announcement updated successfully',
      announcement: populatedAnnouncement
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement deleted successfully' });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish/unpublish announcement
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { isPublished } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.isPublished = isPublished;
    
    // Set publishedAt when first published
    if (isPublished && !announcement.publishedAt) {
      announcement.publishedAt = new Date();
    }

    await announcement.save();

    res.json({
      message: `Announcement ${isPublished ? 'published' : 'unpublished'} successfully`,
      announcement
    });

  } catch (error) {
    console.error('Publish announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pin/unpin announcement
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_content')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { isPinned } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.isPinned = isPinned;
    await announcement.save();

    res.json({
      message: `Announcement ${isPinned ? 'pinned' : 'unpinned'} successfully`,
      announcement
    });

  } catch (error) {
    console.error('Pin announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Increment view count
router.patch('/:id/view', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.incrementViews();

    res.json({ message: 'View count updated' });

  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add acknowledgment
router.patch('/:id/acknowledge', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.addAcknowledgment(req.user._id);

    res.json({ message: 'Acknowledgment added successfully' });

  } catch (error) {
    console.error('Add acknowledgment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;