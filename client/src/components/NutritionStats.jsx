import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalorieChart, MacroTrendChart } from './MacroChart';

export default function NutritionStats() {
  const { authFetch, user } = useAuth();
  const [daysRange, setDaysRange] = useState(7);
  const [statsData, setStatsData] = useState({
    days: [],
    averages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    totalLoggedDays: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const now = new Date();
    const end = now.toISOString().split('T')[0];
    const startObj = new Date();
    startObj.setDate(now.getDate() - daysRange + 1);
    const start = startObj.toISOString().split('T')[0];

    authFetch(`/api/logs/stats?startDate=${start}&endDate=${end}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch nutrition stats');
        return res.json();
      })
      .then((data) => {
        setStatsData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [daysRange, user, authFetch]);

  return (
    <div className="nutrition-stats-container">
      {/* Timeframe Filter Buttons */}
      <div className="stats-controls-bar">
        <h3>Nutrition Analytics & Trends</h3>
        <div className="range-buttons-group">
          <button
            type="button"
            className={daysRange === 7 ? 'contrast' : 'outline secondary'}
            onClick={() => setDaysRange(7)}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={daysRange === 14 ? 'contrast' : 'outline secondary'}
            onClick={() => setDaysRange(14)}
          >
            Last 14 Days
          </button>
          <button
            type="button"
            className={daysRange === 30 ? 'contrast' : 'outline secondary'}
            onClick={() => setDaysRange(30)}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {loading && <p aria-busy="true">Loading nutrition statistics...</p>}
      {error && <p className="error-text">Error: {error}</p>}

      {/* Period Averages KPI Cards */}
      <div className="macro-cards-grid">
        <div className="macro-card calorie-card">
          <span className="macro-label">Avg Calories / Day</span>
          <span className="macro-value">{statsData.averages.calories}</span>
          <span className="macro-unit">kcal</span>
        </div>
        <div className="macro-card protein-card">
          <span className="macro-label">Avg Protein / Day</span>
          <span className="macro-value">{statsData.averages.protein}g</span>
          <span className="macro-subtext">
            {statsData.averages.calories > 0
              ? `${Math.round(((statsData.averages.protein * 4) / statsData.averages.calories) * 100)}% of cal`
              : '0%'}
          </span>
        </div>
        <div className="macro-card carbs-card">
          <span className="macro-label">Avg Carbs / Day</span>
          <span className="macro-value">{statsData.averages.carbs}g</span>
          <span className="macro-subtext">
            {statsData.averages.calories > 0
              ? `${Math.round(((statsData.averages.carbs * 4) / statsData.averages.calories) * 100)}% of cal`
              : '0%'}
          </span>
        </div>
        <div className="macro-card fat-card">
          <span className="macro-label">Avg Fat / Day</span>
          <span className="macro-value">{statsData.averages.fat}g</span>
          <span className="macro-subtext">
            {statsData.averages.calories > 0
              ? `${Math.round(((statsData.averages.fat * 9) / statsData.averages.calories) * 100)}% of cal`
              : '0%'}
          </span>
        </div>
      </div>

      {statsData.days.length === 0 && !loading && (
        <div className="empty-log-card" style={{ marginTop: '2rem' }}>
          <p>No meals logged within this time period.</p>
          <small>Start logging meals on the Daily Log tab to see charts and analytics appear here!</small>
        </div>
      )}

      {statsData.days.length > 0 && (
        <div className="charts-container-grid">
          {/* Calorie Intake Bar Chart */}
          <article className="chart-card">
            <header>
              <strong>Daily Calorie Intake (Last {daysRange} Days)</strong>
            </header>
            <CalorieChart days={statsData.days} />
          </article>

          {/* Macronutrients Trend Line Chart */}
          <article className="chart-card">
            <header>
              <strong>Macronutrients Trend (Protein, Carbs, Fat)</strong>
            </header>
            <MacroTrendChart days={statsData.days} />
          </article>

          {/* Detailed Daily History Table */}
          <article className="history-table-card">
            <header>
              <strong>Daily History Breakdown ({statsData.totalLoggedDays} logged days)</strong>
            </header>
            <table role="grid">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meals Logged</th>
                  <th>Calories</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Fat</th>
                </tr>
              </thead>
              <tbody>
                {statsData.days.map((d) => (
                  <tr key={d.date}>
                    <td><strong>{d.date}</strong></td>
                    <td>{d.mealCount}</td>
                    <td>{d.totalCalories} kcal</td>
                    <td><span className="badge-protein">{d.totalProtein}g</span></td>
                    <td><span className="badge-carbs">{d.totalCarbs}g</span></td>
                    <td><span className="badge-fat">{d.totalFat}g</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}
    </div>
  );
}
