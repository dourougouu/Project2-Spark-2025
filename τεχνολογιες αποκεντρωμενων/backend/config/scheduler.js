const cron = require('node-cron');
const connectors = require('../connectors');

// Schedule automatic syncs
function startScheduler() {
  // Sync every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting scheduled sync...');
    
    for (const [sourceName, connector] of Object.entries(connectors)) {
      try {
        await connector.sync(false); // Incremental sync
        console.log(`Scheduled sync completed for ${sourceName}`);
      } catch (error) {
        console.error(`Scheduled sync failed for ${sourceName}:`, error);
      }
    }
  });

  console.log('Scheduler started - automatic syncs will run daily at 2 AM');
}

module.exports = { startScheduler };

