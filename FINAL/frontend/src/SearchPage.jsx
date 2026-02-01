import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchPage.css';
import { Home, Search,  BarChart3 as AnalyticsIcon } from 'lucide-react';

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

// ==================== FilterSidebar Component ====================
function FilterSidebar({ filters, selectedFilters, onFilterChange }) {
  const handleCheckboxChange = (filterType, value) => {
    const currentValues = selectedFilters[filterType] || [];
    let newValues;
    
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    onFilterChange(filterType, newValues);
  };

  const isChecked = (filterType, value) => {
    return (selectedFilters[filterType] || []).includes(value);
  };

  return (
    <aside className="filter-sidebar">
      <h3 className="filter-title">REFINE RESULTS</h3>
      
      {/* Language Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Language</h4>
        {filters.languages?.map(lang => (
          <label key={lang} className="filter-checkbox">
            <input
              type="checkbox"
              checked={isChecked('language', lang)}
              onChange={() => handleCheckboxChange('language', lang)}
            />
            <span className="checkmark"></span>
            <span className="filter-label">{lang}</span>
          </label>
        ))}
      </div>

      {/* Level Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Level</h4>
        {filters.levels?.map(level => (
          <label key={level} className="filter-checkbox">
            <input
              type="checkbox"
              checked={isChecked('level', level)}
              onChange={() => handleCheckboxChange('level', level)}
            />
            <span className="checkmark"></span>
            <span className="filter-label">{level}</span>
          </label>
        ))}
      </div>

      {/* Source Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Source</h4>
        {filters.sources?.map(source => (
          <label key={source.source_id} className="filter-checkbox">
            <input
              type="checkbox"
              checked={isChecked('source', source.name)}
              onChange={() => handleCheckboxChange('source', source.name)}
            />
            <span className="checkmark"></span>
            <span className="filter-label">{source.name}</span>
          </label>
        ))}
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Category</h4>
        <div className="filter-options scrollable">
          {filters.categories?.map(cat => (
            <label key={cat.category_id} className="filter-checkbox">
              <input
                type="checkbox"
                checked={isChecked('category', cat.category_id.toString())}
                onChange={() => handleCheckboxChange('category', cat.category_id.toString())}
              />
              <span className="checkmark"></span>
              <span className="filter-label">{cat.name_of_the_category}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ==================== SearchPage Component ====================
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    languages: ['English', 'Spanish'],
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    sources: [
      { source_id: 1, name: 'Coursera' },
      { source_id: 2, name: 'Udacity' }
    ],
    categories: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    language: [],
    level: [],
    source: [],
    category: []
  });
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch available filters from API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/filters`);
        setFilters(prev => ({
          ...prev,
          ...response.data,
          sources: response.data.sources?.length > 0 
            ? response.data.sources 
            : [{ source_id: 1, name: 'Coursera' }, { source_id: 2, name: 'Udacity' }]
        }));
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedFilters.level.length > 0) {
        params.append('level', selectedFilters.level[0]);
      }
      
      if (selectedFilters.source.length > 0) {
        params.append('source', selectedFilters.source[0]);
      }
      
      if (selectedFilters.language.length > 0) {
        params.append('language', selectedFilters.language[0]);
      }
      
      if (selectedFilters.category.length > 0) {
        params.append('category', selectedFilters.category[0]);
      }
      
      params.append('page', currentPage.toString());
      params.append('limit', '10');

      const response = await axios.get(`${API_BASE_URL}/courses?${params.toString()}`);
      
      if (Array.isArray(response.data)) {
        setCourses(response.data);
        setTotalResults(response.data.length);
        setTotalPages(1);
      } else {
        setCourses(response.data.courses || []);
        setTotalResults(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setTotalResults(0);
    }
    setLoading(false);
  }, [searchTerm, selectedFilters, currentPage]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({ q: searchTerm });
    fetchCourses();
  };

  const handleFilterChange = (filterType, values) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
    setCurrentPage(1);
  };

  return (
    <div className="search-page">
      {/* Το πράσινο header εμφανίζεται από το App.jsx – εδώ μόνο το περιεχόμενο της σελίδας */}

      {/* Search Header */}
      <div className="search-header">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search courses by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
      </div>

      {/* Results Title */}
      {searchTerm && (
        <div className="results-header">
          <h1>RESULTS FOR: "{searchTerm.toUpperCase()}"</h1>
          <p className="results-count">Found {totalResults} courses</p>
        </div>
      )}

      {!searchTerm && (
        <div className="results-header">
          <h1>BROWSE COURSES</h1>
          <p className="results-count">Showing {courses.length} of {totalResults} courses</p>
        </div>
      )}

      {/* Main Content */}
      <div className="search-content">
        <FilterSidebar
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />

        <div className="courses-container">
          {loading ? (
            <div className="loading">Loading courses...</div>
          ) : courses.length > 0 ? (
            <>
              <div className="courses-list">
                {courses.map(course => (
                  <CourseCard key={course.course_id} course={course} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>No courses found. Try different search terms or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
