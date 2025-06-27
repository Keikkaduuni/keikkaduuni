import React from 'react';

interface SlideInPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const SlideInPanel: React.FC<SlideInPanelProps> = ({ open, onClose, children, title }) => {
  return (
    <div className={`fixed z-50 inset-0 pointer-events-none`}> {/* Overlay */}
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-950 to-black border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto`}
        style={{ minWidth: 320 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white truncate">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Sulje"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto h-full p-6">{children}</div>
      </div>
    </div>
  );
};

export default SlideInPanel; 