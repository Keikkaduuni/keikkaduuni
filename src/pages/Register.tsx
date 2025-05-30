import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

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
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName || undefined,
      };

      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="heading-md">REKISTERÖIDY</h1>
            <p className="text-gray-600 mt-2">
              Luo tili ja aloita PalveluYhteyden käyttö
            </p>
          </div>

          {errorMsg && (
            <p className="mb-4 text-red-600 text-center">{errorMsg}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Nimi
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="companyName" className="block text-gray-700 mb-2">
                Yrityksen nimi (valinnainen)
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                className="input"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Sähköposti
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="esimerkki@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Salasana
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="Vähintään 8 merkkiä"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 border-gray-300 focus:ring-black"
                  checked={termsAccepted}
                  onChange={handleTermsChange}
                  disabled={loading}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  Hyväksyn{' '}
                  <Link to="/kayttoehdot" className="text-black hover:underline">
                    käyttöehdot
                  </Link>{' '}
                  ja{' '}
                  <Link to="/tietosuoja" className="text-black hover:underline">
                    tietosuojaselosteen
                  </Link>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full mb-4"
              disabled={loading}
            >
              {loading ? 'Rekisteröidytään...' : 'Rekisteröidy'}
            </button>

            <p className="text-center text-gray-600">
              Onko sinulla jo tili?{' '}
              <Link to="/kirjaudu" className="text-black hover:underline">
                Kirjaudu sisään
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

