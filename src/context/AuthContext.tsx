import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { BACKEND_URL } from '../config';

interface User {
  id: string;
  email: string;
  name: string;
  description?: string;
  skills?: string[];
  profilePhoto?: string;
  companyName?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  fetchUser: async () => {},
  getToken: () => null,
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const normalizeUser = (raw: any): User => {
    return {
      id: raw.id,
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
      createdAt: raw.createdAt || undefined,
    };
  };

  const fetchUser = async () => {
    try {
      const currentToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!currentToken) return;

      const res = await axios.get(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
        withCredentials: true,
      });

      console.log('✅ Fetched user from backend:', res.data); // 🔍 Added log

      const normalized = normalizeUser(res.data);
      setUser(normalized);

      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(normalized));
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
      logout();
    }
  };

  useEffect(() => {
    const storedToken =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(); // Always fetch fresh user
    }
  }, []);

  const getToken = () => token || localStorage.getItem('token') || sessionStorage.getItem('token');


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
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  setToken(null);
  setUser(null);
};


  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, login, logout, isAuthenticated, fetchUser, getToken}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };

export const useAuth = () => useContext(AuthContext);

