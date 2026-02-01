import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, BarChart3 as AnalyticsIcon, ArrowRight } from 'lucide-react';
import './SearchPage.css'; // Χρησιμοποιούμε το ίδιο CSS για ομοιομορφία

function HomePage() {
  return (
    <div className="search-page" style={{ paddingTop: '90px' }}>
      
      {/* --- HEADER BAR --- */}
      <header className="header-bar">
        <div className="header-icons">
            <Link to="/" className="icon-link active"><Home className="icon" /></Link>
            <Link to="/search" className="icon-link"><Search className="icon" /></Link>
            <Link to="/analytics" className="icon-link"><AnalyticsIcon className="icon" /></Link>
        </div>
      </header>

      {/* --- ΚΥΡΙΩΣ ΠΕΡΙΕΧΟΜΕΝΟ HOME --- */}
      <main className="main-content" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 style={{ fontSize: '3rem', color: '#3E5B4E', marginBottom: '20px' }}>
          Welcome to Project Spark
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px' }}>
          Discover the best courses to upgrade your skills.
        </p>

        <Link to="/search">
          <button className="search-btn" style={{ margin: '0 auto', padding: '15px 30px', fontSize: '1.2rem' }}>
            Start Searching <ArrowRight size={20} style={{ marginLeft: '10px' }}/>
          </button>
        </Link>
      </main>
    </div>
  );
}

export default HomePage;