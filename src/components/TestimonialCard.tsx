import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface TestimonialProps {
  testimonial: {
    id: number;
    name: string;
    role: string;
    image: string;
    quote: string;
    rating: number;
  };
}

const TestimonialCard: React.FC<TestimonialProps> = ({ testimonial }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-8 border border-gray-200 h-full flex flex-col"
    >
      <div className="mb-6">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={20}
            className={`inline-block mr-1 ${
              i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      
      <blockquote className="text-gray-700 mb-6 flex-grow">
        "{testimonial.quote}"
      </blockquote>
      
      <div className="flex items-center">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <div className="font-bold">{testimonial.name}</div>
          <div className="text-gray-500 text-sm">{testimonial.role}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;