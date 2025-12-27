const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const connectors = require('../connectors');

// Sync from specific source
router.post('/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { fullSync = false } = req.body;

    if (!connectors[source]) {
      return res.status(404).json({ error: `Connector for source '${source}' not found` });
    }

    res.json({ 
      message: `Sync started for source: ${source}`,
      fullSync 
    });

    // Run sync asynchronously
    connectors[source].sync(fullSync)
      .then(result => {
        console.log(`Sync completed for ${source}:`, result);
      })
      .catch(error => {
        console.error(`Sync error for ${source}:`, error);
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sync status
router.get('/status', async (req, res) => {
  try {
    const sources = Object.keys(connectors);
    const status = {};

    for (const source of sources) {
      const count = await Course.countDocuments({ 'source.repositoryName': source });
      const lastSync = await Course.findOne({ 'source.repositoryName': source })
        .sort({ lastUpdated: -1 })
        .select('lastUpdated');

      status[source] = {
        courseCount: count,
        lastSync: lastSync ? lastSync.lastUpdated : null
      };
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

