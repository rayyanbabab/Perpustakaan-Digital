import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LibrarySettings } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  settings: LibrarySettings | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateSettings: (newSettings: Partial<LibrarySettings>) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('widya_pustaka_token'));
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchInitialData = async () => {
    try {
      // Fetch public settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const setJson = await settingsRes.json();
        setSettings(setJson);
      }

      // Check current user session if token exists
      const savedToken = localStorage.getItem('widya_pustaka_token');
      if (savedToken) {
        const userRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (userRes.ok) {
          const userJson = await userRes.json();
          setUser(userJson.user);
          if (userJson.settings) setSettings(userJson.settings);
        } else {
          localStorage.removeItem('widya_pustaka_token');
          setToken(null);
          setUser(null);
        }
      }
    } catch (e) {
      console.error('Failed to initialize session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal' };
      }
      localStorage.setItem('widya_pustaka_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.settings) setSettings(data.settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan jaringan' };
    }
  };

  const demoLogin = async (role: string) => {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Demo login gagal' };
      }
      localStorage.setItem('widya_pustaka_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.settings) setSettings(data.settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan jaringan' };
    }
  };

  const logout = () => {
    localStorage.removeItem('widya_pustaka_token');
    setToken(null);
    setUser(null);
  };

  const updateSettings = async (newSettings: Partial<LibrarySettings>) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const json = await res.json();
        setSettings(json.settings);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userJson = await userRes.json();
        setUser(userJson.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        settings,
        isLoading,
        login,
        demoLogin,
        logout,
        updateSettings,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
