/**
 * Course Controller - Handles all course-related operations
 */

const db = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Get all courses with filtering, pagination, and search
 * GET /courses?page=1&limit=10&search=keyword&level=Beginner&source=coursera
 */
async function getCourses(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      level = '',
      source = '',
      category = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push(`(c.title LIKE ? OR c.summary LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (level) {
      whereConditions.push(`c.level_ = ?`);
      queryParams.push(level);
    }

    if (source) {
      whereConditions.push(`s.name = ?`);
      queryParams.push(source);
    }

    if (category) {
      whereConditions.push(`cat.name_of_the_category = ?`);
      queryParams.push(category);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Build JOIN clauses
    let joinClause = 'FROM courses c INNER JOIN sources s ON c.source_id = s.source_id';
    if (category) {
      joinClause += ' INNER JOIN course_categories cc ON c.course_id = cc.course_id';
      joinClause += ' INNER JOIN categories cat ON cc.category_id = cat.category_id';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.course_id) as total
      ${joinClause}
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get courses with pagination
    const coursesQuery = `
      SELECT 
        c.course_id,
        c.source_course_id,
        c.title,
        c.summary,
        c.language_,
        c.level_,
        c.url,
        c.last_updated,
        c.time_created,
        c.time_updated,
        s.source_id,
        s.name as source_name,
        s.url_link as source_url
      ${joinClause}
      ${whereClause}
      GROUP BY c.course_id
      ORDER BY c.time_updated DESC
      LIMIT ? OFFSET ?
    `;

    const courses = await db.query(coursesQuery, [...queryParams, limitNum, offset]);

    // Get categories for each course
    for (let course of courses) {
      const categoriesQuery = `
        SELECT cat.category_id, cat.name_of_the_category
        FROM course_categories cc
        INNER JOIN categories cat ON cc.category_id = cat.category_id
        WHERE cc.course_id = ?
      `;
      course.categories = await db.query(categoriesQuery, [course.course_id]);

      // Get keywords for each course
      const keywordsQuery = `
        SELECT k.keyword_id, k.keyword
        FROM course_keywords ck
        INNER JOIN keywords k ON ck.keyword_id = k.keyword_id
        WHERE ck.course_id = ?
      `;
      course.keywords = await db.query(keywordsQuery, [course.course_id]);
    }

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
      message: error.message
    });
  }
}

/**
 * Get course details by ID
 * GET /courses/:id
 */
async function getCourseById(req, res) {
  try {
    const { id } = req.params;

    // Get course details
    const courseQuery = `
      SELECT 
        c.course_id,
        c.source_course_id,
        c.title,
        c.summary,
        c.language_,
        c.level_,
        c.url,
        c.last_updated,
        c.time_created,
        c.time_updated,
        s.source_id,
        s.name as source_name,
        s.url_link as source_url
      FROM courses c
      INNER JOIN sources s ON c.source_id = s.source_id
      WHERE c.course_id = ?
    `;

    const courses = await db.query(courseQuery, [id]);

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const course = courses[0];

    // Get categories
    const categoriesQuery = `
      SELECT cat.category_id, cat.name_of_the_category
      FROM course_categories cc
      INNER JOIN categories cat ON cc.category_id = cat.category_id
      WHERE cc.course_id = ?
    `;
    course.categories = await db.query(categoriesQuery, [id]);

    // Get keywords
    const keywordsQuery = `
      SELECT k.keyword_id, k.keyword
      FROM course_keywords ck
      INNER JOIN keywords k ON ck.keyword_id = k.keyword_id
      WHERE ck.course_id = ?
    `;
    course.keywords = await db.query(keywordsQuery, [id]);

    // Get user interactions (ratings) if any
    const interactionsQuery = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings
      FROM user_interactions
      WHERE course_id = ?
    `;
    const interactions = await db.query(interactionsQuery, [id]);
    course.ratings = interactions[0] || { average_rating: null, total_ratings: 0 };

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course',
      message: error.message
    });
  }
}

/**
 * Get similar courses (Spark-based recommendations)
 * GET /courses/:id/similar?limit=5
 */
