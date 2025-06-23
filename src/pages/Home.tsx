// src/pages/Home.tsx

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { FaTimes, FaHandPaper, FaTools } from 'react-icons/fa';
import PalveluModal from '../components/PalveluModal';
import TarveModal from '../components/TarveModal';
import PalvelutList from '../components/PalvelutList';
import TarpeetList from '../components/TarpeetList';
import { Listing } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';



const BACKEND_URL = 'http://localhost:5001';

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
        // 👇 Clear state to avoid showing toast again on reload
        window.history.replaceState({}, document.title);
      }
    }, [location.state]);

  
   useEffect(() => {
  const wasCancelled = sessionStorage.getItem('bookingCancelled');
  if (wasCancelled) {
    setShowCancelToast(true); // state you'll define
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
        // Fetch PALVELUT
        const palveluRes = await fetch(`${BACKEND_URL}/api/palvelut`);
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

        // Fetch TARPEET
        const tarveRes = await fetch(`${BACKEND_URL}/api/tarpeet`);
        if (!tarveRes.ok) throw new Error('Failed to fetch tarpeet');
        const tarveItems: any[] = await tarveRes.json(); // ✅ directly the array


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

        // Merge, sort by date
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

  const categoryRef = useRef<HTMLDivElement>(null);
  const [showCategories, setShowCategories] = useState(false);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="flex flex-col bg-gray-50 min-h-screen text-black">
      <main className="flex-grow">
        <div className="max-w-screen-xl mx-auto bg-white rounded-xl overflow-hidden mt-8 mb-12 px-6">
          {/* Hero */}
          <section className="relative h-[35vh] flex items-center justify-center text-center overflow-hidden bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-black to-black opacity-90 blur-sm" />
            <div className="relative z-10 px-4 text-white">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-wider mb-2">KEIKKADUUNI</h2>
              <p className="text-lg sm:text-xl tracking-wide">YHDISTETÄÄN TEKIJÄT JA TARVITSIJAT</p>
            </div>
          </section>

          {/* Lisää ilmoitus */}
          <div className="text-center mt-6 mb-10">
            <button
              onClick={() => setShowTypeModal(true)}
              className="bg-black text-white px-8 py-3 rounded-xl uppercase font-semibold hover:bg-gray-800 transition"
            >
              Lisää ilmoitus
            </button>
          </div>

          {/* Valitse tyyppi */}
          {showTypeModal && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
              onClick={() => setShowTypeModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-gray-900 border border-white rounded-2xl w-full max-w-sm p-6 space-y-6"
              >
                <button
                  onClick={() => setShowTypeModal(false)}
                  className="absolute top-3 right-3 text-white hover:text-gray-300 transition"
                  aria-label="Sulje"
                >
                  <FaTimes size={20} />
                </button>
                <h2 className="text-center text-white text-2xl font-bold mb-6">VALITSE ILMOITUSTYYPPI</h2>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => openCreateModal('TARPEET')}
                    className="flex items-center justify-center gap-2 border border-white text-white bg-black rounded-lg px-4 py-3 hover:bg-gray-800 transition"
                    aria-label="Valitse Tarve"
                  >
                    <FaHandPaper size={18} />
                    <span className="font-semibold uppercase">Tarve</span>
                  </button>
                  <button
                    onClick={() => openCreateModal('PALVELUT')}
                    className="flex items-center justify-center gap-2 border border-white text-white bg-black rounded-lg px-4 py-3 hover:bg-gray-800 transition"
                    aria-label="Valitse Palvelu"
                  >
                    <FaTools size={18} />
                    <span className="font-semibold uppercase">Palvelu</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowTypeModal(false)}
                  className="block mx-auto mt-6 text-center text-gray-400 hover:text-white text-sm transition"
                >
                  Peruuta
                </button>
              </div>
            </div>
          )}

          {/* Modaalit */}
          {showTarveModal && (
            <TarveModal
              onClose={() => setShowTarveModal(false)}
              onSubmit={async (formData) => {
                try {
                  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                  const res = await fetch(`${BACKEND_URL}/api/tarpeet`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined, // ✅ vain Authorization
                    body: formData, // ✅ antaa selaimen asettaa Content-Type automaattisesti
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
                  const res = await fetch(`${BACKEND_URL}/api/palvelut`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined, // ✅ korjattu tännekin
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
  
          {showPalveluDeletedToast && (
            <div className="fixed top-6 right-6 z-50">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
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
  <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in">
    Varaus peruutettu.
    <button
      onClick={() => setShowCancelToast(false)}
      className="text-white text-lg leading-none ml-4"
    >
      ×
    </button>
  </div>
)}


          
          {/* Välilehdet */}
          <div className="flex justify-center space-x-4 mb-6">
            {['PALVELUT', 'TARPEET'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as 'PALVELUT' | 'TARPEET')}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  selectedTab === tab
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
                aria-pressed={selectedTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Suodattimet */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 pt-2">
            <input
              type="text"
              placeholder="Hae otsikolla tai kuvauksella..."
              className="border rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black transition"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              className="border rounded-lg px-4 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-black transition"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Kaikki sijainnit</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <div className="relative w-full md:w-1/3" ref={categoryRef}>
              <button
                onClick={() => setShowCategories((prev) => !prev)}
                className="border rounded-lg px-4 py-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-black transition"
              >
                {selectedCategories.length === 0
                  ? 'Valitse kategoriat'
                  : `${selectedCategories.length} valittuna: ${selectedCategories.join(', ')}`}
              </button>
              {showCategories && (
                <ul
                  className="absolute z-20 max-h-60 overflow-auto border border-gray-300 rounded-lg bg-white mt-1 w-full shadow-lg"
                  role="listbox"
                >
                  {categories.map((cat) => (
                    <li
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`cursor-pointer px-4 py-2 hover:bg-black hover:text-white transition flex items-center gap-2 ${
                        selectedCategories.includes(cat) ? 'font-bold bg-gray-100' : ''
                      }`}
                      role="option"
                      aria-selected={selectedCategories.includes(cat)}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedCategories.includes(cat)}
                        tabIndex={-1}
                        className="cursor-pointer"
                      />
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Lista */}
          <section className="mb-12 pb-6">
            {selectedTab === 'PALVELUT' ? (
              <PalvelutList listings={filteredListings} />
            ) : (
              <TarpeetList listings={filteredListings} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
