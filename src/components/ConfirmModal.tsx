// components/ConfirmModal.tsx
import React from 'react';

const ConfirmModal = ({ title, onConfirm, onCancel }: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-white/10 rounded-lg p-6 w-full max-w-sm text-white">
        <div className="text-center text-lg mb-4">{title}</div>
        <div className="flex justify-between gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg"
          >
            ❌ Ei
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-white text-black hover:bg-gray-300 py-2 rounded-lg"
          >
            ✅ Kyllä
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
