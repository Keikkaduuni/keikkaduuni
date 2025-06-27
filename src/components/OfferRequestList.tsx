import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Offer {
  id: number;
  price: number;
  date: string;
  status?: 'pending' | 'approved' | 'rejected';
  isRead?: boolean;
  tarveTitle?: string;
  user?: { id: string; name?: string };
  onClick?: () => void;
}

interface OfferRequestListProps {
  offers: Offer[];
  onAllRead?: () => void;
}

const OfferRequestList: React.FC<OfferRequestListProps> = ({ offers, onAllRead }) => {
  const { getToken } = useAuth();
  const [localOffers, setLocalOffers] = React.useState<Offer[]>(offers);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalOffers(offers);
  }, [offers]);

  React.useEffect(() => {
    const unreadStillExist = localOffers.some(
      (o) => o.status === 'pending' && o.isRead === false
    );
    if (!unreadStillExist && onAllRead) {
      onAllRead();
    }
  }, [localOffers, onAllRead]);

  if (error) {
    return (
      <div className="fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
        {error}
      </div>
    );
  }

  if (!localOffers || localOffers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm pt-20">
        <span>Ei tarjouksia vielä</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {localOffers.map((offer) => (
        <div
          key={offer.id}
          onClick={async () => {
            if (offer.isRead === false) {
              try {
                const token = getToken();
                if (!token) {
                  console.warn('🔐 No token found, skipping mark-as-read');
                  return;
                }
                await axios.patch(
                  `http://localhost:5001/api/offers/${offer.id}/read`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                  }
                );
                setLocalOffers((prev) =>
                  prev.map((o) => (o.id === offer.id ? { ...o, isRead: true } : o))
                );
              } catch (err) {
                console.error('Failed to mark offer as read:', err);
              }
            }
            offer.onClick?.();
          }}
          className="relative flex justify-between items-start p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer w-full"
        >
          {/* 🔴 UUSI badge if unread and pending */}
          {offer.status === 'pending' && offer.isRead === false && (
            <div className="absolute top-3 right-4 flex items-center gap-1">
              <span className="text-red-500 text-sm font-bold">UUSI</span>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white font-anton">{offer.tarveTitle || 'Tarve'}</span>
            <span className="text-white font-medium">
              {new Date(offer.date).toLocaleDateString('fi-FI')} — {offer.price} €
            </span>
            {offer.status && offer.status !== 'pending' && (
              <span
                className={`text-sm mt-1 ${
                  offer.status === 'approved' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {offer.status === 'approved' ? 'Hyväksytty' : 'Hylätty'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfferRequestList; 