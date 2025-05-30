import React, { useState, useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const isLoggedIn = isAuthenticated; // Use auth context here

  return (
    <div className="min-h-screen bg-black text-white font-anton">
      {/* Header */}
      <header className="sticky top-0 bg-black border-b border-white/10 z-50">
        {/* Top bar: mobile menu toggle + Kirjaudu */}
        <div className="flex items-center justify-between px-6 py-3 sm:hidden border-b border-white/20">
          {/* Hamburger Menu Button */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
          >
            {menuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Kirjaudu sisään button or ProfileDropdown */}
          {!isLoggedIn && (
            <Link
              to="/kirjaudu"
              className="uppercase px-4 py-2 border border-white hover:bg-white hover:text-black transition text-sm"
            >
              Kirjaudu sisään
            </Link>
          )}
          {isLoggedIn && <ProfileDropdown />}
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="sm:hidden flex flex-col px-6 py-4 space-y-4 uppercase text-lg border-b border-white/20">
            <Link to="/" onClick={() => setMenuOpen(false)} className="hover:underline">
              Etusivu
            </Link>
            <Link to="/meista" onClick={() => setMenuOpen(false)} className="hover:underline">
              Meistä
            </Link>
          </nav>
        )}

        {/* Main navbar: logo + desktop nav + desktop Kirjaudu */}
        <div className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div />
          <Link to="/" className="uppercase text-3xl tracking-wide hover:opacity-80">
            Keikkaduuni
          </Link>

          <nav className="flex gap-6 text-lg uppercase">
            <Link to="/" className="hover:underline">Etusivu</Link>
            <Link to="/meista" className="hover:underline">Meistä</Link>
          </nav>

          <div>
            {!isLoggedIn && (
              <Link
                to="/kirjaudu"
                className="uppercase px-4 py-2 border border-white hover:bg-white hover:text-black transition text-sm"
              >
                Kirjaudu sisään
              </Link>
            )}
            {isLoggedIn && <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-white/50 py-6 uppercase">
        © {new Date().getFullYear()} Keikkaduuni. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
