/**
 * Course Routes
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// GET /courses - List courses with filters and pagination
router.get('/', courseController.getCourses);

// GET /courses/:id - Get course details
router.get('/:id', courseController.getCourseById);

// GET /courses/:id/similar - Get similar courses (Spark recommendations)
router.get('/:id/similar', courseController.getSimilarCourses);

// POST /courses - Create new course
router.post('/', courseController.createCourse);

// PUT /courses/:id - Update course
router.put('/:id', courseController.updateCourse);

// DELETE /courses/:id - Delete course
router.delete('/:id', courseController.deleteCourse);

module.exports = router;

