// src/components/PalvelutList.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5001';
const PAGE_SIZE = 10;

const PalvelutList: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    try {
      const skip = page * PAGE_SIZE;
      const res = await axios.get(`${BACKEND_URL}/api/palvelut?skip=${skip}&take=${PAGE_SIZE}`);
      const newItems = Array.isArray(res.data.items)
         ? res.data.items.map((p: any) => ({
            ...p,
            type: 'PALVELUT',
            userName: p.user?.name || 'Tuntematon',
            userPhotoUrl: p.user?.profilePhoto || null,
            rating: null,
          }))
        : [];



      const total = res.data.total;

      setListings((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);

      if (listings.length + newItems.length >= total) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch Palvelut:', err);
    }
  }, [page, listings.length]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.disconnect();
      }
    };
  }, [loadMore, hasMore]);

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((item) => (
          <li key={item.id}>
            <ListingCard listing={item} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div ref={loaderRef} className="text-center py-4 text-gray-500">
          Ladataan lisää palveluja...
        </div>
      )}
      {!hasMore && listings.length === 0 && (
        <p className="text-center text-gray-500 py-10">Ei löytynyt palveluja.</p>
      )}
    </>
  );
};

export default PalvelutList;
