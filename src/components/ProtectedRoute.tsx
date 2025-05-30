// src/components/ProtectedRoute.tsx
import React, { ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Not logged in? Redirect to login page
    return <Navigate to="/kirjaudu" replace />;
  }

  // Logged in? Show the component
  return children;
};

export default ProtectedRoute;
