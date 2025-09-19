const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const ceaVerificationService = require('../services/ceaVerificationService');

// Get all agents with CEA verification status
router.get('/agents/cea-verification', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const agents = await User.find({ 
      role: 'referral',
      referralUserType: 'property_agent'
    })
    .select('firstName lastName fullName email agentCode ceaRegistrationNumber ceaVerificationStatus ceaVerificationDate ceaVerifiedBy ceaExpiryDate ceaVerificationNotes createdAt')
    .populate('ceaVerifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update CEA verification status for an agent
router.put('/agents/:agentId/cea-verification', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { agentId } = req.params;
    const { status, notes, expiryDate } = req.body;

    // Validate status
    const validStatuses = ['PENDING_MANUAL_VERIFICATION', 'VERIFIED', 'FAILED', 'EXPIRED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const updateData = {
      ceaVerificationStatus: status,
      ceaVerificationNotes: notes || '',
      ceaVerifiedBy: req.user.id,
      ceaVerificationDate: new Date()
    };

    // Set expiry date if provided
    if (expiryDate) {
      updateData.ceaExpiryDate = new Date(expiryDate);
    }

    // Update agent active status based on verification
    if (status === 'VERIFIED') {
      updateData.isAgentActive = true;
    } else if (status === 'FAILED' || status === 'SUSPENDED' || status === 'EXPIRED') {
      updateData.isAgentActive = false;
    }

    const agent = await User.findByIdAndUpdate(
      agentId,
      updateData,
      { new: true }
    ).populate('ceaVerifiedBy', 'firstName lastName');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Log the verification action
    console.log(`CEA verification updated for agent ${agent.fullName} (${agent.ceaRegistrationNumber}) by admin ${req.user.firstName} ${req.user.lastName}: ${status}`);

    res.json({
      message: 'CEA verification updated successfully',
      agent: {
        id: agent._id,
        fullName: agent.fullName,
        ceaRegistrationNumber: agent.ceaRegistrationNumber,
        ceaVerificationStatus: agent.ceaVerificationStatus,
        ceaVerificationDate: agent.ceaVerificationDate,
        ceaExpiryDate: agent.ceaExpiryDate,
        isAgentActive: agent.isAgentActive
      }
    });
  } catch (error) {
    console.error('Error updating CEA verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get CEA verification statistics
router.get('/cea-verification/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await User.aggregate([
      {
        $match: {
          role: 'referral',
          referralUserType: 'property_agent'
        }
      },
      {
        $group: {
          _id: '$ceaVerificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get agents with expiring registrations (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCount = await User.countDocuments({
      role: 'referral',
      referralUserType: 'property_agent',
      ceaExpiryDate: {
        $lte: thirtyDaysFromNow,
        $gte: new Date()
      }
    });

    // Get total agents
    const totalAgents = await User.countDocuments({
      role: 'referral',
      referralUserType: 'property_agent'
    });

    const formattedStats = {
      total: totalAgents,
      pending: stats.find(s => s._id === 'PENDING_MANUAL_VERIFICATION')?.count || 0,
      verified: stats.find(s => s._id === 'VERIFIED')?.count || 0,
      failed: stats.find(s => s._id === 'FAILED')?.count || 0,
      expired: stats.find(s => s._id === 'EXPIRED')?.count || 0,
      suspended: stats.find(s => s._id === 'SUSPENDED')?.count || 0,
      expiringSoon: expiringCount
    };

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching CEA stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update expired CEA registrations
router.post('/cea-verification/update-expired', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await User.updateMany(
      {
        role: 'referral',
        referralUserType: 'property_agent',
        ceaExpiryDate: { $lt: today },
        ceaVerificationStatus: 'VERIFIED'
      },
      {
        ceaVerificationStatus: 'EXPIRED',
        isAgentActive: false,
        ceaVerificationDate: new Date(),
        ceaVerifiedBy: req.user.id,
        ceaVerificationNotes: 'Automatically marked as expired due to expiry date'
      }
    );

    console.log(`Bulk update: ${result.modifiedCount} CEA registrations marked as expired by admin ${req.user.firstName} ${req.user.lastName}`);

    res.json({
      message: `${result.modifiedCount} CEA registrations marked as expired`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating expired CEA registrations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get agent CEA verification details
router.get('/agents/:agentId/cea-verification', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { agentId } = req.params;

    const agent = await User.findById(agentId)
      .select('firstName lastName fullName email agentCode ceaRegistrationNumber ceaVerificationStatus ceaVerificationDate ceaVerifiedBy ceaExpiryDate ceaVerificationNotes')
      .populate('ceaVerifiedBy', 'firstName lastName');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    if (agent.role !== 'referral' || agent.referralUserType !== 'property_agent') {
      return res.status(400).json({ message: 'User is not a property agent' });
    }

    // Generate verification record for manual checking
    const verificationRecord = ceaVerificationService.createVerificationRecord({
      registrationNumber: agent.ceaRegistrationNumber,
      agentName: agent.fullName,
      email: agent.email,
      phone: agent.phone
    });

    res.json({
      agent,
      verificationRecord
    });
  } catch (error) {
    console.error('Error fetching agent CEA details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;