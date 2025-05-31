import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ProfileForm = () => {
  const { user, fetchUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    profilePhoto: '',
    description: '',
    skills: '',
  });

  const [removePhoto, setRemovePhoto] = useState(false);
  const [nameError, setNameError] = useState('');
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        profilePhoto: user.profilePhoto || '',
        description: user.description || '',
        skills: Array.isArray(user.skills)
          ? user.skills.join(', ')
          : user.skills || '',
      });
      setRemovePhoto(false);
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'name') {
      setNameError('');
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: '' }));
    setRemovePhoto(true);
  };

  const checkNameTaken = async (name: string) => {
    try {
      setCheckingName(true);
      const res = await axios.get('http://localhost:5001/api/check-name', {
        params: {
          name: name.trim(),
          userId: user?.email || '', // send current user's email to exclude self
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setCheckingName(false);
      return res.data?.taken;
    } catch (err) {
      console.error('Virhe nimen tarkistuksessa:', err);
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

    try {
      const token = localStorage.getItem('token');
      const payload = new FormData();

      payload.append('name', trimmedName);
      payload.append('companyName', formData.companyName.trim());
      payload.append('description', formData.description.trim() || '');
      payload.append(
        'skills',
        JSON.stringify(
          formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );

      if (removePhoto) {
        payload.append('removePhoto', 'true');
      }

      const res = await axios.put('http://localhost:5001/api/profile', payload, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        await fetchUser();
        alert('Profiili päivitetty!');
        setRemovePhoto(false);
      }
    } catch (err) {
      console.error(err);
      alert('Päivitys epäonnistui');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg text-black"
    >
      <h2 className="text-xl font-bold mb-4">Muokkaa profiilia</h2>

      {user?.email && (
        <>
          <label className="block mb-2">Sähköposti</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full border p-2 mb-4 bg-gray-100 cursor-not-allowed"
          />
        </>
      )}

      <label className="block mb-1">Nimi</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        className={`w-full border p-2 mb-1 ${nameError ? 'border-red-500' : ''}`}
      />
      {nameError && (
        <p className="text-sm text-red-600 mb-4">{nameError}</p>
      )}

      <label className="block mb-2">Yrityksen nimi</label>
      <input
        type="text"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        className="w-full border p-2 mb-4"
      />

      <label className="block mb-2">Profiilikuva (URL)</label>
      <input
        type="text"
        name="profilePhoto"
        value={formData.profilePhoto}
        onChange={handleChange}
        className="w-full border p-2 mb-2"
        disabled
      />

      {formData.profilePhoto && !removePhoto && (
        <div className="mb-4 text-center">
          <img
            src={
              formData.profilePhoto.startsWith('http')
                ? formData.profilePhoto
                : `http://localhost:5001${formData.profilePhoto}`
            }
            alt="Profile preview"
            className="w-24 h-24 object-cover rounded-full mx-auto"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
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
