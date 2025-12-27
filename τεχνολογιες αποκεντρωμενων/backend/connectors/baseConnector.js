const Course = require('../models/Course');
const axios = require('axios');

class BaseConnector {
  constructor(name, apiUrl) {
    this.name = name;
    this.apiUrl = apiUrl;
  }

  // Transform external course data to unified schema
  transformCourse(externalCourse) {
    throw new Error('transformCourse must be implemented by subclass');
  }

  // Fetch courses from external API
  async fetchCourses() {
    throw new Error('fetchCourses must be implemented by subclass');
  }

  // Sync courses to database
  async sync(fullSync = false) {
    try {
      console.log(`Starting sync for ${this.name} (fullSync: ${fullSync})`);
      
      const externalCourses = await this.fetchCourses();
      let imported = 0;
      let updated = 0;

      for (const externalCourse of externalCourses) {
        const transformedCourse = this.transformCourse(externalCourse);
        
        const existingCourse = await Course.findOne({
          'source.repositoryName': this.name,
          'source.sourceId': transformedCourse.source.sourceId
        });

        if (existingCourse) {
          // Update existing course
          await Course.updateOne(
            { _id: existingCourse._id },
            { 
              ...transformedCourse,
              lastUpdated: new Date()
            }
          );
          updated++;
        } else {
          // Create new course
          await Course.create(transformedCourse);
          imported++;
        }
      }

      console.log(`${this.name} sync completed: ${imported} imported, ${updated} updated`);
      
      return {
        imported,
        updated,
        total: imported + updated
      };
    } catch (error) {
      console.error(`Error syncing ${this.name}:`, error);
      throw error;
    }
  }
}

module.exports = BaseConnector;

