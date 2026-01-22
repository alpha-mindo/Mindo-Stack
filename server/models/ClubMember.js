const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema({
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
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    default: 'Member'
  },
  customPermissions: [{
    type: String,
    enum: [
      'edit_club',
      'delete_club',
      'manage_roles',
      'assign_roles',
      'invite_members',
      'remove_members',
      'suspend_members',
      'approve_applications',
      'view_applications',
      'manage_violations',
      'view_members',
      'view_club',
      'post_announcements',
      'create_trips',
      'upload_content',
      'manage_content'
    ]
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound unique index to prevent duplicate memberships
clubMemberSchema.index({ clubId: 1, userId: 1 }, { unique: true });

// Index for faster queries
clubMemberSchema.index({ clubId: 1, role: 1 });
clubMemberSchema.index({ userId: 1 });
clubMemberSchema.index({ status: 1 });

// Pre-save validation: Presidents can only lead one club and cannot be members of others
clubMemberSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingMemberships = await this.constructor.find({ 
      userId: this.userId,
      status: 'active'
    });
    
    // If user is becoming a president
    if (this.role === 'president') {
      // Check if they're already a president or member of another club
      if (existingMemberships.length > 0) {
        throw new Error('User is already a member of another club. Presidents cannot join multiple clubs.');
      }
    } else {
      // If user is joining as regular member, check if they're already a president
      const isPresident = existingMemberships.some(m => m.role === 'president');
      if (isPresident) {
        throw new Error('User is already a president of another club and cannot join as a member.');
      }
    }
  }
  next();
});

// Virtual to check if member is president
clubMemberSchema.virtual('isPresident').get(function() {
  return this.role === 'president';
});

// Method to check if member has a specific permission
clubMemberSchema.methods.hasPermission = async function(permission) {
  // President always has all permissions
  if (this.role === 'president') {
    return true;
  }
  
  // Check custom permissions first (they override role permissions)
  if (this.customPermissions && this.customPermissions.includes(permission)) {
    return true;
  }
  
  // If no custom permissions, check role permissions from club
  const Club = mongoose.model('Club');
  const club = await Club.findById(this.clubId);
  
  if (!club) {
    return false;
  }
  
  // Find the role in club's customRoles
  const roleDefinition = club.customRoles.find(r => r.name === this.role);
  
  if (!roleDefinition) {
    return false;
  }
  
  return roleDefinition.permissions.includes(permission);
};

// Static method to get all members of a club
clubMemberSchema.statics.getClubMembers = function(clubId, options = {}) {
  const query = { clubId, status: 'active' };
  
  if (options.role) {
    query.role = options.role;
  }
  
  return this.find(query)
    .populate('userId', 'username email profilePicture')
    .sort({ joinedAt: -1 });
};

// Static method to get user's club memberships
clubMemberSchema.statics.getUserMemberships = function(userId) {
  return this.find({ userId, status: 'active' })
    .populate('clubId', 'name logo category')
    .sort({ joinedAt: -1 });
};

module.exports = mongoose.model('ClubMember', clubMemberSchema);
