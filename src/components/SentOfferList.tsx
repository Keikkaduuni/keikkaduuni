import React, { useEffect, useState } from 'react';
import { getSocket } from '../socket';

interface Offer {
  id: number;
  tarveId: number;
  tarveTitle: string;
  price: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SentOfferListProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const SentOfferList: React.FC<SentOfferListProps> = ({ selectedId, onSelect }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/offers/sent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOffers(data);
      } catch (err) {
        setError('Lähetettyjen tarjousten haku epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOfferDeleted = (deletedOfferId: number) => {
      setOffers(prev => prev.filter(offer => offer.id !== deletedOfferId));
    };

    const handleOfferUpdated = (updatedOffer: Offer) => {
      setOffers(prev => prev.map(offer => 
        offer.id === updatedOffer.id ? updatedOffer : offer
      ));
    };

    socket.on('offer-deleted', handleOfferDeleted);
    socket.on('offer-updated', handleOfferUpdated);

    return () => {
      socket.off('offer-deleted', handleOfferDeleted);
      socket.off('offer-updated', handleOfferUpdated);
    };
  }, []);

  if (error) {
    return (
      <div className="fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
        {error}
      </div>
    );
  }

  if (loading) {
    return <div className="text-white/40 px-4 py-6">Ladataan...</div>;
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm pt-20">
        <span>Ei lähetettyjä tarjouksia</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {offers.map((o) => (
        <div
          key={o.id}
          onClick={() => onSelect(o.tarveId)}
          className={`cursor-pointer p-4 rounded-xl border border-white/10 text-white ${
            selectedId === o.tarveId ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <div><strong>Tarve:</strong> {o.tarveTitle || 'Tuntematon'}</div>
          <div className="text-sm text-white/60"><strong>Hinta:</strong> {o.price} €</div>
          <div className="text-sm text-white/60"><strong>Pvm:</strong> {o.date}</div>
        </div>
      ))}
    </div>
  );
};

export default SentOfferList;
