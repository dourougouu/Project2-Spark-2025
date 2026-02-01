import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Home, Search,  BarChart3 as AnalyticsIcon } from 'lucide-react';
import HomePage from './HomePage';       
import SearchPage from './SearchPage';   
import CourseDetails from './CourseDetails';
import Analytics from './Analytics';     
import './App.css';



function Header() {
  return (
    <header className="header-bar">
      <div className="header-icons">
        <Link to="/" className="icon-link">
          <Home className="icon" />
        </Link>
        <Link to="/search" className="icon-link">
          <Search className="icon" />
        </Link>
        <Link to="/analytics" className="icon-link">
          <AnalyticsIcon className="icon" />
        </Link>
      </div>
    </header>
  );
}


// ==================== Footer Component ====================
function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2026 Project Spark</p>
    </footer>
  );
}

// ==================== App Component ====================
function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
      <Footer />
    </div>

  );
}

export default App;
