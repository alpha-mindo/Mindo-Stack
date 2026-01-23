const mongoose = require('mongoose');

const clubBanSchema = new mongoose.Schema({
  // Who was banned
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  
  // Which club banned them
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true
  },
  clubName: {
    type: String,
    required: true
  },
  
  // Ban details
  reason: {
    type: String,
    required: [true, 'Ban reason is required'],
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['harassment', 'spam', 'inappropriate-behavior', 'violation-of-rules', 'inactivity', 'other'],
    default: 'other'
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe'],
    default: 'moderate'
  },
  
  // Who banned them
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bannedByName: {
    type: String,
    required: true
  },
  
  // Evidence/notes
  evidence: {
    type: String,
    maxlength: [2000, 'Evidence cannot exceed 2000 characters']
  },
  additionalNotes: {
    type: String,
    maxlength: [500, 'Additional notes cannot exceed 500 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'appealed', 'overturned'],
    default: 'active'
  },
  
  // Timestamps
  bannedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: null // null = permanent ban
  },
  
  // Appeal system
  appeal: {
    submitted: {
      type: Boolean,
      default: false
    },
    appealText: {
      type: String,
      maxlength: [1000, 'Appeal cannot exceed 1000 characters']
    },
    appealedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    decision: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    decisionNotes: {
      type: String,
      maxlength: [500, 'Decision notes cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true
});

// Compound index for finding user's bans
clubBanSchema.index({ userId: 1, status: 1 });
clubBanSchema.index({ clubId: 1, userId: 1 });

// Virtual to check if ban is expired
clubBanSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false; // Permanent bans don't expire
  return new Date() > this.expiresAt;
});

// Virtual to check if ban is still active
clubBanSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Method to submit appeal
clubBanSchema.methods.submitAppeal = async function(appealText) {
  if (this.appeal.submitted) {
    throw new Error('Appeal already submitted for this ban');
  }
  
  this.appeal.submitted = true;
  this.appeal.appealText = appealText;
  this.appeal.appealedAt = Date.now();
  this.status = 'appealed';
  
  return this.save();
};

// Method to review appeal
clubBanSchema.methods.reviewAppeal = async function(reviewerId, decision, notes) {
  if (!this.appeal.submitted) {
    throw new Error('No appeal to review');
  }
  
  this.appeal.reviewedBy = reviewerId;
  this.appeal.reviewedAt = Date.now();
  this.appeal.decision = decision;
  this.appeal.decisionNotes = notes;
  
  if (decision === 'accepted') {
    this.status = 'overturned';
  } else {
    this.status = 'active'; // Rejected appeals return ban to active
  }
  
  return this.save();
};

// Static method to get user's ban history across all clubs
clubBanSchema.statics.getUserBanHistory = function(userId, includeExpired = false) {
  const query = { userId };
  
  if (!includeExpired) {
    query.status = 'active';
  }
  
  return this.find(query)
    .populate('clubId', 'name logo category')
    .populate('bannedBy', 'username')
    .sort({ bannedAt: -1 });
};

// Static method to get club's ban list
clubBanSchema.statics.getClubBans = function(clubId, includeExpired = false) {
  const query = { clubId };
  
  if (!includeExpired) {
    query.status = 'active';
  }
  
  return this.find(query)
    .populate('userId', 'username email profilePicture')
    .populate('bannedBy', 'username')
    .sort({ bannedAt: -1 });
};

// Static method to check if user is banned from specific club
clubBanSchema.statics.isUserBannedFromClub = async function(userId, clubId) {
  const ban = await this.findOne({
    userId,
    clubId,
    status: 'active'
  });
  
  if (!ban) return false;
  
  // Check if ban has expired
  if (ban.isExpired) {
    ban.status = 'expired';
    await ban.save();
    return false;
  }
  
  return true;
};

// Static method to get all active bans for a user (global check)
clubBanSchema.statics.getUserActiveBans = function(userId) {
  return this.find({
    userId,
    status: 'active'
  }).populate('clubId', 'name logo');
};

// Static method to expire old bans automatically
clubBanSchema.statics.expireOldBans = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $ne: null, $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result;
};

const ClubBan = mongoose.model('ClubBan', clubBanSchema);

module.exports = ClubBan;
