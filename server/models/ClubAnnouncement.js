const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const clubAnnouncementSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club ID is required']
  },
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  announcerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Announcer ID is required']
  },
  announcerName: {
    type: String,
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema]
}, {
  timestamps: true
});

// Indexes
clubAnnouncementSchema.index({ clubId: 1, createdAt: -1 });
clubAnnouncementSchema.index({ clubId: 1, isPinned: -1, createdAt: -1 });

// Static method to get club announcements (pinned first)
clubAnnouncementSchema.statics.getClubAnnouncements = function(clubId) {
  return this.find({ clubId })
    .populate('comments.userId', 'username profilePicture')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Method to add comment
clubAnnouncementSchema.methods.addComment = function(userId, content) {
  this.comments.push({ userId, content });
  return this.save();
};

// Method to pin/unpin announcement
clubAnnouncementSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

module.exports = mongoose.model('ClubAnnouncement', clubAnnouncementSchema);
