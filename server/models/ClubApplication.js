const mongoose = require('mongoose');

const clubApplicationSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Application message cannot exceed 500 characters']
  },
  answers: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'interview-scheduled', 'interview-completed', 'approved', 'rejected'],
    default: 'pending'
  },
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date
    },
    location: {
      type: String,
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters']
    },
    type: {
      type: String,
      enum: ['in-person', 'online', 'phone'],
      default: 'in-person'
    },
    meetingLink: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Interview notes cannot exceed 500 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [300, 'Rejection reason cannot exceed 300 characters']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index to ensure one application per user per club
clubApplicationSchema.index({ clubId: 1, userId: 1 }, { unique: true });

// Index for filtering by status
clubApplicationSchema.index({ clubId: 1, status: 1 });
clubApplicationSchema.index({ userId: 1, status: 1 });

// Static method to get pending applications for a club
clubApplicationSchema.statics.getPendingApplications = function(clubId) {
  return this.find({ clubId, status: 'pending' })
    .populate('userId', 'username email profilePicture bio')
    .sort({ appliedAt: -1 });
};

// Static method to get user's applications
clubApplicationSchema.statics.getUserApplications = function(userId) {
  return this.find({ userId })
    .populate('clubId', 'name logo category')
    .sort({ appliedAt: -1 });
};

// Method to schedule interview
clubApplicationSchema.methods.scheduleInterview = async function(interviewData) {
  if (this.status !== 'pending') {
    throw new Error('Can only schedule interview for pending applications');
  }
  
  this.status = 'interview-scheduled';
  this.interview = {
    scheduled: true,
    date: interviewData.date,
    location: interviewData.location,
    type: interviewData.type || 'in-person',
    meetingLink: interviewData.meetingLink,
    notes: interviewData.notes
  };
  
  await this.save();
  
  // Update user's clubApplications
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.userId, {
    $addToSet: { clubApplications: this._id }
  });
  
  return this;
};

// Method to mark interview as completed
clubApplicationSchema.methods.completeInterview = async function(notes) {
  if (this.status !== 'interview-scheduled') {
    throw new Error('Interview must be scheduled first');
  }
  
  this.status = 'interview-completed';
  this.interview.completed = true;
  if (notes) {
    this.interview.notes = notes;
  }
  
  return this.save();
};

// Method to approve application
clubApplicationSchema.methods.approve = async function(reviewerId) {
  // Can approve from interview-completed or pending (skip interview)
  if (!['pending', 'interview-completed'].includes(this.status)) {
    throw new Error('Can only approve pending or interview-completed applications');
  }
  
  this.status = 'approved';
  this.reviewedAt = Date.now();
  this.reviewedBy = reviewerId;
  await this.save();
  
  // Create ClubMember entry
  const ClubMember = mongoose.model('ClubMember');
  const newMember = new ClubMember({
    clubId: this.clubId,
    userId: this.userId,
    role: 'Member' // Default role
  });
  await newMember.save();
  
  // Update user's clubMemberships and club's memberCount
  const User = mongoose.model('User');
  const Club = mongoose.model('Club');
  
  await User.findByIdAndUpdate(this.userId, {
    $push: { clubMemberships: newMember._id, clubApplications: this._id }
  });
  
  await Club.findByIdAndUpdate(this.clubId, {
    $inc: { memberCount: 1 }
  });
  
  // Can reject at any stage
  if (this.status === 'approved') {
    throw new Error('Cannot reject an already approved application');
  }
  
  return newMember;
};

// Method to reject application
clubApplicationSchema.methods.reject = async function(reviewerId, reason) {
  this.status = 'rejected';
  this.reviewedAt = Date.now();
  this.reviewedBy = reviewerId;
  this.rejectionReason = reason;
  await this.save();
  
  // Update user's clubApplications
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.userId, {
    $push: { clubApplications: this._id }
  });
};

module.exports = mongoose.model('ClubApplication', clubApplicationSchema);
