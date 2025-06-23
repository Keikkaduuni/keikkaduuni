// src/components/Layout.tsx

import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import classNames from 'classnames';
import {
  Bell,
  MessageCircle,
  Home as HomeIcon,
  UserCircle as UserIcon,
  LogOut
} from 'lucide-react';
import logo from '../assets/Logo.png';

const Layout: React.FC = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const location = useLocation();
  const isLoggedIn = isAuthenticated;
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdownMobile, setShowProfileDropdownMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const hasUnreadMessages = true;
  const notifications = [
    { id: 1, message: 'Uusi varauspyyntö saapui' },
    { id: 2, message: 'Arvostelu julkaistiin' },
  ];
  const isChatPage = location.pathname.startsWith('/viestit');

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdownMobile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileDropdownMobile(false);
  };

  return (
    <div className="bg-black text-white font-anton flex flex-col min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 bg-black border-b border-white/10 z-50">
        {/* Desktop header (logo + text nav + desktop profile) */}
        <div className="hidden sm:flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Keikkaduuni" className="h-8" />
          </Link>

          <div className="flex items-center gap-16">
            <Link to="/" className="text-xl font-bold uppercase hover:opacity-80">
              Etusivu
            </Link>

            {isLoggedIn && (
              <Link to="/viestit" className="relative flex items-center">
                <MessageCircle className="w-6 h-6 text-white" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
                <span className="ml-2 uppercase">Viestit</span>
              </Link>
            )}

            {isLoggedIn && (
              <div ref={notifRef} className="relative flex items-center">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="flex items-center"
                >
                  <Bell className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <span className="ml-2 uppercase">Ilmoitukset</span>
                </button>
                {showNotifDropdown && (
                  <div className="absolute top-full mt-1 right-0 w-64 bg-white text-black rounded-xl shadow-lg z-50 overflow-hidden uppercase divide-y divide-gray-200">
                    <div className="p-3 font-semibold">Ilmoitukset</div>
                    {notifications.length === 0
                      ? <div className="p-3 text-sm text-gray-500">Ei ilmoituksia vielä.</div>
                      : notifications.map(n => (
                          <div key={n.id} className="p-3 text-sm hover:bg-gray-100">
                            {n.message}
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            {!isLoggedIn ? (
              <Link
                to="/kirjaudu"
                className="uppercase px-4 py-2 border border-white hover:bg-white hover:text-black transition text-sm"
              >
                Kirjaudu sisään
              </Link>
            ) : (
              <ProfileDropdown />
            )}
          </div>
        </div>

        {/* Mobile nav (icons + labels) */}
        <div className="flex sm:hidden justify-around items-center border-b border-white/10 bg-black">
          {/* Home */}
          <Link to="/" className="flex flex-col items-center py-2">
            <HomeIcon className="w-6 h-6 text-white" />
            <span className="text-xs mt-1 uppercase">Etusivu</span>
          </Link>

          {/* Messages */}
          {isLoggedIn && (
            <Link to="/viestit" className="flex flex-col items-center py-2">
              <div className="relative">
                <MessageCircle className="w-6 h-6 text-white" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </div>
              <span className="text-xs mt-1 uppercase">Viestit</span>
            </Link>
          )}

          {/* Notifications */}
          {isLoggedIn && (
            <div ref={notifRef} className="flex flex-col items-center py-2">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="focus:outline-none"
              >
                <div className="relative">
                  <Bell className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </div>
              </button>
              <span className="text-xs mt-1 uppercase">Ilmoitukset</span>
              {showNotifDropdown && (
                <div className="absolute top-full mt-1 right-1 w-56 bg-black border border-white/20 rounded shadow-lg z-50 overflow-hidden uppercase divide-y divide-white/20">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-2 text-sm hover:bg-white hover:text-black transition">
                      {n.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile dropdown trigger (mobile) */}
          {isLoggedIn && (
            <div ref={profileRef} className="relative flex flex-col items-center py-2">
              <button
                onClick={() => {
                  setShowProfileDropdownMobile(!showProfileDropdownMobile);
                  setShowNotifDropdown(false);
                }}
                className="focus:outline-none"
              >
                <UserIcon className="w-6 h-6 text-white" />
              </button>
              <span className="text-xs mt-1 uppercase">Profiili</span>

              {showProfileDropdownMobile && (
                <div className="absolute top-full mt-1 right-0 w-44 bg-black border border-white/20 rounded shadow-lg z-50 overflow-hidden uppercase divide-y divide-white/20">
                  <Link
                    to="/profiili"
                    onClick={() => setShowProfileDropdownMobile(false)}
                    className="block px-4 py-2 hover:bg-white hover:text-black transition"
                  >
                    Profiili
                  </Link>
                  <Link
                    to="/omat-palvelut"
                    onClick={() => setShowProfileDropdownMobile(false)}
                    className="block px-4 py-2 hover:bg-white hover:text-black transition"
                  >
                    Omat Palvelut
                  </Link>
                  <Link
                    to="/omat-tarpeet"
                    onClick={() => setShowProfileDropdownMobile(false)}
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
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={classNames(isChatPage ? 'flex-1 p-0 sm:p-6' : 'flex-1 p-6')}>
        {isChatPage ? (
          <div
            className="bg-white/5 border border-white/10 max-w-6xl mx-auto flex flex-col rounded-none sm:rounded-2xl shadow-none sm:shadow-xl"
            style={{ height: 'calc(100vh - 80px)' }}
          >
            <div className="flex-1 overflow-y-auto">
              <Outlet />
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 max-w-6xl mx-auto rounded-2xl shadow-xl">
            <Outlet />
          </div>
        )}
      </main>

      {/* FOOTER */}
      {!isChatPage && (
        <footer className="text-center text-sm text-white/50 py-6 uppercase">
          © {new Date().getFullYear()} Keikkaduuni. All rights reserved.
        </footer>
      )}
    </div>
  );
};

export default Layout;
