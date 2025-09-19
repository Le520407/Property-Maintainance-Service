const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search agents by CEA registration number
router.get('/agents/search-cea/:ceaNumber', authenticateToken, async (req, res) => {
  try {
    console.log('=== CEA Search Route Called ===');
    console.log('User role:', req.user.role);
    console.log('CEA Number to search:', req.params.ceaNumber);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { ceaNumber } = req.params;
    
    if (!ceaNumber || ceaNumber.trim() === '') {
      console.log('Missing CEA number parameter');
      return res.status(400).json({ message: 'CEA registration number is required' });
    }

    console.log('Searching for CEA number:', ceaNumber);
    
    // Search for ANY user with the CEA registration number (case-insensitive)
    const agents = await User.find({ 
      ceaRegistrationNumber: new RegExp(`^${ceaNumber.trim()}$`, 'i')
    })
    .select('firstName lastName fullName email agentCode ceaRegistrationNumber ceaVerificationStatus ceaVerificationDate ceaVerifiedBy ceaExpiryDate ceaVerificationNotes ceaFraudRiskLevel ceaFraudWarnings createdAt role referralUserType')
    .populate('ceaVerifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    console.log(`Found ${agents.length} agents with CEA number: ${ceaNumber}`);
    
    // Debug: Log some basic info about the agents found
    agents.forEach(agent => {
      console.log(`Agent: ${agent.fullName || agent.firstName + ' ' + agent.lastName}, Role: ${agent.role}, ReferralType: ${agent.referralUserType}, CEA: ${agent.ceaRegistrationNumber || 'None'}`);
    });
    
    console.log('Sending search response with agents:', agents.length);
    res.json(agents);
  } catch (error) {
    console.error('Error searching agents by CEA:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update CEA verification status
router.patch('/agents/:agentId/verify-cea', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { agentId } = req.params;
    const { status, notes, expiryDate } = req.body;

    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Gmail format validation for property agents
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(agent.email)) {
      return res.status(400).json({ 
        message: 'Agent must have a valid Gmail address (e.g., username@gmail.com) for verification' 
      });
    }

    // Update CEA verification
    agent.ceaVerificationStatus = status;
    agent.ceaVerificationDate = new Date();
    agent.ceaVerifiedBy = req.user._id;
    agent.ceaVerificationNotes = notes || '';
    
    if (expiryDate) {
      agent.ceaExpiryDate = new Date(expiryDate);
    }

    // If verified, activate the agent
    if (status === 'verified') {
      agent.isAgentActive = true;
      agent.status = 'ACTIVE';
    }

    await agent.save();

    const updatedAgent = await User.findById(agentId)
      .select('firstName lastName fullName email ceaRegistrationNumber ceaVerificationStatus ceaVerificationDate ceaVerifiedBy ceaExpiryDate ceaVerificationNotes')
      .populate('ceaVerifiedBy', 'firstName lastName');

    res.json(updatedAgent);
  } catch (error) {
    console.error('Error updating CEA verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all agents with CEA verification status
router.get('/agents/cea-verification', authenticateToken, async (req, res) => {
  try {
    console.log('=== CEA Verification List Route Called ===');
    console.log('User role:', req.user.role);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    console.log('Admin access confirmed, querying database...');
    
    // Query for all users with CEA registration numbers (regardless of role)
    const agents = await User.find({ 
      ceaRegistrationNumber: { $exists: true, $nin: [null, ''] }
    })
    .select('firstName lastName fullName email agentCode ceaRegistrationNumber ceaVerificationStatus ceaVerificationDate ceaVerifiedBy ceaExpiryDate ceaVerificationNotes ceaFraudRiskLevel ceaFraudWarnings createdAt role referralUserType')
    .populate('ceaVerifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    console.log(`Found ${agents.length} agents with CEA registration numbers`);
    
    // Debug: Log some basic info about the agents found
    agents.forEach(agent => {
      console.log(`Agent: ${agent.fullName || agent.firstName + ' ' + agent.lastName}, Role: ${agent.role}, ReferralType: ${agent.referralUserType}, CEA: ${agent.ceaRegistrationNumber}`);
    });
    
    res.json(agents);
  } catch (error) {
    console.error('Error fetching CEA verification list:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;