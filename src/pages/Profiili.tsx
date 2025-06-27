import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Settings, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '../config';

interface User {
  name?: string;
  email?: string;
  description?: string;
  skills?: string[] | string;
  profilePhoto?: string;
  companyName?: string;
  palvelut?: { id: string; title: string; description: string }[];
  tarpeet?: { id: string; title: string; description: string }[];
  savedServices?: { id: string; title: string; description: string }[];
}

const Profiili: React.FC = () => {
  const { user, fetchUser } = useContext(AuthContext) as {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    fetchUser: () => Promise<void>;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const photoUrlRef = useRef<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    companyName: '',
    description: '',
    skills: [] as string[],
    profilePhoto: '',
  });

  const syncProfileFromUser = (user: User) => {
    setPhotoError(false);
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      companyName: user.companyName || '',
      description: user.description?.trim() || '',
      skills: Array.isArray(user.skills)
        ? user.skills
        : typeof user.skills === 'string'
        ? user.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      profilePhoto: user.profilePhoto || '',
    });
  };

  useEffect(() => {
    if (user) {
      syncProfileFromUser(user);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
      }
    };
  }, []);

  const handleSave = async (updatedData: {
    name: string;
    email: string;
    companyName?: string;
    description?: string;
    skills: string[];
    profilePhotoFile?: File | null;
    removePhoto?: boolean;
  }) => {
    try {
      const formData = new FormData();
      formData.append('name', updatedData.name);
      formData.append('email', updatedData.email);
      formData.append('companyName', updatedData.companyName || '');
      formData.append('description', updatedData.description || '');
      formData.append('skills', JSON.stringify(updatedData.skills || []));

      if (updatedData.profilePhotoFile) {
        formData.append('profilePhoto', updatedData.profilePhotoFile);
      }

      if (updatedData.removePhoto) {
        formData.append('removePhoto', 'true');
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Profiilin päivitys epäonnistui');

      await fetchUser();
      setModalOpen(false);
      setPhotoError(false);
    } catch (error) {
      console.error('Profiilin päivitysvirhe:', error);
      alert('Profiilin päivittäminen epäonnistui. Yritä uudelleen.');
    }
  };

  const resolvedPhoto =
    !photoError && profileData.profilePhoto
      ? profileData.profilePhoto.startsWith('http')
        ? profileData.profilePhoto
        : `${BACKEND_URL}${profileData.profilePhoto}`
      : null;

  // Add error handling for image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Profile image failed to load:', e.currentTarget.src);
    e.currentTarget.src = '/default-avatar.svg';
  };

  if (!user) return <p>Ladataan profiilia...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-widest">PROFIILISI</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/asetukset"
            className="inline-block mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium transition"
          >
            Asetukset
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            aria-label="Asetukset"
            className="flex items-center gap-2 p-2 rounded hover:bg-white/10 transition"
          >
            <Settings className="w-6 h-6" />
            <span className="uppercase font-semibold text-sm">Muokkaa tietojasi</span>
          </button>
          <Link to="/my-work" className="flex items-center gap-2 p-2 rounded hover:bg-white/10 transition">
            <Wrench className="w-6 h-6" />
            <span className="uppercase font-semibold text-sm">TYÖT</span>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        <motion.section
          key="profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-10 mb-12"
        >
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 border-4 border-white/20 shadow-lg flex items-center justify-center">
              {resolvedPhoto ? (
                <img
                  src={resolvedPhoto}
                  alt="Profiilikuva"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A1.5 1.5 0 0118.75 21H5.25A1.5 1.5 0 013.75 20.25V19.5z"
                  />
                </svg>
              )}
            </div>
          </div>

          <div className="flex-1 text-white space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Nimi</h2>
              <p>{profileData.name}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sähköposti</h2>
              <p>{profileData.email}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Yrityksen nimi</h2>
              <p>{profileData.companyName || 'Ei määritelty'}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Kuvaus</h2>
              <p className="whitespace-pre-wrap">
                {profileData.description || 'Ei kuvausta'}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Taidot</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.length > 0 ? (
                  profileData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-white/20 rounded-full px-3 py-1 text-sm uppercase font-semibold"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>Ei taitoja lisättynä</p>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {modalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          userData={profileData}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Profiili;
