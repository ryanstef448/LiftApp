import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const {
    user,
    profiles,
    modalOpen,
    modalTab,
    setModalTab,
    closeAuthModal,
    switchUser,
    loginAsTest,
    login,
    register,
    updateGoals,
  } = useAuth();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    display_name: '',
    calorie_goal: 2200,
    protein_goal: 160,
    carbs_goal: 220,
    fat_goal: 70,
    weight_goal: 175,
  });
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Goals edit form state
  const [goalsData, setGoalsData] = useState({
    display_name: '',
    calorie_goal: 2400,
    protein_goal: 180,
    carbs_goal: 240,
    fat_goal: 75,
    weight_goal: 180,
  });
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  useEffect(() => {
    if (user) {
      setGoalsData({
        display_name: user.display_name || '',
        calorie_goal: user.calorie_goal || 2200,
        protein_goal: user.protein_goal || 160,
        carbs_goal: user.carbs_goal || 220,
        fat_goal: user.fat_goal || 70,
        weight_goal: user.weight_goal || 175,
      });
    }
  }, [user]);

  if (!modalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginUsername, loginPassword);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setIsRegistering(true);
    try {
      await register(regData);
      setRegData({
        username: '',
        password: '',
        display_name: '',
        calorie_goal: 2200,
        protein_goal: 160,
        carbs_goal: 220,
        fat_goal: 70,
        weight_goal: 175,
      });
    } catch (err) {
      setRegError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoalsSubmit = async (e) => {
    e.preventDefault();
    setIsSavingGoals(true);
    try {
      await updateGoals(goalsData);
      setGoalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingGoals(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {modalTab === 'switch' && '👤 Switch Profile'}
            {modalTab === 'register' && '✨ Create New Profile'}
            {modalTab === 'login' && '🔑 Log In to Profile'}
            {modalTab === 'goals' && '🎯 Fitness & Macro Goals'}
          </h3>
          <button type="button" className="close-btn" onClick={closeAuthModal}>
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`m-tab-btn ${modalTab === 'switch' ? 'active' : ''}`}
            onClick={() => setModalTab('switch')}
          >
            Profiles
          </button>
          <button
            type="button"
            className={`m-tab-btn ${modalTab === 'register' ? 'active' : ''}`}
            onClick={() => setModalTab('register')}
          >
            + Create Account
          </button>
          <button
            type="button"
            className={`m-tab-btn ${modalTab === 'login' ? 'active' : ''}`}
            onClick={() => setModalTab('login')}
          >
            Log In
          </button>
          {user && (
            <button
              type="button"
              className={`m-tab-btn ${modalTab === 'goals' ? 'active' : ''}`}
              onClick={() => setModalTab('goals')}
            >
              My Goals
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* TAB 1: SWITCH PROFILE */}
          {modalTab === 'switch' && (
            <div>
              <p className="hint-text">
                Select a profile to instantly switch your active logs, workouts, and macro data:
              </p>

              <div className="profile-list">
                {profiles.map((p) => {
                  const isActive = user && user.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`profile-card ${isActive ? 'active-profile' : ''}`}
                      onClick={() => switchUser(p.id)}
                    >
                      <div className="profile-avatar">
                        {p.display_name ? p.display_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="profile-info">
                        <strong>{p.display_name}</strong>
                        <span className="profile-username">@{p.username}</span>
                      </div>
                      {p.is_test_account === 1 && (
                        <span className="badge-test">⚡ Testing Account</span>
                      )}
                      {isActive && <span className="badge-active">Active</span>}
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions-box">
                <button
                  type="button"
                  className="btn-test-action"
                  onClick={loginAsTest}
                >
                  ⚡ Instant Testing Account
                </button>
                <button
                  type="button"
                  className="btn-create-action"
                  onClick={() => setModalTab('register')}
                >
                  + Create New Profile
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE ACCOUNT */}
          {modalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              {regError && <div className="auth-error">{regError}</div>}

              <div className="form-grid-2">
                <div>
                  <label htmlFor="reg-username">Username *</label>
                  <input
                    id="reg-username"
                    type="text"
                    required
                    placeholder="e.g. lift_legend"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-password">Password *</label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    placeholder="Choose a password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-display-name">Display Name</label>
                <input
                  id="reg-display-name"
                  type="text"
                  placeholder="e.g. Jordan Smith"
                  value={regData.display_name}
                  onChange={(e) => setRegData({ ...regData, display_name: e.target.value })}
                />
              </div>

              <hr style={{ margin: '1rem 0' }} />
              <h5 style={{ marginBottom: '0.5rem' }}>Personal Fitness Targets</h5>

              <div className="form-grid-3">
                <div>
                  <label htmlFor="reg-calories">Daily Calories (kcal)</label>
                  <input
                    id="reg-calories"
                    type="number"
                    value={regData.calorie_goal}
                    onChange={(e) => setRegData({ ...regData, calorie_goal: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-protein">Daily Protein (g)</label>
                  <input
                    id="reg-protein"
                    type="number"
                    value={regData.protein_goal}
                    onChange={(e) => setRegData({ ...regData, protein_goal: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-weight">Target Weight (lbs)</label>
                  <input
                    id="reg-weight"
                    type="number"
                    step="0.5"
                    value={regData.weight_goal}
                    onChange={(e) => setRegData({ ...regData, weight_goal: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isRegistering}>
                {isRegistering ? 'Creating Profile...' : 'Create Account & Start Tracking'}
              </button>
            </form>
          )}

          {/* TAB 3: LOG IN */}
          {modalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              {loginError && <div className="auth-error">{loginError}</div>}

              <div>
                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="Enter username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in...' : 'Sign In'}
              </button>

              <div className="login-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                className="btn-test-action"
                onClick={loginAsTest}
              >
                ⚡ 1-Click Login as Testing Account
              </button>
            </form>
          )}

          {/* TAB 4: EDIT GOALS */}
          {modalTab === 'goals' && user && (
            <form onSubmit={handleGoalsSubmit} className="auth-form">
              {goalsSaved && <div className="auth-success">Goals updated successfully!</div>}

              <div>
                <label htmlFor="goal-name">Display Name</label>
                <input
                  id="goal-name"
                  type="text"
                  value={goalsData.display_name}
                  onChange={(e) => setGoalsData({ ...goalsData, display_name: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label htmlFor="goal-calories">Daily Calorie Target (kcal)</label>
                  <input
                    id="goal-calories"
                    type="number"
                    value={goalsData.calorie_goal}
                    onChange={(e) => setGoalsData({ ...goalsData, calorie_goal: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="goal-protein">Daily Protein Target (g)</label>
                  <input
                    id="goal-protein"
                    type="number"
                    value={goalsData.protein_goal}
                    onChange={(e) => setGoalsData({ ...goalsData, protein_goal: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div>
                  <label htmlFor="goal-carbs">Carbs Target (g)</label>
                  <input
                    id="goal-carbs"
                    type="number"
                    value={goalsData.carbs_goal}
                    onChange={(e) => setGoalsData({ ...goalsData, carbs_goal: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="goal-fat">Fats Target (g)</label>
                  <input
                    id="goal-fat"
                    type="number"
                    value={goalsData.fat_goal}
                    onChange={(e) => setGoalsData({ ...goalsData, fat_goal: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="goal-weight">Target Body Weight (lbs)</label>
                  <input
                    id="goal-weight"
                    type="number"
                    step="0.5"
                    value={goalsData.weight_goal}
                    onChange={(e) => setGoalsData({ ...goalsData, weight_goal: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isSavingGoals}>
                {isSavingGoals ? 'Saving Changes...' : 'Save Goals'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
