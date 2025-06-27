import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaCog, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';

interface Palvelu {
  id: string;
  title: string;
  description?: string;
  pendingCount: number;
  price?: number;
  category?: string;
  location?: string;
  createdAt?: string;
  photoUrl?: string;
  rating?: number;
}

const OmatPalvelut: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [palvelut, setPalvelut] = useState<Palvelu[]>([]);
  const [search, setSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get<Palvelu[]>(`${BACKEND_URL}/api/palvelut/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPalvelut(res.data);
      } catch (err) {
        console.error('Failed to fetch services', err);
      }
    };
    fetchMyServices();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPalvelut = palvelut.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleModify = (id: string) => {
    navigate(`/palvelut/${id}`);
  };

  const handleRemove = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/palvelut/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPalvelut(prev => prev.filter(p => p.id !== id));
      setDeleteTargetId(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to delete palvelu', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-white">
      <h1 className="text-3xl font-bold uppercase mb-6">Omat Palvelut</h1>

      <input
        type="text"
        placeholder="Etsi palvelua..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-3 mb-6 rounded-lg text-black shadow"
      />

      {filteredPalvelut.length === 0 ? (
        <p>Ei palveluita löytynyt.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-[80vh] overflow-y-auto">
          {filteredPalvelut.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/palvelut/${p.id}`)}
              className="bg-white text-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 pt-14 px-3 pb-5 flex flex-col justify-between relative cursor-pointer"
            >
              <div
                className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                }}
              >
                <FaCog size={30} />
              </div>

              {openDropdownId === p.id && (
                <div
                  ref={dropdownRef}
                  className="absolute right-4 top-12 bg-white border rounded shadow z-20 w-36"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleModify(p.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Muokkaa
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(p.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Poista
                  </button>
                </div>
              )}

              {p.photoUrl && (
                <img
                  src={p.photoUrl}
                  alt={p.title}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}

              <h2 className="text-lg font-bold mb-1">
                {p.title || 'Nimetön palvelu'}
              </h2>

              {typeof p.rating === 'number' && (
                <div className="flex items-center gap-1 text-yellow-500 text-sm mb-2">
                  {Array.from({ length: Math.round(p.rating) }, (_, i) => (
                    <FaStar key={i} />
                  ))}
                  <span className="text-gray-700 ml-1">{p.rating.toFixed(1)}</span>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                {p.description || 'Ei kuvausta.'}
              </p>

              <div className="text-sm text-gray-700 space-y-2 mb-5">
                {p.category && <p><strong>Kategoria:</strong> {p.category}</p>}
                {p.location && <p><strong>Sijainti:</strong> {p.location}</p>}
                {typeof p.price === 'number' && <p><strong>Hinta:</strong> {p.price} € / h</p>}
                {p.createdAt && (
                  <p><strong>Luotu:</strong> {new Date(p.createdAt).toLocaleDateString('fi-FI')}</p>
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()} className="relative">
                <button
                  onClick={() => console.log('Show varauspyynnöt for', p.id)}
                  className="uppercase w-full pt-3 py-3 bg-black text-white rounded-lg hover:bg-gray-700 relative"
                >
                  {p.pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {p.pendingCount}
                    </span>
                  )}
                  Näytä varauspyynnöt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-[90%] max-w-sm">
            <h2 className="text-xl font-bold">Haluatko poistaa palvelun?</h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Ei
              </button>
              <button
                onClick={() => handleRemove(deleteTargetId)}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Kyllä
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <span>Palvelu poistettiin onnistuneesti</span>
          <button onClick={() => setShowSuccess(false)} className="text-white font-bold">×</button>
        </div>
      )}
    </div>
  );
};

export default OmatPalvelut;
