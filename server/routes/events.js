const express = require('express');
const router = express.Router({ mergeParams: true });
const Event = require('../models/Event');
const Club = require('../models/Club');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/clubs/:clubId/events
// @desc    Create a new event
// @access  Private (club owner/admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { name, description, startDate, endDate, location, capacity } = req.body;

    // Check if club exists and user is owner
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only club owner can create events' });
    }

    const event = new Event({
      club: clubId,
      name,
      description,
      startDate,
      endDate,
      location,
      capacity
    });

    await event.save();

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
});

// @route   GET /api/clubs/:clubId/events
// @desc    Get all events for a club
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { clubId } = req.params;

    const events = await Event.find({ club: clubId })
      .sort({ startDate: -1 })
      .populate('club', 'name');

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// @route   GET /api/clubs/:clubId/events/:eventId
// @desc    Get single event
// @access  Public
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('club', 'name category');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Error fetching event' });
  }
});

// @route   PUT /api/clubs/:clubId/events/:eventId
// @desc    Update an event
// @access  Private (club owner/admin only)
router.put('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { clubId, eventId } = req.params;
    const { name, description, startDate, endDate, location, capacity } = req.body;

    // Check if club exists and user is owner
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only club owner can update events' });
    }

    const event = await Event.findOneAndUpdate(
      { _id: eventId, club: clubId },
      { name, description, startDate, endDate, location, capacity },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error updating event' });
  }
});

// @route   DELETE /api/clubs/:clubId/events/:eventId
// @desc    Delete an event
// @access  Private (club owner/admin only)
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { clubId, eventId } = req.params;

    // Check if club exists and user is owner
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only club owner can delete events' });
    }

    const event = await Event.findOneAndDelete({ _id: eventId, club: clubId });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Error deleting event' });
  }
});

module.exports = router;
