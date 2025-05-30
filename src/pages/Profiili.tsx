import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  name?: string;
  email?: string;
  description?: string;
  skills?: string[];
  profilePhoto?: string;
  palvelut?: { id: string; title: string; description: string }[];
  tarpeet?: { id: string; title: string; description: string }[];
  savedServices?: { id: string; title: string; description: string }[];
}

const Profiili: React.FC = () => {
  const { user, setUser } = useContext(AuthContext) as {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
  };

  const [modalOpen, setModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    description: '',
    skills: [] as string[],
    profilePhoto: '',
  });

  const photoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        description: user.description || '',
        skills: user.skills || [],
        profilePhoto: user.profilePhoto || '',
      });
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
  }) => {
    try {
      const formData = new FormData();
      formData.append('name', updatedData.name);
      formData.append('email', updatedData.email);
      formData.append('description', updatedData.description || '');
      formData.append('skills', JSON.stringify(updatedData.skills));

      if (updatedData.profilePhotoFile) {
        formData.append('profilePhoto', updatedData.profilePhotoFile);
      }

      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Profiilin päivitys epäonnistui');
      }

      const updatedUser = await response.json();

      let newPhotoUrl = profileData.profilePhoto;
      if (updatedData.profilePhotoFile) {
        if (photoUrlRef.current) {
          URL.revokeObjectURL(photoUrlRef.current);
        }
        newPhotoUrl = URL.createObjectURL(updatedData.profilePhotoFile);
        photoUrlRef.current = newPhotoUrl;
      }

      setProfileData({
        name: updatedUser.name,
        email: updatedUser.email,
        description: updatedUser.description || '',
        skills: updatedUser.skills || [],
        profilePhoto: newPhotoUrl,
      });

      setUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email,
        description: updatedUser.description || '',
        skills: updatedUser.skills || [],
        profilePhoto: newPhotoUrl,
        palvelut: updatedUser.palvelut || user.palvelut || [],
        tarpeet: updatedUser.tarpeet || user.tarpeet || [],
        savedServices: updatedUser.savedServices || user.savedServices || [],
      });


      setModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Profiilin päivittäminen epäonnistui. Yritä uudelleen.');
    }
  };

  if (!user) {
    return <p>Ladataan profiilia...</p>;
  }

  const { palvelut, tarpeet, savedServices } = user;

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
              src={
                profileData.profilePhoto
                  ? profileData.profilePhoto.startsWith('http')
                    ? profileData.profilePhoto
                    : `http://localhost:5001${profileData.profilePhoto}`
                  : '/default-profile.png'
              }
              alt="Profiilikuva"
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
              <p className="whitespace-pre-wrap">{profileData.description || 'Ei kuvausta'}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Taidot</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.skills?.length ? (
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

      {/* Palveluni */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold uppercase mb-4 border-b border-white/20 pb-2">Palveluni</h2>
        {palvelut?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {palvelut.map((service) => (
              <div
                key={service.id}
                className="bg-white/10 p-4 rounded shadow hover:bg-white/20 transition"
              >
                <h3 className="font-semibold text-lg">{service.title}</h3>
                <p className="text-sm mt-1">{service.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Ei palveluita lisättynä</p>
        )}
      </motion.section>

      {/* Tarpeeni */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold uppercase mb-4 border-b border-white/20 pb-2">Tarpeeni</h2>
        {tarpeet?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tarpeet.map((need) => (
              <div
                key={need.id}
                className="bg-white/10 p-4 rounded shadow hover:bg-white/20 transition"
              >
                <h3 className="font-semibold text-lg">{need.title}</h3>
                <p className="text-sm mt-1">{need.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Ei tarpeita lisättynä</p>
        )}
      </motion.section>

      {/* Tallennetut palvelut */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold uppercase mb-4 border-b border-white/20 pb-2">Tallennetut palvelut</h2>
        {savedServices?.length ? (
          <div className="flex overflow-x-auto gap-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
            {savedServices.map((saved) => (
              <div
                key={saved.id}
                className="min-w-[250px] bg-white/10 p-4 rounded shadow hover:bg-white/20 transition flex-shrink-0"
              >
                <h3 className="font-semibold text-lg">{saved.title}</h3>
                <p className="text-sm mt-1">{saved.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Ei tallennettuja palveluita</p>
        )}
      </motion.section>

      {/* Support Picture */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold uppercase mb-4 border-b border-white/20 pb-2">Tuki</h2>
        <div className="flex justify-center">
          <img
            src="/support-picture.png"
            alt="Tuki kuvitus"
            className="max-w-xs rounded shadow-lg"
          />
        </div>
      </motion.section>

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

