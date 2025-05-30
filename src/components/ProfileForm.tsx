import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const ProfileForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills: '',        // comma-separated string in UI
    profilePhoto: null,
  });

  useEffect(() => {
    // Fetch current user profile on mount
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/profile', {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const { name, description, skills } = res.data;

        // skills might come as array, convert to CSV string for input
        const skillsStr = Array.isArray(skills) ? skills.join(', ') : '';

        setFormData((prev) => ({
          ...prev,
          name: name || '',
          description: description || '',
          skills: skillsStr,
        }));
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    data.append('name', formData.name);
    data.append('description', formData.description);

    // Convert skills CSV string to JSON stringified array for backend
    const skillsArray = formData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    data.append('skills', JSON.stringify(skillsArray));

    if (formData.profilePhoto) {
      data.append('profilePhoto', formData.profilePhoto);
    }

    try {
      await axios.put('http://localhost:5001/api/profile', data, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your name"
        className="w-full border p-2 rounded"
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Short bio"
        className="w-full border p-2 rounded"
      />
      <input
        type="text"
        name="skills"
        value={formData.skills}
        onChange={handleChange}
        placeholder="Skills (e.g. React, Node, Prisma)"
        className="w-full border p-2 rounded"
      />
      <input
        type="file"
        name="profilePhoto"
        accept="image/*"
        onChange={handleChange}
        className="w-full"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Update Profile
      </button>
       {modalOpen && user && (
      <Modal
    onClose={() => setModalOpen(false)}
    userData={user}
    onSave={handleSave}
    />
 )}
 
    </form>
  );
};

export default ProfileForm;
