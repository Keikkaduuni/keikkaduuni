import React, { useEffect, useRef, useState } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';
import { getToken } from '../utils/token';
import Papa from 'papaparse';
import axios from 'axios';
import ReactDOM from 'react-dom';

const BACKEND_URL = 'http://localhost:5001';

const MuokkaaTarveModal = ({ tarve, onClose, onUpdated }) => {
  const [title, setTitle] = useState(tarve.title);
  const [description, setDescription] = useState(tarve.description);
  const [category, setCategory] = useState(tarve.category || '');
  const [location, setLocation] = useState(tarve.location || '');
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(tarve.photoUrl || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    const loadCSV = (filePath, setter) => {
      fetch(filePath)
        .then(res => res.text())
        .then(text => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
              const values = results.data
                .map(row => row.Name || Object.values(row)[0])
                .filter(v => typeof v === 'string' && v.trim())
                .sort((a, b) => a.localeCompare(b));
              setter(values);
            },
          });
        })
        .catch(() => setter([]));
    };
    loadCSV('/KATEGORIA.csv', setCategories);
    loadCSV('/SIJAINTI.csv', setLocations);
  }, []);

  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [photo]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = 'Tämä on pakollinen*';
    if (!description.trim()) errs.description = 'Tämä on pakollinen*';
    if (!category) errs.category = 'Tämä on pakollinen*';
    if (!location) errs.location = 'Tämä on pakollinen*';
    if (!previewUrl && !photo) errs.photo = 'Tämä on pakollinen*';

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('location', location);
    if (photo) formData.append('photo', photo);
    else if (previewUrl) formData.append('existingPhoto', previewUrl);

    setIsSubmitting(true);
    try {
      const token = getToken();
      await axios.put(`${BACKEND_URL}/api/tarpeet/${tarve.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Tarpeen muokkaus epäonnistui.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl rounded-xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-black">
          <FaTimes size={40} />
        </button>
        <h2 className="text-2xl mb-2 font-anton text-black">MUOKKAA TARVETTA</h2>
        <p className="text-sm text-gray-600 mb-6 font-anton">Pakolliset kentät on merkitty tähdellä (*)</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-black font-anton">Otsikko *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`w-full border px-4 py-2 rounded text-black ${fieldErrors.title ? 'border-red-500' : 'border-black'}`}
            />
            {fieldErrors.title && <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block font-semibold text-black font-anton">Kuvaus *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className={`w-full border px-4 py-2 rounded text-black resize-none ${fieldErrors.description ? 'border-red-500' : 'border-black'}`}
            />
            {fieldErrors.description && <p className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-black font-anton">Kategoria *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`w-full border px-4 py-2 rounded text-black ${fieldErrors.category ? 'border-red-500' : 'border-black'}`}
              >
                <option value="">Valitse kategoria</option>
                {categories.map(cat => <option key={cat}>{cat}</option>)}
              </select>
              {fieldErrors.category && <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>}
            </div>

            <div>
              <label className="block font-semibold text-black font-anton">Sijainti *</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={`w-full border px-4 py-2 rounded text-black ${fieldErrors.location ? 'border-red-500' : 'border-black'}`}
              >
                <option value="">Valitse sijainti</option>
                {locations.map(loc => <option key={loc}>{loc}</option>)}
              </select>
              {fieldErrors.location && <p className="text-red-500 text-sm mt-1">{fieldErrors.location}</p>}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-black font-anton flex items-center">
              <FaCamera className="mr-2" /> Valokuva *
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={e => setPhoto(e.target.files[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="photo-input"
              className={`inline-block mt-2 px-4 py-2 rounded cursor-pointer ${fieldErrors.photo ? 'bg-red-100 border border-red-500' : 'bg-gray-200'} hover:bg-gray-300 font-anton text-black`}
            >
              📷 Valitse kuva
            </label>
            {fieldErrors.photo && <p className="text-red-500 text-sm mt-1">{fieldErrors.photo}</p>}
            {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 h-36 rounded object-cover border" />}
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto bg-black text-white px-6 py-3 rounded-xl text-base font-semibold font-anton transition flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Tallennetaan...
                </>
              ) : (
                'Tallenna muutokset'
              )}
            </button>
          </div>
        </form>

        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="animate-pulse text-lg font-semibold text-black">Tallennetaan...</div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default MuokkaaTarveModal;