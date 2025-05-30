import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LogoutButton: React.FC = () => {
  const { logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/kirjaudu'); // redirect to login page
  };

  if (!isAuthenticated) return null; // hide button if not logged in

  return (
    <button onClick={handleLogout} className="btn-primary">
      Kirjaudu ulos
    </button>
  );
};

export default LogoutButton;
