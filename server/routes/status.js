const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @route   GET /api/status
// @desc    Get system status and available routes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    const routeInfo = {
      system: {
        status: 'operational',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      routes: {
        authentication: {
          base: '/api/auth',
          endpoints: [
            { method: 'POST', path: '/signup', description: 'Register new user' },
            { method: 'POST', path: '/login', description: 'Login user' },
            { method: 'POST', path: '/forgot-password', description: 'Request password reset' },
            { method: 'POST', path: '/reset-password/:token', description: 'Reset password with token' }
          ]
        },
        users: {
          base: '/api/users',
          endpoints: [
            { method: 'GET', path: '/me', description: 'Get current user profile', auth: true },
            { method: 'PUT', path: '/me', description: 'Update user profile', auth: true },
            { method: 'GET', path: '/me/clubs', description: 'Get all user club relationships', auth: true },
            { method: 'GET', path: '/:userId/profile', description: 'Get public user profile' }
          ]
        },
        clubs: {
          base: '/api/clubs',
          endpoints: [
            { method: 'POST', path: '/', description: 'Create new club', auth: true },
            { method: 'GET', path: '/', description: 'List all clubs (with filters)' },
            { method: 'GET', path: '/my-clubs', description: 'Get user-owned clubs', auth: true },
            { method: 'GET', path: '/my-memberships', description: 'Get user memberships', auth: true },
            { method: 'GET', path: '/:id', description: 'Get club details' },
            { method: 'PUT', path: '/:id', description: 'Update club', auth: true, permission: 'edit_club' },
            { method: 'DELETE', path: '/:id', description: 'Delete club', auth: true, role: 'president' },
            { method: 'GET', path: '/:id/stats', description: 'Get club statistics', auth: true },
            { method: 'POST', path: '/:id/roles', description: 'Create custom role', auth: true, permission: 'manage_roles' },
            { method: 'PUT', path: '/:id/roles/:roleId', description: 'Update role', auth: true, permission: 'manage_roles' },
            { method: 'DELETE', path: '/:id/roles/:roleId', description: 'Delete role', auth: true, permission: 'manage_roles' },
            { method: 'PUT', path: '/:id/application-form', description: 'Update application form', auth: true, role: 'president' },
            { method: 'PUT', path: '/:id/application-form/toggle', description: 'Toggle applications', auth: true, role: 'president' },
            { method: 'POST', path: '/:id/violations', description: 'Add violation', auth: true, permission: 'manage_violations' },
            { method: 'PUT', path: '/:id/violations/:violationId', description: 'Resolve violation', auth: true, permission: 'manage_violations' }
          ]
        },
        applications: {
          base: '/api/applications',
          endpoints: [
            { method: 'POST', path: '/:clubId', description: 'Apply to join club', auth: true },
            { method: 'GET', path: '/:clubId', description: 'Get club applications', auth: true, permission: 'view_applications' },
            { method: 'GET', path: '/my-applications', description: 'Get user applications', auth: true },
            { method: 'PUT', path: '/:applicationId/schedule-interview', description: 'Schedule interview', auth: true, permission: 'interview_applicants' },
            { method: 'PUT', path: '/:applicationId/complete-interview', description: 'Complete interview', auth: true, permission: 'interview_applicants' },
            { method: 'PUT', path: '/:applicationId/approve', description: 'Approve application', auth: true, permission: 'approve_applications' },
            { method: 'PUT', path: '/:applicationId/reject', description: 'Reject application', auth: true, permission: 'approve_applications' },
            { method: 'GET', path: '/:applicationId', description: 'Get application details', auth: true },
            { method: 'DELETE', path: '/:applicationId', description: 'Withdraw application', auth: true }
          ]
        },
        members: {
          base: '/api/clubs/:clubId/members',
          endpoints: [
            { method: 'GET', path: '/', description: 'List club members', auth: true },
            { method: 'GET', path: '/:userId', description: 'Get member details', auth: true },
            { method: 'PUT', path: '/:userId/role', description: 'Update member role', auth: true, permission: 'assign_roles' },
            { method: 'PUT', path: '/:userId/permissions', description: 'Update permissions', auth: true, role: 'president' },
            { method: 'PUT', path: '/:userId/status', description: 'Suspend/ban member', auth: true, permission: 'suspend_members' },
            { method: 'DELETE', path: '/:userId', description: 'Remove member', auth: true, permission: 'remove_members' },
            { method: 'POST', path: '/leave', description: 'Leave club', auth: true }
          ]
        },
        invitations: {
          base: '/api/invitations',
          endpoints: [
            { method: 'POST', path: '/:clubId', description: 'Invite user to club', auth: true, permission: 'invite_members' },
            { method: 'GET', path: '/:clubId', description: 'Get club invitations', auth: true },
            { method: 'GET', path: '/my-invitations', description: 'Get user invitations', auth: true },
            { method: 'PUT', path: '/:invitationId/accept', description: 'Accept invitation', auth: true },
            { method: 'PUT', path: '/:invitationId/decline', description: 'Decline invitation', auth: true },
            { method: 'GET', path: '/:invitationId', description: 'Get invitation details', auth: true },
            { method: 'DELETE', path: '/:invitationId', description: 'Cancel invitation', auth: true }
          ]
        },
        announcements: {
          base: '/api/clubs/:clubId/announcements',
          endpoints: [
            { method: 'POST', path: '/', description: 'Create announcement/poll/form', auth: true, permission: 'post_announcements' },
            { method: 'GET', path: '/', description: 'List club announcements', auth: true },
            { method: 'GET', path: '/:announcementId', description: 'Get announcement details', auth: true },
            { method: 'PUT', path: '/:announcementId', description: 'Update announcement', auth: true },
            { method: 'DELETE', path: '/:announcementId', description: 'Delete announcement', auth: true },
            { method: 'PUT', path: '/:announcementId/pin', description: 'Toggle pin status', auth: true, permission: 'post_announcements' },
            { method: 'POST', path: '/:announcementId/comments', description: 'Add comment', auth: true },
            { method: 'PUT', path: '/:announcementId/comments/:commentId', description: 'Edit comment', auth: true },
            { method: 'DELETE', path: '/:announcementId/comments/:commentId', description: 'Delete comment', auth: true },
            { method: 'POST', path: '/:announcementId/comments/:commentId/reply', description: 'Reply to comment', auth: true },
            { method: 'POST', path: '/:announcementId/poll/vote', description: 'Vote on poll', auth: true },
            { method: 'GET', path: '/:announcementId/poll/results', description: 'Get poll results', auth: true },
            { method: 'PUT', path: '/:announcementId/poll/close', description: 'Close poll', auth: true },
            { method: 'POST', path: '/:announcementId/form/submit', description: 'Submit form response', auth: true },
            { method: 'GET', path: '/:announcementId/form/responses', description: 'Get form responses', auth: true, permission: 'post_announcements' },
            { method: 'PUT', path: '/:announcementId/form/close', description: 'Close form', auth: true },
            { method: 'DELETE', path: '/:announcementId/form/responses/:responseId', description: 'Delete form response', auth: true }
          ]
        },
        trips: {
          base: '/api/clubs/:clubId/trips',
          endpoints: [
            { method: 'POST', path: '/', description: 'Create trip', auth: true, permission: 'manage_trips' },
            { method: 'GET', path: '/', description: 'List club trips', auth: true },
            { method: 'GET', path: '/:tripId', description: 'Get trip details', auth: true },
            { method: 'PUT', path: '/:tripId', description: 'Update trip', auth: true, permission: 'manage_trips' },
            { method: 'DELETE', path: '/:tripId', description: 'Delete trip', auth: true, permission: 'manage_trips' },
            { method: 'POST', path: '/:tripId/signup', description: 'Sign up for trip', auth: true },
            { method: 'DELETE', path: '/:tripId/signup', description: 'Cancel trip signup', auth: true },
            { method: 'PUT', path: '/:tripId/status', description: 'Update trip status', auth: true, permission: 'manage_trips' },
            { method: 'PUT', path: '/:tripId/attendance/:participantId', description: 'Mark attendance', auth: true, permission: 'manage_trips' }
          ]
        },
        content: {
          base: '/api/clubs/:clubId/content',
          endpoints: [
            { method: 'POST', path: '/', description: 'Upload content', auth: true, permission: 'manage_content' },
            { method: 'GET', path: '/', description: 'List club content', auth: true },
            { method: 'GET', path: '/:contentId', description: 'Get content details', auth: true },
            { method: 'PUT', path: '/:contentId', description: 'Update content', auth: true },
            { method: 'DELETE', path: '/:contentId', description: 'Delete content', auth: true, permission: 'manage_content' },
            { method: 'GET', path: '/by-category/:category', description: 'Get content by category', auth: true },
            { method: 'GET', path: '/:contentId/download', description: 'Download content (tracked)', auth: true },
            { method: 'GET', path: '/categories/list', description: 'List all content categories', auth: true }
          ]
        }
      },
      models: {
        implemented: [
          'User',
          'Club',
          'ClubMember',
          'ClubApplication',
          'ClubInvitation',
          'ClubAnnouncement (with polls, forms, comments)',
          'ClubTrip',
          'ClubContent',
          'ClubBan'
        ]
      },
      features: {
        authentication: true,
        clubManagement: true,
        customRoles: true,
        permissions: '17 granular permissions',
        applications: 'With interview scheduling',
        invitations: true,
        announcements: 'With polls, forms, and threaded comments',
        trips: 'Full trip management with signup and attendance',
        content: 'Role-based content management with access control',
        bans: 'Planned (model ready)',
        adminSystem: 'Admin roles and protected routes'
      },
      statistics: {
        totalEndpoints: 72,
        routeCategories: 9,
        models: 9,
        phaseCompletion: '50% (Phase 5 complete)'
      }
    };

    res.json(routeInfo);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
});

module.exports = router;
