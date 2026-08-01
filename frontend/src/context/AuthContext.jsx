import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  signInWithFirebaseEmail,
  registerWithFirebaseEmail,
  signOutFirebase,
  isFirebaseConfigured
} from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sph_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchApi('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to load user profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  /**
   * Firebase Email & Password Login
   */
  const login = async (email, password, role) => {
    // 1. Try Firebase Auth SDK
    try {
      const fbResult = await signInWithFirebaseEmail(email, password);
      if (fbResult && fbResult.user) {
        setFirebaseUser(fbResult.user);
      }
    } catch (fbErr) {
      console.warn('Firebase auth attempt notice:', fbErr.message);
      if (fbErr.code === 'auth/operation-not-allowed') {
        throw fbErr;
      }
    }

    // 2. Authenticate with backend API
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Direct Backend Login (Bypasses Firebase provider check if un-toggled)
   */
  const loginDirectBackend = async (email, password, role) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Firebase User Registration
   */
  const register = async (formData) => {
    try {
      const fbResult = await registerWithFirebaseEmail(formData.email, formData.password);
      if (fbResult && fbResult.user) {
        setFirebaseUser(fbResult.user);
      }
    } catch (fbErr) {
      console.warn('Firebase registration notice:', fbErr.message);
    }

    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Quick Login for Demo / Direct Role Access
   */
  const quickLogin = async (role, email = null) => {
    const data = await fetchApi('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role, email })
    });
    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Logout from both Firebase Auth & App Session
   */
  const logout = async () => {
    await signOutFirebase();
    localStorage.removeItem('sph_token');
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const effectiveRole = isAdmin ? 'owner' : (user?.role || 'student');

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isFirebaseConfigured,
        token,
        role: effectiveRole,
        isAdmin,
        loading,
        login,
        loginDirectBackend,
        register,
        quickLogin,
        logout,
        refreshUser: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
