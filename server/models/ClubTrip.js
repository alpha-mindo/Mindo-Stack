const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  signedUpAt: {
    type: Date,
    default: Date.now
  },
  attended: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
});

const clubTripSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club ID is required']
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [200, 'Destination cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Trip date is required']
  },
  duration: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  signups: [signupSchema],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Virtual for available spots
clubTripSchema.virtual('availableSpots').get(function() {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.signups.length);
});

// Virtual for is full
clubTripSchema.virtual('isFull').get(function() {
  if (!this.capacity) return false;
  return this.signups.length >= this.capacity;
});

// Indexes
clubTripSchema.index({ clubId: 1, date: 1 });
clubTripSchema.index({ clubId: 1, status: 1 });

// Static method to get club trips
clubTripSchema.statics.getClubTrips = function(clubId, status = null) {
  const query = { clubId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('signups.userId', 'username profilePicture')
    .sort({ date: 1 });
};

// Method to sign up for trip
clubTripSchema.methods.signup = async function(userId) {
  // Check if already signed up
  const alreadySignedUp = this.signups.some(
    signup => signup.userId.toString() === userId.toString()
  );
  
  if (alreadySignedUp) {
    throw new Error('User already signed up for this trip');
  }
  
  // Check capacity
  if (this.capacity && this.signups.length >= this.capacity) {
    throw new Error('Trip is full');
  }
  
  this.signups.push({ userId });
  return this.save();
};

// Method to cancel signup
clubTripSchema.methods.cancelSignup = async function(userId) {
  this.signups = this.signups.filter(
    signup => signup.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to mark attendance
clubTripSchema.methods.markAttendance = async function(userId, attended = true) {
  const signup = this.signups.find(
    s => s.userId.toString() === userId.toString()
  );
  
  if (!signup) {
    throw new Error('User not signed up for this trip');
  }
  
  signup.attended = attended;
  return this.save();
};

module.exports = mongoose.model('ClubTrip', clubTripSchema);
