/**
 * Script to seed initial data by syncing from all available sources
 * Usage: node backend/scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectors = require('../connectors');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course-aggregator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    console.log('Starting data sync from all sources...\n');

    // Sync from all available connectors
    for (const [sourceName, connector] of Object.entries(connectors)) {
      try {
        console.log(`Syncing from ${sourceName}...`);
        const result = await connector.sync(true); // Full sync
        console.log(`✓ ${sourceName}: ${result.imported} imported, ${result.updated} updated\n`);
      } catch (error) {
        console.error(`✗ Error syncing ${sourceName}:`, error.message);
      }
    }

    console.log('Data seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedData();

