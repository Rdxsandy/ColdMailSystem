import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const exchangeToken = async (token: string) => {
    try {
      // Exchange the short-lived JWT (from URL) for a real session cookie
      await axios.post(`${API_BASE}/auth/verify-token`, { token }, { withCredentials: true });
      // Redirect to dashboard — this also cleans the token from the URL
      window.location.replace('/dashboard');
    } catch {
      setLoading(false);
      window.location.href = '/login?error=auth_failed';
    }
  };

  useEffect(() => {
    // Check if we're coming back from Google OAuth with a token in the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // We're on the /auth/callback page with a token — exchange it
      exchangeToken(token);
    } else {
      // Normal load — check if there's an existing session
      fetchUser();
    }
  }, []);

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const logout = async () => {
    await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
