const express = require('express');
const router = express.Router();
const ClubApplication = require('../models/ClubApplication');
const Club = require('../models/Club');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/clubAuth');
const { 
  validateObjectId, 
  validateClubExists, 
  validateApplicationExists,
  validateNotMember,
  validateNoExistingApplication,
  validateApplicationsOpen 
} = require('../middleware/validators');

// @route   POST /api/clubs/:clubId/applications
// @desc    Apply to join a club
// @access  Private
router.post(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  validateClubExists,
  validateNotMember,
  validateNoExistingApplication,
  validateApplicationsOpen,
  async (req, res) => {
    try {
      const { message, answers } = req.body;
      const club = req.club;

      // Validate answers match application form questions
      if (club.applicationForm.questions && club.applicationForm.questions.length > 0) {
        const requiredQuestions = club.applicationForm.questions.filter(q => q.required);
        
        if (!answers || answers.length < requiredQuestions.length) {
          return res.status(400).json({
            success: false,
            message: 'Please answer all required questions'
          });
        }
      }

      // Create application
      const application = await ClubApplication.create({
        clubId: req.params.clubId,
        userId: req.user._id,
        message,
        answers: answers || []
      });

      // Update user's applications array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { clubApplications: application._id }
      });

      // Notify president and members with view_applications permission
      const ClubMember = require('../models/ClubMember');
      const membersWithPermission = await ClubMember.find({
        clubId: req.params.clubId,
        status: 'active',
        $or: [
          { role: 'president' },
          { 'permissions.view_applications': true },
          { 'permissions.approve_applications': true }
        ]
      }).select('userId');

      const notificationPromises = membersWithPermission.map(member =>
        Notification.createNotification({
          recipient: member.userId,
          type: 'club_join_request',
          title: 'New club application',
          message: `${req.user.username} applied to join ${club.name}`,
          relatedClub: req.params.clubId,
          priority: 'normal'
        })
      );
      await Promise.all(notificationPromises);

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error submitting application',
        error: error.message
      });
    }
  }
);

// @route   GET /api/clubs/:clubId/applications
// @desc    Get all applications for a club
// @access  Private (requires view_applications permission)
router.get(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('view_applications'),
  async (req, res) => {
    try {
      const { status } = req.query;
      
      const query = { clubId: req.params.clubId };
      if (status) {
        query.status = status;
      }

      const applications = await ClubApplication.find(query)
        .populate('userId', 'username email profilePicture bio')
        .sort({ appliedAt: -1 });

      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching applications',
        error: error.message
      });
    }
  }
);

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const applications = await ClubApplication.getUserApplications(req.user._id);

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your applications',
      error: error.message
    });
  }
});

