const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :clubId
const ClubTrip = require('../models/ClubTrip');
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

// @route   POST /api/clubs/:clubId/trips
// @desc    Create new trip
// @access  Private (requires manage_trips permission)
router.post('/', checkPermission('manage_trips'), async (req, res) => {
  try {
    const { title, description, destination, startDate, endDate, capacity, cost, requirements } = req.body;

    // Validation
    if (!title || !destination || !startDate) {
      return res.status(400).json({ error: 'Title, destination, and start date are required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Invalid start date' });
    }

    if (end && isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid end date' });
    }

    if (end && end < start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const tripData = {
      clubId: req.params.clubId,
      title,
      description,
      destination,
      startDate: start,
      endDate: end,
      capacity,
      cost,
      requirements
    };

    const trip = new ClubTrip(tripData);
    await trip.save();

    res.status(201).json({
      message: 'Trip created successfully',
      trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/trips
// @desc    List club trips
// @access  Private (club members)
router.get('/', async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;
    
    const query = { clubId: req.params.clubId };
    
    // Filter by status
    if (status && ['planned', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Filter upcoming trips
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
      query.status = { $in: ['planned', 'ongoing'] };
    }

    const skip = (page - 1) * limit;

    const trips = await ClubTrip.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClubTrip.countDocuments(query);

    res.json({
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List trips error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/clubs/:clubId/trips/:tripId
// @desc    Get trip details
// @access  Private (club members)
router.get('/:tripId', async (req, res) => {
  try {
    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/trips/:tripId
// @desc    Update trip
// @access  Private (manage_trips permission)
router.put('/:tripId', checkPermission('manage_trips'), async (req, res) => {
  try {
    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { title, description, destination, startDate, endDate, capacity, cost, requirements } = req.body;

    // Update allowed fields
    if (title) trip.title = title;
    if (description !== undefined) trip.description = description;
    if (destination) trip.destination = destination;
    if (capacity !== undefined) trip.capacity = capacity;
    if (cost !== undefined) trip.cost = cost;
    if (requirements !== undefined) trip.requirements = requirements;

    // Validate and update dates
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: 'Invalid start date' });
      }
      trip.startDate = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid end date' });
      }
      if (end < trip.startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      trip.endDate = end;
    }

    await trip.save();

    res.json({
      message: 'Trip updated successfully',
      trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/trips/:tripId
// @desc    Delete trip
// @access  Private (manage_trips permission or club president)
router.delete('/:tripId', async (req, res) => {
  try {
    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if user has permission or is president
    const hasPermission = await req.membership.hasPermission('manage_trips');
    const isPresident = req.membership.role === 'president';

    if (!hasPermission && !isPresident) {
      return res.status(403).json({ error: 'Not authorized to delete this trip' });
    }

    await trip.deleteOne();

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/clubs/:clubId/trips/:tripId/signup
// @desc    Sign up for trip
// @access  Private (all club members)
router.post('/:tripId/signup', async (req, res) => {
  try {
    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if trip is in planned status
    if (trip.status !== 'planned') {
      return res.status(400).json({ error: `Cannot sign up for ${trip.status} trip` });
    }

    // Check if already signed up
    const alreadySignedUp = trip.participants.some(
      participant => participant.userId.toString() === req.user.userId
    );

    if (alreadySignedUp) {
      return res.status(400).json({ error: 'You are already signed up for this trip' });
    }

    // Check capacity
    if (trip.capacity && trip.participants.length >= trip.capacity) {
      return res.status(400).json({ error: 'Trip is at full capacity' });
    }

    // Get user info
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    // Add participant
    trip.participants.push({
      userId: req.user.userId,
      participantName: user.username,
      status: 'confirmed'
    });

    await trip.save();

    res.json({
      message: 'Successfully signed up for trip',
      trip
    });
  } catch (error) {
    console.error('Sign up for trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/clubs/:clubId/trips/:tripId/signup
// @desc    Cancel trip signup
// @access  Private (participant or manage_trips permission)
router.delete('/:tripId/signup', async (req, res) => {
  try {
    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Find participant
    const participantIndex = trip.participants.findIndex(
      participant => participant.userId.toString() === req.user.userId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ error: 'You are not signed up for this trip' });
    }

    // Check if trip has already started
    if (trip.status === 'ongoing' || trip.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel signup for ongoing or completed trip' });
    }

    // Remove participant
    trip.participants.splice(participantIndex, 1);
    await trip.save();

    res.json({
      message: 'Successfully cancelled trip signup',
      trip
    });
  } catch (error) {
    console.error('Cancel trip signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/trips/:tripId/status
// @desc    Update trip status
// @access  Private (manage_trips permission)
router.put('/:tripId/status', checkPermission('manage_trips'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['planned', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: planned, ongoing, completed, or cancelled' });
    }

    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.status = status;
    await trip.save();

    res.json({
      message: 'Trip status updated successfully',
      trip
    });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/clubs/:clubId/trips/:tripId/attendance/:participantId
// @desc    Mark participant attendance
// @access  Private (manage_trips permission)
router.put('/:tripId/attendance/:participantId', checkPermission('manage_trips'), async (req, res) => {
  try {
    const { attended } = req.body;

    if (attended === undefined) {
      return res.status(400).json({ error: 'Attended status is required' });
    }

    const trip = await ClubTrip.findOne({
      _id: req.params.tripId,
      clubId: req.params.clubId
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Find participant
    const participant = trip.participants.id(req.params.participantId);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    participant.attended = attended;
    await trip.save();

    res.json({
      message: 'Attendance updated successfully',
      participant
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
