/**
 * Express Server - Main entry point for the API
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./config/database');
const courseRoutes = require('./routes/courses');
const syncRoutes = require('./routes/sync');
const sparkRoutes = require('./routes/spark');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await db.testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/courses', courseRoutes);
app.use('/sync', syncRoutes);
app.use('/spark', sparkRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Stratos Course Aggregation API',
    version: '1.0.0',
    endpoints: {
      courses: {
        list: 'GET /courses?page=1&limit=10&search=keyword&level=Beginner&source=coursera',
        details: 'GET /courses/:id',
        similar: 'GET /courses/:id/similar?limit=5',
        create: 'POST /courses',
        update: 'PUT /courses/:id',
        delete: 'DELETE /courses/:id'
      },
      sync: {
        source: 'POST /sync/:source (coursera, udacity)',
        all: 'POST /sync/all'
      },
      spark: {
        courses: 'GET /spark/courses?limit=100&offset=0',
        interactions: 'GET /spark/interactions',
        similarities: 'POST /spark/similarities'
      },
      health: 'GET /health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Warning: Database connection failed. API may not work correctly.');
      console.warn('Please check your database configuration in .env file');
    }

    app.listen(PORT, () => {
      console.log('=' .repeat(60));
      console.log('🚀 Stratos Course Aggregation API Server');
      console.log('=' .repeat(60));
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`📚 Database: ${process.env.DB_NAME || 'spark'}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=' .repeat(60));
      console.log('\nAvailable endpoints:');
      console.log('  GET  / - API documentation');
      console.log('  GET  /health - Health check');
      console.log('  GET  /courses - List courses');
      console.log('  GET  /courses/:id - Course details');
      console.log('  GET  /courses/:id/similar - Similar courses');
      console.log('  POST /courses - Create course');
      console.log('  PUT  /courses/:id - Update course');
      console.log('  DELETE /courses/:id - Delete course');
      console.log('  POST /sync/:source - Sync from source');
      console.log('  POST /sync/all - Sync all sources');
      console.log('  GET  /spark/courses - Get courses for Spark ML');
      console.log('  GET  /spark/interactions - Get user interactions');
      console.log('  POST /spark/similarities - Update similarity scores');
      console.log('=' .repeat(60));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

