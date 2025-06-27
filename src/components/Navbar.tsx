import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageCircle, Wrench } from 'lucide-react';
import { fetchNotifications, markNotificationAsRead, deleteNotification } from '../api/notifications';

interface HeaderProps {
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetchNotifications(token).then((data) => {
      setNotifications(data);
      setHasUnreadNotifications(data.some((n: any) => !n.isRead));
    });
  }, [isLoggedIn, token]);

  const handleNotifDropdown = async () => {
    setShowNotifDropdown((prev) => !prev);
    if (!showNotifDropdown && notifications.some((n) => !n.isRead) && token) {
      // Mark all as read
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => markNotificationAsRead(n.id, token))
      );
      // Refetch
      const data = await fetchNotifications(token);
      setNotifications(data);
      setHasUnreadNotifications(data.some((n: any) => !n.isRead));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!token) return;
    await deleteNotification(id, token);
    const data = await fetchNotifications(token);
    setNotifications(data);
    setHasUnreadNotifications(data.some((n: any) => !n.isRead));
  };

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
              </Link>
            </div>

            {/* My Work icon */}
            <div className="relative">
              <Link to="/my-work" className="flex items-center gap-2 hover:opacity-80 transition">
                <Wrench className="w-6 h-6 text-white" />
                <span className="text-white font-semibold uppercase text-sm">TYÖT</span>
              </Link>
            </div>

            {/* Notifications bell */}
            <div className="relative">
              <button onClick={handleNotifDropdown}>
                <Bell className="w-6 h-6 text-white" />
                {hasUnreadNotifications && (
                  <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b font-semibold">Ilmoitukset</div>
                  {notifications.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Ei ilmoituksia vielä.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="flex items-center justify-between p-3 text-sm border-b hover:bg-gray-100">
                        <span className={n.isRead ? 'text-gray-500' : 'font-bold'}>{n.message}</span>
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="ml-2 text-red-500 hover:text-red-700 text-xs uppercase"
                          title="Poista ilmoitus"
                        >
                          Poista
                        </button>
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
          {isLoggedIn && (
            <>
              <Link to="/viestit" className="px-4 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>VIESTIT</Link>
              <Link to="/my-work" className="px-4 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>TYÖT</Link>
            </>
          )}
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
