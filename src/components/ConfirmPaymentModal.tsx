import React, { useState } from 'react';

interface ConfirmPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  price: number;
}

const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  open,
  onClose,
  onConfirm,
  price,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-black">
        <h2 className="text-xl font-bold mb-4">Vahvista maksu</h2>

        <p className="text-sm mb-3">
          Sinulta veloitetaan yhteensä:{' '}
          <strong>{price.toFixed(2)} €</strong>
        </p>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Maksu pidetään Keikkaduunissa turvassa ja vapautetaan palveluntarjoajalle, 
          kun työ on tehty ja molemmat osapuolet ovat tyytyväisiä.
        </p>

        <label className="flex items-start gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>
            Olen lukenut ja hyväksyn{' '}
            <a href="/ehdot" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">
              käyttöehdot ja varausehdot
            </a>.
          </span>
        </label>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            onClick={onClose}
          >
            Peruuta
          </button>
          <button
            disabled={!agreed}
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${
              agreed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-400 cursor-not-allowed'
            }`}
          >
            Siirry maksamaan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPaymentModal;
