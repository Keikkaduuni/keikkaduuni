import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { BACKEND_URL } from '../config';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert('Hyväksy rekisteröityäksesi');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      alert('Rekisteröinti onnistui!');
      navigate('/kirjaudu');
    } catch (error: any) {
      setErrorMsg(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center min-h-screen bg-black bg-opacity-80">
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.point.y > 200) {
              window.location.href = '/kirjaudu';
            }
          }}
          className="w-full max-w-md mb-6 rounded-t-3xl bg-[#18181b] shadow-2xl px-6 pt-8 pb-10 flex flex-col"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            <h1 className="text-lg font-bold text-white mb-1 font-inter">Rekisteröidy</h1>
            <p className="text-gray-400 text-sm font-inter">Luo tili ja aloita Keikkaduunin käyttö</p>
          </div>
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="text-red-500 text-center font-semibold text-sm font-inter animate-pulse mb-4"
            >
              {errorMsg}
            </motion.p>
          )}
          <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="block text-white font-inter mb-2 text-xs font-semibold">Nimi</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-white font-inter mb-2 text-xs font-semibold">Yrityksen nimi (valinnainen)</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-white font-inter mb-2 text-xs font-semibold">Sähköposti</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                placeholder="esimerkki@email.com"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-white font-inter mb-2 text-xs font-semibold">Salasana</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                  placeholder="Vähintään 8 merkkiä"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 mt-1 border-white/20 bg-black text-accent focus:ring-white rounded"
                checked={termsAccepted}
                onChange={handleTermsChange}
                disabled={loading}
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-white font-inter">
                Hyväksyn{' '}
                <Link to="/kayttoehdot" className="text-accent hover:underline">käyttöehdot</Link>{' '}ja{' '}
                <Link to="/tietosuoja" className="text-accent hover:underline">tietosuojaselosteen</Link>
              </label>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black font-bold font-inter text-base shadow-md hover:bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-white/30"
              disabled={loading}
            >
              {loading ? 'Rekisteröidytään...' : 'Rekisteröidy'}
            </button>
          </form>
          <div className="mt-8 border-t border-white/10 pt-6 flex flex-col items-center">
            <span className="text-gray-400 text-sm font-inter mb-2">Onko sinulla jo tili?</span>
            <Link
              to="/kirjaudu"
              className="w-full py-3 rounded-xl bg-black border border-white/20 text-white font-bold font-inter text-base text-center hover:bg-white/10 transition"
            >
              Kirjaudu sisään
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Register;

