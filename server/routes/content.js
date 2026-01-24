const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :clubId
const ClubContent = require('../models/ClubContent');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const { authMiddleware } = require('../middleware/auth');

// Middleware to check if user is a club member
const checkClubMembership = async (req, res, next) => {
  try {
    const membership = await ClubMember.findOne({
      clubId: req.params.clubId,
      userId: req.user.userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ error: 'You must be a member of this club' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await req.membership.hasPermission(permission);
      
      if (!hasPermission) {
        return res.status(403).json({ error: `Missing required permission: ${permission}` });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Apply auth and membership check to all routes
router.use(authMiddleware);
router.use(checkClubMembership);

// @route   POST /api/clubs/:clubId/content
// @desc    Upload content
// @access  Private (requires manage_content permission)
router.post('/', checkPermission('manage_content'), async (req, res) => {
  try {
    const { title, description, contentType, fileUrl, fileSize, accessLevel, category, tags } = req.body;

    // Validation
    if (!title || !fileUrl || !contentType) {
      return res.status(400).json({ error: 'Title, file URL, and content type are required' });
    }

    if (!['document', 'image', 'video', 'audio', 'other'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!['member', 'officer', 'executive', 'president'].includes(accessLevel)) {
      return res.status(400).json({ error: 'Invalid access level' });
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    const contentData = {
      clubId: req.params.clubId,
      title,
      description,
      contentType,
      fileUrl,
      fileSize,
      uploadedBy: req.user.userId,
      uploaderName: user.username,
      accessLevel: accessLevel || 'member',
      category,
      tags: tags || []
    };

    const content = new ClubContent(contentData);
    await content.save();

    res.status(201).json({
      message: 'Content uploaded successfully',
      content
    });
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/content
// @desc    List club content
// @access  Private (club members, filtered by access level)
router.get('/', async (req, res) => {
  try {
    const { contentType, category, page = 1, limit = 10 } = req.query;
    
    const query = { clubId: req.params.clubId };
    
    // Filter by content type
    if (contentType && ['document', 'image', 'video', 'audio', 'other'].includes(contentType)) {
      query.contentType = contentType;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Get user's role to filter by access level
    const roleHierarchy = {
      'member': 0,
      'officer': 1,
      'executive': 2,
      'president': 3
    };

    const userRoleLevel = roleHierarchy[req.membership.role] || 0;
    
    // Filter content based on access level
    const accessibleLevels = Object.keys(roleHierarchy).filter(
      role => roleHierarchy[role] <= userRoleLevel
    );

    query.accessLevel = { $in: accessibleLevels };

    const skip = (page - 1) * limit;

    const content = await ClubContent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClubContent.countDocuments(query);

    res.json({
      content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/content/:contentId
// @desc    Get content details
// @access  Private (club members with appropriate access level)
router.get('/:contentId', async (req, res) => {
  try {
    const content = await ClubContent.findOne({
      _id: req.params.contentId,
      clubId: req.params.clubId
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check access level
    const roleHierarchy = {
      'member': 0,
      'officer': 1,
      'executive': 2,
      'president': 3
    };

    const userRoleLevel = roleHierarchy[req.membership.role] || 0;
    const contentRoleLevel = roleHierarchy[content.accessLevel] || 0;

    if (userRoleLevel < contentRoleLevel) {
      return res.status(403).json({ error: 'Insufficient access level for this content' });
    }

    // Increment download count
    content.downloadCount += 1;
    await content.save();

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/content/:contentId
// @desc    Update content
// @access  Private (manage_content permission or content uploader)
router.put('/:contentId', async (req, res) => {
  try {
    const content = await ClubContent.findOne({
      _id: req.params.contentId,
      clubId: req.params.clubId
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check if user has permission or is the uploader
    const hasPermission = await req.membership.hasPermission('manage_content');
    const isUploader = content.uploadedBy.toString() === req.user.userId;

    if (!hasPermission && !isUploader) {
      return res.status(403).json({ error: 'Not authorized to update this content' });
    }

    const { title, description, accessLevel, category, tags } = req.body;

    // Update allowed fields
    if (title) content.title = title;
    if (description !== undefined) content.description = description;
    if (category !== undefined) content.category = category;
    if (tags !== undefined) content.tags = tags;
    
    if (accessLevel && ['member', 'officer', 'executive', 'president'].includes(accessLevel)) {
      content.accessLevel = accessLevel;
    }

    await content.save();

    res.json({
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/content/:contentId
// @desc    Delete content
// @access  Private (manage_content permission or club president)
router.delete('/:contentId', async (req, res) => {
  try {
    const content = await ClubContent.findOne({
      _id: req.params.contentId,
      clubId: req.params.clubId
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check if user has permission or is president
    const hasPermission = await req.membership.hasPermission('manage_content');
    const isPresident = req.membership.role === 'president';

    if (!hasPermission && !isPresident) {
      return res.status(403).json({ error: 'Not authorized to delete this content' });
    }

    await content.deleteOne();

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/content/by-category/:category
// @desc    Get content by category
// @access  Private (club members with appropriate access level)
router.get('/by-category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const query = { 
      clubId: req.params.clubId,
      category: req.params.category
    };

    // Get user's role to filter by access level
    const roleHierarchy = {
      'member': 0,
      'officer': 1,
      'executive': 2,
      'president': 3
    };

    const userRoleLevel = roleHierarchy[req.membership.role] || 0;
    
    // Filter content based on access level
    const accessibleLevels = Object.keys(roleHierarchy).filter(
      role => roleHierarchy[role] <= userRoleLevel
    );

    query.accessLevel = { $in: accessibleLevels };

    const skip = (page - 1) * limit;

    const content = await ClubContent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClubContent.countDocuments(query);

    res.json({
      content,
      category: req.params.category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get content by category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/content/:contentId/download
// @desc    Download content (track download)
// @access  Private (club members with appropriate access level)
router.get('/:contentId/download', async (req, res) => {
  try {
    const content = await ClubContent.findOne({
      _id: req.params.contentId,
      clubId: req.params.clubId
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check access level
    const roleHierarchy = {
      'member': 0,
      'officer': 1,
      'executive': 2,
      'president': 3
    };

    const userRoleLevel = roleHierarchy[req.membership.role] || 0;
    const contentRoleLevel = roleHierarchy[content.accessLevel] || 0;

    if (userRoleLevel < contentRoleLevel) {
      return res.status(403).json({ error: 'Insufficient access level for this content' });
    }

    // Increment download count
    content.downloadCount += 1;
    await content.save();

    // Return file URL for download
    res.json({
      message: 'Download tracked',
      fileUrl: content.fileUrl,
      fileName: content.title,
      contentType: content.contentType
    });
  } catch (error) {
    console.error('Download content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/content/categories/list
// @desc    Get all content categories in club
// @access  Private (club members)
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await ClubContent.distinct('category', {
      clubId: req.params.clubId
    });

    res.json({
      categories: categories.filter(Boolean) // Remove null/undefined
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
