const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get all courses with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      language,
      level,
      category,
      source,
      search,
      sortBy = 'lastUpdated',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (language) query.language = language;
    if (level) query.level = level;
    if (category) query.category = category;
    if (source) query['source.repositoryName'] = source;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get similar courses (Spark-based recommendations)
router.get('/:id/similar', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // If Spark similarity data exists, use it
    if (course.sparkSimilarity && course.sparkSimilarity.length > 0) {
      const similarCourseIds = course.sparkSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
        .map(item => item.courseId);

      const similarCourses = await Course.find({
        _id: { $in: similarCourseIds }
      });

      // Sort by similarity score
      const sortedCourses = similarCourseIds
        .map(id => similarCourses.find(c => c._id.toString() === id.toString()))
        .filter(Boolean);

      return res.json({ similarCourses: sortedCourses });
    }

    // Fallback: find courses in same category/level
    const similarCourses = await Course.find({
      $or: [
        { category: course.category },
        { level: course.level },
        { language: course.language }
      ],
      _id: { $ne: course._id }
    }).limit(10);

    res.json({ similarCourses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available filter options
router.get('/filters/options', async (req, res) => {
  try {
    const languages = await Course.distinct('language');
    const levels = await Course.distinct('level');
    const categories = await Course.distinct('category');
    const sources = await Course.distinct('source.repositoryName');

    res.json({
      languages,
      levels,
      categories,
      sources
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

