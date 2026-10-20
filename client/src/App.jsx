import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import Nutrition from './pages/Nutrition';
import Lifts from './pages/Lifts';
import Weights from './pages/Weights';
import './App.css';

function NavigationHeader() {
  const { user, openAuthModal, loginAsTest } = useAuth();

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="nav-left">
          <NavLink to="/" className="brand-logo">
            <span className="brand-icon">⚡</span>
            <span className="brand-name">LiftApp</span>
          </NavLink>

          <nav className="main-nav-tabs">
            <NavLink
              to="/nutrition"
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              🥗 Nutrition
            </NavLink>
            <NavLink
              to="/lifts"
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              🏋️ Lifting
            </NavLink>
            <NavLink
              to="/weights"
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              ⚖️ Body Weight
            </NavLink>
          </nav>
        </div>

        <div className="nav-right">
          {user && (
            <div className="profile-pill-trigger" onClick={() => openAuthModal('switch')}>
              <div className="avatar-circle">
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="profile-pill-text">
                <span className="profile-name">{user.display_name || user.username}</span>
                {user.is_test_account === 1 ? (
                  <span className="profile-role-tag test-tag">⚡ Testing Account</span>
                ) : (
                  <span className="profile-role-tag">Active Profile</span>
                )}
              </div>
              <span className="dropdown-arrow">▼</span>
            </div>
          )}

          <div className="nav-actions-group">
            {user?.is_test_account !== 1 && (
              <button
                type="button"
                className="btn-quick-test"
                onClick={loginAsTest}
                title="Switch to Testing Account"
              >
                ⚡ Test Mode
              </button>
            )}
            <button
              type="button"
              className="btn-switch-profile"
              onClick={() => openAuthModal('switch')}
            >
              Profiles
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div className="app-wrapper">
      <NavigationHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/nutrition" replace />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/foods" element={<Navigate to="/nutrition" replace />} />
          <Route path="/lifts" element={<Lifts />} />
          <Route path="/weights" element={<Weights />} />
        </Routes>
      </main>
      <AuthModal />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
