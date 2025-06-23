import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/offers/sent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOffers(data);
      } catch (err) {
        console.error('Error fetching sent offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="text-white/40 px-4 py-6">Ladataan...</div>;
  }

  if (!offers.length) {
    return <div className="text-white/50 px-4 py-10">Ei tarjouksia vielä</div>;
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
