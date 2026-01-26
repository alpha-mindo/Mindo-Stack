const mongoose = require('mongoose');

const clubViolationSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  violationType: {
    type: String,
    enum: [
      'Inappropriate Content',
      'Spam',
      'Harassment',
      'Impersonation',
      'Terms Violation',
      'Illegal Activity',
      'Other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  action: {
    type: String,
    enum: ['warning', 'suspension', 'deleted'],
    default: 'warning'
  },
  suspensionEndDate: {
    type: Date
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
clubViolationSchema.index({ club: 1, createdAt: -1 });
clubViolationSchema.index({ resolved: 1 });

const ClubViolation = mongoose.model('ClubViolation', clubViolationSchema);

module.exports = ClubViolation;
