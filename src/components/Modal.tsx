import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import heic2any from 'heic2any';
import { convertHeicToJpeg, isHeicFile } from '../utils/heicConverter';
import { BACKEND_URL } from '../config';

interface ModalProps {
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    companyName?: string;
    description?: string;
    skills?: string[];
    profilePhoto?: string;
  };
  onSave: (data: {
    name: string;
    companyName?: string;
    email: string;
    description?: string;
    skills: string[];
    profilePhotoFile?: File | null;
    removePhoto?: boolean;
  }) => void;
}

const Modal: React.FC<ModalProps> = ({ onClose, userData, onSave }) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [cropping, setCropping] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    setName(userData.name || '');
    setCompanyName(userData.companyName || '');
    setDescription(userData.description || '');
    setSkills((userData.skills || []).join(', '));
    setPhotoFile(null);
    setRemovePhoto(false);
    setError(null);
    setCropping(false);
    setImageSrc(null);
    setCroppedAreaPixels(null);

    if (userData.profilePhoto) {
      const fullUrl = userData.profilePhoto.startsWith('http')
        ? userData.profilePhoto
        : `${BACKEND_URL}${userData.profilePhoto}`;
      console.log('🔧 Loading profile photo:', fullUrl);
      setPreview(fullUrl);
    } else {
      setPreview(null);
    }
  }, [userData]);

  useEffect(() => {
    if (photoFile) {
      const objectUrl = URL.createObjectURL(photoFile);
      previewUrlRef.current = objectUrl;
      setPreview(objectUrl);
      return () => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      };
    }
  }, [photoFile]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isHeicFile(file)) {
      console.log('🔄 Modal - Attempting HEIC/HEIF conversion...');
      const result = await convertHeicToJpeg(file);
      
      if (result.success && result.file) {
        console.log('✅ Modal - HEIC/HEIF conversion successful:', result.file.name);
        setImageSrc(URL.createObjectURL(result.file));
        setPhotoFile(result.file);
        setCropping(true);
        setError(null);
      } else {
        console.error('❌ Modal - HEIC/HEIF conversion failed:', result.error);
        setError(result.error || 'HEIC/HEIF-kuvan muuntaminen epäonnistui.');
        setPhotoFile(null);
        setCropping(false);
      }
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!croppedBlob) return;
    const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPreview(previewUrl);
    setPhotoFile(file);
    setRemovePhoto(false);
    setImageSrc(null);
    setCropping(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nimi vaaditaan');
      return;
    }

    try {
      const [nameRes, companyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/check-name?name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(userData.email)}`),
        fetch(`${BACKEND_URL}/api/check-company?companyName=${encodeURIComponent(companyName.trim())}&email=${encodeURIComponent(userData.email)}`),
      ]);

      const nameData = await nameRes.json();
      const companyData = await companyRes.json();

      if (nameData.taken) {
        setError('Tämä nimi on jo käytössä');
        return;
      }

      if (companyData.taken) {
        setError('Yrityksen nimi on jo käytössä');
        return;
      }

      const cleanSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      onSave({
        name: name.trim(),
        companyName: companyName.trim() || '',
        email: userData.email,
        description: description?.trim() || '',
        skills: cleanSkills,
        profilePhotoFile: removePhoto ? null : photoFile,
        removePhoto,
      });

      setError(null);
      onClose();
      document.body.classList.add('fade-out');
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      console.error('Name/company check failed', err);
      setError('Virhe tarkistuksessa');
    }
  };

  const resolvedPreview = removePhoto || !preview ? null : preview;

  // Add error handling for image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Image failed to load:', e.currentTarget.src);
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white text-black rounded-xl w-full max-w-xl p-6 space-y-4 relative"
      >
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden relative group bg-gray-200">
          {resolvedPreview ? (
            <img src={resolvedPreview} alt="Profiilikuva" className="w-full h-full object-cover" onError={handleImageError} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
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
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
          >
            <div className="flex flex-col items-center text-white text-sm">
              <Pencil className="w-4 h-4 mb-1" />
              Muokkaa
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {(preview || userData.profilePhoto) && !removePhoto && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => {
                setPhotoFile(null);
                setPreview('');
                setRemovePhoto(true);
              }}
              className="text-gray-600 text-sm flex items-center gap-1 hover:text-red-600 transition"
            >
              <Trash2 size={14} /> Poista profiilikuva
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-center mt-16 mb-4">Muokkaa profiilia</h2>
        {error && <p className="text-red-600 font-semibold text-sm text-center -mt-2">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nimi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Yrityksen nimi</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setError(null);
              }}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Kuvaus</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Taidot (pilkuilla eroteltuna)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Peruuta
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Tallenna
          </button>
        </div>

        {cropping && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="relative w-[90vw] h-[80vh] bg-white rounded-xl overflow-hidden">
              <div className="absolute inset-0 z-10">
                <Cropper
                  image={imageSrc!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={handleCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="absolute bottom-4 right-4 z-20 flex gap-3">
                <button
                  onClick={() => setCropping(false)}
                  className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
                >
                  Peruuta
                </button>
                <button
                  onClick={handleCropSave}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Käytä kuvaa
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Modal;

