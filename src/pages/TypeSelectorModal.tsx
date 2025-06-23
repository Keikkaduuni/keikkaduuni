// TypeSelectorModal.tsx

import React from 'react';
import { FaHandPaper, FaTools, FaTimes } from 'react-icons/fa';

type Props = {
  onSelect: (type: 'PALVELUT' | 'TARPEET') => void;
  onClose: () => void;
};

/**
 * TypeSelectorModal
 * -----------------
 * - Näyttää modaalin, jossa käyttäjä valitsee “PALVELUT” tai “TARPEET”
 * - Tausta on puoliläpinäkyvä musta
 * - Itse modal-laatikko on tummanharmaa (tai musta), valkoinen reuna ja pyöristetyt kulmat
 * - Napit ovat mustat, valkoisella reunuksella ja kuvakkeilla
 * - Sulje-ikoni (X) oikeassa yläkulmassa, valkoinen
 */
export default function TypeSelectorModal({ onSelect, onClose }: Props) {
  return (
    // 1) Tumma overlay-kokonaisuus
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={onClose}
    >
      {/* 2) Itse modal-laatikko */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-11/12 max-w-sm bg-black border border-white rounded-2xl p-6"
      >
        {/* 3) Sulje-ikoni oikeassa yläkulmassa */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-300 transition"
          aria-label="Sulje"
        >
          <FaTimes size={20} />
        </button>

        {/* 4) Otsikko */}
        <h2 className="text-center text-white text-2xl font-bold mb-6">
          PALVELU VAI TARVE?
        </h2>

        {/* 5) Napit */}
        <div className="flex flex-col gap-4">
          {/* 5.1. TARVE */}
          <button
            onClick={() => onSelect('TARPEET')}
            className="flex items-center justify-center gap-2 border border-white text-white bg-black rounded-lg px-4 py-3 hover:bg-gray-800 transition"
            aria-label="Valitse Tarve"
          >
            <FaHandPaper size={18} />
            <span className="font-semibold uppercase">Tarve</span>
          </button>

          {/* 5.2. PALVELUT */}
          <button
            onClick={() => onSelect('PALVELUT')}
            className="flex items-center justify-center gap-2 border border-white text-white bg-black rounded-lg px-4 py-3 hover:bg-gray-800 transition"
            aria-label="Valitse Palvelu"
          >
            <FaTools size={18} />
            <span className="font-semibold uppercase">Palvelu</span>
          </button>
        </div>

        {/* 6) Peruuta-linkki (tekstinä modalin alareunassa) */}
        <button
          onClick={onClose}
          className="block mx-auto mt-6 text-center text-gray-400 hover:text-white text-sm transition"
        >
          Peruuta
        </button>
      </div>
    </div>
  );
}
