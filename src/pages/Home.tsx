import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

type Listing = {
  id: string;
  title: string;
  type: 'PALVELUT' | 'TARPEET';
  category: string;
  location: string;
  description?: string;
  createdAt: string;
};

const BACKEND_URL = 'http://localhost:5001';

const Home = () => {
  // State
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PALVELUT' | 'TARPEET'>('PALVELUT');
  const [showCategories, setShowCategories] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'PALVELUT' as 'PALVELUT' | 'TARPEET',
    category: '',
    location: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories from CSV once on mount
  useEffect(() => {
    fetch('/KATEGORIA.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Filter out empty or malformed rows
            const cats = results.data
              .map((row: any) => row.Name || Object.values(row)[0])
              .filter((cat: any) => typeof cat === 'string' && cat.trim() !== '')
              .sort((a: string, b: string) => a.localeCompare(b));
            setCategories(cats);
          }
        });
      });
  }, []);

  // Load locations from CSV once on mount
  useEffect(() => {
    fetch('/SIJAINTI.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const locs = results.data
              .map((row: any) => row.Name || Object.values(row)[0])
              .filter((loc: any) => typeof loc === 'string' && loc.trim() !== '')
              .sort((a: string, b: string) => a.localeCompare(b));
            setLocations(locs);
          }
        });
      });
  }, []);

  // Fetch listings from backend with current filters
  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      params.append('type', activeTab);

      // Support multiple categories by appending multiple category params
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('category', cat));
      }

      if (selectedLocation) params.append('location', selectedLocation);
      if (searchText) params.append('search', searchText.trim());

      const res = await fetch(`${BACKEND_URL}/listings?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch listings');

      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    }
  };

  // Fetch listings initially and every time filters change
  useEffect(() => {
    fetchListings();
  }, [activeTab, selectedCategories, selectedLocation, searchText]);

  // Auto-refresh every 15 seconds for live data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListings();
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab, selectedCategories, selectedLocation, searchText]);

  // Category selection toggle (multi-select)
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Close categories dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form input change handler
  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form submission to backend for creating new listing
  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) return setFormErrors('Nimi on pakollinen.');
    if (!formData.category) return setFormErrors('Valitse kategoria.');
    if (!formData.location) return setFormErrors('Valitse sijainti.');

    setFormErrors(null);
    setIsSubmitting(true);

    try {
      // Send POST request
      const res = await fetch(`${BACKEND_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Virhe palvelimella');
      }
      const created = await res.json();

      // Immediately show new listing at the top
      setListings(prev => [created, ...prev]);

      // Reset form and close modal
      setShowCreateForm(false);
      setFormData({
        title: '',
        type: activeTab,
        category: '',
        location: '',
        description: '',
      });
    } catch (e: any) {
      setFormErrors(e.message || 'Virhe');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateForm(false);
    };
    if (showCreateForm) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showCreateForm]);

  return (
    <main className="min-h-screen bg-white text-black p-4 relative">
      {/* Header */}
      <section className="relative h-[50vh] flex items-center justify-center text-center text-white overflow-hidden mb-6">
        {/* Black gradient background behind text */}
        <div className="absolute inset-0 bg-gradient-to-br from-black to-black opacity-90 blur-sm"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide mb-2">KEIKKADUUNI</h1>
          <p className="text-sm sm:text-base tracking-widest">YHDISTETÄÄN TEKIJÄT JA TARVITSIJAT</p>
        </div>
      </section>

      {/* Add Listing Button */}
      <div className="text-center mt-4 mb-10">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-black text-white text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3 rounded-xl uppercase font-semibold hover:bg-gray-800 transition duration-300 ease-in-out"
        >
          Lisää ilmoitus
        </button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-6">
        {['PALVELUT', 'TARPEET'].map(tab => (
          <button
            key={tab}
            className={`px-5 py-2 rounded-full font-semibold transition duration-300 ease-in-out ${
              activeTab === tab ? 'bg-black text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab(tab as 'PALVELUT' | 'TARPEET')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Hae otsikolla tai kuvauksella..."
          className="border rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black transition"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          aria-label="Haku otsikolla tai kuvauksella"
        />

        <select
          className="border rounded-lg px-4 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-black transition"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          aria-label="Valitse sijainti"
        >
          <option value="">Kaikki sijainnit</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <div className="relative w-full md:w-1/3" ref={categoryRef}>
          <button
            onClick={() => setShowCategories(prev => !prev)}
            className="border rounded-lg px-4 py-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-black transition"
            aria-haspopup="listbox"
            aria-expanded={showCategories}
            aria-label="Valitse kategoriat"
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
              {categories.map(cat => (
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

      {/* Listings */}
      <section className="max-w-5xl mx-auto px-2">
        {listings.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Ei löytynyt ilmoituksia hakuehdoilla.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map(listing => (
              <li
                key={listing.id}
                className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                aria-label={`${listing.title}, ${listing.category}, ${listing.location}`}
              >
                <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{listing.category} — {listing.location}</p>
                {listing.description && (
                  <p className="text-sm text-gray-700">{listing.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create Listing Modal */}
      {showCreateForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={onSubmitForm}
            className="bg-white rounded-lg p-6 max-w-md w-full space-y-4"
            noValidate
          >
            <h2 className="text-xl font-semibold">Lisää ilmoitus</h2>

            {formErrors && <p className="text-red-600">{formErrors}</p>}

            <label className="block">
              <span className="font-semibold">Tyyppi</span>
              <select
                name="type"
                value={formData.type}
                onChange={onFormChange}
                className="border rounded px-3 py-2 w-full"
                aria-required="true"
              >
                <option value="PALVELUT">PALVELUT</option>
                <option value="TARPEET">TARPEET</option>
              </select>
            </label>

            <label className="block">
              <span className="font-semibold">Nimi</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={onFormChange}
                className="border rounded px-3 py-2 w-full"
                aria-required="true"
              />
            </label>

            <label className="block">
              <span className="font-semibold">Kategoria</span>
              <select
                name="category"
                value={formData.category}
                onChange={onFormChange}
                className="border rounded px-3 py-2 w-full"
                aria-required="true"
              >
                <option value="">Valitse kategoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-semibold">Sijainti</span>
              <select
                name="location"
                value={formData.location}
                onChange={onFormChange}
                className="border rounded px-3 py-2 w-full"
                aria-required="true"
              >
                <option value="">Valitse sijainti</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-semibold">Kuvaus (vapaaehtoinen)</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={onFormChange}
                className="border rounded px-3 py-2 w-full"
                rows={3}
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default Home;

