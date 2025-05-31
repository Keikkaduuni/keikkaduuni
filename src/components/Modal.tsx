import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

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
  const [name, setName] = useState(userData.name || '');
  const [companyName, setCompanyName] = useState(userData.companyName || '');
  const [description, setDescription] = useState(userData.description || '');
  const [skills, setSkills] = useState((userData.skills || []).join(', '));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(userData.profilePhoto || '');
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
        fetch(`http://localhost:5001/api/check-name?name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(userData.email)}`),
        fetch(`http://localhost:5001/api/check-company?companyName=${encodeURIComponent(companyName.trim())}&email=${encodeURIComponent(userData.email)}`),
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
        .filter((s) => s !== '');

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
    } catch (err) {
      console.error('Name/company check failed', err);
      setError('Virhe tarkistuksessa');
    }
  };

  const resolvedPreview =
    removePhoto || !preview
      ? 'https://www.svgrepo.com/show/501943/user.svg'
      : preview.startsWith('http')
      ? preview
      : `http://localhost:5001${preview}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white text-black rounded-xl w-full max-w-xl p-6 space-y-4 relative"
      >
        {/* Profile Image */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden relative group bg-gray-200">
          <img
            src={resolvedPreview}
            alt="Profiilikuva"
            className="w-full h-full object-cover"
          />
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

        {/* Remove Photo */}
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

        {/* Title and Error */}
        <h2 className="text-2xl font-bold text-center mt-16 mb-4">Muokkaa profiilia</h2>
        {error && (
          <p className="text-red-600 font-semibold text-sm text-center -mt-2">{error}</p>
        )}

        {/* Fields */}
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

        {/* Buttons */}
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

        {/* Cropping Modal */}
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
