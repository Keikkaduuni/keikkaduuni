import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Filter, ChevronDown } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';

const Services: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'Kaikki kategoriat' },
    { id: 'cleaning', name: 'Siivous' },
    { id: 'repairs', name: 'Korjaustyöt' },
    { id: 'teaching', name: 'Opetus' },
    { id: 'it', name: 'IT-tuki' },
    { id: 'gardening', name: 'Puutarhanhoito' },
    { id: 'health', name: 'Terveys ja hyvinvointi' },
    { id: 'events', name: 'Tapahtumat' },
  ];

  const locations = [
    { id: 'all', name: 'Kaikki sijainnit' },
    { id: 'helsinki', name: 'Helsinki' },
    { id: 'espoo', name: 'Espoo' },
    { id: 'vantaa', name: 'Vantaa' },
    { id: 'turku', name: 'Turku' },
    { id: 'tampere', name: 'Tampere' },
    { id: 'oulu', name: 'Oulu' },
  ];

  const services = [
    {
      id: 1,
      title: 'Kodin siivous',
      provider: 'Siivouspalvelu Oy',
      rating: 4.8,
      reviews: 124,
      image: 'https://images.pexels.com/photos/5591580/pexels-photo-5591580.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '35€/h',
      location: 'Helsinki',
      category: 'cleaning'
    },
    {
      id: 2,
      title: 'IT-tukipalvelut',
      provider: 'TechApu Finland',
      rating: 4.7,
      reviews: 86,
      image: 'https://images.pexels.com/photos/6963944/pexels-photo-6963944.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '45€/h',
      location: 'Espoo',
      category: 'it'
    },
    {
      id: 3,
      title: 'Puutarhanhoito',
      provider: 'Vihreä Peukalo',
      rating: 4.9,
      reviews: 93,
      image: 'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '40€/h',
      location: 'Vantaa',
      category: 'gardening'
    },
    {
      id: 4,
      title: 'Matematiikan opettaja',
      provider: 'OpeTutoring',
      rating: 4.9,
      reviews: 65,
      image: 'https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '50€/h',
      location: 'Helsinki',
      category: 'teaching'
    },
    {
      id: 5,
      title: 'Kodin remontit',
      provider: 'RemppaApu',
      rating: 4.6,
      reviews: 112,
      image: 'https://images.pexels.com/photos/8092372/pexels-photo-8092372.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '55€/h',
      location: 'Tampere',
      category: 'repairs'
    },
    {
      id: 6,
      title: 'Hieronta',
      provider: 'HyväOlo',
      rating: 4.8,
      reviews: 78,
      image: 'https://images.pexels.com/photos/3865548/pexels-photo-3865548.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '65€/h',
      location: 'Turku',
      category: 'health'
    },
    {
      id: 7,
      title: 'Tapahtumajärjestäjä',
      provider: 'EventPro Finland',
      rating: 4.7,
      reviews: 42,
      image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: 'Tarjouspyyntö',
      location: 'Helsinki',
      category: 'events'
    },
    {
      id: 8,
      title: 'Toimistosiivous',
      provider: 'PuhtaaksiPro',
      rating: 4.5,
      reviews: 56,
      image: 'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '38€/h',
      location: 'Oulu',
      category: 'cleaning'
    },
    {
      id: 9,
      title: 'Tietokoneen korjaus',
      provider: 'PCFix',
      rating: 4.6,
      reviews: 61,
      image: 'https://images.pexels.com/photos/257881/pexels-photo-257881.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      price: '60€/h',
      location: 'Espoo',
      category: 'it'
    },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || service.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-black text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="heading-lg mb-6">SELAA PALVELUJA</h1>
            <p className="text-xl mb-8">
              Etsi ja löydä juuri sinulle sopivat palvelut tuhansien ammattilaisten joukosta
            </p>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Etsi palveluja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input py-4 pl-12 pr-4 w-full"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50 border-b border-gray-200">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <button 
                className="md:hidden flex items-center mr-4 p-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2" />
                <span>Suodattimet</span>
                <ChevronDown className={`ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`md:flex items-center gap-4 ${showFilters ? 'block' : 'hidden'}`}>
                <div className="mb-2 md:mb-0">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input py-2"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="input py-2"
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
              <p className="text-gray-600">
                {filteredServices.length} palvelua löydetty
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          {filteredServices.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredServices.map((service) => (
                <motion.div key={service.id} variants={itemVariants}>
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-600 mb-4">Ei hakua vastaavia palveluja</p>
              <p className="text-gray-500">Kokeile eri hakusanoja tai suodattimia</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;