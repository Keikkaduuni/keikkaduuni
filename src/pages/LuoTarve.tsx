// Example: src/pages/LuoTarve.tsx
import React, { useState } from 'react';
import TarveModal from '../components/TarveModal';
import { BACKEND_URL } from '../config';

const LuoTarve: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleCreateTarve = async (formData: FormData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/tarpeet`, {
        method: 'POST',
        // ⚠️ Do NOT set `Content-Type` here!
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(errorData.error || 'Virhe luodessa tarvetta.');
        return;
      }

      const created = await response.json();
      console.log('Tarve created:', created);
      // Optionally refresh the list of tarpeet or show a success message…
    } catch (err) {
      console.error('Network/CORS error:', err);
      alert('Yhteysvirhe: ' + err.message);
    }
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Luo uusi tarve</button>
      {showModal && (
        <TarveModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTarve}
          categories={['Siivous', 'Rakentaminen', 'Piha']}
          locations={['Helsinki', 'Espoo', 'Tampere']}
        />
      )}
    </div>
  );
};

export default LuoTarve;
