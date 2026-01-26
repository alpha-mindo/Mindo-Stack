const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Ticket = require('../models/Ticket');
const ClubViolation = require('../models/ClubViolation');
const { adminMiddleware } = require('../middleware/auth');

// All routes require admin authentication
router.use(adminMiddleware);

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClubs = await Club.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } });
    const adminCount = await User.countDocuments({ isAdmin: true });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    const suspendedClubs = await Club.countDocuments({ isSuspended: true });
    const unresolvedViolations = await ClubViolation.countDocuments({ resolved: false });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalClubs,
        totalTickets,
        openTickets,
        adminCount,
        recentUsers,
        suspendedClubs,
        unresolvedViolations
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isAdmin } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (isAdmin !== undefined) {
      filter.isAdmin = isAdmin === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/users/:id/toggle-admin
// @desc    Toggle user admin status
// @access  Admin
router.patch('/users/:id/toggle-admin', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent demoting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin status'
      });
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isAdmin ? 'promoted to' : 'removed from'} admin`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// @route   GET /api/admin/clubs
// @desc    Get all clubs with pagination
// @access  Admin
router.get('/clubs', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const clubs = await Club.find(filter)
      .populate('ownerId', 'username email')
      .select('name description category memberCount isSuspended violationCount suspensionEndDate createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Club.countDocuments(filter);

    res.json({
      success: true,
      clubs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clubs',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/clubs/:id
// @desc    Delete club (admin override)
// @access  Admin
router.delete('/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    res.json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting club',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/clubs/:clubId/suspension
// @desc    Update club suspension duration
// @access  Private (admin only)
router.patch('/clubs/:clubId/suspension', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { suspensionDays, reason } = req.body;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (suspensionDays && suspensionDays > 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(suspensionDays));
      
      club.isSuspended = true;
      club.suspensionEndDate = endDate;
      if (reason) {
        club.suspensionReason = reason;
      }

      await club.save();

      res.json({
        success: true,
        club,
        message: `Suspension updated to ${suspensionDays} days`
      });
    } else {
      return res.status(400).json({ error: 'Suspension days must be greater than 0' });
    }
  } catch (error) {
    console.error('Error updating suspension:', error);
    res.status(500).json({ error: 'Error updating suspension duration' });
  }
});

// PATCH /api/admin/clubs/:clubId/unsuspend - Unsuspend a club
router.patch('/clubs/:clubId/unsuspend', async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    club.isSuspended = false;
    club.suspensionEndDate = null;
    club.suspensionReason = null;

    await club.save();

    res.json({
      success: true,
      club,
      message: 'Club suspension removed successfully'
    });
  } catch (error) {
    console.error('Error unsuspending club:', error);
    res.status(500).json({ error: 'Error removing club suspension' });
  }
});

// PATCH /api/admin/violations/:violationId/resolve - Resolve a violation
router.patch('/violations/:violationId/resolve', async (req, res) => {
  try {
    const { violationId } = req.params;
    const { resolutionNotes } = req.body;

    const ClubViolation = require('../models/ClubViolation');
    
    const violation = await ClubViolation.findById(violationId);
    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    violation.resolved = true;
    violation.resolvedAt = new Date();
    violation.resolvedBy = req.user._id;
    if (resolutionNotes) {
      violation.resolutionNotes = resolutionNotes;
    }

    await violation.save();

    res.json({
      success: true,
      violation,
      message: 'Violation resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving violation:', error);
    res.status(500).json({ error: 'Error resolving violation' });
  }
});

module.exports = router;
