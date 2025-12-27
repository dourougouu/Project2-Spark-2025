const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    default: ''
  },
  keywords: [{
    type: String
  }],
  category: {
    type: String,
    index: true
  },
  language: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true
  },
  source: {
    repositoryName: {
      type: String,
      required: true,
      index: true
    },
    repositoryUrl: {
      type: String
    },
    sourceId: {
      type: String,
      required: true
    }
  },
  accessLink: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    duration: String,
    instructor: String,
    rating: Number,
    enrollmentCount: Number,
    imageUrl: String
  },
  // For ML recommendations
  sparkSimilarity: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    similarity: Number
  }],
  clusterId: {
    type: Number,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for search optimization
courseSchema.index({ title: 'text', description: 'text', keywords: 'text' });
courseSchema.index({ source: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);

