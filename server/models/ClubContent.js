const mongoose = require('mongoose');

const clubContentSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club ID is required']
  },
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  contentType: {
    type: String,
    enum: ['file', 'link', 'document', 'image', 'video', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  visibleToRoles: [{
    type: String,
    required: true,
    trim: true
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploaderName: {
    type: String,
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
clubContentSchema.index({ clubId: 1, category: 1, createdAt: -1 });
clubContentSchema.index({ clubId: 1, visibleToRoles: 1 });
clubContentSchema.index({ clubId: 1, isPinned: -1, createdAt: -1 });

// Static method to get content visible to a user's role
clubContentSchema.statics.getContentForRole = function(clubId, userRole, category = null) {
  const query = {
    clubId,
    visibleToRoles: userRole
  };
  
  if (category) query.category = category;
  
  return this.find(query)
    .populate('uploadedBy', 'username profilePicture')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to get all content (for president/admins)
clubContentSchema.statics.getAllClubContent = function(clubId, category = null) {
  const query = { clubId };
  if (category) query.category = category;
  
  return this.find(query)
    .populate('uploadedBy', 'username profilePicture')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Method to increment download count
clubContentSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to toggle pin
clubContentSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

module.exports = mongoose.model('ClubContent', clubContentSchema);
