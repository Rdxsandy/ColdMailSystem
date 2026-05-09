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

// ─── Helpers: read/write JWT in localStorage ───────────────────────────────────
const TOKEN_KEY = 'coldmail_auth_token';

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);

const storeToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  // Set as default Authorization header for all future axios requests
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete axios.defaults.headers.common['Authorization'];
};

// Restore the authorization header on page load if token exists in localStorage
const existingToken = getStoredToken();
if (existingToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the current user using the stored JWT
  const fetchUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      // Token is invalid or expired — clear it
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of the OAuth flow: exchange the one-time URL token for a long-lived JWT
  const exchangeToken = async (token: string) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-token`, { token });
      // Store the long-lived JWT and user data — no cookies, no sessions!
      storeToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      // Navigate to dashboard and remove the token from the URL
      window.history.replaceState({}, '', '/dashboard');
      window.location.replace('/dashboard');
    } catch (err: any) {
      console.error('[exchangeToken] Failed:', err?.response?.data || err?.message);
      clearToken();
      setLoading(false);
      window.location.href = '/login?error=auth_failed';
    }
  };

  useEffect(() => {
    // Check if we're coming back from Google OAuth with a one-time token in the URL
    const params = new URLSearchParams(window.location.search);
    const oneTimeToken = params.get('token');

    if (oneTimeToken) {
      exchangeToken(oneTimeToken);
    } else {
      fetchUser();
    }
  }, []);

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const logout = async () => {
    await axios.post(`${API_BASE}/auth/logout`).catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