// @route   GET /api/applications/:applicationId
// @desc    Get specific application details
// @access  Private
router.get(
  '/:applicationId',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;

      // Only allow viewing if you're the applicant or have permission in the club
      const club = await Club.findById(application.clubId);
      const isApplicant = application.userId._id.toString() === req.user._id.toString();
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isApplicant && !isPresident) {
        // Check if user has view_applications permission
        const ClubMember = require('../models/ClubMember');
        const membership = await ClubMember.findOne({
          clubId: application.clubId,
          userId: req.user._id,
          status: 'active'
        });

        if (!membership || !membership.hasPermission('view_applications')) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching application',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/applications/:applicationId/schedule-interview
// @desc    Schedule interview for an application
// @access  Private (requires interview_applicants permission)
router.put(
  '/:applicationId/schedule-interview',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;
      const { date, location, type, meetingLink, notes } = req.body;

      // Check permission
      const club = await Club.findById(application.clubId);
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isPresident) {
        const ClubMember = require('../models/ClubMember');
        const membership = await ClubMember.findOne({
          clubId: application.clubId,
          userId: req.user._id,
          status: 'active'
        });

        if (!membership || !membership.hasPermission('interview_applicants')) {
          return res.status(403).json({
            success: false,
            message: 'You need interview_applicants permission'
          });
        }
      }

      if (!date || !location) {
        return res.status(400).json({
          success: false,
          message: 'Interview date and location are required'
        });
      }

      await application.scheduleInterview({
        date,
        location,
        type: type || 'in-person',
        meetingLink,
        notes
      });

      // Notify the applicant
      const club = await Club.findById(application.clubId);
      await Notification.createNotification({
        recipient: application.userId,
        type: 'event_reminder',
        title: 'Interview scheduled',
        message: `Your interview for ${club.name} has been scheduled for ${new Date(date).toLocaleDateString()}`,
        relatedClub: application.clubId,
        priority: 'high'
      });

      res.json({
        success: true,
        message: 'Interview scheduled successfully',
        data: application
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   PUT /api/applications/:applicationId/complete-interview
// @desc    Mark interview as completed
// @access  Private (requires interview_applicants permission)
router.put(
  '/:applicationId/complete-interview',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;
      const { notes } = req.body;

      // Check permission
      const club = await Club.findById(application.clubId);
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isPresident) {
        const ClubMember = require('../models/ClubMember');
        const membership = await ClubMember.findOne({
          clubId: application.clubId,
          userId: req.user._id,
          status: 'active'
        });

        if (!membership || !membership.hasPermission('interview_applicants')) {
          return res.status(403).json({
            success: false,
            message: 'You need interview_applicants permission'
          });
        }
      }

      await application.completeInterview(notes);

      res.json({
        success: true,
        message: 'Interview marked as completed',
        data: application
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   PUT /api/applications/:applicationId/approve
// @desc    Approve application
// @access  Private (requires approve_applications permission)
router.put(
  '/:applicationId/approve',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;

      // Check permission
      const club = await Club.findById(application.clubId);
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isPresident) {
        const ClubMember = require('../models/ClubMember');
        const membership = await ClubMember.findOne({
          clubId: application.clubId,
          userId: req.user._id,
          status: 'active'
        });

        if (!membership || !membership.hasPermission('approve_applications')) {
          return res.status(403).json({
            success: false,
            message: 'You need approve_applications permission'
          });
        }
      }

      await application.approve(req.user._id);

      // Notify the applicant
      await Notification.createNotification({
        recipient: application.userId,
        type: 'system',
        title: 'Application approved! 🎉',
        message: `Congratulations! Your application to join ${club.name} has been approved`,
        relatedClub: application.clubId,
        priority: 'high'
      });

      res.json({
        success: true,
        message: 'Application approved successfully',
        data: application
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   PUT /api/applications/:applicationId/reject
// @desc    Reject application
// @access  Private (requires approve_applications permission)
router.put(
  '/:applicationId/reject',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;
      const { reason } = req.body;

      // Check permission
      const club = await Club.findById(application.clubId);
      const isPresident = club.ownerId.toString() === req.user._id.toString();

      if (!isPresident) {
        const ClubMember = require('../models/ClubMember');
        const membership = await ClubMember.findOne({
          clubId: application.clubId,
          userId: req.user._id,
          status: 'active'
        });

        if (!membership || !membership.hasPermission('approve_applications')) {
          return res.status(403).json({
            success: false,
            message: 'You need approve_applications permission'
          });
        }
      }

      await application.reject(req.user._id, reason);

      // Notify the applicant
      await Notification.createNotification({
        recipient: application.userId,
        type: 'system',
        title: 'Application update',
        message: `Your application to join ${club.name} was not approved${reason ? ': ' + reason : ''}`,
        relatedClub: application.clubId,
        priority: 'normal'
      });

      res.json({
        success: true,
        message: 'Application rejected',
        data: application
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   DELETE /api/applications/:applicationId
// @desc    Cancel/withdraw application
// @access  Private (applicant only)
router.delete(
  '/:applicationId',
  authMiddleware,
  validateObjectId('applicationId'),
  validateApplicationExists,
  async (req, res) => {
    try {
      const application = req.application;

      // Only applicant can withdraw
      if (application.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only withdraw your own applications'
        });
      }

      // Can't withdraw approved applications
      if (application.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw an approved application'
        });
      }

      await ClubApplication.findByIdAndDelete(application._id);

      // Remove from user's applications
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { clubApplications: application._id }
      });

      res.json({
        success: true,
        message: 'Application withdrawn successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error withdrawing application',
        error: error.message
      });
    }
  }
);

module.exports = router;
