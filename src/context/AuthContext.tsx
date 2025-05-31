import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  email: string;
  name: string;
  description?: string;
  skills?: string[];
  profilePhoto?: string;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  fetchUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const normalizeUser = (raw: any): User => {
    return {
      email: raw.email || '',
      name: raw.name || '',
      description: raw.description?.trim() || '',
      skills: Array.isArray(raw.skills)
        ? raw.skills
        : typeof raw.skills === 'string'
        ? raw.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      profilePhoto: raw.profilePhoto || undefined,
      companyName: raw.companyName || '',
    };
  };

  const fetchUser = async () => {
    try {
      const currentToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!currentToken) return;

      const res = await axios.get('http://localhost:5001/api/profile', {
        headers: { Authorization: `Bearer ${currentToken}` },
        withCredentials: true,
      });

      const normalized = normalizeUser(res.data);
      setUser(normalized);

      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(normalized));
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
      logout(); // fallback if token expired or fetch fails
    }
  };

  useEffect(() => {
    const storedToken =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser =
      localStorage.getItem('user') || sessionStorage.getItem('user');

    if (storedToken) setToken(storedToken);

    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
      } catch (err) {
        console.error('❌ Invalid stored user JSON:', err);
        logout();
      }
    }
  }, []);

  const login = (token: string, rawUser: User, rememberMe: boolean = false) => {
    const normalized = normalizeUser(rawUser);
    setToken(token);
    setUser(normalized);

    const storage = rememberMe ? localStorage : sessionStorage;
    const altStorage = rememberMe ? sessionStorage : localStorage;

    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(normalized));

    altStorage.removeItem('token');
    altStorage.removeItem('user');
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, login, logout, isAuthenticated, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
