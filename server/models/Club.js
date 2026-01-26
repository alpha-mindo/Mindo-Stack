const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
});

const customRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [{
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
      'interview_applicants',
      'manage_violations',
      'view_members',
      'view_club',
      'post_announcements',
      'create_trips',
      'upload_content',
      'manage_content'
    ]
  }],
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'],
    default: null
  }
});

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Club name must be at least 3 characters long'],
    maxlength: [100, 'Club name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Club description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Club owner is required']
  },
  logo: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Club category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  memberCount: {
    type: Number,
    default: 0,
    min: [0, 'Member count cannot be negative']
  },
  customRoles: [customRoleSchema],
  violations: [violationSchema],
  violationCount: {
    type: Number,
    default: 0,
    min: [0, 'Violation count cannot be negative']
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionEndDate: {
    type: Date
  },
  suspensionReason: {
    type: String,
    maxlength: 500
  },
  applicationForm: {
    enabled: {
      type: Boolean,
      default: true
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    questions: [{
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['short_answer', 'paragraph', 'multiple_choice', 'checkboxes', 'dropdown', 'linear_scale', 'date', 'time'],
        required: true
      },
      question: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Question cannot exceed 500 characters']
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
      },
      required: {
        type: Boolean,
        default: false
      },
      options: [{
        type: String,
        trim: true
      }],
      minScale: {
        type: Number,
        min: 0,
        max: 10
      },
      maxScale: {
        type: Number,
        min: 0,
        max: 10
      },
      minLabel: {
        type: String,
        trim: true
      },
      maxLabel: {
        type: String,
        trim: true
      }
    }]
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Create default "Member" role when club is created
clubSchema.pre('save', function(next) {
  if (this.isNew) {
    // Check if Member role already exists
    const hasMemberRole = this.customRoles.some(role => role.name === 'Member');
    
    if (!hasMemberRole) {
      this.customRoles.push({
        name: 'Member',
        permissions: ['view_club', 'view_members'],
        color: '#6B7280' // Gray color
      });
    }
    
    // Add default application form questions if none exist
    if (!this.applicationForm || !this.applicationForm.questions || this.applicationForm.questions.length === 0) {
      this.applicationForm = {
        enabled: true,
        isOpen: false, // President must manually open applications
        questions: [
          {
            id: 'q_default_1',
            type: 'paragraph',
            question: 'Why do you want to join this club?',
            description: '',
            required: true
          },
          {
            id: 'q_default_2',
            type: 'paragraph',
            question: 'What relevant experience or skills do you have?',
            description: '',
            required: false
          }
        ]
      };
    }
  }
  next();
});

// Update violation count when violations array changes
clubSchema.pre('save', function(next) {
  if (this.isModified('violations')) {
    this.violationCount = this.violations.length;
  }
  next();
});

// Index for faster queries
clubSchema.index({ ownerId: 1 });
clubSchema.index({ category: 1 });
clubSchema.index({ name: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('Club', clubSchema);
