import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';

interface HeaderProps {
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // ⬇️ Replace this with your actual logic later
  const hasUnreadMessages = true;
  const notifications = [
    { id: 1, message: 'Uusi varauspyyntö saapui.' },
    { id: 2, message: 'Arvostelu vastaanotettu.' },
  ];

  return (
    <header className="sticky top-0 bg-black border-b border-gray-800 py-4 px-6 flex items-center justify-between z-50">
      {/* Left: login */}
      <div className="text-white font-bold uppercase text-xs md:text-sm">
        {!isLoggedIn && (
          <Link to="/kirjaudu" className="hidden md:inline-block">
            KIRJAUDU SISÄÄN
          </Link>
        )}
      </div>

      {/* Center: logo shifted left via ml-[-40px] */}
      <div className="text-xl md:text-2xl font-extrabold uppercase tracking-wider ml-[-40px]">
        <Link to="/" className="text-white">KEIKKADUUNI</Link>
      </div>

      {/* Right: message + notification icons */}
      <div className="hidden md:flex items-center space-x-6">
        {isLoggedIn && (
          <>
            {/* Messages icon */}
            <div className="relative">
              <Link to="/viestit">
                <MessageCircle className="w-6 h-6 text-white" />
                {hasUnreadMessages && (
                  <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </Link>
            </div>

            {/* Notifications bell */}
            <div className="relative">
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <Bell className="w-6 h-6 text-white" />
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b font-semibold">Ilmoitukset</div>
                  {notifications.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Ei ilmoituksia vielä.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 text-sm border-b hover:bg-gray-100">
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hamburger icon - mobile */}
      <button
        className="md:hidden focus:outline-none"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md flex flex-col font-semibold uppercase text-sm z-50">
          <Link to="/" className="px-4 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>ETUSIVU</Link>
          <Link to="/tietoa" className="px-4 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>MEISTÄ</Link>
          {!isLoggedIn && (
            <Link to="/kirjaudu" className="px-4 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
              KIRJAUDU SISÄÄN
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
