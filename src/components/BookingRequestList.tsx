import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // adjust path



interface BookingRequest {
  id: number;
  date: string;
  hours: number;
  isUnread?: boolean;
  palveluTitle?: string;
  status?: 'pending' | 'approved' | 'rejected';
  user?: { id: string };
  onClick: () => void;
}

interface BookingRequestListProps {
  requests: BookingRequest[];
  onAllRead?: () => void;
}

const BookingRequestList: React.FC<BookingRequestListProps> = ({ requests, onAllRead }) => {
       const { getToken } = useAuth(); // ✅ Hook here

       const [localRequests, setLocalRequests] = React.useState<BookingRequest[]>(requests);
       const [error, setError] = React.useState<string | null>(null);

   React.useEffect(() => {
  setLocalRequests(requests); // keep local state in sync when parent updates
    }, [requests]);

  React.useEffect(() => {
    const unreadStillExist = localRequests.some(
      (r) => r.status === 'pending' && r.isUnread
     );

    if (!unreadStillExist && onAllRead) {
      onAllRead(); // 🔥 tell parent that all are read
    }
  }, [requests, onAllRead]);

  React.useEffect(() => {
    const fetchRequests = async () => {
      setError(null);
      try {
        // ... existing code ...
      } catch (err) {
        setError('Varauspyyntöjen haku epäonnistui');
      }
    };
    fetchRequests();
  }, [/* dependencies */]);

  if (error) {
    return (
      <div className="fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
        {error}
      </div>
    );
  }

  if (!localRequests || localRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm pt-20">
        <span>Ei varauspyyntöjä vielä</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
        {localRequests.map((req) => (
        <div
          key={req.id}
          onClick={async () => {
  if (req.isUnread) {
    try {
      const token = getToken();
      if (!token) {
        console.warn('🔐 No token found, skipping mark-as-read');
        return;
      }

      await axios.patch(
        `http://localhost:5001/api/bookings/${req.id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setLocalRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, isUnread: false } : r))
      );
    } catch (err) {
      console.error('Failed to mark booking as read:', err);
    }
  }

  // Just call the parent's handler — no need to update localRequests again
  req.onClick?.();
}}


          className="relative flex justify-between items-start p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          {/* 🔴 UUSI badge if unread and pending */}
         {req.status === 'pending' && localRequests.find((r) => r.id === req.id)?.isUnread && (
            <div className="absolute top-3 right-4 flex items-center gap-1">
              <span className="text-red-500 text-sm font-bold">UUSI</span>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-white font-anton">{req.palveluTitle || 'Palvelu'}</span>
            <span className="text-white font-medium">
              {new Date(req.date).toLocaleDateString('fi-FI')} — {req.hours} h
            </span>
            {req.status && req.status !== 'pending' && (
              <span
                className={`text-sm mt-1 ${
                  req.status === 'approved' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {req.status === 'approved' ? 'Hyväksytty' : 'Hylätty'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingRequestList;
