import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/users.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUserState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const saveAuth = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUserState(newUser);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUserState(updatedUser);
  }, []);

  // Sync user profile from server on mount and when tab regains focus
  useEffect(() => {
    if (!token) return;

    const refresh = () => {
      usersApi.getProfile()
        .then((freshUser) => updateUser(freshUser))
        .catch(() => {}); // 401 handled by auth:logout event
    };

    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [token, updateUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUserState(null);
  }, []);

  // Listen for 401 auto-logout from apiFetch
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  const isOnboarded = Boolean(
    user?.gender && user?.birthYear && user?.heightCm && user?.weightKg && user?.activityLevel
  );

  return (
    <AuthContext.Provider value={{ token, user, isOnboarded, saveAuth, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
