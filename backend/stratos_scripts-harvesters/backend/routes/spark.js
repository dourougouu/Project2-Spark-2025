/**
 * Spark Routes - Endpoints for Spark ML data processing
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Get courses data for Spark ML processing
 * GET /spark/courses
 * Returns courses with all related data (categories, keywords) in a format suitable for Spark
 */
router.get('/courses', async (req, res) => {
  try {
    const { limit, offset = 0 } = req.query;
    let limitClause = '';
    let params = [];

    if (limit) {
      limitClause = 'LIMIT ? OFFSET ?';
      params = [parseInt(limit), parseInt(offset)];
    }

    // Get all courses with related data
    const coursesQuery = `
      SELECT 
        c.course_id,
        c.source_id,
        c.source_course_id,
        c.title,
        c.summary,
        c.language_,
        c.level_,
        c.url,
        s.name as source_name,
        GROUP_CONCAT(DISTINCT cat.name_of_the_category) as categories,
        GROUP_CONCAT(DISTINCT k.keyword) as keywords
      FROM courses c
      INNER JOIN sources s ON c.source_id = s.source_id
      LEFT JOIN course_categories cc ON c.course_id = cc.course_id
      LEFT JOIN categories cat ON cc.category_id = cat.category_id
      LEFT JOIN course_keywords ck ON c.course_id = ck.course_id
      LEFT JOIN keywords k ON ck.keyword_id = k.keyword_id
      GROUP BY c.course_id
      ORDER BY c.course_id
      ${limitClause}
    `;

    const courses = await db.query(coursesQuery, params);

    // Transform data for Spark
    const sparkData = courses.map(course => ({
      course_id: course.course_id,
      source_id: course.source_id,
      source_name: course.source_name,
      title: course.title,
      summary: course.summary,
      language: course.language_,
      level: course.level_,
      url: course.url,
      categories: course.categories ? course.categories.split(',') : [],
      keywords: course.keywords ? course.keywords.split(',') : [],
      // Combined text for NLP processing
      combined_text: [
        course.title,
        course.summary,
        course.categories,
        course.keywords
      ].filter(Boolean).join(' ')
    }));

    res.json({
      success: true,
      count: sparkData.length,
      data: sparkData
    });
  } catch (error) {
    console.error('Error fetching Spark data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data for Spark',
      message: error.message
    });
  }
});

/**
 * Get user interactions for Spark ML collaborative filtering
 * GET /spark/interactions
 */
router.get('/interactions', async (req, res) => {
  try {
    const interactionsQuery = `
      SELECT 
        user_id,
        course_id,
        rating,
        DATE(interaction_date) as date
      FROM user_interactions
      ORDER BY interaction_date DESC
    `;

    const interactions = await db.query(interactionsQuery);

    res.json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interactions for Spark',
      message: error.message
    });
  }
});

/**
 * Update course similarities from Spark ML results
 * POST /spark/similarities
 * Body: Array of {course_id, similar_course_id, score}
 */
router.post('/similarities', async (req, res) => {
  try {
    const { similarities } = req.body;

    if (!Array.isArray(similarities)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected array of similarities.'
      });
    }

    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Clear existing similarities (optional - you might want to keep them)
      // await connection.execute('TRUNCATE TABLE course_similarities');

      // Insert new similarities
      for (const similarity of similarities) {
        const { course_id, similar_course_id, score } = similarity;

        if (!course_id || !similar_course_id || score === undefined) {
          continue;
        }

        await connection.execute(
          `INSERT INTO course_similarities (course_id, similar_course_id, score)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE score = ?`,
          [course_id, similar_course_id, score, score]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: `Updated ${similarities.length} course similarities`,
        count: similarities.length
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating similarities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update similarities',
      message: error.message
    });
  }
});

module.exports = router;

