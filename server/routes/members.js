const express = require('express');
const router = express.Router();
const ClubMember = require('../models/ClubMember');
const Club = require('../models/Club');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { clubPresidentMiddleware, clubMemberMiddleware, checkPermission } = require('../middleware/clubAuth');
const { validateObjectId, validateUserExists, validateMembership } = require('../middleware/validators');

// @route   GET /api/clubs/:clubId/members
// @desc    Get all club members
// @access  Private (club members only)
router.get(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  clubMemberMiddleware,
  async (req, res) => {
    try {
      const { role, status = 'active' } = req.query;
      
      const query = { clubId: req.params.clubId, status };
      if (role) {
        query.role = role;
      }

      const members = await ClubMember.find(query)
        .populate('userId', 'username email profilePicture bio phoneNumber')
        .sort({ joinedAt: -1 });

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching members',
        error: error.message
      });
    }
  }
);

// @route   GET /api/clubs/:clubId/members/:userId
// @desc    Get specific member details
// @access  Private (club members only)
router.get(
  '/:clubId/:userId',
  authMiddleware,
  validateObjectId('clubId'),
  validateObjectId('userId'),
  clubMemberMiddleware,
  async (req, res) => {
    try {
      const member = await ClubMember.findOne({
        clubId: req.params.clubId,
        userId: req.params.userId
      }).populate('userId', 'username email profilePicture bio phoneNumber');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching member details',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/clubs/:clubId/members/:userId/role
// @desc    Update member role
// @access  Private (requires assign_roles permission)
router.put(
  '/:clubId/:userId/role',
  authMiddleware,
  validateObjectId('clubId'),
  validateObjectId('userId'),
  checkPermission('assign_roles'),
  async (req, res) => {
    try {
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }

      // Can't change president role
      if (role === 'president') {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign president role. Only the club owner is president.'
        });
      }

      // Verify role exists in club
      const club = await Club.findById(req.params.clubId);
      const roleExists = club.customRoles.some(r => r.name === role);

      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: `Role "${role}" does not exist in this club`
        });
      }

      const member = await ClubMember.findOneAndUpdate(
        {
          clubId: req.params.clubId,
          userId: req.params.userId,
          status: 'active'
        },
        { role },
        { new: true }
      ).populate('userId', 'username email profilePicture');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: member
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating member role',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/clubs/:clubId/members/:userId/permissions
// @desc    Update member custom permissions
// @access  Private (president only)
router.put(
  '/:clubId/:userId/permissions',
  authMiddleware,
  validateObjectId('clubId'),
  validateObjectId('userId'),
  clubPresidentMiddleware,
  async (req, res) => {
    try {
      const { customPermissions } = req.body;

      if (!Array.isArray(customPermissions)) {
        return res.status(400).json({
          success: false,
          message: 'customPermissions must be an array'
        });
      }

      const member = await ClubMember.findOneAndUpdate(
        {
          clubId: req.params.clubId,
          userId: req.params.userId,
          status: 'active'
        },
        { customPermissions },
        { new: true, runValidators: true }
      ).populate('userId', 'username email profilePicture');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member permissions updated successfully',
        data: member
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating member permissions',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/clubs/:clubId/members/:userId/status
// @desc    Update member status (suspend/ban/reactivate)
// @access  Private (requires suspend_members permission)
router.put(
  '/:clubId/:userId/status',
  authMiddleware,
  validateObjectId('clubId'),
  validateObjectId('userId'),
  checkPermission('suspend_members'),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!['active', 'suspended', 'banned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active, suspended, or banned'
        });
      }

      // Can't suspend/ban the president
      const club = await Club.findById(req.params.clubId);
      if (club.ownerId.toString() === req.params.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the president\'s status'
        });
      }

      const updateData = { status };
      if (notes) updateData.notes = notes;

      const member = await ClubMember.findOneAndUpdate(
        {
          clubId: req.params.clubId,
          userId: req.params.userId
        },
        updateData,
        { new: true }
      ).populate('userId', 'username email profilePicture');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: `Member ${status} successfully`,
        data: member
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating member status',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/clubs/:clubId/members/:userId
// @desc    Remove member from club
// @access  Private (requires remove_members permission)
router.delete(
  '/:clubId/:userId',
  authMiddleware,
  validateObjectId('clubId'),
  validateObjectId('userId'),
  checkPermission('remove_members'),
  async (req, res) => {
    try {
      const clubId = req.params.clubId;
      const userId = req.params.userId;

      // Can't remove the president
      const club = await Club.findById(clubId);
      if (club.ownerId.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the club president'
        });
      }

      const member = await ClubMember.findOneAndDelete({
        clubId,
        userId
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      // Update club member count
      await Club.findByIdAndUpdate(clubId, {
        $inc: { memberCount: -1 }
      });

      // Remove from user's memberships
      await User.findByIdAndUpdate(userId, {
        $pull: { clubMemberships: member._id }
      });

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing member',
        error: error.message
      });
    }
  }
);

// @route   POST /api/clubs/:clubId/members/leave
// @desc    Leave club
// @access  Private (member only)
router.post(
  '/:clubId/leave',
  authMiddleware,
  validateObjectId('clubId'),
  async (req, res) => {
    try {
      const clubId = req.params.clubId;
      const userId = req.user._id;

      // Can't leave if you're the president
      const club = await Club.findById(clubId);
      if (club.ownerId.toString() === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'President cannot leave the club. Delete the club instead or transfer presidency first.'
        });
      }

      const member = await ClubMember.findOneAndDelete({
        clubId,
        userId
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'You are not a member of this club'
        });
      }

      // Update club member count
      await Club.findByIdAndUpdate(clubId, {
        $inc: { memberCount: -1 }
      });

      // Remove from user's memberships
      await User.findByIdAndUpdate(userId, {
        $pull: { clubMemberships: member._id }
      });

      res.json({
        success: true,
        message: 'You have left the club successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error leaving club',
        error: error.message
      });
    }
  }
);

module.exports = router;
