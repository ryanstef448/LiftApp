import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('liftoff_user') || localStorage.getItem('liftapp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('switch'); // 'switch' | 'login' | 'register' | 'goals'

  // Fetch list of all existing profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  }, []);

  // Save current user to localStorage
  const saveUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('liftoff_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('liftoff_user');
      localStorage.removeItem('liftapp_user');
    }
  };

  // Initialize session: either verify stored user or load testing account by default
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await fetchProfiles();

      const stored = localStorage.getItem('liftoff_user') || localStorage.getItem('liftapp_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const res = await fetch('/api/auth/me', {
            headers: { 'x-user-id': String(parsed.id) },
          });
          if (res.ok) {
            const verified = await res.json();
            saveUser(verified);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error validating session:', e);
        }
      }

      // Default to testing account if no stored session
      try {
        const res = await fetch('/api/auth/test-login', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          saveUser(data.user);
        }
      } catch (e) {
        console.error('Error auto-logging into test account:', e);
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchProfiles]);

  // Login as testing account
  const loginAsTest = async () => {
    try {
      const res = await fetch('/api/auth/test-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login as test user');
      saveUser(data.user);
      await fetchProfiles();
      setModalOpen(false);
      return data.user;
    } catch (err) {
      alert(err.message);
      throw err;
    }
  };

  // Login with credentials
  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    saveUser(data.user);
    await fetchProfiles();
    setModalOpen(false);
    return data.user;
  };

  // Register a new profile
  const register = async (profileData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create profile');
    }
    saveUser(data.user);
    await fetchProfiles();
    setModalOpen(false);
    return data.user;
  };

  // Switch to another profile
  const switchUser = async (userId) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': String(userId) },
      });
      if (res.ok) {
        const userData = await res.json();
        saveUser(userData);
        setModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to switch profile:', err);
    }
  };

  // Update profile goals
  const updateGoals = async (goals) => {
    if (!user) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(user.id),
      },
      body: JSON.stringify(goals),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    saveUser(data);
    await fetchProfiles();
    return data;
  };

  const logout = () => {
    saveUser(null);
    loginAsTest();
  };

  // Authenticated fetch helper that injects x-user-id
  const authFetch = (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'x-user-id': user ? String(user.id) : '1',
    };
    return fetch(url, { ...options, headers });
  };

  const openAuthModal = (tab = 'switch') => {
    setModalTab(tab);
    setModalOpen(true);
    fetchProfiles();
  };

  const closeAuthModal = () => {
    setModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        loading,
        modalOpen,
        modalTab,
        setModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        loginAsTest,
        register,
        switchUser,
        updateGoals,
        logout,
        authFetch,
        fetchProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: {
        id: 1,
        username: 'testuser',
        display_name: 'Alex (Testing Account)',
        calorie_goal: 2400,
        protein_goal: 180,
        carbs_goal: 240,
        fat_goal: 75,
        weight_goal: 180,
        is_test_account: 1,
      },
      profiles: [],
      loading: false,
      modalOpen: false,
      modalTab: 'switch',
      setModalTab: () => {},
      openAuthModal: () => {},
      closeAuthModal: () => {},
      login: async () => {},
      loginAsTest: async () => {},
      register: async () => {},
      switchUser: async () => {},
      updateGoals: async () => {},
      logout: () => {},
      authFetch: (url, options = {}) => fetch(url, options),
      fetchProfiles: async () => {},
    };
  }
  return context;
}
