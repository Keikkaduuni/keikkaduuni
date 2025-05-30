import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    description?: string;
    skills?: string[];
    profilePhoto?: string;
  };
  onSave: (data: {
    name: string;
    email: string;
    description?: string;
    skills: string[];
    profilePhotoFile?: File | null;
  }) => void;
}

const Modal: React.FC<ModalProps> = ({ onClose, userData, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const objectUrlRef = useRef<string | null>(null);

  // Reset modal state on open/userData change
  useEffect(() => {
    setName(userData.name || '');
    setEmail(userData.email || '');
    setDescription(userData.description || '');
    setSkillsInput((userData.skills || []).join(', '));
    setPreviewPhoto(userData.profilePhoto || '');
    setProfilePhotoFile(null);
    setErrors({});
  }, [userData]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const previewUrl = URL.createObjectURL(file);
      objectUrlRef.current = previewUrl;
      setProfilePhotoFile(file);
      setPreviewPhoto(previewUrl);
    }
  };

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = 'Nimi vaaditaan';
    if (!email.trim()) newErrors.email = 'Sähköposti vaaditaan';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Sähköposti ei ole validi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await onSave({
      name,
      email,
      description,
      skills: skillsArray,
      profilePhotoFile,
    });

    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      >
        <motion.div
          key="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-heading"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-lg max-w-lg w-full p-6 relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-white hover:text-red-500 transition text-xl font-bold"
          >
            &times;
          </button>

          <h2 id="edit-profile-heading" className="text-2xl font-bold mb-6 text-white">
            Muokkaa profiilia
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-white">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center mb-4">
              {previewPhoto ? (
                <img
                  src={previewPhoto}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-lg mb-2"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center text-white mb-2">
                  Ei kuvaa
                </div>
              )}
              <label
                htmlFor="photo-upload"
                className="cursor-pointer px-4 py-2 bg-white text-black rounded uppercase font-semibold hover:bg-gray-200 transition select-none"
              >
                Vaihda kuva
              </label>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block mb-1 font-semibold">
                Nimi <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`w-full rounded px-3 py-2 text-black ${
                  errors.name ? 'border border-red-500' : ''
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 font-semibold">
                Sähköposti <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`w-full rounded px-3 py-2 text-black ${
                  errors.email ? 'border border-red-500' : ''
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block mb-1 font-semibold">
                Kuvaus
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded px-3 py-2 text-black"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block mb-1 font-semibold">
                Taidot (pilkulla eroteltuna)
              </label>
              <input
                id="skills"
                type="text"
                className="w-full rounded px-3 py-2 text-black"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Esim. valokuvaus, graafinen suunnittelu"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 rounded uppercase font-semibold hover:bg-gray-600 transition"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-white text-black rounded uppercase font-semibold hover:bg-gray-200 transition disabled:opacity-50"
              >
                {isSaving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
