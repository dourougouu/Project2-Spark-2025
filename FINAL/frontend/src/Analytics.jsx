import React, { useState, useEffect } from 'react';
import './Analytics.css';
import './BasicPage.css';
import { Link } from 'react-router-dom';
import { Home, Search, BookOpen, FileText, BarChart3 as AnalyticsIcon} from 'lucide-react';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:5000/api/analytics');
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <header className="header-bar">
                    <div className="header-icons">
                        <Link to="/" className="icon-link"><Home className="icon" /></Link>
                        <Link to="/search" className="icon-link"><Search className="icon" /></Link>
                        <Link to="/course-list" className="icon-link"><FileText className="icon" /></Link>
                        <Link to="/my-courses" className="icon-link"><BookOpen className="icon" /></Link>
                        <Link to="/analytics" className="icon-link"><AnalyticsIcon className="icon" /></Link>
                    </div>
                </header>
                <main className="main-content">
                <div className="analytics-container">
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Φόρτωση στατιστικών...</p>
                    </div>
                </div>
                </main>
              <footer className="footer-bar">
                <p>© 2026 Project Spark</p>
              </footer>
            </div>
        );
    }

    if (error) {
        return (
             <div className="page-container">
              <header className="header-bar">
                <div className="header-icons">
                    <Link to="/" className="icon-link"><Home className="icon" /></Link>
                    <Link to="/search" className="icon-link"><Search className="icon" /></Link>
                    <Link to="/course-list" className="icon-link"><FileText className="icon" /></Link>
                    <Link to="/my-courses" className="icon-link"><BookOpen className="icon" /></Link>
                    <Link to="/analytics" className="icon-link"><AnalyticsIcon className="icon" /></Link>
                </div>
              </header>
                <main className="main-content">
                    <div className="analytics-container">
                        <div className="error">
                            <h2>⚠️ Σφάλμα</h2>
                            <p>{error}</p>
                            <button onClick={fetchAnalytics}>Προσπάθεια ξανά</button>
                        </div>
                    </div>
                </main>
              <footer className="footer-bar">
                <p>© 2026 Project Spark</p>
              </footer>
            </div>
        );
    }

    const getMaxValue = (data) => {
        return Math.max(...data.map(item => item.count));
    };

    const getPercentage = (value, total) => {
        return ((value / total) * 100).toFixed(1);
    };

    return (
        <div className="page-container">

        {/* HEADER */}
        <header className="header-bar">
        <div className="header-icons">
            <Link to="/" className="icon-link"><Home className="icon" /></Link>
            <Link to="/search" className="icon-link"><Search className="icon" /></Link>
            <Link to="/course-list" className="icon-link"><FileText className="icon" /></Link>
            <Link to="/my-courses" className="icon-link"><BookOpen className="icon" /></Link>
            <Link to="/analytics" className="icon-link"><AnalyticsIcon className="icon" /></Link>
        </div>
      </header>

        {/* MAIN CONTENT */}
        <main className="main-content">
            <div className="analytics-container">

                {/* ⬇️ ΟΛΟ το υπάρχον analytics content σου ΜΕΣΑ ΕΔΩ ⬇️ */}
                <div className="analytics-header">
                    <h1>📊 Analytics Dashboard</h1>
                    <p className="subtitle">Στατιστικά και Αναλυτικά Στοιχεία Μαθημάτων</p>
                </div>

                            {/* Overview Cards */}
            <div className="stats-overview">
                <div className="stat-card total">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>Συνολικά Μαθήματα</h3>
                        <p className="stat-number">{stats.totalCourses}</p>
                    </div>
                </div>
                <div className="stat-card sources">
                    <div className="stat-icon">🌐</div>
                    <div className="stat-content">
                        <h3>Πηγές</h3>
                        <p className="stat-number">{stats.bySource.length}</p>
                    </div>
                </div>
                <div className="stat-card categories">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-content">
                        <h3>Θεματικές</h3>
                        <p className="stat-number">{stats.byCategory.length}</p>
                    </div>
                </div>
                <div className="stat-card languages">
                    <div className="stat-icon">🌍</div>
                    <div className="stat-content">
                        <h3>Γλώσσες</h3>
                        <p className="stat-number">{stats.byLanguage.length}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* By Source */}
                <div className="chart-card">
                    <h2>📦 Μαθήματα ανά Πηγή</h2>
                    <div className="chart">
                        {stats.bySource.map((item, index) => {
                            const maxValue = getMaxValue(stats.bySource);
                            const percentage = (item.count / maxValue) * 100;
                            return (
                                <div key={index} className="bar-item">
                                    <div className="bar-label">
                                        <span className="label-name">{item.source_name}</span>
                                        <span className="label-count">{item.count}</span>
                                    </div>
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill source-bar"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <span className="bar-percentage">
                                                {getPercentage(item.count, stats.totalCourses)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* By Level */}
                <div className="chart-card">
                    <h2>📈 Μαθήματα ανά Επίπεδο</h2>
                    <div className="chart">
                        {stats.byLevel.map((item, index) => {
                            const maxValue = getMaxValue(stats.byLevel);
                            const percentage = (item.count / maxValue) * 100;
                            const levelEmoji = {
                                'Beginner': '🌱',
                                'Intermediate': '📚',
                                'Advanced': '🎓',
                                'All Levels': '🌟',
                                'Unknown': '❓'
                            };
                            return (
                                <div key={index} className="bar-item">
                                    <div className="bar-label">
                                        <span className="label-name">
                                            {levelEmoji[item.level_] || '📖'} {item.level_}
                                        </span>
                                        <span className="label-count">{item.count}</span>
                                    </div>
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill level-bar"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <span className="bar-percentage">
                                                {getPercentage(item.count, stats.totalCourses)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* By Language */}
                <div className="chart-card">
                    <h2>🌍 Μαθήματα ανά Γλώσσα</h2>
                    <div className="chart">
                        {stats.byLanguage.slice(0, 10).map((item, index) => {
                            const maxValue = getMaxValue(stats.byLanguage);
                            const percentage = (item.count / maxValue) * 100;
                            return (
                                <div key={index} className="bar-item">
                                    <div className="bar-label">
                                        <span className="label-name">
                                            {item.language_ || 'Unknown'}
                                        </span>
                                        <span className="label-count">{item.count}</span>
                                    </div>
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill language-bar"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <span className="bar-percentage">
                                                {getPercentage(item.count, stats.totalCourses)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.byLanguage.length > 10 && (
                            <p className="more-info">και {stats.byLanguage.length - 10} ακόμη γλώσσες...</p>
                        )}
                    </div>
                </div>

                {/* By Category */}
                <div className="chart-card">
                    <h2>🏷️ Μαθήματα ανά Θεματική</h2>
                    <div className="chart">
                        {stats.byCategory.slice(0, 15).map((item, index) => {
                            const maxValue = getMaxValue(stats.byCategory);
                            const percentage = (item.count / maxValue) * 100;
                            return (
                                <div key={index} className="bar-item">
                                    <div className="bar-label">
                                        <span className="label-name">
                                            {item.category_name}
                                        </span>
                                        <span className="label-count">{item.count}</span>
                                    </div>
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill category-bar"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <span className="bar-percentage">
                                                {getPercentage(item.count, stats.totalCourses)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.byCategory.length > 15 && (
                            <p className="more-info">και {stats.byCategory.length - 15} ακόμη κατηγορίες...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Updates */}
            <div className="recent-section">
                <h2>🕒 Πρόσφατες Ενημερώσεις</h2>
                <div className="recent-list">
                    {stats.recentUpdates.map((course, index) => (
                        <div key={index} className="recent-item">
                            <div className="recent-info">
                                <h4>{course.title}</h4>
                                <p className="recent-meta">
                                    <span className="source-badge">{course.source_name}</span>
                                    <span className="level-badge">{course.level_}</span>
                                    <span className="date">
                                        {new Date(course.last_updated).toLocaleDateString('el-GR')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Refresh Button */}
            <div className="analytics-footer">
                <button className="refresh-btn" onClick={fetchAnalytics}>
                    🔄 Ανανέωση Δεδομένων
                </button>
            </div>
                
            </div>
        </main>

        {/* --- FOOTER --- */}
        <footer className="footer-bar">
          <p>© 2026 Project Spark</p>
        </footer>
    

    </div>
    );
};

export default Analytics;
