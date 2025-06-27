import React, { useEffect, useState } from 'react';
import { fetchNotifications, markNotificationAsRead, deleteNotification } from '../api/notifications';
import { useNavigate } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    fetchNotifications(token).then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id, token);
    const data = await fetchNotifications(token);
    setNotifications(data);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id, token);
    const data = await fetchNotifications(token);
    setNotifications(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 uppercase">Ilmoitukset</h1>
      {loading ? (
        <div className="text-gray-500">Ladataan...</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500">Ei ilmoituksia.</div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-center justify-between p-4">
              <div>
                <span className={n.isRead ? 'text-gray-500' : 'font-bold'}>{n.message}</span>
                {n.link && (
                  <button
                    onClick={() => navigate(n.link)}
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    Näytä
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Merkitse luetuksi
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Poista
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationCenter; 