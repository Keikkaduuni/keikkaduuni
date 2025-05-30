import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl mb-4">PALVELUYHTEYS</h3>
            <p className="text-gray-300 mb-4">
              Yhdistämme palvelujen tarjoajat ja etsijät helposti ja luotettavasti.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl mb-4">LINKIT</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Etusivu
                </Link>
              </li>
              <li>
                <Link to="/palvelut" className="text-gray-300 hover:text-white transition-colors">
                  Palvelut
                </Link>
              </li>
              <li>
                <Link to="/tietoa" className="text-gray-300 hover:text-white transition-colors">
                  Tietoa meistä
                </Link>
              </li>
              <li>
                <Link to="/rekisteroidy" className="text-gray-300 hover:text-white transition-colors">
                  Rekisteröidy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl mb-4">PALVELUT</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/palvelut" className="text-gray-300 hover:text-white transition-colors">
                  Siivous
                </Link>
              </li>
              <li>
                <Link to="/palvelut" className="text-gray-300 hover:text-white transition-colors">
                  Korjaustyöt
                </Link>
              </li>
              <li>
                <Link to="/palvelut" className="text-gray-300 hover:text-white transition-colors">
                  Opetus
                </Link>
              </li>
              <li>
                <Link to="/palvelut" className="text-gray-300 hover:text-white transition-colors">
                  IT-tuki
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl mb-4">YHTEYSTIEDOT</h3>
            <div className="space-y-3 text-gray-300">
              <p className="flex items-center">
                <Mail size={18} className="mr-2" /> info@palveluyhteys.fi
              </p>
              <p className="flex items-center">
                <Phone size={18} className="mr-2" /> +358 50 123 4567
              </p>
              <p>
                Palvelukatu 10<br />
                00100 Helsinki
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} PalveluYhteys. Kaikki oikeudet pidätetään.
            </p>
            <div className="flex space-x-6">
              <Link to="/tietosuoja" className="text-gray-400 text-sm hover:text-white transition-colors">
                Tietosuojaseloste
              </Link>
              <Link to="/kayttoehdot" className="text-gray-400 text-sm hover:text-white transition-colors">
                Käyttöehdot
              </Link>
              <Link to="/evasteet" className="text-gray-400 text-sm hover:text-white transition-colors">
                Evästekäytäntö
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;