async function getSimilarCourses(req, res) {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit);

    // Check if course exists
    const courseCheck = await db.query(
      'SELECT course_id FROM courses WHERE course_id = ?',
      [id]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get similar courses from course_similarities table (populated by Spark)
    const similarQuery = `
      SELECT 
        c.course_id,
        c.title,
        c.summary,
        c.level_,
        c.url,
        cs.score as similarity_score,
        s.name as source_name
      FROM course_similarities cs
      INNER JOIN courses c ON cs.similar_course_id = c.course_id
      INNER JOIN sources s ON c.source_id = s.source_id
      WHERE cs.course_id = ?
      ORDER BY cs.score DESC
      LIMIT ?
    `;

    const similarCourses = await db.query(similarQuery, [id, limitNum]);

    // If no Spark similarities exist, return empty or fallback to keyword-based similarity
    if (similarCourses.length === 0) {
      // Fallback: find courses with similar keywords
      const fallbackQuery = `
        SELECT DISTINCT
          c2.course_id,
          c2.title,
          c2.summary,
          c2.level_,
          c2.url,
          COUNT(DISTINCT k.keyword_id) as common_keywords,
          s.name as source_name
        FROM courses c1
        INNER JOIN course_keywords ck1 ON c1.course_id = ck1.course_id
        INNER JOIN keywords k ON ck1.keyword_id = k.keyword_id
        INNER JOIN course_keywords ck2 ON k.keyword_id = ck2.keyword_id
        INNER JOIN courses c2 ON ck2.course_id = c2.course_id
        INNER JOIN sources s ON c2.source_id = s.source_id
        WHERE c1.course_id = ? AND c2.course_id != ?
        GROUP BY c2.course_id
        ORDER BY common_keywords DESC
        LIMIT ?
      `;

      const fallbackCourses = await db.query(fallbackQuery, [id, id, limitNum]);
      
      // Add similarity_score (normalized) for fallback
      fallbackCourses.forEach(course => {
        course.similarity_score = (course.common_keywords / 10).toFixed(3); // Normalize
      });

      return res.json({
        success: true,
        data: fallbackCourses,
        note: 'Using keyword-based similarity (Spark similarities not available)'
      });
    }

    res.json({
      success: true,
      data: similarCourses
    });
  } catch (error) {
    console.error('Error fetching similar courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch similar courses',
      message: error.message
    });
  }
}

/**
 * Create a new course
 * POST /courses
 */
async function createCourse(req, res) {
  try {
    const {
      source_id,
      source_course_id,
      title,
      summary,
      language_,
      level_,
      url,
      categories = [],
      keywords = []
    } = req.body;

    // Validate required fields
    if (!source_id || !source_course_id || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: source_id, source_course_id, title'
      });
    }

    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert course
      const insertCourseQuery = `
        INSERT INTO courses 
        (source_id, source_course_id, title, summary, language_, level_, url, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
      `;

      const [result] = await connection.execute(insertCourseQuery, [
        source_id,
        source_course_id,
        title,
        summary || null,
        language_ || null,
        level_ || 'Unknown',
        url || null
      ]);

      const courseId = result.insertId;

      // Add categories
      if (categories.length > 0) {
        for (const categoryName of categories) {
          // Get or create category
          let [catResult] = await connection.execute(
            'SELECT category_id FROM categories WHERE name_of_the_category = ?',
            [categoryName]
          );

          let categoryId;
          if (catResult.length === 0) {
            [catResult] = await connection.execute(
              'INSERT INTO categories (name_of_the_category) VALUES (?)',
              [categoryName]
            );
            categoryId = catResult.insertId;
          } else {
            categoryId = catResult[0].category_id;
          }

          // Link course to category
          await connection.execute(
            'INSERT IGNORE INTO course_categories (course_id, category_id) VALUES (?, ?)',
            [courseId, categoryId]
          );
        }
      }

      // Add keywords
      if (keywords.length > 0) {
        for (const keyword of keywords) {
          // Get or create keyword
          let [keyResult] = await connection.execute(
            'SELECT keyword_id FROM keywords WHERE keyword = ?',
            [keyword]
          );

          let keywordId;
          if (keyResult.length === 0) {
            [keyResult] = await connection.execute(
              'INSERT INTO keywords (keyword) VALUES (?)',
              [keyword]
            );
            keywordId = keyResult.insertId;
          } else {
            keywordId = keyResult[0].keyword_id;
          }

          // Link course to keyword
          await connection.execute(
            'INSERT IGNORE INTO course_keywords (course_id, keyword_id) VALUES (?, ?)',
            [courseId, keywordId]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: { course_id: courseId }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create course',
      message: error.message
    });
  }
}

