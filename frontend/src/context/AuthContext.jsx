/**
 * Auth Context Provider
 * Manages authentication state globally
 */

import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Load user data from API
   */
  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await api.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
      // If token is invalid, clear it
      if (err.isAuthError) {
        api.logout();
        setUser(null);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.register(userData);
      
      // After registration, log in automatically
      await login({
        email: userData.email,
        password: userData.password,
      });
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.login(credentials);
      
      // Load user data after successful login
      await loadUser();
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    api.logout();
    setUser(null);
    setError(null);
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}