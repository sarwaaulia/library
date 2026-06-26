import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRole] = useState(null); // 'pustakawan' or 'anggota'

  useEffect(() => {
    const token = localStorage.getItem('library_token');
    const savedUser = localStorage.getItem('library_user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Default role: admin@library.com is automatically pustakawan.
        // Others are anggota, but can be switched if they want.
        if (parsedUser.email === 'admin@library.com') {
          setSimulatedRole('pustakawan');
        } else {
          setSimulatedRole('anggota');
        }
      } catch (err) {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/masuk', {
        method: 'POST',
        body: { email, password }
      });
      
      localStorage.setItem('library_token', data.token);
      localStorage.setItem('library_user', JSON.stringify(data.pengguna));
      setUser(data.pengguna);
      
      if (data.pengguna.email === 'admin@library.com') {
        setSimulatedRole('pustakawan');
      } else {
        setSimulatedRole('anggota');
      }
      return data.pengguna;
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiFetch('/auth/daftar', {
        method: 'POST',
        body: userData
      });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setUser(null);
    setSimulatedRole(null);
  };

  const toggleSimulatedRole = () => {
    setSimulatedRole(prev => prev === 'pustakawan' ? 'anggota' : 'pustakawan');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    simulatedRole,
    setSimulatedRole,
    toggleSimulatedRole
  };

  return (
    <AuthContext.Provider value={value}>
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
