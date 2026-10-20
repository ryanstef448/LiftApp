import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ChartComponent from '../components/ChartComponent';

function Lifts() {
  const { authFetch, user } = useAuth();

  const [lifts, setLifts] = useState([]);
  const [selectedLiftId, setSelectedLiftId] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loadingLifts, setLoadingLifts] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);

  // New lift form
  const [showAddLift, setShowAddLift] = useState(false);
  const [newLiftName, setNewLiftName] = useState('');
  const [isAddingLift, setIsAddingLift] = useState(false);

  // New progress entry form
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    reps: '5',
    sets: '3',
    notes: '',
  });
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Fetch all lifts
  const fetchLifts = useCallback(async (selectIdAfter) => {
    setLoadingLifts(true);
    setError(null);
    try {
      const res = await authFetch('/api/lifts');
      if (!res.ok) throw new Error('Failed to load lift movements');
      const data = await res.json();
      setLifts(data);

      if (data.length > 0) {
        if (selectIdAfter && data.some((l) => l.id === selectIdAfter)) {
          setSelectedLiftId(selectIdAfter);
        } else if (!selectedLiftId || !data.some((l) => l.id === selectedLiftId)) {
          setSelectedLiftId(data[0].id);
        }
      } else {
        setSelectedLiftId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLifts(false);
    }
  }, [authFetch, selectedLiftId]);

  // Fetch progress for selected lift
  const fetchProgress = useCallback(async (liftId) => {
    if (!liftId) {
      setProgress([]);
      return;
    }
    setLoadingProgress(true);
    try {
      const res = await authFetch(`/api/lifts/${liftId}/progress`);
      if (!res.ok) throw new Error('Failed to load progress for this lift');
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchLifts();
  }, [user]);

  useEffect(() => {
    if (selectedLiftId) {
      fetchProgress(selectedLiftId);
    }
  }, [selectedLiftId, fetchProgress]);

  // Handle adding new movement
  const handleAddLift = async (e) => {
    e.preventDefault();
    if (!newLiftName.trim()) return;
    setIsAddingLift(true);
    try {
      const res = await authFetch('/api/lifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLiftName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lift');
      setNewLiftName('');
      setShowAddLift(false);
      await fetchLifts(data.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAddingLift(false);
    }
  };

  // Handle logging a new workout set
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedLiftId || !entryForm.weight) return;
    setIsAddingEntry(true);
    try {
      const res = await authFetch(`/api/lifts/${selectedLiftId}/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save workout entry');
      }
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        reps: '5',
        sets: '3',
        notes: '',
      });
      await fetchProgress(selectedLiftId);
      await fetchLifts(selectedLiftId);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAddingEntry(false);
    }
  };

  // Delete a progress entry
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this workout entry?')) return;
    try {
      const res = await authFetch(`/api/lifts/${selectedLiftId}/entry/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProgress(selectedLiftId);
        fetchLifts(selectedLiftId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedLift = lifts.find((l) => l.id === selectedLiftId);

  // Chart configuration
  const chartData = {
    labels: progress.map((p) => new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: `${selectedLift ? selectedLift.name : 'Lift'} Weight (lbs)`,
        data: progress.map((p) => p.weight),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.25,
        pointBackgroundColor: '#0284c7',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
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
          label: (context) => {
            const entry = progress[context.dataIndex];
            const repsSets = entry ? ` (${entry.sets}×${entry.reps} reps)` : '';
            return ` ${context.parsed.y} lbs${repsSets}`;
          },
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

  // Stats calculations
  const totalSetsLogged = lifts.reduce((acc, l) => acc + (l.totalEntries || 0), 0);
  const highestPR = lifts.reduce((max, l) => Math.max(max, l.pr || 0), 0);

  return (
    <div className="lifts-dashboard">
      <header className="page-header">
        <div>
          <h1>Lifting Movements Tracking</h1>
          <p className="subtitle">
            Log your workouts, track progressive overload, and set new personal records.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAddLift(!showAddLift)}
        >
          {showAddLift ? '✕ Cancel' : '➕ Add Movement'}
        </button>
      </header>

      {/* Stats Summary Bar */}
      <div className="macro-cards-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="macro-card">
          <span className="macro-label">Total Movements</span>
          <span className="macro-value">{lifts.length}</span>
          <span className="macro-unit">exercises</span>
        </div>
        <div className="macro-card calorie-card">
          <span className="macro-label">Highest PR</span>
          <span className="macro-value">{highestPR > 0 ? `${highestPR}` : '—'}</span>
          <span className="macro-unit">{highestPR > 0 ? 'lbs' : 'no data'}</span>
        </div>
        <div className="macro-card carbs-card">
          <span className="macro-label">Workout Entries</span>
          <span className="macro-value">{totalSetsLogged}</span>
          <span className="macro-unit">logged sessions</span>
        </div>
      </div>

      {/* Add New Movement Form */}
      {showAddLift && (
        <article className="card-box" style={{ marginBottom: '1.5rem' }}>
          <h4>➕ Add New Lifting Movement</h4>
          <form onSubmit={handleAddLift} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label htmlFor="new-lift-input">Movement Name:</label>
              <input
                id="new-lift-input"
                type="text"
                placeholder="e.g. Incline Dumbbell Press, Romanian Deadlift..."
                required
                value={newLiftName}
                onChange={(e) => setNewLiftName(e.target.value)}
                style={{ margin: 0 }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isAddingLift} style={{ margin: 0 }}>
              {isAddingLift ? 'Saving...' : 'Add Exercise'}
            </button>
          </form>
        </article>
      )}

      {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Movement Selector Tabs */}
      <div className="movement-tabs-container">
        <span className="movement-tabs-label">Select Exercise:</span>
        <div className="movement-pills-row">
          {lifts.map((lift) => {
            const isSelected = lift.id === selectedLiftId;
            return (
              <button
                key={lift.id}
                type="button"
                className={`movement-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedLiftId(lift.id)}
              >
                <span className="pill-name">{lift.name}</span>
                {lift.pr > 0 && <span className="pill-pr">PR: {lift.pr} lbs</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Lift Content */}
      {selectedLift ? (
        <div className="lift-detail-container">
          <div className="lift-detail-header-card">
            <div className="lift-header-left">
              <h2>{selectedLift.name}</h2>
              <div className="lift-header-meta">
                {selectedLift.pr > 0 ? (
                  <span className="badge-pr">🏆 Personal Record: {selectedLift.pr} lbs</span>
                ) : (
                  <span className="badge-new">No sets logged yet</span>
                )}
                {selectedLift.lastWeight && (
                  <span className="badge-last">
                    Last session: {selectedLift.lastWeight} lbs ({selectedLift.lastSets}×{selectedLift.lastReps})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="lift-two-columns">
            {/* Log Workout Form */}
            <article className="card-box">
              <h3>⚡ Log Workout Set</h3>
              <form onSubmit={handleAddEntry}>
                <div className="form-grid-2">
                  <div>
                    <label htmlFor="lift-date">Date</label>
                    <input
                      id="lift-date"
                      type="date"
                      required
                      value={entryForm.date}
                      onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lift-weight">Weight (lbs) *</label>
                    <input
                      id="lift-weight"
                      type="number"
                      step="0.5"
                      placeholder="e.g. 185"
                      required
                      value={entryForm.weight}
                      onChange={(e) => setEntryForm({ ...entryForm, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div>
                    <label htmlFor="lift-reps">Reps per set</label>
                    <input
                      id="lift-reps"
                      type="number"
                      placeholder="e.g. 5"
                      value={entryForm.reps}
                      onChange={(e) => setEntryForm({ ...entryForm, reps: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lift-sets">Sets</label>
                    <input
                      id="lift-sets"
                      type="number"
                      placeholder="e.g. 3"
                      value={entryForm.sets}
                      onChange={(e) => setEntryForm({ ...entryForm, sets: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lift-notes">Notes / Cues</label>
                  <input
                    id="lift-notes"
                    type="text"
                    placeholder="e.g. Felt light, paused on chest, RPE 8"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isAddingEntry}>
                  {isAddingEntry ? 'Logging...' : 'Save Workout Entry'}
                </button>
              </form>
            </article>

            {/* Progression Chart */}
            <article className="card-box">
              <h3>📈 Weight Progression Over Time</h3>
              {progress.length > 0 ? (
                <div style={{ height: '280px' }}>
                  <ChartComponent data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="empty-chart-box">
                  <p>No workout entries yet for {selectedLift.name}.</p>
                  <span>Log your first set using the form on the left to generate the strength curve!</span>
                </div>
              )}
            </article>
          </div>

          {/* History Log Table */}
          <article className="card-box" style={{ marginTop: '1.5rem' }}>
            <h3>📜 Workout History ({progress.length} sessions)</h3>
            {progress.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Reps</th>
                      <th>Sets</th>
                      <th>Total Volume</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...progress].reverse().map((entry) => (
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
                        <td>{entry.reps}</td>
                        <td>{entry.sets}</td>
                        <td>
                          <span className="text-muted">
                            {Number(entry.weight) * Number(entry.reps || 1) * Number(entry.sets || 1)} lbs
                          </span>
                        </td>
                        <td>{entry.notes || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="hint-text">No recorded history for this exercise.</p>
            )}
          </article>
        </div>
      ) : (
        <div className="empty-log-card">
          <p>No lifting movements found.</p>
          <span>Click "Add Movement" above to create your first exercise!</span>
        </div>
      )}
    </div>
  );
}

export default Lifts;
