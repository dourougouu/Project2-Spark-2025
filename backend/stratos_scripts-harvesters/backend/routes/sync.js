/**
 * Sync Routes - Trigger data harvesting from sources
 */

const express = require('express');
const router = express.Router();
const harvesterService = require('../services/harvesterService');

/**
 * Sync courses from a specific source
 * POST /sync/:source (e.g., /sync/coursera, /sync/udacity)
 */
router.post('/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const result = await harvesterService.triggerHarvester(source);
    
    res.json({
      success: true,
      message: `Sync initiated for ${source}`,
      data: result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync courses',
      message: error.message || error.error,
      details: error
    });
  }
});

/**
 * Sync courses from all sources
 * POST /sync/all
 */
router.post('/all', async (req, res) => {
  try {
    const results = await harvesterService.triggerAllHarvesters();
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    res.json({
      success: successCount === totalCount,
      message: `Synced ${successCount}/${totalCount} sources`,
      data: results
    });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync courses',
      message: error.message || 'Unknown error'
    });
  }
});

module.exports = router;

