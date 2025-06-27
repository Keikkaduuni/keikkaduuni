import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white transition-colors duration-300 flex flex-col items-center justify-start pt-12">
      <div className="w-full max-w-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Anton, sans-serif' }}>Asetukset</h1>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg">Vaihda teema</span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium transition"
          >
            {theme === 'light' ? 'Vaalea' : 'Tumma'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 