// src/pages/Home.tsx

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { FaTimes, FaHandPaper, FaTools, FaSearch, FaMapMarkerAlt, FaFilter, FaPlus } from 'react-icons/fa';
import PalveluModal from '../components/PalveluModal';
import TarveModal from '../components/TarveModal';
import { Listing } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { API_BASE_PATH } from '../config';

const Home: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const location = useLocation();
  const tabFromState = location.state?.showTab || location.state?.fromTab;
  const defaultTab = (tabFromState?.toUpperCase?.() === 'TARPEET') ? 'TARPEET' : 'PALVELUT';
  const [selectedTab, setSelectedTab] = useState<'PALVELUT' | 'TARPEET'>(defaultTab);

  const [searchParams] = useSearchParams();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showTarveModal, setShowTarveModal] = useState(false);
  const [showPalveluModal, setShowPalveluModal] = useState(false);
  const [showPalveluDeletedToast, setShowPalveluDeletedToast] = useState(false);
  const [showCancelToast, setShowCancelToast] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toUpperCase();
    if (tabParam === 'PALVELUT' || tabParam === 'TARPEET') {
      setSelectedTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.deleted && ['PALVELUT', 'TARPEET'].includes(location.state?.showTab?.toUpperCase())) {
      setShowPalveluDeletedToast(true);
      setTimeout(() => setShowPalveluDeletedToast(false), 3000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const wasCancelled = sessionStorage.getItem('bookingCancelled');
    if (wasCancelled) {
      setShowCancelToast(true);
      sessionStorage.removeItem('bookingCancelled');
      setTimeout(() => setShowCancelToast(false), 3000);
    }
  }, []);

  useEffect(() => {
    fetch('/KATEGORIA.csv')
      .then((res) => {
        if (!res.ok) throw new Error('KATEGORIA.csv not found');
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cats = (results.data as any[])
              .map((row) => row.Name || Object.values(row)[0])
              .filter((c) => typeof c === 'string' && c.trim() !== '')
              .sort((a: string, b: string) => a.localeCompare(b));
            setCategories(cats);
          },
        });
      })
      .catch((e) => {
        console.error('Failed to load KATEGORIA.csv:', e);
        setCategories([]);
      });

    fetch('/SIJAINTI.csv')
      .then((res) => {
        if (!res.ok) throw new Error('SIJAINTI.csv not found');
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const locs = (results.data as any[])
              .map((row) => row.Name || Object.values(row)[0])
              .filter((l) => typeof l === 'string' && l.trim() !== '')
              .sort((a: string, b: string) => a.localeCompare(b));
            setLocations(locs);
          },
        });
      })
      .catch((e) => {
        console.error('Failed to load SIJAINTI.csv:', e);
        setLocations([]);
      });
  }, []);

  const fetchAllListings = async () => {
    try {
      const palveluRes = await fetch(`${API_BASE_PATH}/api/palvelut`);
      if (!palveluRes.ok) throw new Error('Failed to fetch palvelut');
      const palveluJson = await palveluRes.json();
      const palveluItems: any[] = palveluJson.items;

      const palvelutAsListings: Listing[] = palveluItems.map((p) => ({
        id: p.id,
        type: 'PALVELUT',
        title: p.title,
        description: p.description,
        category: p.category || '',
        location: p.location || '',
        createdAt: p.createdAt,
        photoUrl: p.photoUrl || null,
        price: p.price || null,
        unit: p.unit || null,
        userName: p.userName || 'Tuntematon',
        userPhotoUrl: p.userPhotoUrl || null,
        rating: p.rating || null,
      }));

      const tarveRes = await fetch(`${API_BASE_PATH}/api/tarpeet`);
      if (!tarveRes.ok) throw new Error('Failed to fetch tarpeet');
      const tarveItems: any[] = await tarveRes.json();

      const tarpeetAsListings: Listing[] = tarveItems.map((t) => ({
        id: t.id,
        type: 'TARPEET',
        title: t.title,
        description: t.description,
        category: t.category || '',
        location: t.location || '',
        createdAt: t.createdAt,
        photoUrl: t.photoUrl || null,
        price: null,
        unit: null,
        userName: t.userName || 'Tuntematon',
        userPhotoUrl: t.userPhotoUrl || null,
        rating: t.rating || null,
      }));

      setListings(
        [...palvelutAsListings, ...tarpeetAsListings].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (err) {
      console.error(err);
      setListings([]);
    }
  };

  useEffect(() => {
    fetchAllListings();
  }, []);

  const filteredListings = listings.filter((item) => {
    if (item.type !== selectedTab) return false;
    if (selectedLocation && item.location !== selectedLocation) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) return false;
    if (searchText.trim()) {
      const txt = searchText.trim().toLowerCase();
      const inTitle = item.title.toLowerCase().includes(txt);
      const inDesc = item.description?.toLowerCase().includes(txt);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const [showCategories, setShowCategories] = useState(false);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    }
    if (showCategories) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategories]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTypeModal(false);
        setShowTarveModal(false);
        setShowPalveluModal(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const openCreateModal = (type: 'PALVELUT' | 'TARPEET') => {
    setSelectedTab(type);
    if (type === 'PALVELUT') setShowPalveluModal(true);
    else setShowTarveModal(true);
    setShowTypeModal(false);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('No JWT found in localStorage or sessionStorage. You must log in first.');
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col h-screen overflow-hidden">
      {/* Sticky Top Controls */}
      <div className="fixed top-[56px] left-0 right-0 z-30 bg-black w-full px-2 sm:px-4 border-b border-[#232329]" style={{maxWidth: '100vw', height: 144}}>
        {/* Search Bar */}
        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Hae palveluita tai tarpeita..."
              className="w-full pl-10 py-2 bg-[#18181b] border border-[#232329] rounded-md text-white placeholder-gray-300 focus:outline-none focus:border-white transition text-base"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-2">
          {['PALVELUT', 'TARPEET'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as 'PALVELUT' | 'TARPEET')}
              className={`px-3 py-1.5 text-sm uppercase rounded-full transition border font-anton ${
                selectedTab === tab
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/20 hover:border-white/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Filters */}
        <div className="flex flex-row gap-2">
          <select
            className="w-1/2 py-2 bg-[#18181b] border border-[#232329] rounded-md text-white placeholder-gray-300 focus:outline-none focus:border-white transition text-sm"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">Kaikki sijainnit</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <div className="relative w-1/2" ref={categoryDropdownRef}>
            <button
              onClick={() => setShowCategories((prev) => !prev)}
              className="w-full py-2 bg-[#18181b] border border-[#232329] rounded-md text-left text-white placeholder-gray-300 focus:outline-none focus:border-white transition text-sm"
            >
              {selectedCategories.length === 0
                ? 'Valitse kategoriat'
                : selectedCategories[0]}
            </button>
            {showCategories && (
              <div className="absolute z-20 mt-1 w-full bg-[#18181b] border border-[#232329] rounded-lg shadow-lg max-h-60 overflow-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategories([cat]);
                      setShowCategories(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-[#232329] transition-colors duration-200 flex items-center gap-2 ${
                      selectedCategories[0] === cat ? 'font-semibold' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={selectedCategories[0] === cat}
                      className="h-4 w-4 text-white border-[#232329] rounded-full focus:ring-white"
                    />
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Listings Scrollable Area */}
      <main className="flex-1 overflow-y-auto w-full pb-20" style={{maxWidth: '100vw', paddingTop: 200}}>
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={selectedTab}
            timeout={250}
            classNames="fade"
          >
            <section className="pt-2">
              <ul className="grid grid-cols-2 gap-3">
                {filteredListings.length > 0 ? (
                  filteredListings.map((item) => (
                    <li key={item.id}>
                      <div className="border border-[#232329] rounded-xl bg-[#18181b] shadow-sm">
                        <ListingCard listing={item} />
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="col-span-full text-center text-gray-500 py-10">
                    Ei löytynyt ilmoituksia.
                  </li>
                )}
              </ul>
            </section>
          </CSSTransition>
        </SwitchTransition>
      </main>

      {/* Modals */}
      {showTypeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowTypeModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl"
          >
            <button
              onClick={() => setShowTypeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Sulje"
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Valitse ilmoitustyyppi</h2>
            <div className="space-y-4">
              <button
                onClick={() => openCreateModal('TARPEET')}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 text-gray-900 bg-white rounded-xl px-6 py-4 hover:border-black hover:bg-gray-50 transition-all duration-200"
              >
                <FaHandPaper size={20} />
                <span className="font-semibold">Tarve</span>
              </button>
              <button
                onClick={() => openCreateModal('PALVELUT')}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 text-gray-900 bg-white rounded-xl px-6 py-4 hover:border-black hover:bg-gray-50 transition-all duration-200"
              >
                <FaTools size={20} />
                <span className="font-semibold">Palvelu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showTarveModal && (
        <TarveModal
          onClose={() => setShowTarveModal(false)}
          onSubmit={async (formData) => {
            try {
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              const res = await fetch(`${API_BASE_PATH}/api/tarpeet`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData,
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error('Tarpeen luonti epäonnistui', errorText);
                throw new Error(errorText);
              }

              await fetchAllListings();
              setSearchText('');
              setSelectedLocation('');
              setSelectedCategories([]);
            } catch (err) {
              console.error('Tarpeen lähetysvirhe:', err);
            } finally {
              setShowTarveModal(false);
            }
          }}
          categories={categories}
          locations={locations}
        />
      )}

      {showPalveluModal && (
        <PalveluModal
          onClose={() => setShowPalveluModal(false)}
          onSubmit={async (formData) => {
            try {
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              const res = await fetch(`${API_BASE_PATH}/api/palvelut`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData,
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error('Palvelun luonti epäonnistui', errorText);
                throw new Error(errorText);
              }

              await fetchAllListings();
              setSearchText('');
              setSelectedLocation('');
              setSelectedCategories([]);
            } catch (err) {
              console.error('Palvelun lähetysvirhe:', err);
            } finally {
              setShowPalveluModal(false);
            }
          }}
          categories={categories}
          locations={locations}
        />
      )}

      {/* Toasts */}
      {showPalveluDeletedToast && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in">
            <span>
              {location.state.showTab?.toUpperCase() === 'PALVELUT'
                ? 'Palvelu poistettu onnistuneesti'
                : 'Tarve poistettu onnistuneesti'}
            </span>
            <button
              onClick={() => setShowPalveluDeletedToast(false)}
              className="text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showCancelToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in">
          Varaus peruutettu.
          <button
            onClick={() => setShowCancelToast(false)}
            className="text-white text-lg leading-none ml-4"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;