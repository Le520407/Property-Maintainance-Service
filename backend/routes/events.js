const express = require('express');
const Event = require('../models/Event');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for event image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/events/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all events (filtered by user role)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      location,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let userRole = 'guest';
    if (req.headers.authorization) {
      try {
        // Try to authenticate if token is provided
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (user) {
          userRole = user.role;
        }
      } catch (error) {
        // If token is invalid, continue as guest
      }
    }

    // Build filters
    let filters = {};

    if (category) filters.category = category;
    if (location) filters['location.type'] = location;
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (startDate || endDate) {
      filters.startDate = {};
      if (startDate) filters.startDate.$gte = new Date(startDate);
      if (endDate) filters.startDate.$lte = new Date(endDate);
    }

    // Build complete filters for the user role
    let roleFilters = {};
    let statusFilter = {};

    switch (userRole) {
      case 'admin':
        roleFilters = {}; // Admin can see all events
        statusFilter = {}; // Admin can see all statuses
        break;
      case 'vendor':
      case 'technician':
        roleFilters = { visibility: { $in: ['public', 'vendor_only'] } };
        statusFilter = { status: 'published' };
        break;
      case 'referral':
        roleFilters = { visibility: { $in: ['public', 'agent_only'] } };
        statusFilter = { status: 'published' };
        break;
      case 'customer':
        roleFilters = { visibility: { $in: ['public', 'customer_only'] } };
        statusFilter = { status: 'published' };
        break;
      default:
        roleFilters = { visibility: 'public' };
        statusFilter = { status: 'published' };
    }

    // Combine all filters
    const allFilters = { ...roleFilters, ...statusFilter, ...filters };

    // Get events with pagination
    const events = await Event.find(allFilters)
      .populate('organizer', 'firstName lastName email')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Count total events with same filters
    const total = await Event.countDocuments(allFilters);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees.user', 'firstName lastName email')
      .populate('waitlist.user', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has access to this event
    let userRole = 'guest';
    let userId = null;

    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (user) {
          userRole = user.role;
          userId = user._id;
        }
      } catch (error) {
        // Continue as guest
      }
    }

    // Check visibility permissions
    const canView = (
      event.visibility === 'public' ||
      (event.visibility === 'vendor_only' && ['vendor', 'technician', 'admin'].includes(userRole)) ||
      (event.visibility === 'agent_only' && ['referral', 'admin'].includes(userRole)) ||
      (event.visibility === 'customer_only' && ['customer', 'admin'].includes(userRole)) ||
      (event.visibility === 'admin_only' && userRole === 'admin')
    );

    if (!canView) {
      return res.status(403).json({ message: 'Access denied to this event' });
    }

    // Add user-specific data
    let userRegistration = null;
    let userWaitlist = null;

    if (userId) {
      userRegistration = event.attendees.find(
        attendee => attendee.user._id.toString() === userId.toString()
      );
      userWaitlist = event.waitlist.find(
        wait => wait.user._id.toString() === userId.toString()
      );
    }

    res.json({
      ...event.toObject(),
      userRegistration,
      userWaitlist,
      isUserRegistered: !!userRegistration,
      isUserOnWaitlist: !!userWaitlist
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register for an event (protected route)
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check visibility permissions
    const userRole = req.user.role;
    const canRegister = (
      event.visibility === 'public' ||
      (event.visibility === 'vendor_only' && ['vendor', 'technician'].includes(userRole)) ||
      (event.visibility === 'agent_only' && userRole === 'referral') ||
      (event.visibility === 'customer_only' && userRole === 'customer')
    );

    if (!canRegister) {
      return res.status(403).json({ message: 'You cannot register for this event' });
    }

    await event.registerUser(req.user._id);

    res.json({
      message: 'Successfully registered for event',
      event: {
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        availableSpots: event.availableSpots
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    if (error.message.includes('already registered') ||
        error.message.includes('full') ||
        error.message.includes('closed')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel event registration (protected route)
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.cancelRegistration(req.user._id);

    res.json({
      message: 'Successfully cancelled registration',
      event: {
        id: event._id,
        title: event.title,
        availableSpots: event.availableSpots
      }
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    if (error.message.includes('not registered')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add feedback to an event (protected route)
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.addFeedback(req.user._id, rating, comment);

    res.json({
      message: 'Feedback submitted successfully',
      averageRating: event.analytics.averageRating
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    if (error.message.includes('not registered') ||
        error.message.includes('must have attended')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's registered events (protected route)
router.get('/user/my-events', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({
      'attendees.user': req.user._id
    })
    .populate('organizer', 'firstName lastName email')
    .sort({ startDate: 1 });

    const userEvents = events.map(event => {
      const userRegistration = event.attendees.find(
        attendee => attendee.user.toString() === req.user._id.toString()
      );

      return {
        ...event.toObject(),
        userRegistration
      };
    });

    res.json({ events: userEvents });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes

// Create new event (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update event (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark attendance (admin only)
router.post('/:id/attendance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId, attended } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.markAttendance(userId, attended);

    res.json({
      message: 'Attendance updated successfully',
      totalAttendance: event.analytics.totalAttendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload event image (admin only)
router.post('/:id/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const imageUrl = `/uploads/events/${req.file.filename}`;
    event.imageUrl = imageUrl;
    await event.save();

    res.json({
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;