import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between z-50">
      {/* Left side */}
      <div className="text-black font-bold uppercase text-xs md:text-sm">
        {!isLoggedIn && (
          <Link to="/kirjaudu" className="hidden md:inline-block">
            KIRJAUDU SISÄÄN
          </Link>
        )}
      </div>

      {/* Center */}
      <div className="text-xl md:text-2xl font-extrabold uppercase tracking-wider">
        <Link to="/">KEIKKADUUNI</Link>
      </div>

      {/* Right side - desktop nav */}
      <nav className="hidden md:flex space-x-6 font-semibold uppercase text-sm">
        <Link to="/" className="hover:text-gray-700">
          ETUSIVU
        </Link>
        <Link to="/tietoa" className="hover:text-gray-700">
          MEISTÄ
        </Link>
        {!isLoggedIn && (
          <Link to="/kirjaudu" className="hover:text-gray-700">
            KIRJAUDU SISÄÄN
          </Link>
        )}
      </nav>

      {/* Hamburger icon - mobile */}
      <button
        className="md:hidden focus:outline-none"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {menuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md flex flex-col font-semibold uppercase text-sm z-50">
          <Link
            to="/"
            className="px-4 py-2 hover:bg-gray-100"
            onClick={() => setMenuOpen(false)}
          >
            ETUSIVU
          </Link>
          <Link
            to="/tietoa"
            className="px-4 py-2 hover:bg-gray-100"
            onClick={() => setMenuOpen(false)}
          >
            MEISTÄ
          </Link>
          {!isLoggedIn && (
            <Link
              to="/kirjaudu"
              className="px-4 py-2 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              KIRJAUDU SISÄÄN
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
