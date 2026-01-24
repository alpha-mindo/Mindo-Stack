const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :clubId
const ClubAnnouncement = require('../models/ClubAnnouncement');
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

// @route   POST /api/clubs/:clubId/announcements
// @desc    Create new announcement
// @access  Private (requires post_announcements permission)
router.post('/', checkPermission('post_announcements'), async (req, res) => {
  try {
    const { title, content, type, pollData, formData } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (type && !['announcement', 'poll', 'form'].includes(type)) {
      return res.status(400).json({ error: 'Invalid announcement type' });
    }

    // Get user info for announcerName
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    const announcementData = {
      clubId: req.params.clubId,
      title,
      content,
      type: type || 'announcement',
      announcerName: user.username
    };

    // Add poll data if type is poll
    if (type === 'poll' && pollData) {
      announcementData.pollData = {
        question: pollData.question,
        options: pollData.options || [],
        allowMultipleVotes: pollData.allowMultipleVotes || false,
        isAnonymous: pollData.isAnonymous || false,
        closesAt: pollData.closesAt
      };
    }

    // Add form data if type is form
    if (type === 'form' && formData) {
      announcementData.formData = {
        questions: formData.questions || [],
        allowMultipleResponses: formData.allowMultipleResponses || false,
        closesAt: formData.closesAt
      };
    }

    const announcement = new ClubAnnouncement(announcementData);
    await announcement.save();

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/announcements
// @desc    List club announcements
// @access  Private (club members)
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    
    const query = { clubId: req.params.clubId };
    
    // Filter by type if provided
    if (type && ['announcement', 'poll', 'form'].includes(type)) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    // Get announcements with pinned ones first
    const announcements = await ClubAnnouncement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClubAnnouncement.countDocuments(query);

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List announcements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/announcements/:announcementId
// @desc    Get announcement details
// @access  Private (club members)
router.get('/:announcementId', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/announcements/:announcementId
// @desc    Update announcement
// @access  Private (post_announcements permission or announcement creator)
router.put('/:announcementId', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user has permission or is the creator
    const hasPermission = await req.membership.hasPermission('post_announcements');
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const isCreator = announcement.announcerName === user.username;

    if (!hasPermission && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    const { title, content } = req.body;

    // Update allowed fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;

    await announcement.save();

    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/announcements/:announcementId
// @desc    Delete announcement
// @access  Private (post_announcements permission or club president)
router.delete('/:announcementId', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user has permission or is president
    const hasPermission = await req.membership.hasPermission('post_announcements');
    const isPresident = req.membership.role === 'president';

    if (!hasPermission && !isPresident) {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    await announcement.deleteOne();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/announcements/:announcementId/pin
// @desc    Toggle pin status
// @access  Private (post_announcements permission)
router.put('/:announcementId/pin', checkPermission('post_announcements'), async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.json({
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMENT ROUTES ====================

// @route   POST /api/clubs/:clubId/announcements/:announcementId/comments
// @desc    Add comment to announcement
// @access  Private (all club members)
router.post('/:announcementId/comments', async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    const comment = {
      userId: req.user.userId,
      commenterName: user.username,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    };

    announcement.comments.push(comment);
    await announcement.save();

    const newComment = announcement.comments[announcement.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/announcements/:announcementId/comments/:commentId
// @desc    Edit comment
// @access  Private (comment author only)
router.put('/:announcementId/comments/:commentId', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const comment = announcement.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    // Check if comment is older than 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - comment.createdAt.getTime() > fifteenMinutes) {
      return res.status(403).json({ error: 'Cannot edit comments older than 15 minutes' });
    }

    comment.text = text.trim();
    await announcement.save();

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/announcements/:announcementId/comments/:commentId
// @desc    Delete comment
// @access  Private (comment author or club president)
router.delete('/:announcementId/comments/:commentId', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const comment = announcement.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author or president
    const isAuthor = comment.userId.toString() === req.user.userId;
    const isPresident = req.membership.role === 'president';

    if (!isAuthor && !isPresident) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Remove comment
    comment.deleteOne();
    await announcement.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/clubs/:clubId/announcements/:announcementId/comments/:commentId/reply
// @desc    Reply to comment
// @access  Private (all club members)
router.post('/:announcementId/comments/:commentId/reply', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if parent comment exists
    const parentComment = announcement.comments.id(req.params.commentId);
    if (!parentComment) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    const reply = {
      userId: req.user.userId,
      commenterName: user.username,
      text: text.trim(),
      parentCommentId: req.params.commentId
    };

    announcement.comments.push(reply);
    await announcement.save();

    const newReply = announcement.comments[announcement.comments.length - 1];

    res.status(201).json({
      message: 'Reply added successfully',
      comment: newReply
    });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== POLL ROUTES ====================

// @route   POST /api/clubs/:clubId/announcements/:announcementId/poll/vote
// @desc    Vote on poll
// @access  Private (all club members)
router.post('/:announcementId/poll/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;

    if (optionIndex === undefined) {
      return res.status(400).json({ error: 'Option index is required' });
    }

    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'poll') {
      return res.status(400).json({ error: 'This announcement is not a poll' });
    }

    if (!announcement.pollData || !announcement.pollData.isOpen) {
      return res.status(400).json({ error: 'Poll is closed' });
    }

    // Check if poll has expired
    if (announcement.pollData.closesAt && new Date() > announcement.pollData.closesAt) {
      announcement.pollData.isOpen = false;
      await announcement.save();
      return res.status(400).json({ error: 'Poll has expired' });
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= announcement.pollData.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }

    // Check if user already voted
    const existingVoteIndex = announcement.pollData.options.findIndex(option =>
      option.votes.some(vote => vote.userId.toString() === req.user.userId)
    );

    if (existingVoteIndex !== -1 && !announcement.pollData.allowMultipleVotes) {
      return res.status(400).json({ error: 'You have already voted on this poll' });
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    // Add vote
    announcement.pollData.options[optionIndex].votes.push({
      userId: req.user.userId,
      voterName: announcement.pollData.isAnonymous ? null : user.username
    });

    await announcement.save();

    res.json({
      message: 'Vote recorded successfully',
      pollData: announcement.pollData
    });
  } catch (error) {
    console.error('Vote on poll error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/announcements/:announcementId/poll/results
// @desc    Get poll results
// @access  Private (all club members)
router.get('/:announcementId/poll/results', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'poll') {
      return res.status(400).json({ error: 'This announcement is not a poll' });
    }

    const results = announcement.pollData.options.map(option => ({
      text: option.text,
      voteCount: option.votes.length,
      voters: announcement.pollData.isAnonymous ? null : option.votes.map(v => v.voterName)
    }));

    const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);

    res.json({
      question: announcement.pollData.question,
      totalVotes,
      isOpen: announcement.pollData.isOpen,
      closesAt: announcement.pollData.closesAt,
      results
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/announcements/:announcementId/poll/close
// @desc    Close poll
// @access  Private (post_announcements permission or announcement creator)
router.put('/:announcementId/poll/close', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'poll') {
      return res.status(400).json({ error: 'This announcement is not a poll' });
    }

    // Check if user has permission or is the creator
    const hasPermission = await req.membership.hasPermission('post_announcements');
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const isCreator = announcement.announcerName === user.username;

    if (!hasPermission && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to close this poll' });
    }

    announcement.pollData.isOpen = false;
    await announcement.save();

    res.json({
      message: 'Poll closed successfully',
      pollData: announcement.pollData
    });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== FORM ROUTES ====================

// @route   POST /api/clubs/:clubId/announcements/:announcementId/form/submit
// @desc    Submit form response
// @access  Private (all club members)
router.post('/:announcementId/form/submit', async (req, res) => {
  try {
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Responses array is required' });
    }

    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'form') {
      return res.status(400).json({ error: 'This announcement is not a form' });
    }

    if (!announcement.formData || !announcement.formData.isOpen) {
      return res.status(400).json({ error: 'Form is closed' });
    }

    // Check if form has expired
    if (announcement.formData.closesAt && new Date() > announcement.formData.closesAt) {
      announcement.formData.isOpen = false;
      await announcement.save();
      return res.status(400).json({ error: 'Form has expired' });
    }

    // Check if user already submitted
    const existingSubmission = announcement.formData.responses.find(
      response => response.userId.toString() === req.user.userId
    );

    if (existingSubmission && !announcement.formData.allowMultipleResponses) {
      return res.status(400).json({ error: 'You have already submitted this form' });
    }

    // Validate all required questions are answered
    for (const question of announcement.formData.questions) {
      if (question.required) {
        const response = responses.find(r => r.question === question.question);
        if (!response || !response.answer || response.answer.trim().length === 0) {
          return res.status(400).json({ error: `Required question not answered: ${question.question}` });
        }
      }
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    // Add submission
    announcement.formData.responses.push({
      userId: req.user.userId,
      responderName: user.username,
      answers: responses
    });

    await announcement.save();

    res.status(201).json({
      message: 'Form submitted successfully'
    });
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/announcements/:announcementId/form/responses
// @desc    Get form responses
// @access  Private (post_announcements permission or club president)
router.get('/:announcementId/form/responses', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'form') {
      return res.status(400).json({ error: 'This announcement is not a form' });
    }

    // Check if user has permission or is president
    const hasPermission = await req.membership.hasPermission('post_announcements');
    const isPresident = req.membership.role === 'president';

    if (!hasPermission && !isPresident) {
      return res.status(403).json({ error: 'Not authorized to view form responses' });
    }

    res.json({
      responses: announcement.formData.responses,
      totalResponses: announcement.formData.responses.length
    });
  } catch (error) {
    console.error('Get form responses error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/announcements/:announcementId/form/close
// @desc    Close form
// @access  Private (post_announcements permission or announcement creator)
router.put('/:announcementId/form/close', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'form') {
      return res.status(400).json({ error: 'This announcement is not a form' });
    }

    // Check if user has permission or is the creator
    const hasPermission = await req.membership.hasPermission('post_announcements');
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const isCreator = announcement.announcerName === user.username;

    if (!hasPermission && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to close this form' });
    }

    announcement.formData.isOpen = false;
    await announcement.save();

    res.json({
      message: 'Form closed successfully',
      formData: announcement.formData
    });
  } catch (error) {
    console.error('Close form error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/announcements/:announcementId/form/responses/:responseId
// @desc    Delete form response
// @access  Private (club president or response owner)
router.delete('/:announcementId/form/responses/:responseId', async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findOne({
      _id: req.params.announcementId,
      clubId: req.params.clubId
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.type !== 'form') {
      return res.status(400).json({ error: 'This announcement is not a form' });
    }

    const response = announcement.formData.responses.id(req.params.responseId);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check if user is president or response owner
    const isPresident = req.membership.role === 'president';
    const isOwner = response.userId.toString() === req.user.userId;

    if (!isPresident && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this response' });
    }

    response.deleteOne();
    await announcement.save();

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete form response error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
