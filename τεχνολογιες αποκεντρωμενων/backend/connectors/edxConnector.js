const BaseConnector = require('./baseConnector');
const axios = require('axios');

class EdxConnector extends BaseConnector {
  constructor() {
    super('edx', 'https://api.edx.org/catalog/v1/courses');
  }

  async fetchCourses() {
    try {
      // EDX API example - using mock data structure
      // In production, replace with actual API call
      const response = await axios.get(this.apiUrl, {
        params: {
          page_size: 100,
          page: 1
        }
      });

      // Mock data structure for demonstration
      // Replace with actual API response parsing
      return this.getMockEdxCourses();
    } catch (error) {
      console.warn('EDX API not available, using mock data');
      return this.getMockEdxCourses();
    }
  }

  getMockEdxCourses() {
    return [
      {
        id: 'edx-001',
        title: 'Introduction to Computer Science',
        short_description: 'Learn the fundamentals of computer science',
        full_description: 'A comprehensive introduction to computer science covering programming, algorithms, and data structures.',
        subjects: ['Computer Science', 'Programming'],
        language: 'en',
        level: 'beginner',
        url: 'https://www.edx.org/course/introduction-to-computer-science'
      },
      {
        id: 'edx-002',
        title: 'Machine Learning Fundamentals',
        short_description: 'Explore machine learning concepts and applications',
        full_description: 'Deep dive into machine learning algorithms, neural networks, and practical applications.',
        subjects: ['Machine Learning', 'Data Science'],
        language: 'en',
        level: 'intermediate',
        url: 'https://www.edx.org/course/machine-learning-fundamentals'
      },
      {
        id: 'edx-003',
        title: 'Advanced Algorithms',
        short_description: 'Master advanced algorithmic techniques',
        full_description: 'Study complex algorithms, optimization techniques, and algorithm design patterns.',
        subjects: ['Computer Science', 'Algorithms'],
        language: 'en',
        level: 'advanced',
        url: 'https://www.edx.org/course/advanced-algorithms'
      }
    ];
  }

  transformCourse(externalCourse) {
    return {
      title: externalCourse.title,
      description: externalCourse.full_description || externalCourse.short_description,
      shortDescription: externalCourse.short_description,
      keywords: externalCourse.subjects || [],
      category: externalCourse.subjects?.[0] || 'General',
      language: externalCourse.language || 'en',
      level: externalCourse.level || 'beginner',
      source: {
        repositoryName: 'edx',
        repositoryUrl: 'https://www.edx.org',
        sourceId: externalCourse.id
      },
      accessLink: externalCourse.url,
      lastUpdated: new Date(),
      metadata: {
        duration: externalCourse.duration,
        instructor: externalCourse.instructor,
        rating: externalCourse.rating,
        enrollmentCount: externalCourse.enrollment_count
      }
    };
  }
}

module.exports = new EdxConnector();

