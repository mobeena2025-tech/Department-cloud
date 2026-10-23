import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getSession, setSession, USER_KEY } from '../services/api';

const AuthContext = createContext(null);

function readSavedUser() {
  if (!getSession()) return null; // no session -> not logged in
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readSavedUser);
  const [loading, setLoading] = useState(false);
  // Shown on the login page, e.g. after a session expires.
  const [authNotice, setAuthNotice] = useState('');

  const clearUser = useCallback(() => {
    setSession(null);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  }, []);

  // Remove keys left over from the old demo login.
  useEffect(() => {
    localStorage.removeItem('dac_auth_token');
  }, []);

  // On load, confirm the saved session is still valid and refresh the profile.
  useEffect(() => {
    if (!getSession()) return;
    api.getProfile()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }
      })
      .catch(() => {
        // A 401 is handled by the 'dac:unauthorized' listener below.
      });
  }, []);

  // The API client fires this when the session can't be renewed.
  useEffect(() => {
    const onUnauthorized = () => {
      setCurrentUser(null);
      setAuthNotice('Your session has expired. Please sign in again.');
    };
    window.addEventListener('dac:unauthorized', onUnauthorized);
    return () => window.removeEventListener('dac:unauthorized', onUnauthorized);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      if (!res?.session || !res?.user) throw new Error('Login failed');
      setSession(res.session);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setCurrentUser(res.user);
      setAuthNotice('');
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearUser();
    setAuthNotice('');
  };

  const isStudent = currentUser?.role === 'student';
  const isFaculty = currentUser?.role === 'faculty';
  const isAdmin = currentUser?.role === 'admin';

  let accessScope = 'Restricted';
  if (isStudent) accessScope = 'Enrolled Courses Only';
  if (isFaculty) accessScope = 'Assigned Courses & Submissions';
  if (isAdmin) accessScope = 'Department-Level Authority';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authNotice,
        login,
        logout,
        isStudent,
        isFaculty,
        isAdmin,
        accessScope,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
