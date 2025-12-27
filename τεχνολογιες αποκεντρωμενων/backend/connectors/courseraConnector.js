const BaseConnector = require('./baseConnector');
const axios = require('axios');

class CourseraConnector extends BaseConnector {
  constructor() {
    super('coursera', 'https://api.coursera.org/api/courses.v1');
  }

  async fetchCourses() {
    try {
      // Coursera API example - using mock data structure
      // In production, replace with actual API call
      const response = await axios.get(this.apiUrl, {
        params: {
          limit: 100,
          start: 0
        }
      });

      // Mock data structure for demonstration
      // Replace with actual API response parsing
      return this.getMockCourseraCourses();
    } catch (error) {
      console.warn('Coursera API not available, using mock data');
      return this.getMockCourseraCourses();
    }
  }

  getMockCourseraCourses() {
    return [
      {
        id: 'coursera-001',
        name: 'Data Science Specialization',
        description: 'Learn data science from scratch with hands-on projects',
        shortDescription: 'Comprehensive data science course',
        courseType: 'specialization',
        domains: ['Data Science', 'Statistics'],
        language: 'en',
        difficulty: 'intermediate',
        slug: 'data-science-specialization',
        url: 'https://www.coursera.org/specializations/data-science'
      },
      {
        id: 'coursera-002',
        name: 'Python for Everybody',
        shortDescription: 'Learn Python programming',
        description: 'A beginner-friendly Python programming course covering basics to advanced topics.',
        courseType: 'course',
        domains: ['Programming', 'Python'],
        language: 'en',
        difficulty: 'beginner',
        slug: 'python-for-everybody',
        url: 'https://www.coursera.org/learn/python'
      },
      {
        id: 'coursera-003',
        name: 'Deep Learning Specialization',
        shortDescription: 'Master deep learning and neural networks',
        description: 'Advanced course on deep learning, convolutional networks, and recurrent networks.',
        courseType: 'specialization',
        domains: ['Deep Learning', 'Neural Networks'],
        language: 'en',
        difficulty: 'advanced',
        slug: 'deep-learning-specialization',
        url: 'https://www.coursera.org/specializations/deep-learning'
      }
    ];
  }

  transformCourse(externalCourse) {
    // Map Coursera difficulty to our level system
    const levelMap = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'mixed': 'intermediate'
    };

    return {
      title: externalCourse.name,
      description: externalCourse.description || externalCourse.shortDescription,
      shortDescription: externalCourse.shortDescription,
      keywords: externalCourse.domains || [],
      category: externalCourse.domains?.[0] || 'General',
      language: externalCourse.language || 'en',
      level: levelMap[externalCourse.difficulty] || 'beginner',
      source: {
        repositoryName: 'coursera',
        repositoryUrl: 'https://www.coursera.org',
        sourceId: externalCourse.id
      },
      accessLink: externalCourse.url,
      lastUpdated: new Date(),
      metadata: {
        courseType: externalCourse.courseType,
        enrollmentCount: externalCourse.enrollmentCount
      }
    };
  }
}

module.exports = new CourseraConnector();

