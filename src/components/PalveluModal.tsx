// src/components/PalveluModal.tsx

import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';

type PalveluModalProps = {
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  categories: string[];
  locations: string[];
};

const PalveluModal: React.FC<PalveluModalProps> = ({ onClose, onSubmit, categories, locations }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'hour' | 'urakka'>('hour');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl('');
    }
  }, [photo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLightbox) {
          setShowLightbox(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, showLightbox]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !category || !location || !price || !photo) {
      setError('Täytä kaikki pakolliset kentät.');
      return;
    }

    if (photo.size > 5 * 1024 * 1024) {
      setError('Kuvan koko ei saa ylittää 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('location', location);
    formData.append('price', price);
    formData.append('unit', unit);
    formData.append('photo', photo);
    
    console.log('Submitting with:', {
        title,
        description,
        category,
        location,
        price,
        unit,
        photo,
      });
 
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {}
    setIsSubmitting(false);
    onClose();
  };

  return (
    <>
      {showLightbox && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
            >
              <FaTimes size={24} />
            </button>
            <img
              src={previewUrl}
              alt="Täysikokoinen esikatselu"
              className="max-h-[90vh] max-w-[90vw] rounded"
            />
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-8"
        onClick={handleBackgroundClick}
      >
        <div
          ref={modalRef}
          className="bg-white w-full max-w-6xl rounded-xl p-6 relative overflow-y-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-black bg-white rounded-full p-1 hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>

          <h2 className="text-2xl mb-4" style={{ fontFamily: 'Anton, sans-serif' }}>
            TEE PALVELU
          </h2>
          <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Anton, sans-serif' }}>
            Pakolliset kentät on merkitty tähdellä (*)
          </p>

          {error && (
            <p className="text-red-600 mb-4" style={{ fontFamily: 'Anton, sans-serif' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-semibold block mb-1" style={{ fontFamily: 'Anton, sans-serif' }}>
                Palvelun nimi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-black rounded px-4 py-2 text-black font-sans focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1" style={{ fontFamily: 'Anton, sans-serif' }}>
                Kuvaus palvelusta *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border border-black rounded px-4 py-2 text-black font-sans focus:outline-none resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-semibold block mb-1">Kategoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-black rounded px-4 py-2 text-black font-sans"
                  required
                >
                  <option value="">Valitse kategoria</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Sijainti *</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-black rounded px-4 py-2 text-black font-sans"
                  required
                >
                  <option value="">Valitse sijainti</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-semibold block mb-1">Hinta (€) *</label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-black rounded px-4 py-2 text-black font-sans"
                  required
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Hintaperuste *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'hour' | 'urakka')}
                  className="w-full border border-black rounded px-4 py-2 text-black font-sans"
                  required
                >
                  <option value="hour">€/tunti</option>
                  <option value="urakka">€/urakka</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 flex items-center">
                <FaCamera className="mr-2" /> Valitse kuva *
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="hidden"
                required={!photo}
              />
              <label
                htmlFor="photo-input"
                className="inline-block px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300 font-sans"
              >
                📷 Valitse kuva
              </label>
              {previewUrl && (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt="Esikatselu"
                    className="h-36 rounded object-cover border border-gray-300 cursor-pointer"
                    onClick={() => setShowLightbox(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="mt-2 text-red-600 font-sans hover:underline"
                  >
                    Poista kuva
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50 font-sans"
                style={{ fontFamily: 'Anton, sans-serif' }}
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä palvelu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PalveluModal;
