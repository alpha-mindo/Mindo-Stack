const mongoose = require('mongoose');

const clubInvitationSchema = new mongoose.Schema({
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
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter ID is required']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [300, 'Invitation message cannot exceed 300 characters']
  },
  role: {
    type: String,
    trim: true,
    default: 'Member',
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 7 days from now
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate invitations
clubInvitationSchema.index({ clubId: 1, userId: 1, status: 1 });

// Index for filtering by status
clubInvitationSchema.index({ userId: 1, status: 1 });
clubInvitationSchema.index({ clubId: 1, status: 1 });

// Check if invitation is expired
clubInvitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < Date.now() && this.status === 'pending';
});

// Static method to get user's pending invitations
clubInvitationSchema.statics.getUserInvitations = function(userId) {
  return this.find({ 
    userId, 
    status: 'pending',
    expiresAt: { $gt: Date.now() }
  })
    .populate('clubId', 'name logo category description')
    .populate('invitedBy', 'username profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to get club's pending invitations
clubInvitationSchema.statics.getClubInvitations = function(clubId) {
  return this.find({ clubId, status: 'pending' })
    .populate('userId', 'username email profilePicture')
    .populate('invitedBy', 'username')
    .sort({ createdAt: -1 });
};

// Method to accept invitation
clubInvitationSchema.methods.accept = async function() {
  // Check if expired
  if (this.expiresAt < Date.now()) {
    this.status = 'expired';
    await this.save();
    throw new Error('Invitation has expired');
  }
  
  this.status = 'accepted';
  this.respondedAt = Date.now();
  await this.save();
  
  // Create ClubMember entry with the invited role
  const ClubMember = mongoose.model('ClubMember');
  const newMember = new ClubMember({
    clubId: this.clubId,
    userId: this.userId,
    role: this.role
  });
  await newMember.save();
  
  // Update user's clubMemberships and club's memberCount
  const User = mongoose.model('User');
  const Club = mongoose.model('Club');
  
  await User.findByIdAndUpdate(this.userId, {
    $push: { clubMemberships: newMember._id }
  });
  
  await Club.findByIdAndUpdate(this.clubId, {
    $inc: { memberCount: 1 }
  });
  
  return newMember;
};

// Method to decline invitation
clubInvitationSchema.methods.decline = async function() {
  this.status = 'declined';
  this.respondedAt = Date.now();
  await this.save();
};

// Method to cancel/revoke invitation (by inviter or admin)
clubInvitationSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending invitations');
  }
  await this.deleteOne();
};

// Auto-expire old invitations (can be called by a cron job)
clubInvitationSchema.statics.expireOldInvitations = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: Date.now() }
    },
    {
      status: 'expired'
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('ClubInvitation', clubInvitationSchema);
