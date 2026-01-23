const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');

// Middleware to check if user is the president of a club
const clubPresidentMiddleware = async (req, res, next) => {
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

    // Check if user is the president
    if (club.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only the club president can perform this action' 
      });
    }

    // Attach club to request for later use
    req.club = club;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization',
      error: error.message 
    });
  }
};

// Middleware to check if user is a member of the club
const clubMemberMiddleware = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    
    if (!clubId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Club ID is required' 
      });
    }

    // Check if user is president
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }

    if (club.ownerId.toString() === req.user._id.toString()) {
      req.club = club;
      req.membership = { role: 'president', isPresident: true };
      return next();
    }

    // Check membership
    const membership = await ClubMember.findOne({
      clubId,
      userId: req.user._id,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must be a member of this club to perform this action' 
      });
    }

    req.club = club;
    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization',
      error: error.message 
    });
  }
};

// Middleware to check if user has a specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const clubId = req.params.clubId || req.body.clubId;
      
      if (!clubId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Club ID is required' 
        });
      }

      // Get club
      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(404).json({ 
          success: false, 
          message: 'Club not found' 
        });
      }

      // President has all permissions
      if (club.ownerId.toString() === req.user._id.toString()) {
        req.club = club;
        req.membership = { role: 'president', isPresident: true };
        return next();
      }

      // Check membership and permissions
      const membership = await ClubMember.findOne({
        clubId,
        userId: req.user._id,
        status: 'active'
      }).populate('clubId');

      if (!membership) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be a member of this club' 
        });
      }

      // Check if member has the required permission
      if (!membership.hasPermission(permission)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. You need the '${permission}' permission to perform this action` 
        });
      }

      req.club = club;
      req.membership = membership;
      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error during authorization',
        error: error.message 
      });
    }
  };
};

// Middleware to check if user can manage applications (view or approve)
const canManageApplications = checkPermission('approve_applications');
const canViewApplications = checkPermission('view_applications');
const canInterviewApplicants = checkPermission('interview_applicants');

module.exports = {
  clubPresidentMiddleware,
  clubMemberMiddleware,
  checkPermission,
  canManageApplications,
  canViewApplications,
  canInterviewApplicants
};
