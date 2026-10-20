import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ChartComponent from '../components/ChartComponent';

function Weights() {
  const { authFetch, user } = useAuth();

  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWeights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/weights');
      if (!res.ok) throw new Error('Failed to fetch weight logs');
      const data = await res.json();
      setWeights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchWeights();
  }, [user, fetchWeights]);

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!entryForm.weight) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save weight');
      }
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        notes: '',
      });
      await fetchWeights();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWeight = async (id) => {
    if (!confirm('Are you sure you want to delete this weight log?')) return;
    try {
      const res = await authFetch(`/api/weights/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWeights();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Stats calculation
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const startingWeight = weights.length > 0 ? weights[0].weight : null;
  const weightChange = currentWeight !== null && startingWeight !== null ? (currentWeight - startingWeight).toFixed(1) : 0;
  const goalWeight = user?.weight_goal || 180;
  const distanceToGoal = currentWeight !== null ? (currentWeight - goalWeight).toFixed(1) : null;

  // Chart setup
  const chartData = {
    labels: weights.map((w) =>
      new Date(w.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Actual Body Weight (lbs)',
        data: weights.map((w) => w.weight),
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        tension: 0.2,
        pointBackgroundColor: '#10b981',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      ...(weights.length > 0
        ? [
            {
              label: `Target Goal (${goalWeight} lbs)`,
              data: weights.map(() => goalWeight),
              borderColor: '#f59e0b',
              borderDash: [6, 6],
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y} lbs`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'Weight (lbs)' },
        grid: { color: '#e2e8f0' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="weights-dashboard">
      <header className="page-header">
        <div>
          <h1>Body Weight Tracking</h1>
          <p className="subtitle">
            Monitor daily weight trends, track progress toward your goal, and visualize body composition changes.
          </p>
        </div>
      </header>

      {/* Stats Summary Cards */}
      <div className="macro-cards-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="macro-card calorie-card">
          <span className="macro-label">Current Weight</span>
          <span className="macro-value">{currentWeight !== null ? `${currentWeight}` : '—'}</span>
          <span className="macro-unit">lbs</span>
        </div>
        <div className="macro-card">
          <span className="macro-label">Starting Weight</span>
          <span className="macro-value">{startingWeight !== null ? `${startingWeight}` : '—'}</span>
          <span className="macro-unit">lbs</span>
        </div>
        <div className="macro-card carbs-card">
          <span className="macro-label">Net Change</span>
          <span className="macro-value" style={{ color: Number(weightChange) <= 0 ? '#10b981' : '#f59e0b' }}>
            {Number(weightChange) > 0 ? `+${weightChange}` : `${weightChange}`}
          </span>
          <span className="macro-unit">lbs total</span>
        </div>
        <div className="macro-card protein-card">
          <span className="macro-label">Target Goal</span>
          <span className="macro-value">{goalWeight}</span>
          <span className="macro-unit">
            {distanceToGoal !== null
              ? `${Math.abs(distanceToGoal)} lbs ${Number(distanceToGoal) > 0 ? 'to lose' : 'to gain'}`
              : 'target lbs'}
          </span>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="lift-two-columns">
        {/* Log Weight Form */}
        <article className="card-box">
          <h3>⚡ Log Today's Weight</h3>
          <form onSubmit={handleAddWeight}>
            <div className="form-grid-2">
              <div>
                <label htmlFor="weight-date">Date</label>
                <input
                  id="weight-date"
                  type="date"
                  required
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="weight-val">Weight (lbs) *</label>
                <input
                  id="weight-val"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 182.5"
                  required
                  value={entryForm.weight}
                  onChange={(e) => setEntryForm({ ...entryForm, weight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="weight-notes">Notes / Observations</label>
              <input
                id="weight-notes"
                type="text"
                placeholder="e.g. Morning fasted, post hydration, feeling great"
                value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving Weight...' : 'Save Weight Log'}
            </button>
          </form>
        </article>

        {/* Weight Progress Chart */}
        <article className="card-box">
          <h3>📈 Weight Trend Over Time</h3>
          {weights.length > 0 ? (
            <div style={{ height: '270px' }}>
              <ChartComponent data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="empty-chart-box">
              <p>No weight logs recorded yet.</p>
              <span>Log your first morning weight using the form to generate the progress trendline!</span>
            </div>
          )}
        </article>
      </div>

      {/* Weight History Table */}
      <article className="card-box" style={{ marginTop: '1.5rem' }}>
        <h3>📜 Weight History ({weights.length} entries)</h3>
        {weights.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Difference from Prior</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...weights].reverse().map((entry, idx, arr) => {
                  const prior = arr[idx + 1];
                  const diff = prior ? (entry.weight - prior.weight).toFixed(1) : null;
                  return (
                    <tr key={entry.id}>
                      <td>
                        <strong>
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                      </td>
                      <td>
                        <span className="badge-weight">{entry.weight} lbs</span>
                      </td>
                      <td>
                        {diff !== null ? (
                          <span style={{ color: Number(diff) < 0 ? '#10b981' : Number(diff) > 0 ? '#ef4444' : '#64748b' }}>
                            {Number(diff) > 0 ? `+${diff}` : `${diff}`} lbs
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{entry.notes || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeleteWeight(entry.id)}
                          title="Delete record"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint-text">No recorded weights yet.</p>
        )}
      </article>
    </div>
  );
}

export default Weights;
