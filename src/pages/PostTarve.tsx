import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PostTarve() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/tarpeet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, contact }),
      });
      if (res.ok) {
        navigate('/tarpeet');
      } else {
        alert('Error submitting tarve');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div>
      <h2>Lisää uusi Tarve</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Otsikko" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Kuvaus" value={description} onChange={e => setDescription(e.target.value)} required />
        <input placeholder="Yhteystiedot" value={contact} onChange={e => setContact(e.target.value)} required />
        <button type="submit">Lähetä</button>
      </form>
    </div>
  );
}

export default PostTarve;
