import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ProfileDropdown: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/kirjaudu');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        <UserCircle className="w-8 h-8 text-white cursor-pointer" />
      </button>

      <div
        className={`
          absolute right-2 mt-2 w-40 bg-black border border-white/20 rounded shadow-lg z-50
          transform transition-all duration-300 origin-top-right
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          uppercase divide-y divide-white/20
        `}
      >
        <Link
          to="/profiili"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 hover:bg-white hover:text-black transition"
        >
          Profiili
        </Link>

        <Link
          to="/omat-palvelut"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 hover:bg-white hover:text-black transition"
        >
          Omat Palvelut
        </Link>

        <Link
          to="/omat-tarpeet"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 hover:bg-white hover:text-black transition"
        >
          Omat Tarpeet
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-4 py-2 hover:bg-white hover:text-black transition"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Kirjaudu ulos
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
