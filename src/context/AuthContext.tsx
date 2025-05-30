import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  description?: string;
  skills?: string[];
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  token: null,
  login: (_token: string, _user: User, _rememberMe?: boolean) => {},
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser =
      localStorage.getItem('user') || sessionStorage.getItem('user');

    if (
      storedToken &&
      storedUser &&
      storedUser !== 'undefined' &&
      storedUser !== 'null'
    ) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse storedUser:', error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const login = (token: string, user: User, rememberMe: boolean = false) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setToken(token);
    setUser(user);
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
      value={{ user, setUser, token, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
