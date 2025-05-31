import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  name?: string;
  email?: string;
  description?: string;
  skills?: string[]; // always array here
  profilePhoto?: string;
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
    description: '',
    skills: [] as string[],
    profilePhoto: '',
  });

  // Sync state from context
  const syncProfileFromUser = (user: User) => {
    setPhotoError(false);
    setProfileData({
      name: user.name || '',
      email: user.email || '',
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
    description?: string;
    skills: string[];
    profilePhotoFile?: File | null;
    removePhoto?: boolean;
  }) => {
    try {
      const formData = new FormData();
      formData.append('name', updatedData.name);
      formData.append('email', updatedData.email);
      formData.append('description', updatedData.description || '');
      formData.append('skills', JSON.stringify(updatedData.skills || []));

      if (updatedData.profilePhotoFile) {
        formData.append('profilePhoto', updatedData.profilePhotoFile);
      }

      if (updatedData.removePhoto) {
        formData.append('removePhoto', 'true');
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Profiilin päivitys epäonnistui');

      await fetchUser(); // refresh context from DB
      setModalOpen(false);
      setPhotoError(false);
    } catch (error) {
      console.error('Profiilin päivitysvirhe:', error);
      alert('Profiilin päivittäminen epäonnistui. Yritä uudelleen.');
    }
  };

  if (!user) return <p>Ladataan profiilia...</p>;

  const resolvedPhoto =
    !photoError && profileData.profilePhoto
      ? profileData.profilePhoto.startsWith('http')
        ? profileData.profilePhoto
        : `http://localhost:5001${profileData.profilePhoto}`
      : 'https://www.svgrepo.com/show/501943/user.svg';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-widest">PROFIILISI</h1>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="Asetukset"
          className="flex items-center gap-2 p-2 rounded hover:bg-white/10 transition"
        >
          <Settings className="w-6 h-6" />
          <span className="uppercase font-semibold text-sm">Muokkaa tietojasi</span>
        </button>
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
            <img
              src={resolvedPhoto}
              alt="Profiilikuva"
              onError={() => setPhotoError(true)}
              className="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-lg"
            />
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

