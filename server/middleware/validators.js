const mongoose = require('mongoose');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const ClubApplication = require('../models/ClubApplication');
const User = require('../models/User');

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

// Validate club exists
const validateClubExists = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    
    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const club = await Club.findById(clubId);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    req.club = club;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating club',
      error: error.message
    });
  }
};

// Validate user exists
const validateUserExists = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.targetUser = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating user',
      error: error.message
    });
  }
};

// Validate membership exists and is active
const validateMembership = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    const userId = req.params.userId || req.body.userId;
    
    if (!clubId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID and User ID are required'
      });
    }

    const membership = await ClubMember.findOne({
      clubId,
      userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active membership not found'
      });
    }

    req.targetMembership = membership;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating membership',
      error: error.message
    });
  }
};

// Validate application exists
const validateApplicationExists = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId || req.body.applicationId;
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    const application = await ClubApplication.findById(applicationId)
      .populate('clubId', 'name logo')
      .populate('userId', 'username email profilePicture');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    req.application = application;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating application',
      error: error.message
    });
  }
};

// Validate user is not already a member
const validateNotMember = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    const userId = req.user._id;

    // Check if already a member
    const existingMembership = await ClubMember.findOne({
      clubId,
      userId,
      status: { $in: ['active', 'suspended'] }
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking membership',
      error: error.message
    });
  }
};

// Validate user hasn't already applied
const validateNoExistingApplication = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    const userId = req.user._id;

    const existingApplication = await ClubApplication.findOne({
      clubId,
      userId,
      status: { $in: ['pending', 'interview-scheduled', 'interview-completed'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending application for this club'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking existing applications',
      error: error.message
    });
  }
};

// Validate club applications are open
const validateApplicationsOpen = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (!club.applicationForm.enabled || !club.applicationForm.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'This club is not accepting applications at the moment'
      });
    }

    req.club = club;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking application status',
      error: error.message
    });
  }
};

module.exports = {
  validateObjectId,
  validateClubExists,
  validateUserExists,
  validateMembership,
  validateApplicationExists,
  validateNotMember,
  validateNoExistingApplication,
  validateApplicationsOpen
};
