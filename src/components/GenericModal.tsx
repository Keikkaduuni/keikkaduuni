import React from 'react';

interface GenericModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const GenericModal: React.FC<GenericModalProps> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white text-black rounded-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          aria-label="Sulje"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default GenericModal; 