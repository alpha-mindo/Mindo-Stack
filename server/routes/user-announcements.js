const express = require('express');
const router = express.Router();
const ClubAnnouncement = require('../models/ClubAnnouncement');
const ClubMember = require('../models/ClubMember');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/announcements/my-announcements
// @desc    Get all announcements from user's clubs
// @access  Private
router.get('/my-announcements', authMiddleware, async (req, res) => {
  try {
    // Get user's club memberships
    const memberships = await ClubMember.find({ 
      userId: req.user._id,
      status: 'active'
    }).select('clubId');
    
    const clubIds = memberships.map(m => m.clubId);
    
    // Get announcements from all user's clubs
    const announcements = await ClubAnnouncement.find({
      clubId: { $in: clubIds }
    })
    .populate('clubId', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('Get my announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
});

module.exports = router;
