const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { clubPresidentMiddleware, checkPermission } = require('../middleware/clubAuth');
const { validateObjectId, validateClubExists } = require('../middleware/validators');

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, logo, category, tags, customRoles } = req.body;

    // Check if user already owns a club (president exclusivity)
    const existingClub = await Club.findOne({ ownerId: req.user._id });
    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'You already own a club. A user can only be president of one club.'
      });
    }

    // Check if user is a member of any club (presidents cannot be members elsewhere)
    const existingMembership = await ClubMember.findOne({ 
      userId: req.user._id,
      status: 'active'
    });
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are currently a member of another club. Leave that club first to create your own.'
      });
    }

    // Create club
    const club = await Club.create({
      name,
      description,
      logo,
      category,
      tags: tags || [],
      customRoles: customRoles || [],
      ownerId: req.user._id,
      memberCount: 1
    });

    // Create ClubMember entry for president
    const presidentMembership = await ClubMember.create({
      clubId: club._id,
      userId: req.user._id,
      role: 'president',
      status: 'active'
    });

    // Update user's clubsOwned and clubMemberships
    await User.findByIdAndUpdate(req.user._id, {
      $push: { 
        clubsOwned: club._id,
        clubMemberships: presidentMembership._id
      }
    });

    // Notify all registered users about the new club (except the creator)
    const allUsers = await User.find({ _id: { $ne: req.user._id } }).select('_id');
    const notificationPromises = allUsers.map(user =>
      Notification.createNotification({
        recipient: user._id,
        type: 'system',
        title: 'New club available',
        message: `${club.name} has been created and is now available!`,
        relatedClub: club._id,
        priority: 'low'
      })
    );
    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: club
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A club with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating club',
      error: error.message
    });
  }
});

// @route   GET /api/clubs
// @desc    Get all clubs with search and filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, tags, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Execute query with pagination
    const clubs = await Club.find(query)
      .select('name description logo category tags memberCount createdAt')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Club.countDocuments(query);

    res.json({
      success: true,
      data: clubs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clubs',
      error: error.message
    });
  }
});

// @route   GET /api/clubs/my-clubs
// @desc    Get clubs owned by current user
// @access  Private
router.get('/my-clubs', authMiddleware, async (req, res) => {
  try {
    const clubs = await Club.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your clubs',
      error: error.message
    });
  }
});

// @route   GET /api/clubs/my-memberships
// @desc    Get clubs where user is a member
// @access  Private
router.get('/my-memberships', authMiddleware, async (req, res) => {
  try {
    const memberships = await ClubMember.find({ 
      userId: req.user._id,
      status: 'active'
    }).populate('clubId', 'name description logo category memberCount');

    const clubs = memberships.map(membership => ({
      ...membership.clubId.toObject(),
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
        title: membership.title
      }
    }));

    res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your memberships',
      error: error.message
    });
  }
});

// @route   GET /api/clubs/:clubId
// @desc    Get club details
// @access  Public
router.get('/:clubId', validateObjectId('clubId'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate('ownerId', 'username email profilePicture');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    res.json({
      success: true,
      data: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching club details',
      error: error.message
    });
  }
});

