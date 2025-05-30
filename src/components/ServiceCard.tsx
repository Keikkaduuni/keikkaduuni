import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceProps {
  service: {
    id: number;
    title: string;
    provider: string;
    rating: number;
    reviews: number;
    image: string;
    price: string;
    location: string;
  };
}

const ServiceCard: React.FC<ServiceProps> = ({ service }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-200 overflow-hidden group"
    >
      <div className="relative h-60 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-black text-white py-1 px-3">
          {service.price}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{service.location}</span>
        </div>
        
        <h3 className="text-xl font-anton mb-2">
          <Link to={`/palvelut/${service.id}`} className="hover:text-gray-600 transition-colors">
            {service.title}
          </Link>
        </h3>
        
        <p className="text-gray-500 mb-3">{service.provider}</p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${
                  i < Math.floor(service.rating) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {service.rating} ({service.reviews} arvostelua)
          </span>
        </div>
        
        <Link 
          to={`/palvelut/${service.id}`}
          className="btn-primary w-full text-center"
        >
          Katso tarkemmin
        </Link>
      </div>
    </motion.div>
  );
};

export default ServiceCard;