import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import heic2any from 'heic2any';
import { convertHeicToJpeg, isHeicFile } from '../utils/heicConverter';
import { BACKEND_URL } from '../config';

const ProfileForm = () => {
  const { user, fetchUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    profilePhoto: '',
    description: '',
    skills: '',
  });

  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [nameError, setNameError] = useState('');
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('🟡 Incoming user from context:', user);
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        profilePhoto: user.profilePhoto || '',
        description: user.description || '',
        skills: Array.isArray(user.skills)
          ? user.skills.join(', ')
          : user.skills || '',
      });
      setPreviewUrl(null);
      setRemovePhoto(false);
      setNewPhotoFile(null);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setNameError('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isHeicFile(file)) {
      console.log('🔄 ProfileForm - Attempting HEIC/HEIF conversion...');
      const result = await convertHeicToJpeg(file);
      
      if (result.success && result.file) {
        console.log('✅ ProfileForm - HEIC/HEIF conversion successful:', result.file.name);
        setNewPhotoFile(result.file);
        setPreviewUrl(URL.createObjectURL(result.file));
        setRemovePhoto(false);
      } else {
        console.error('❌ ProfileForm - HEIC/HEIF conversion failed:', result.error);
        setNewPhotoFile(null);
        setPreviewUrl(null);
        setRemovePhoto(false);
        alert(result.error || 'HEIC/HEIF-kuvan muuntaminen epäonnistui.');
      }
      return;
    }
    if (file) {
      setNewPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: '' }));
    setPreviewUrl(null);
    setNewPhotoFile(null);
    setRemovePhoto(true);
  };

  const checkNameTaken = async (name: string) => {
    try {
      setCheckingName(true);
      const res = await axios.get(`${BACKEND_URL}/api/check-name`, {
        params: { name, email: user?.email || '' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCheckingName(false);
      return res.data?.taken;
    } catch (err) {
      console.error('Name check failed:', err);
      setCheckingName(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setNameError('Nimi vaaditaan');
      return;
    }

    const isTaken = await checkNameTaken(trimmedName);
    if (isTaken) {
      setNameError('Nimi on jo käytössä');
      return;
    }

      const payload = new FormData();
      payload.append('name', trimmedName);
      payload.append('companyName', formData.companyName.trim() || ''); // ✅ REQUIRED
      payload.append('description', formData.description || '');
      payload.append(
        'skills',
        JSON.stringify(
          formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      if (removePhoto) payload.append('removePhoto', 'true');
      if (newPhotoFile) payload.append('profilePhoto', newPhotoFile);

    for (let pair of payload.entries()) {
      console.log(`📦 ${pair[0]}:`, pair[1]);
    }

    try {
      const res = await axios.put(`${BACKEND_URL}/api/profile`, payload, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.status === 200) {
        console.log('✅ Server returned updated user:', res.data.user);

        await fetchUser();

        // ⚡ Update company name from context user after refresh
        setTimeout(() => {
          if (user) {
            setFormData((prev) => ({
              ...prev,
              companyName: user.companyName || '',
            }));
            console.log('🔁 Updated formData.companyName after fetch:', user.companyName);
          }
        }, 0);

        alert('Profiili päivitetty!');
      }
    } catch (err) {
      console.error('❌ Päivitys epäonnistui:', err);
      alert('Päivitys epäonnistui');
    }
  };

  console.log("🧠 Current formData.companyName:", formData.companyName);

  // Add error handling for image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Profile image failed to load:', e.currentTarget.src);
    e.currentTarget.src = '/default-avatar.svg';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg text-black">
      <h2 className="text-xl font-bold mb-4">Muokkaa profiilia</h2>

      <label className="block mb-2">Sähköposti</label>
      <input
        type="email"
        value={user?.email || ''}
        disabled
        className="w-full border p-2 mb-4 bg-gray-100 cursor-not-allowed"
      />

      <label className="block mb-1">Nimi</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        className={`w-full border p-2 mb-1 ${nameError ? 'border-red-500' : ''}`}
      />
      {nameError && <p className="text-sm text-red-600 mb-4">{nameError}</p>}

      <label className="block mb-2">Yrityksen nimi</label>
      <input
        type="text"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        className="w-full border p-2 mb-4"
      />

      <label className="block mb-2">Uusi profiilikuva</label>
      <input type="file" accept="image/*" onChange={handleFileChange} className="w-full mb-2" />

      {(previewUrl || formData.profilePhoto) && !removePhoto && (
        <div className="mb-4 text-center">
          <img
            src={previewUrl || `${BACKEND_URL}${formData.profilePhoto}`}
            alt="Profile"
            className="w-24 h-24 object-cover rounded-full mx-auto"
            onError={handleImageError}
          />
          <button type="button" onClick={handleRemovePhoto} className="mt-2 text-sm text-red-600 hover:underline">
            Poista kuva
          </button>
        </div>
      )}

      <label className="block mb-2">Kuvaus</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        className="w-full border p-2 mb-4"
      />

      <label className="block mb-2">Osaamiset (pilkuilla eroteltuna)</label>
      <input
        type="text"
        name="skills"
        value={formData.skills}
        onChange={handleChange}
        className="w-full border p-2 mb-4"
      />

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        disabled={checkingName}
      >
        {checkingName ? 'Tarkistetaan...' : 'Tallenna muutokset'}
      </button>
    </form>
  );
};

export default ProfileForm;