// @route   PUT /api/clubs/:clubId
// @desc    Update club details
// @access  Private (president or members with edit_club permission)
router.put(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('edit_club'),
  async (req, res) => {
    try {
      const { name, description, logo, category, tags } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (logo !== undefined) updateData.logo = logo;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;

      // Check if registration is being opened
      const oldClub = await Club.findById(req.params.clubId);
      const registrationOpened = req.body.isRecruitmentOpen === true && oldClub.isRecruitmentOpen === false;

      if (req.body.isRecruitmentOpen !== undefined) {
        updateData.isRecruitmentOpen = req.body.isRecruitmentOpen;
      }

      const club = await Club.findByIdAndUpdate(
        req.params.clubId,
        updateData,
        { new: true, runValidators: true }
      );

      // If registration was just opened, notify all non-members
      if (registrationOpened) {
        const clubMemberIds = await ClubMember.find({ 
          clubId: req.params.clubId,
          status: 'active'
        }).distinct('userId');
        
        const nonMembers = await User.find({ 
          _id: { $nin: clubMemberIds }
        }).select('_id');
        
        const notificationPromises = nonMembers.map(user =>
          Notification.createNotification({
            recipient: user._id,
            type: 'system',
            title: 'Club registration opened',
            message: `${club.name} is now accepting new members!`,
            relatedClub: club._id,
            priority: 'normal'
          })
        );
        await Promise.all(notificationPromises);
      }

      res.json({
        success: true,
        message: 'Club updated successfully',
        data: club
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A club with this name already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error updating club',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/clubs/:clubId
// @desc    Delete club
// @access  Private (president only)
router.delete(
  '/:clubId',
  authMiddleware,
  validateObjectId('clubId'),
  clubPresidentMiddleware,
  async (req, res) => {
    try {
      const clubId = req.params.clubId;

      // Delete all club members
      await ClubMember.deleteMany({ clubId });

      // Remove club references from users
      await User.updateMany(
        { clubsOwned: clubId },
        { $pull: { clubsOwned: clubId } }
      );

      await User.updateMany(
        { clubMemberships: { $exists: true } },
        { $pull: { clubMemberships: { $in: await ClubMember.find({ clubId }).distinct('_id') } } }
      );

      // Delete the club
      await Club.findByIdAndDelete(clubId);

      res.json({
        success: true,
        message: 'Club deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting club',
        error: error.message
      });
    }
  }
);

// @route   GET /api/clubs/:clubId/stats
// @desc    Get club statistics
// @access  Private (club members only)
router.get(
  '/:clubId/stats',
  authMiddleware,
  validateObjectId('clubId'),
  async (req, res) => {
    try {
      const club = await Club.findById(req.params.clubId);
      
      if (!club) {
        return res.status(404).json({
          success: false,
          message: 'Club not found'
        });
      }

      const memberCount = await ClubMember.countDocuments({ 
        clubId: req.params.clubId,
        status: 'active'
      });

      const roleDistribution = await ClubMember.aggregate([
        { $match: { clubId: club._id, status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          totalMembers: memberCount,
          roleDistribution,
          violations: club.violationCount,
          customRoles: club.customRoles.length,
          createdAt: club.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching club statistics',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/clubs/:clubId/application-form
// @desc    Update club application form settings
// @access  Private (president only)
router.put(
  '/:clubId/application-form',
  authMiddleware,
  validateObjectId('clubId'),
  clubPresidentMiddleware,
  async (req, res) => {
    try {
      const { enabled, isOpen, questions } = req.body;

      const updateData = {};
      if (enabled !== undefined) updateData['applicationForm.enabled'] = enabled;
      if (isOpen !== undefined) updateData['applicationForm.isOpen'] = isOpen;
      if (questions) updateData['applicationForm.questions'] = questions;

      const club = await Club.findByIdAndUpdate(
        req.params.clubId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Application form updated successfully',
        data: club.applicationForm
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating application form',
        error: error.message
      });
    }
  }
);

// @route   POST /api/clubs/:clubId/roles
// @desc    Add custom role to club
// @access  Private (president or members with manage_roles permission)
router.post(
  '/:clubId/roles',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('manage_roles'),
  async (req, res) => {
    try {
      const { name, permissions, color } = req.body;

      if (!name || !permissions) {
        return res.status(400).json({
          success: false,
          message: 'Role name and permissions are required'
        });
      }

      // Check if role name already exists
      const club = await Club.findById(req.params.clubId);
      const existingRole = club.customRoles.find(role => role.name === name);
      
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }

      club.customRoles.push({ name, permissions, color });
      await club.save();

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: club.customRoles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating role',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/clubs/:clubId/roles/:roleName
// @desc    Update custom role
// @access  Private (president or members with manage_roles permission)
router.put(
  '/:clubId/roles/:roleName',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('manage_roles'),
  async (req, res) => {
    try {
      const { permissions, color } = req.body;
      const roleName = req.params.roleName;

      const club = await Club.findById(req.params.clubId);
      const role = club.customRoles.find(r => r.name === roleName);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      if (roleName === 'Member') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify the default Member role name. You can only update its permissions.'
        });
      }

      if (permissions) role.permissions = permissions;
      if (color !== undefined) role.color = color;

      await club.save();

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: club.customRoles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating role',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/clubs/:clubId/roles/:roleName
// @desc    Delete custom role
// @access  Private (president or members with manage_roles permission)
router.delete(
  '/:clubId/roles/:roleName',
  authMiddleware,
  validateObjectId('clubId'),
  checkPermission('manage_roles'),
  async (req, res) => {
    try {
      const roleName = req.params.roleName;

      if (roleName === 'Member') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the default Member role'
        });
      }

      // Check if any members have this role
      const membersWithRole = await ClubMember.countDocuments({
        clubId: req.params.clubId,
        role: roleName
      });

      if (membersWithRole > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. ${membersWithRole} member(s) currently have this role. Reassign them first.`
        });
      }

      const club = await Club.findById(req.params.clubId);
      club.customRoles = club.customRoles.filter(r => r.name !== roleName);
      await club.save();

      res.json({
        success: true,
        message: 'Role deleted successfully',
        data: club.customRoles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting role',
        error: error.message
      });
    }
  }
);

module.exports = router;
