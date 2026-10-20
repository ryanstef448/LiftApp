import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function NutritionLibrary({ foods, onRefreshFoods, onLoggedToToday }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    serving_unit: 'serving',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [justLoggedId, setJustLoggedId] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);

    authFetch('/api/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        serving_unit: form.serving_unit || 'serving',
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to save meal to library');
        return res.json();
      })
      .then(() => {
        setIsAdding(false);
        setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', serving_unit: 'serving' });
        onRefreshFoods();
      })
      .catch((err) => {
        setIsAdding(false);
        setError(err.message);
      });
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your library?`)) return;
    authFetch(`/api/foods/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete food');
        onRefreshFoods();
      })
      .catch((err) => alert(err.message));
  };

  const handleQuickLogToToday = (food) => {
    const today = new Date().toISOString().split('T')[0];
    authFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_id: food.id,
        date: today,
        servings: 1,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to log meal');
        return res.json();
      })
      .then(() => {
        setJustLoggedId(food.id);
        setTimeout(() => setJustLoggedId(null), 2500);
        if (onLoggedToToday) onLoggedToToday();
      })
      .catch((err) => alert(err.message));
  };

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="nutrition-library-container">
      {/* Add New Meal Form Card */}
      <article className="library-form-card">
        <header>
          <h3>Add New Known Meal to Library</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            Save your favorite foods and recipes here so you can quickly add them to your daily log at any time.
          </p>
        </header>

        {error && <p className="error-text">Error: {error}</p>}

        <form onSubmit={handleSubmit} className="new-food-form">
          <div className="form-row-2">
            <div>
              <label htmlFor="food-name">Meal / Food Name:</label>
              <input
                id="food-name"
                type="text"
                name="name"
                placeholder="e.g., Grilled Salmon & Rice"
                value={form.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="food-unit">Serving Size / Unit:</label>
              <input
                id="food-unit"
                type="text"
                name="serving_unit"
                placeholder="e.g., 1 bowl, 200g, 1 slice"
                value={form.serving_unit}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="macros-inputs-row">
            <div>
              <label htmlFor="food-calories">Calories (kcal):</label>
              <input
                id="food-calories"
                type="number"
                name="calories"
                placeholder="Calories"
                value={form.calories}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="food-protein">Protein (g):</label>
              <input
                id="food-protein"
                type="number"
                step="0.1"
                name="protein"
                placeholder="Protein"
                value={form.protein}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="food-carbs">Carbs (g):</label>
              <input
                id="food-carbs"
                type="number"
                step="0.1"
                name="carbs"
                placeholder="Carbs"
                value={form.carbs}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="food-fat">Fat (g):</label>
              <input
                id="food-fat"
                type="number"
                step="0.1"
                name="fat"
                placeholder="Fat"
                value={form.fat}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isAdding} style={{ marginTop: '0.5rem' }}>
            {isAdding ? 'Saving to Library...' : '💾 Save Meal to Library'}
          </button>
        </form>
      </article>

      {/* Meals Library List */}
      <section className="library-list-section">
        <div className="library-list-header">
          <h3>Known Meals Library ({foods.length})</h3>
          <input
            type="search"
            placeholder="🔍 Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px', margin: 0 }}
          />
        </div>

        {filteredFoods.length === 0 ? (
          <div className="empty-log-card">
            {searchTerm ? (
              <p>No meals match your search "{searchTerm}".</p>
            ) : (
              <p>Your library is empty. Add your first meal using the form above!</p>
            )}
          </div>
        ) : (
          <div className="meals-grid">
            {filteredFoods.map((food) => (
              <article key={food.id} className="meal-card">
                <header className="meal-card-header">
                  <strong>{food.name}</strong>
                  <span className="meal-unit-tag">{food.serving_unit || '1 serving'}</span>
                </header>

                <div className="meal-macros-badges">
                  <div className="macro-badge macro-cal">
                    <span className="b-val">{food.calories}</span>
                    <span className="b-lbl">kcal</span>
                  </div>
                  <div className="macro-badge macro-p">
                    <span className="b-val">{food.protein}g</span>
                    <span className="b-lbl">Protein</span>
                  </div>
                  <div className="macro-badge macro-c">
                    <span className="b-val">{food.carbs}g</span>
                    <span className="b-lbl">Carbs</span>
                  </div>
                  <div className="macro-badge macro-f">
                    <span className="b-val">{food.fat}g</span>
                    <span className="b-lbl">Fat</span>
                  </div>
                </div>

                <footer className="meal-card-actions">
                  <button
                    type="button"
                    className="btn-quick-log"
                    onClick={() => handleQuickLogToToday(food)}
                  >
                    {justLoggedId === food.id ? '✓ Added to Today!' : '+ Add to Today'}
                  </button>
                  <button
                    type="button"
                    className="btn-delete secondary outline"
                    onClick={() => handleDelete(food.id, food.name)}
                    title="Delete meal"
                  >
                    🗑
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
