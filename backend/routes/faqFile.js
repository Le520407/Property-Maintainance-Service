const express = require('express');
const router = express.Router();
const faqFileManager = require('../utils/faqFileManager');

// Middleware to check admin authentication (you may need to adjust this based on your auth system)
const requireAdmin = (req, res, next) => {
  // Add your admin authentication logic here
  // For now, we'll assume the user is authenticated and has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/cms/faq-file - Get all FAQ data from file
router.get('/faq-file', async (req, res) => {
  try {
    if (req.query.admin === 'true') {
      // Return flat list for admin management
      const allFAQs = await faqFileManager.getAllFAQs();
      res.json({ faqs: allFAQs });
    } else {
      // Return categorized structure for public display
      const faqCategories = await faqFileManager.readFAQData();
      res.json({ faqCategories });
    }
  } catch (error) {
    console.error('Error fetching FAQ data:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ data' });
  }
});

// POST /api/cms/faq-file - Add new FAQ
router.post('/faq-file', requireAdmin, async (req, res) => {
  try {
    const { question, answer, category, slug } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ error: 'Question, answer, and category are required' });
    }

    const newFAQ = await faqFileManager.addFAQ(category, {
      question,
      answer,
      slug
    });

    res.status(201).json({ faq: newFAQ });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to add FAQ' });
  }
});

// PUT /api/cms/faq-file/:categoryId/:faqId - Update existing FAQ
router.put('/faq-file/:categoryId/:faqId', requireAdmin, async (req, res) => {
  try {
    const { categoryId, faqId } = req.params;
    const { question, answer, slug } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const updatedFAQ = await faqFileManager.updateFAQ(categoryId, faqId, {
      question,
      answer,
      slug
    });

    res.json({ faq: updatedFAQ });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to update FAQ' });
  }
});

// DELETE /api/cms/faq-file/:categoryId/:faqId - Delete FAQ
router.delete('/faq-file/:categoryId/:faqId', requireAdmin, async (req, res) => {
  try {
    const { categoryId, faqId } = req.params;
    
    const deletedFAQ = await faqFileManager.deleteFAQ(categoryId, faqId);
    
    res.json({ message: 'FAQ deleted successfully', faq: deletedFAQ });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to delete FAQ' });
  }
});

// GET /api/cms/faq-file/categories - Get available categories
router.get('/faq-file/categories', async (req, res) => {
  try {
    const categoryOptions = [
      { value: 'general', label: 'General Services', icon: '🏠' },
      { value: 'account', label: 'Account & Registration', icon: '👤' },
      { value: 'agent-program', label: 'Agent Referral Program', icon: '⭐' },
      { value: 'cea-verification', label: 'CEA Verification Process', icon: '🛡️' },
      { value: 'privacy-cookies', label: 'Privacy & Cookies', icon: '🍪' },
      { value: 'payments', label: 'Payments & Billing', icon: '💳' },
      { value: 'technical', label: 'Technical Support', icon: '⚙️' },
      { value: 'contact-support', label: 'Contact & Support', icon: '🎧' }
    ];
    
    res.json({ categories: categoryOptions });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;