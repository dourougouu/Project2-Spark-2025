const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get analytics data
router.get('/', async (req, res) => {
  try {
    // Course counts by source
    const coursesBySource = await Course.aggregate([
      {
        $group: {
          _id: '$source.repositoryName',
          count: { $sum: 1 }
        }
      }
    ]);

    // Courses by level
    const coursesByLevel = await Course.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Courses by language
    const coursesByLanguage = await Course.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Courses by category
    const coursesByCategory = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Clusters distribution
    const coursesByCluster = await Course.aggregate([
      {
        $match: { clusterId: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$clusterId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalCourses = await Course.countDocuments();

    res.json({
      totalCourses,
      coursesBySource,
      coursesByLevel,
      coursesByLanguage,
      coursesByCategory,
      coursesByCluster
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