/**
 * Update a course
 * PUT /courses/:id
 */
async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      language_,
      level_,
      url,
      categories,
      keywords
    } = req.body;

    // Check if course exists
    const courseCheck = await db.query(
      'SELECT course_id FROM courses WHERE course_id = ?',
      [id]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update course fields
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (summary !== undefined) {
        updateFields.push('summary = ?');
        updateValues.push(summary);
      }
      if (language_ !== undefined) {
        updateFields.push('language_ = ?');
        updateValues.push(language_);
      }
      if (level_ !== undefined) {
        updateFields.push('level_ = ?');
        updateValues.push(level_);
      }
      if (url !== undefined) {
        updateFields.push('url = ?');
        updateValues.push(url);
      }

      if (updateFields.length > 0) {
        updateFields.push('last_updated = CURDATE()');
        updateValues.push(id);

        await connection.execute(
          `UPDATE courses SET ${updateFields.join(', ')} WHERE course_id = ?`,
          updateValues
        );
      }

      // Update categories if provided
      if (categories !== undefined && Array.isArray(categories)) {
        // Remove existing categories
        await connection.execute(
          'DELETE FROM course_categories WHERE course_id = ?',
          [id]
        );

        // Add new categories
        for (const categoryName of categories) {
          let [catResult] = await connection.execute(
            'SELECT category_id FROM categories WHERE name_of_the_category = ?',
            [categoryName]
          );

          let categoryId;
          if (catResult.length === 0) {
            [catResult] = await connection.execute(
              'INSERT INTO categories (name_of_the_category) VALUES (?)',
              [categoryName]
            );
            categoryId = catResult.insertId;
          } else {
            categoryId = catResult[0].category_id;
          }

          await connection.execute(
            'INSERT INTO course_categories (course_id, category_id) VALUES (?, ?)',
            [id, categoryId]
          );
        }
      }

      // Update keywords if provided
      if (keywords !== undefined && Array.isArray(keywords)) {
        // Remove existing keywords
        await connection.execute(
          'DELETE FROM course_keywords WHERE course_id = ?',
          [id]
        );

        // Add new keywords
        for (const keyword of keywords) {
          let [keyResult] = await connection.execute(
            'SELECT keyword_id FROM keywords WHERE keyword = ?',
            [keyword]
          );

          let keywordId;
          if (keyResult.length === 0) {
            [keyResult] = await connection.execute(
              'INSERT INTO keywords (keyword) VALUES (?)',
              [keyword]
            );
            keywordId = keyResult.insertId;
          } else {
            keywordId = keyResult[0].keyword_id;
          }

          await connection.execute(
            'INSERT INTO course_keywords (course_id, keyword_id) VALUES (?, ?)',
            [id, keywordId]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Course updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course',
      message: error.message
    });
  }
}

/**
 * Delete a course
 * DELETE /courses/:id
 */
async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseCheck = await db.query(
      'SELECT course_id FROM courses WHERE course_id = ?',
      [id]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete related records first (due to foreign keys)
      await connection.execute(
        'DELETE FROM course_categories WHERE course_id = ?',
        [id]
      );
      await connection.execute(
        'DELETE FROM course_keywords WHERE course_id = ?',
        [id]
      );
      await connection.execute(
        'DELETE FROM course_similarities WHERE course_id = ? OR similar_course_id = ?',
        [id, id]
      );
      await connection.execute(
        'DELETE FROM user_interactions WHERE course_id = ?',
        [id]
      );

      // Delete course
      await connection.execute(
        'DELETE FROM courses WHERE course_id = ?',
        [id]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course',
      message: error.message
    });
  }
}

module.exports = {
  getCourses,
  getCourseById,
  getSimilarCourses,
  createCourse,
  updateCourse,
  deleteCourse
};

