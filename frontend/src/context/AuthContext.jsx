import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

  const login = async (email, password, role) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    localStorage.setItem('sph_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

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

  const logout = () => {
    localStorage.removeItem('sph_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        loading,
        login,
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
