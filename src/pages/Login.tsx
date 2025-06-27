import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid email or password');
      }

      const data = await response.json();
      console.log('📥 Response data from backend:', data);


      // Use context login to handle storage properly
      login(data.token, data.user, rememberMe);
      localStorage.setItem('userId', data.user.id); // ✅ stores userId for ChatThread
      console.log('📤 Called login() with token:', data.token);


      alert(`Tervetuloa takaisin, ${data.user.name}!`);
      navigate('/profiili');
    } catch (err: any) {
      setError(err.message || 'Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.');
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
              window.location.href = '/';
            }
          }}
          className="w-full max-w-md mb-6 rounded-t-3xl bg-[#18181b] shadow-2xl px-6 pt-8 pb-10 flex flex-col"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            <h1 className="text-lg font-bold text-white mb-1 font-inter">Kirjaudu sisään</h1>
            <p className="text-gray-400 text-sm font-inter">Tervetuloa takaisin Keikkaduuniin!</p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-white font-inter mb-2 text-xs font-semibold">Sähköposti</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                placeholder="esimerkki@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-white font-inter mb-2 text-xs font-semibold">Salasana</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition text-base font-inter"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-red-500 text-center font-semibold text-sm font-inter animate-pulse"
              >
                {error}
              </motion.p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 border-white/20 bg-black text-accent focus:ring-white rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-white font-inter">Muista minut</label>
              </div>
              <div className="text-xs">
                <Link to="/reset-password" className="text-accent hover:underline font-inter">Unohditko salasanasi?</Link>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black font-bold font-inter text-base shadow-md hover:bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Kirjaudu
            </button>
          </form>
          <div className="mt-8 border-t border-white/10 pt-6 flex flex-col items-center">
            <span className="text-gray-400 text-sm font-inter mb-2">Eikö sinulla ole tiliä?</span>
            <Link
              to="/rekisteroidy"
              className="w-full py-3 rounded-xl bg-black border border-white/20 text-white font-bold font-inter text-base text-center hover:bg-white/10 transition"
            >
              Rekisteröidy
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;
