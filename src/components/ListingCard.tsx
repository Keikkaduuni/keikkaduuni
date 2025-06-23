// src/components/ListingCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

type ListingCardProps = {
  listing: Listing;
};

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const detailPath =
    listing.type === 'PALVELUT'
      ? `/palvelut/${listing.id}`
      : `/tarpeet/${listing.id}`;

  const photoSrc = listing.photoUrl || '';


  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Link
        to={detailPath}
        state={{ fromTab: listing.type.toLowerCase() }}
        className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col h-full"
      >

        {listing.photoUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={photoSrc}
              alt={`Kuva: ${listing.title}`}
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}

        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-lg font-bold text-black truncate mb-1 sm:mb-2">
            {listing.title}
          </h3>

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-gray-700 line-clamp-2 sm:mb-3 mb-2">
              {listing.description}
            </p>
          )}

          {/* Category + Location */}
          <div className="text-sm text-gray-600 space-y-1 sm:mb-3 mb-2">
            <div>
              <span className="font-medium">Kategoria:</span> {listing.category}
            </div>
            <div className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-gray-500 text-xs" />
              <span>{listing.location}</span>
            </div>
          </div>

          {/* Price */}
          {listing.type === 'PALVELUT' && listing.price && listing.unit && (
            <div className="mt-auto">
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-black">
                Alkaen {listing.price} € / {listing.unit === 'hour' ? 'h' : listing.unit}
              </div>
            </div>
          )}

          {/* Rating */}
          {typeof listing.rating === 'number' && (
            <div className="mt-2 flex items-center text-yellow-500 text-sm font-semibold">
              <FaStar className="mr-1" />
              {listing.rating.toFixed(1)}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ListingCard;
