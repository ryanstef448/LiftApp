import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import NutritionDailyLog from '../components/NutritionDailyLog';
import NutritionLibrary from '../components/NutritionLibrary';
import NutritionStats from '../components/NutritionStats';

export default function Nutrition() {
  const { authFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'library' | 'stats'
  const [foodsLibrary, setFoodsLibrary] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const fetchFoods = useCallback(() => {
    setLoadingFoods(true);
    authFetch('/api/foods')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch foods library');
        return res.json();
      })
      .then((data) => {
        setFoodsLibrary(data);
        setLoadingFoods(false);
      })
      .catch((err) => {
        console.error('Error loading foods:', err);
        setLoadingFoods(false);
      });
  }, [authFetch]);

  useEffect(() => {
    fetchFoods();
  }, [user, fetchFoods]);

  const handleLoggedToToday = () => {
    setLogRefreshKey((k) => k + 1);
  };

  return (
    <div className="nutrition-hub">
      <header className="nutrition-hub-header">
        <h1>Nutrition Tracker</h1>
        <p className="subtitle">
          Track meals, log macronutrients, manage your meal library, and visualize progress over time.
        </p>

        {/* Sub-Navigation Tabs */}
        <nav className="nutrition-tabs-nav">
          <ul>
            <li>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'daily' ? 'tab-btn-active' : 'secondary outline'}`}
                onClick={() => setActiveTab('daily')}
              >
                🥗 Daily Food Log
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'library' ? 'tab-btn-active' : 'secondary outline'}`}
                onClick={() => setActiveTab('library')}
              >
                📖 Known Meals Library ({foodsLibrary.length})
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'stats' ? 'tab-btn-active' : 'secondary outline'}`}
                onClick={() => setActiveTab('stats')}
              >
                📊 Stats & Visualizations
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="nutrition-tab-content">
        {activeTab === 'daily' && (
          <NutritionDailyLog
            key={logRefreshKey}
            foodsLibrary={foodsLibrary}
            onLogAdded={fetchFoods}
          />
        )}

        {activeTab === 'library' && (
          <NutritionLibrary
            foods={foodsLibrary}
            onRefreshFoods={fetchFoods}
            onLoggedToToday={handleLoggedToToday}
          />
        )}

        {activeTab === 'stats' && <NutritionStats />}
      </main>
    </div>
  );
}
