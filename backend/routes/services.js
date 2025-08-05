const express = require('express');
const Service = require('../models/Service');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;
    
    const query = {};
    
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (active === 'true') {
      query.isActive = true;
    }

    const services = await Service.find(query).sort({ name: 1 });

    res.json({ services });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ service });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create service (admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, category, basePrice, duration, image } = req.body;

    if (!name || !description || !category || !basePrice || !duration) {
      return res.status(400).json({ 
        message: 'Name, description, category, base price, and duration are required' 
      });
    }

    const service = await Service.create({
      name,
      description,
      category,
      basePrice: parseFloat(basePrice),
      duration: parseInt(duration),
      image
    });

    res.status(201).json({
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update service (admin only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, basePrice, duration, isActive, image } = req.body;

    const updateData = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (image !== undefined) updateData.image = image;

    const service = await Service.findByIdAndUpdate(id, updateData, { new: true });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete service (admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;