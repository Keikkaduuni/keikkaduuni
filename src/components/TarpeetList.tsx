// src/components/TarpeetList.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5001';
const PAGE_SIZE = 10;

const TarpeetList: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
  try {
    const skip = page * PAGE_SIZE;
    const res = await axios.get(`${BACKEND_URL}/api/tarpeet`);

    const allTarpeet = Array.isArray(res.data) ? res.data : [];

    const newItems = allTarpeet.slice(skip, skip + PAGE_SIZE).map((t: any) => ({
      ...t,
      type: 'TARPEET',
      userName: t.user?.name || 'Tuntematon',
      userPhotoUrl: t.user?.profilePhoto || null,
      price: null,
      unit: null,
      rating: null,
    }));

    setListings((prev) => [...prev, ...newItems]);
    setPage((prev) => prev + 1);

    if (skip + newItems.length >= allTarpeet.length) {
      setHasMore(false);
    }
  } catch (err) {
    console.error('Failed to fetch Tarpeet:', err);
  }
}, [page]);



  // Observe scroll near bottom
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
          Ladataan lisää tarpeita...
        </div>
      )}
      {!hasMore && listings.length === 0 && (
        <p className="text-center text-gray-500 py-10">Ei löytynyt tarpeita.</p>
      )}
    </>
  );
};

export default TarpeetList;
