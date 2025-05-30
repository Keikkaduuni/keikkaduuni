import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="heading-xl mb-4">404</h1>
        <h2 className="heading-md mb-6">SIVUA EI LÖYTYNYT</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Valitettavasti etsimääsi sivua ei löydy. Se saattaa olla poistettu, siirretty tai sitä ei ole koskaan ollut olemassa.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Takaisin etusivulle
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;