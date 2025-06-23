import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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
      const response = await fetch('http://localhost:5001/api/auth/login', {
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
    <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="heading-md">KIRJAUDU SISÄÄN</h1>
            <p className="text-gray-600 mt-2">
              Tervetuloa takaisin Keikkaduuniin!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Sähköposti
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="esimerkki@email.com"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Salasana
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 mb-4 text-center font-semibold">{error}</p>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 border-gray-300 focus:ring-black"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Muista minut
                </label>
              </div>
              <div className="text-sm">
                <Link to="/reset-password" className="text-black hover:underline">
                  Unohditko salasanasi?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mb-4">
              Kirjaudu
            </button>

            <p className="text-center text-gray-600">
              Eikö sinulla ole tiliä?{' '}
              <Link to="/rekisteroidy" className="text-black hover:underline">
                Rekisteröidy
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
