// src/components/PublicRoute.tsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // If logged in, redirect to profile or dashboard
  if (isAuthenticated) {
    return <Navigate to="/profiili" replace />;
  }

  // Otherwise show the page (like login or register)
  return children;
};

export default PublicRoute;
