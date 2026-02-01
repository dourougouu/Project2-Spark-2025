import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CourseDetails.css';


const API_BASE_URL = 'http://localhost:5001/api';

// ==================== CourseCard Component ====================
function CourseCard({ course }) {
  const navigate = useNavigate();

  const getLanguageBadge = () => {
    const lang = course.language || 'English';
    if (lang.toLowerCase().includes('spanish') || lang.toLowerCase().includes('es')) {
      return 'ES';
    }
    return 'EN';
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleViewDetails = () => {
    navigate(`/course/${course.course_id}`);
  };

  return (
    <div className="course-card">
      <div className="course-badge">{getLanguageBadge()}</div>
      <div className="course-info">
        <h3 className="course-title">{truncateText(course.title, 50)}</h3>
        <p className="course-summary">{truncateText(course.summary, 80)}</p>
      </div>
      <button className="view-details-btn" onClick={handleViewDetails}>
        View Details
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  );
}

// ==================== CourseDetails Component ====================
function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [similarCourses, setSimilarCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const [courseRes, similarRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/courses/${id}`),
          axios.get(`${API_BASE_URL}/courses/${id}/similar`)
        ]);
        setCourse(courseRes.data);
        setSimilarCourses(similarRes.data);
      } catch (error) {
        console.error('Error fetching course details:', error);
      }
      setLoading(false);
    };

    fetchCourseDetails();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (!course) {
    return (
      <div className="not-found">
        <h2>Course not found</h2>
        <button onClick={() => navigate('/search')} className="back-btn">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="course-details-page">
      <button onClick={() => navigate(-1)} className="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Results
      </button>

      <div className="course-details-card">
        <div className="course-header">
          <div className="course-badge-large">
            {course.language?.toLowerCase().includes('spanish') ? 'ES' : 'EN'}
          </div>
          <div className="course-header-info">
            <h1>{course.title}</h1>
            <div className="course-meta">
              <span className="meta-item">
                <strong>Level:</strong> {course.level_ || 'N/A'}
              </span>
              <span className="meta-item">
                <strong>Source:</strong> {course.source_name || 'N/A'}
              </span>
              {course.categories && (
                <span className="meta-item">
                  <strong>Categories:</strong> {course.categories}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="course-body">
          <h3>Description</h3>
          <p className="course-description">{course.summary || course.title || 'No description available.'}</p>

          {course.url && (
            <a href={course.url} target="_blank" rel="noopener noreferrer" className="course-link">
              Visit Course Page
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Similar Courses */}
      {similarCourses.length > 0 && (
        <div className="similar-courses">
          <h2>Similar Courses</h2>
          <div className="similar-courses-list">
            {similarCourses.map(similarCourse => (
              <CourseCard key={similarCourse.course_id} course={similarCourse} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetails;
