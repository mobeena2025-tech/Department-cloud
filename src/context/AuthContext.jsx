import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dac_auth_user');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }

    return null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('dac_auth_token') || null
  );

  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load real users from Supabase through our backend
  useEffect(() => {
    api.getDemoUsers()
      .then((res) => {
        if (res?.users) {
          setDemoUsers(res.users);
        }
      })
      .catch((error) => {
        console.error('Failed to load users:', error);
      });
  }, []);

  const login = async (roleOrIdentifier) => {
    setLoading(true);

    try {
      let targetUser = demoUsers.find(
        (u) =>
          u.role === roleOrIdentifier ||
          u.id === roleOrIdentifier ||
          u.email === roleOrIdentifier
      );

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Authenticate through backend
      const response = await api.login({
        userId: targetUser.id
      });

      if (!response?.success || !response?.user) {
        throw new Error('Login failed');
      }

      const user = response.user;
      const generatedToken = response.token;

      setCurrentUser(user);
      setToken(generatedToken);

      localStorage.setItem(
        'dac_auth_user',
        JSON.stringify(user)
      );

      localStorage.setItem(
        'dac_auth_token',
        generatedToken
      );

      return user;

    } catch (error) {
      console.error('Login error:', error);
      throw error;

    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (newRole) => {
    const targetUser = demoUsers.find(
      (u) => u.role === newRole
    );

    if (targetUser) {
      await login(targetUser.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);

    localStorage.removeItem('dac_auth_user');
    localStorage.removeItem('dac_auth_token');
  };

  const isStudent = currentUser?.role === 'student';
  const isFaculty = currentUser?.role === 'faculty';
  const isAdmin = currentUser?.role === 'admin';

  let accessScope = 'Restricted';

  if (isStudent) {
    accessScope = 'Enrolled Courses Only';
  }

  if (isFaculty) {
    accessScope = 'Assigned Courses & Submissions';
  }

  if (isAdmin) {
    accessScope = 'Department-Level Authority';
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        demoUsers,
        loading,
        login,
        switchRole,
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