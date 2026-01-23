const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true,
    maxlength: [500, 'Reply cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Poll option cannot exceed 100 characters']
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  voteCount: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Poll question cannot exceed 200 characters']
  },
  options: [pollOptionSchema],
  settings: {
    showVoteCount: {
      type: Boolean,
      default: true
    },
    allowMultipleChoices: {
      type: Boolean,
      default: false
    },
    endDate: {
      type: Date,
      default: null // null = no end date
    }
  },
  totalVotes: {
    type: Number,
    default: 0
  }
});

const formFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Field label cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'date', 'email', 'select', 'checkbox', 'radio'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }], // For select, checkbox, radio types
  required: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    trim: true,
    maxlength: [100, 'Placeholder cannot exceed 100 characters']
  }
});

const formResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  responses: [{
    fieldLabel: String,
    value: mongoose.Schema.Types.Mixed // Can be string, number, array, etc.
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Form title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Form description cannot exceed 500 characters']
  },
  fields: [formFieldSchema],
  allowMultipleSubmissions: {
    type: Boolean,
    default: false
  },
  deadline: {
    type: Date,
    default: null // null = no deadline
  },
  responses: [formResponseSchema]
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
  type: {
    type: String,
    enum: ['announcement', 'poll', 'form'],
    default: 'announcement',
    required: true
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
  poll: {
    type: pollSchema,
    default: null
  },
  form: {
    type: formSchema,
    default: null
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
    .populate('comments.replies.userId', 'username profilePicture')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Method to add comment
clubAnnouncementSchema.methods.addComment = function(userId, userName, content) {
  this.comments.push({ userId, userName, content });
  return this.save();
};

// Method to add reply to a comment (forum-style threading)
clubAnnouncementSchema.methods.addReply = function(commentId, userId, userName, content) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  comment.replies.push({ userId, userName, content });
  return this.save();
};

// Method to delete comment
clubAnnouncementSchema.methods.deleteComment = function(commentId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  comment.remove();
  return this.save();
};

// Method to delete reply
clubAnnouncementSchema.methods.deleteReply = function(commentId, replyId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  const reply = comment.replies.id(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }
  reply.remove();
  return this.save();
};

// Method to submit form response
clubAnnouncementSchema.methods.submitFormResponse = async function(userId, userName, responses) {
  if (!this.form) {
    throw new Error('This announcement does not have a form');
  }

  // Check if deadline has passed
  if (this.form.deadline && new Date() > this.form.deadline) {
    throw new Error('The form deadline has passed');
  }

  // Check if user has already submitted (if multiple submissions not allowed)
  if (!this.form.allowMultipleSubmissions) {
    const existingResponse = this.form.responses.find(
      r => r.userId.toString() === userId.toString()
    );
    if (existingResponse) {
      throw new Error('You have already submitted this form');
    }
  }

  // Validate required fields
  for (const field of this.form.fields) {
    if (field.required) {
      const response = responses.find(r => r.fieldLabel === field.label);
      if (!response || !response.value) {
        throw new Error(`Field "${field.label}" is required`);
      }
    }
  }

  // Add response
  this.form.responses.push({ userId, userName, responses });
  return this.save();
};

// Method to update form response
clubAnnouncementSchema.methods.updateFormResponse = async function(userId, responses) {
  if (!this.form) {
    throw new Error('This announcement does not have a form');
  }

  const existingResponse = this.form.responses.find(
    r => r.userId.toString() === userId.toString()
  );

  if (!existingResponse) {
    throw new Error('No existing response found to update');
  }

  // Validate required fields
  for (const field of this.form.fields) {
    if (field.required) {
      const response = responses.find(r => r.fieldLabel === field.label);
      if (!response || !response.value) {
        throw new Error(`Field "${field.label}" is required`);
      }
    }
  }

  existingResponse.responses = responses;
  existingResponse.submittedAt = new Date();
  return this.save();
};

// Method to delete form response (by admin or user)
clubAnnouncementSchema.methods.deleteFormResponse = function(responseId) {
  if (!this.form) {
    throw new Error('This announcement does not have a form');
  }

  const response = this.form.responses.id(responseId);
  if (!response) {
    throw new Error('Response not found');
  }

  response.remove();
  return this.save();
};

// Method to get user's form response
clubAnnouncementSchema.methods.getUserFormResponse = function(userId) {
  if (!this.form) return null;

  return this.form.responses.find(
    r => r.userId.toString() === userId.toString()
  );
};

// Method to pin/unpin announcement
clubAnnouncementSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Method to vote on poll
clubAnnouncementSchema.methods.voteOnPoll = async function(userId, optionIndex) {
  if (!this.poll) {
    throw new Error('This announcement does not have a poll');
  }

  // Check if poll has ended
  if (this.poll.settings.endDate && new Date() > this.poll.settings.endDate) {
    throw new Error('This poll has ended');
  }

  // Check if user has already voted
  const hasVoted = this.poll.options.some(option => 
    option.votes.some(vote => vote.toString() === userId.toString())
  );

  if (hasVoted && !this.poll.settings.allowMultipleChoices) {
    throw new Error('You have already voted on this poll');
  }

  // Validate option index
  if (optionIndex < 0 || optionIndex >= this.poll.options.length) {
    throw new Error('Invalid poll option');
  }

  // Remove previous vote if changing vote (only for single choice polls)
  if (hasVoted && !this.poll.settings.allowMultipleChoices) {
    this.poll.options.forEach(option => {
      const voteIndex = option.votes.findIndex(vote => vote.toString() === userId.toString());
      if (voteIndex !== -1) {
        option.votes.splice(voteIndex, 1);
        option.voteCount--;
        this.poll.totalVotes--;
      }
    });
  }

  // Add vote
  this.poll.options[optionIndex].votes.push(userId);
  this.poll.options[optionIndex].voteCount++;
  this.poll.totalVotes++;

  return this.save();
};

// Method to remove vote from poll
clubAnnouncementSchema.methods.removeVoteFromPoll = async function(userId, optionIndex) {
  if (!this.poll) {
    throw new Error('This announcement does not have a poll');
  }

  // Validate option index
  if (optionIndex < 0 || optionIndex >= this.poll.options.length) {
    throw new Error('Invalid poll option');
  }

  const option = this.poll.options[optionIndex];
  const voteIndex = option.votes.findIndex(vote => vote.toString() === userId.toString());

  if (voteIndex === -1) {
    throw new Error('You have not voted for this option');
  }

  // Remove vote
  option.votes.splice(voteIndex, 1);
  option.voteCount--;
  this.poll.totalVotes--;

  return this.save();
};

// Method to check if user voted on poll
clubAnnouncementSchema.methods.hasUserVoted = function(userId) {
  if (!this.poll) return false;

  return this.poll.options.some(option => 
    option.votes.some(vote => vote.toString() === userId.toString())
  );
};

// Method to get user's votes on poll
clubAnnouncementSchema.methods.getUserVotes = function(userId) {
  if (!this.poll) return [];

  const votedOptions = [];
  this.poll.options.forEach((option, index) => {
    if (option.votes.some(vote => vote.toString() === userId.toString())) {
      votedOptions.push(index);
    }
  });

  return votedOptions;
};

module.exports = mongoose.model('ClubAnnouncement', clubAnnouncementSchema);
