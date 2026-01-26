const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   POST /api/tickets
// @desc    Create a new support ticket
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and category are required'
      });
    }

    const ticket = new Ticket({
      subject,
      description,
      category,
      priority: priority || 'medium',
      userId: req.user._id
    });

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('userId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: populatedTicket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/my-tickets
// @desc    Get current user's tickets
// @access  Private
router.get('/my-tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .populate('assignedTo', 'username')
      .populate('responses.userId', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});

// @route   GET /api/tickets
// @desc    Get all tickets (admin only)
// @access  Admin
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter)
      .populate('userId', 'username email')
      .populate('assignedTo', 'username')
      .populate('responses.userId', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket
// @access  Private (owner) or Admin
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('assignedTo', 'username')
      .populate('responses.userId', 'username isAdmin');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user is ticket owner or admin
    if (ticket.userId._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message
    });
  }
});

// @route   POST /api/tickets/:id/responses
// @desc    Add response to ticket
// @access  Private (owner) or Admin
router.post('/:id/responses', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user is ticket owner or admin
    if (ticket.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    ticket.responses.push({
      userId: req.user._id,
      message,
      isStaff: req.user.isAdmin
    });

    // If user responds, set status to waiting-on-user if in-progress
    if (req.user.isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('userId', 'username email')
      .populate('assignedTo', 'username')
      .populate('responses.userId', 'username isAdmin');

    res.json({
      success: true,
      message: 'Response added successfully',
      ticket: populatedTicket
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding response',
      error: error.message
    });
  }
});

// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status (admin only)
// @access  Admin
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'username email')
     .populate('assignedTo', 'username');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket status updated',
      ticket
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ticket status',
      error: error.message
    });
  }
});

// @route   PATCH /api/tickets/:id/assign
// @desc    Assign ticket to admin (admin only)
// @access  Admin
router.patch('/:id/assign', adminMiddleware, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assignedTo || req.user._id },
      { new: true }
    ).populate('userId', 'username email')
     .populate('assignedTo', 'username');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning ticket',
      error: error.message
    });
  }
});

module.exports = router;
