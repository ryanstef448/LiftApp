import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function NutritionDailyLog({ foodsLibrary, onLogAdded }) {
  const { authFetch, user } = useAuth();
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [logData, setLogData] = useState({ entries: [], totals: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick Add State
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [servings, setServings] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Entry Toggle & State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servings: 1,
  });

  const fetchDailyLogs = useCallback((date) => {
    setLoading(true);
    setError(null);
    authFetch(`/api/logs?date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load daily log');
        return res.json();
      })
      .then((data) => {
        setLogData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [authFetch]);

  useEffect(() => {
    fetchDailyLogs(selectedDate);
  }, [selectedDate, fetchDailyLogs]);

  // Handle Quick Add from known meals
  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!selectedFoodId) return;

    setIsSubmitting(true);
    authFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_id: parseInt(selectedFoodId, 10),
        date: selectedDate,
        servings: Number(servings) || 1,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to log meal');
        return res.json();
      })
      .then(() => {
        setIsSubmitting(false);
        setServings(1);
        fetchDailyLogs(selectedDate);
        if (onLogAdded) onLogAdded();
      })
      .catch((err) => {
        setIsSubmitting(false);
        alert(err.message);
      });
  };

  // Handle Custom Entry Add
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    authFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customForm.name,
        calories: Number(customForm.calories),
        protein: Number(customForm.protein),
        carbs: Number(customForm.carbs),
        fat: Number(customForm.fat),
        servings: Number(customForm.servings) || 1,
        date: selectedDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to log custom meal');
        return res.json();
      })
      .then(() => {
        setIsSubmitting(false);
        setCustomForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servings: 1 });
        setShowCustomForm(false);
        fetchDailyLogs(selectedDate);
        if (onLogAdded) onLogAdded();
      })
      .catch((err) => {
        setIsSubmitting(false);
        alert(err.message);
      });
  };

  // Handle Delete Entry
  const handleDeleteEntry = (id) => {
    if (!window.confirm('Delete this meal from today’s log?')) return;
    authFetch(`/api/logs/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete log entry');
        fetchDailyLogs(selectedDate);
        if (onLogAdded) onLogAdded();
      })
      .catch((err) => alert(err.message));
  };

  // Date Navigators
  const changeDateBy = (days) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const formattedDateString = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Selected food info for quick preview
  const selectedFoodObj = foodsLibrary.find((f) => f.id === parseInt(selectedFoodId, 10));

  return (
    <div className="daily-log-container">
      {/* Date Navigation Bar */}
      <div className="date-nav-bar">
        <button type="button" className="outline secondary" onClick={() => changeDateBy(-1)}>
          ← Yesterday
        </button>
        <div className="date-picker-wrapper">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ margin: 0, fontWeight: 'bold' }}
          />
          <div className="date-display-label">{formattedDateString()}</div>
        </div>
        <button type="button" className="outline secondary" onClick={() => changeDateBy(1)}>
          Tomorrow →
        </button>
        {selectedDate !== getTodayString() && (
          <button type="button" className="contrast" onClick={() => setSelectedDate(getTodayString())}>
            Today
          </button>
        )}
      </div>

      {/* Daily Macro Summary Cards */}
      <div className="macro-cards-grid">
        <div className="macro-card calorie-card">
          <span className="macro-label">Total Calories</span>
          <span className="macro-value">{logData.totals.totalCalories}</span>
          <span className="macro-unit">kcal</span>
        </div>
        <div className="macro-card protein-card">
          <span className="macro-label">Protein</span>
          <span className="macro-value">{logData.totals.totalProtein}g</span>
          <span className="macro-subtext">
            {logData.totals.totalCalories > 0
              ? `${Math.round(((logData.totals.totalProtein * 4) / logData.totals.totalCalories) * 100)}% cal`
              : '0% cal'}
          </span>
        </div>
        <div className="macro-card carbs-card">
          <span className="macro-label">Carbs</span>
          <span className="macro-value">{logData.totals.totalCarbs}g</span>
          <span className="macro-subtext">
            {logData.totals.totalCalories > 0
              ? `${Math.round(((logData.totals.totalCarbs * 4) / logData.totals.totalCalories) * 100)}% cal`
              : '0% cal'}
          </span>
        </div>
        <div className="macro-card fat-card">
          <span className="macro-label">Fats</span>
          <span className="macro-value">{logData.totals.totalFat}g</span>
          <span className="macro-subtext">
            {logData.totals.totalCalories > 0
              ? `${Math.round(((logData.totals.totalFat * 9) / logData.totals.totalCalories) * 100)}% cal`
              : '0% cal'}
          </span>
        </div>
      </div>

      {/* Quick Add Known Meal Section */}
      <article className="quick-add-box">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>⚡ Quick Add Known Meal</strong>
          <button
            type="button"
            className="secondary outline btn-sm"
            onClick={() => setShowCustomForm(!showCustomForm)}
          >
            {showCustomForm ? 'Cancel Custom Entry' : '+ Log One-Off Custom Meal'}
          </button>
        </header>

        {!showCustomForm ? (
          <form onSubmit={handleQuickAdd} className="quick-add-form">
            <div className="quick-add-controls">
              <div style={{ flex: 3 }}>
                <label htmlFor="known-meal-select" style={{ fontSize: '0.85rem' }}>Select Saved Meal:</label>
                <select
                  id="known-meal-select"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  required
                >
                  <option value="">-- Choose from your Meal Library --</option>
                  {foodsLibrary.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.calories} kcal | {f.protein}g P | {f.carbs}g C | {f.fat}g F / {f.serving_unit || 'serv'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="servings-input" style={{ fontSize: '0.85rem' }}>Servings:</label>
                <input
                  id="servings-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                />
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button type="submit" disabled={isSubmitting || !selectedFoodId} style={{ marginBottom: 0 }}>
                  {isSubmitting ? 'Adding...' : '+ Add to Day'}
                </button>
              </div>
            </div>

            {selectedFoodObj && (
              <div className="quick-preview-badge">
                Selected: <strong>{selectedFoodObj.name}</strong> × {servings} serving(s) ={' '}
                {(selectedFoodObj.calories * servings).toFixed(0)} kcal |{' '}
                {(selectedFoodObj.protein * servings).toFixed(1)}g P |{' '}
                {(selectedFoodObj.carbs * servings).toFixed(1)}g C |{' '}
                {(selectedFoodObj.fat * servings).toFixed(1)}g F
              </div>
            )}
          </form>
        ) : (
          /* Custom one-off meal form */
          <form onSubmit={handleCustomSubmit} className="custom-entry-form">
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1rem 0' }}>
              Log a quick one-off meal directly to this date without saving to library:
            </p>
            <div className="custom-form-grid">
              <input
                type="text"
                placeholder="Meal Name (e.g., Protein Shake)"
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Calories (kcal)"
                value={customForm.calories}
                onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Protein (g)"
                value={customForm.protein}
                onChange={(e) => setCustomForm({ ...customForm, protein: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Carbs (g)"
                value={customForm.carbs}
                onChange={(e) => setCustomForm({ ...customForm, carbs: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Fat (g)"
                value={customForm.fat}
                onChange={(e) => setCustomForm({ ...customForm, fat: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Servings"
                value={customForm.servings}
                onChange={(e) => setCustomForm({ ...customForm, servings: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Custom Meal to Day'}
            </button>
          </form>
        )}
      </article>

      {/* Chronological List of Logged Meals */}
      <section className="logged-meals-section">
        <h3>Meals Eaten on {formattedDateString()}</h3>

        {loading && <p aria-busy="true">Loading meals...</p>}
        {error && <p className="error-text">Error: {error}</p>}

        {!loading && logData.entries.length === 0 && (
          <div className="empty-log-card">
            <p>No meals recorded for this date yet.</p>
            <small>Use the quick add bar above or pick a meal from your library.</small>
          </div>
        )}

        {logData.entries.length > 0 && (
          <div className="log-entries-list">
            <table role="grid">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Meal / Food</th>
                  <th>Servings</th>
                  <th>Calories</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Fat</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logData.entries.map((entry, idx) => (
                  <tr key={entry.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{entry.name}</strong></td>
                    <td>{entry.servings}</td>
                    <td>{entry.calories} kcal</td>
                    <td><span className="badge-protein">{entry.protein}g</span></td>
                    <td><span className="badge-carbs">{entry.carbs}g</span></td>
                    <td><span className="badge-fat">{entry.fat}g</span></td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn btn-sm secondary outline"
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Remove meal"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                  <td colSpan={3}>Daily Total:</td>
                  <td>{logData.totals.totalCalories} kcal</td>
                  <td><span className="badge-protein">{logData.totals.totalProtein}g</span></td>
                  <td><span className="badge-carbs">{logData.totals.totalCarbs}g</span></td>
                  <td><span className="badge-fat">{logData.totals.totalFat}g</span></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
