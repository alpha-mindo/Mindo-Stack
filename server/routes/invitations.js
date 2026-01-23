const express = require('express');
const router = express.Router();
const ClubInvitation = require('../models/ClubInvitation');
const Club = require('../models/Club');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/clubAuth');
const { validateObjectId, validateUserExists } = require('../middleware/validators');

// @route   POST /api/clubs/:clubId/invitations
// @desc    Invite user to club
// @access  Private (requires invite_members permission)
router.post(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('invite_members'),
  async (req, res) => {
    try {
      const { userId, message, role = 'Member' } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already a member
      const ClubMember = require('../models/ClubMember');
      const existingMember = await ClubMember.findOne({
        clubId: req.params.clubId,
        userId,
        status: { $in: ['active', 'suspended'] }
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this club'
        });
      }

      // Check if user is president of another club
      const ownedClub = await Club.findOne({ ownerId: userId });
      if (ownedClub) {
        return res.status(400).json({
          success: false,
          message: 'This user is a president of another club and cannot join'
        });
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ClubInvitation.findOne({
        clubId: req.params.clubId,
        userId,
        status: 'pending'
      });

      if (existingInvitation && !existingInvitation.isExpired) {
        return res.status(400).json({
          success: false,
          message: 'User already has a pending invitation to this club'
        });
      }

      // Verify role exists in club
      const club = await Club.findById(req.params.clubId);
      const roleExists = club.customRoles.some(r => r.name === role);

      if (!roleExists && role !== 'Member') {
        return res.status(400).json({
          success: false,
          message: `Role "${role}" does not exist in this club`
        });
      }

      // Create invitation
      const invitation = await ClubInvitation.create({
        clubId: req.params.clubId,
        userId,
        invitedBy: req.user._id,
        message,
        role
      });

      const populatedInvitation = await ClubInvitation.findById(invitation._id)
        .populate('clubId', 'name logo category')
        .populate('userId', 'username email')
        .populate('invitedBy', 'username');

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: populatedInvitation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending invitation',
        error: error.message
      });
    }
  }
);

// @route   GET /api/clubs/:clubId/invitations
// @desc    Get club's sent invitations
// @access  Private (requires invite_members permission)
router.get(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('invite_members'),
  async (req, res) => {
    try {
      const { status } = req.query;

      const invitations = await ClubInvitation.getClubInvitations(req.params.clubId);

      let filteredInvitations = invitations;
      if (status) {
        filteredInvitations = invitations.filter(inv => inv.status === status);
      }

      res.json({
        success: true,
        data: filteredInvitations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching invitations',
        error: error.message
      });
    }
  }
);

// @route   GET /api/invitations/my-invitations
// @desc    Get current user's pending invitations
// @access  Private
router.get('/my-invitations', authMiddleware, async (req, res) => {
  try {
    const invitations = await ClubInvitation.getUserInvitations(req.user._id);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your invitations',
      error: error.message
    });
  }
});

// @route   PUT /api/invitations/:invitationId/accept
// @desc    Accept invitation
// @access  Private (invitee only)
router.put(
  '/:invitationId/accept',
  authMiddleware,
  validateObjectId('invitationId'),
  async (req, res) => {
    try {
      const invitation = await ClubInvitation.findById(req.params.invitationId)
        .populate('clubId', 'name');

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      // Only the invited user can accept
      if (invitation.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'This invitation is not for you'
        });
      }

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Invitation is ${invitation.status}`
        });
      }

      if (invitation.isExpired) {
        invitation.status = 'expired';
        await invitation.save();
        return res.status(400).json({
          success: false,
          message: 'Invitation has expired'
        });
      }

      // Check if user is president of another club
      const ownedClub = await Club.findOne({ ownerId: req.user._id });
      if (ownedClub) {
        return res.status(400).json({
          success: false,
          message: 'You are a president of another club and cannot join'
        });
      }

      // Check if already a member
      const ClubMember = require('../models/ClubMember');
      const existingMember = await ClubMember.findOne({
        clubId: invitation.clubId,
        userId: req.user._id,
        status: 'active'
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this club'
        });
      }

      await invitation.accept();

      res.json({
        success: true,
        message: `You have joined ${invitation.clubId.name}!`,
        data: invitation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error accepting invitation',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/invitations/:invitationId/decline
// @desc    Decline invitation
// @access  Private (invitee only)
router.put(
  '/:invitationId/decline',
  authMiddleware,
  validateObjectId('invitationId'),
  async (req, res) => {
    try {
      const invitation = await ClubInvitation.findById(req.params.invitationId);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      // Only the invited user can decline
      if (invitation.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'This invitation is not for you'
        });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Invitation is already ${invitation.status}`
        });
      }

      await invitation.decline();

      res.json({
        success: true,
        message: 'Invitation declined',
        data: invitation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error declining invitation',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/invitations/:invitationId
// @desc    Cancel invitation
// @access  Private (inviter or president only)
router.delete(
  '/:invitationId',
  authMiddleware,
  validateObjectId('invitationId'),
  async (req, res) => {
    try {
      const invitation = await ClubInvitation.findById(req.params.invitationId);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      // Check if user is the inviter or club president
      const club = await Club.findById(invitation.clubId);
      const isInviter = invitation.invitedBy.toString() === req.user._id.toString();
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isInviter && !isPresident) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel invitations you sent'
        });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel ${invitation.status} invitation`
        });
      }

      await invitation.cancel();

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling invitation',
        error: error.message
      });
    }
  }
);

module.exports = router;
