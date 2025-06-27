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
  LogOut,
  Wrench
} from 'lucide-react';
import logo from '../assets/Logo.png';
import { fetchNotifications, markNotificationAsRead, deleteNotification } from '../api/notifications';
import { getSocket } from '../socket';
import BottomNavBar from './BottomNavBar';

const Layout: React.FC = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const location = useLocation();
  const isLoggedIn = isAuthenticated;
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdownMobile, setShowProfileDropdownMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasUnreadWork, setHasUnreadWork] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const [showTypeModal, setShowTypeModal] = useState(false);

  const isChatPage = location.pathname.startsWith('/viestit');

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const socket = getSocket();
    if (!socket) return;
    const handleNewNotification = () => {
      fetchNotifications(token).then((data) => {
        console.log('🔔 Socket notification update:', data);
        setNotifications(data);
        const hasUnread = data.some((n: any) => !n.isRead);
        console.log('🔔 Has unread notifications:', hasUnread);
        setHasUnreadNotifications(hasUnread);
      });
    };
    socket.on('new-notification', handleNewNotification);
    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const socket = getSocket();
    if (!socket) return;
    
    const handleWorkUpdate = () => {
      // Refetch work data to update unread badges
      Promise.all([
        fetch('http://localhost:5001/api/bookings/received', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
        fetch('http://localhost:5001/api/offers/received', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      ]).then(([bookings, offers]) => {
        setHasUnreadWork(
          (bookings && bookings.some((b: any) => !b.isRead)) ||
          (offers && offers.some((o: any) => !o.isRead))
        );
      });
    };

    socket.on('booking-updated', handleWorkUpdate);
    socket.on('offer-updated', handleWorkUpdate);
    socket.on('new-notification', handleWorkUpdate);

    return () => {
      socket.off('booking-updated', handleWorkUpdate);
      socket.off('offer-updated', handleWorkUpdate);
      socket.off('new-notification', handleWorkUpdate);
    };
  }, [isLoggedIn, token]);

  // ✅ Add initial useEffect to load notifications on mount
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    
    // Load initial notifications
    fetchNotifications(token).then((data) => {
      console.log('🔔 Initial notifications loaded:', data);
      data.forEach((notification: any, index: number) => {
        console.log(`🔔 Notification ${index + 1}:`, {
          id: notification.id,
          message: notification.message,
          isRead: notification.isRead,
          type: notification.type,
          createdAt: notification.createdAt
        });
      });
      setNotifications(data);
      const hasUnread = data.some((n: any) => !n.isRead);
      console.log('🔔 Initial has unread notifications:', hasUnread);
      setHasUnreadNotifications(hasUnread);
    }).catch(err => {
      console.error('Failed to load initial notifications:', err);
      setHasUnreadNotifications(false);
    });
  }, [isLoggedIn, token]);

  const handleNotifDropdown = async () => {
    setShowNotifDropdown((prev) => !prev);
    if (!showNotifDropdown && notifications.some((n) => !n.isRead) && token) {
      console.log('🔔 Marking all notifications as read...');
      // Mark all as read
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => markNotificationAsRead(n.id, token))
      );
      // Refetch
      const data = await fetchNotifications(token);
      console.log('🔔 After marking as read:', data);
      setNotifications(data);
      const hasUnread = data.some((n: any) => !n.isRead);
      console.log('🔔 Has unread after marking:', hasUnread);
      setHasUnreadNotifications(hasUnread);
    }
  };

  // ✅ Add temporary manual mark-as-read function
  const handleMarkAllAsRead = async () => {
    if (!token) return;
    console.log('🔔 Manually marking all as read...');
    try {
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => markNotificationAsRead(n.id, token))
      );
      const data = await fetchNotifications(token);
      console.log('🔔 After manual mark as read:', data);
      setNotifications(data);
      setHasUnreadNotifications(data.some((n: any) => !n.isRead));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!token) return;
    await deleteNotification(id, token);
    const data = await fetchNotifications(token);
    setNotifications(data);
    setHasUnreadNotifications(data.some((n: any) => !n.isRead));
  };

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
              <Link to="/my-work" className="relative flex items-center">
                <Wrench className="w-6 h-6 text-white" />
                {hasUnreadWork && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
                <span className="ml-2 uppercase">Työt</span>
              </Link>
            )}

            {isLoggedIn && (
              <Link to="/viestit" className="relative flex items-center">
                <MessageCircle className="w-6 h-6 text-white" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
                <span className="ml-2 uppercase">Viestit</span>
              </Link>
            )}

            {isLoggedIn && (
              <div ref={notifRef} className="relative flex items-center">
                <button
                  onClick={handleNotifDropdown}
                  className="flex items-center"
                >
                  <Bell className="w-6 h-6 text-white" />
                  {hasUnreadNotifications && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                  <span className="ml-2 uppercase">Ilmoitukset</span>
                </button>
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
      </header>

      {/* Mobile top header */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-black flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src={logo} alt="Keikkaduuni" className="h-7" />
        <button className="relative">
          <Bell className="w-7 h-7 text-white" />
          {hasUnreadNotifications && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </button>
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
          <div className="w-full">
            <Outlet />
          </div>
        )}
      </main>

      {/* Bottom navigation bar for mobile */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <BottomNavBar onClickUusi={() => setShowTypeModal(true)} />
      </div>

      {showNotifDropdown && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-white text-black rounded-xl shadow-lg z-50 overflow-hidden uppercase divide-y divide-gray-200">
          <div className="p-3 font-semibold">Ilmoitukset</div>
          {notifications.length === 0
            ? <div className="p-3 text-sm text-gray-500">Ei ilmoituksia vielä.</div>
            : notifications.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 text-sm hover:bg-gray-100">
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
          }
          <div className="p-2 border-t text-center bg-gray-50">
            <Link to="/ilmoitukset" className="text-xs text-blue-600 hover:underline">Näytä kaikki ilmoitukset</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
