import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Foods from './pages/Foods';
import Lifts from './pages/Lifts';
import Weights from './pages/Weights';
import './App.css'; // Keep existing CSS

function App() {
  return (
    <Router>
      <header className="container">
        <nav>
          <ul>
            <li>
              <strong>LiftApp</strong>
            </li>
          </ul>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/foods">Foods</Link>
            </li>
            <li>
              <Link to="/lifts">Lifts</Link>
            </li>
            <li>
              <Link to="/weights">Weights</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<h2>Welcome to LiftApp!</h2>} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/lifts" element={<Lifts />} />
          <Route path="/weights" element={<Weights />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
