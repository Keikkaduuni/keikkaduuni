import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaChevronDown, FaCheck, FaTimes } from 'react-icons/fa';
import { BACKEND_URL } from '../config';

// Tarpeet with count of pending offers
interface Tarve {
  id: string;
  title: string;
  pendingCount: number;
}

// Offer shape
interface Offer {
  id: string;
  provider: { id: string; name: string; profilePhoto: string };
  message: string;
  status: 'pending' | 'approved' | 'rejected';
}

const OmatTarpeet: React.FC = () => {
  const { user } = useAuth();
  const [tarpeet, setTarpeet] = useState<Tarve[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [offersMap, setOffersMap] = useState<Record<string, Offer[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Fetch user's tarpeet with pending offers count
  useEffect(() => {
    const fetchMyNeeds = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BACKEND_URL}/api/tarpeet/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTarpeet(res.data);
      } catch (err) {
        console.error('Failed to fetch tarpeet', err);
      }
    };
    fetchMyNeeds();
  }, [user]);

  // Toggle expand and fetch offers if needed
  const toggleExpand = async (tarveId: string) => {
    if (expanded.includes(tarveId)) {
      setExpanded(prev => prev.filter(id => id !== tarveId));
      return;
    }
    if (!offersMap[tarveId]) {
      setLoadingMap(prev => ({ ...prev, [tarveId]: true }));
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BACKEND_URL}/api/tarpeet/${tarveId}/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOffersMap(prev => ({ ...prev, [tarveId]: res.data }));
      } catch (err) {
        console.error('Failed to load offers', err);
      } finally {
        setLoadingMap(prev => ({ ...prev, [tarveId]: false }));
      }
    }
    setExpanded(prev => [...prev, tarveId]);
  };

  // Approve or reject an offer
  const handleOfferAction = async (
    tarveId: string,
    offerId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/offers/${offerId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOffersMap(prev => ({
        ...prev,
        [tarveId]: prev[tarveId].map(o =>
          o.id === offerId ? { ...o, status: action === 'approve' ? 'approved' : 'rejected' } : o
        ),
      }));
    } catch (err) {
      console.error(`Failed to ${action} offer`, err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Omat tarpeet</h1>
      {tarpeet.length === 0 ? (
        <p>Sinulla ei ole tarpeita.</p>
      ) : (
        tarpeet.map(t => (
          <div key={t.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{t.title}</h2>
                {t.pendingCount > 0 && (
                  <span className="mt-1 inline-block bg-blue-500 text-white text-sm px-2 py-1 rounded">
                    {t.pendingCount} tarjousta
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleExpand(t.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FaChevronDown
                  className={`transform transition-transform ${
                    expanded.includes(t.id) ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>
            </div>

            {expanded.includes(t.id) && (
              <div className="mt-4">
                {loadingMap[t.id] ? (
                  <p>Ladataan tarjouksia...</p>
                ) : offersMap[t.id]?.length === 0 ? (
                  <p>Ei tarjouksia.</p>
                ) : (
                  offersMap[t.id].map(o => (
                    <div key={o.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{o.provider.name}</p>
                        <p className="text-sm text-gray-500">{o.message}</p>
                      </div>
                      <div className="flex gap-2">
                        {o.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOfferAction(t.id, o.id, 'approve')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded"
                            >
                              <FaCheck /> Hyväksy
                            </button>
                            <button
                              onClick={() => handleOfferAction(t.id, o.id, 'reject')}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded"
                            >
                              <FaTimes /> Hylkää
                            </button>
                          </>
                        )}
                        {o.status === 'approved' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded">Hyväksytty</span>
                        )}
                        {o.status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded">Hylätty</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OmatTarpeet;
