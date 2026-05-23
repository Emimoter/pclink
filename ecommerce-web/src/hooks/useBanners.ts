import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  accentColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  targetCategory?: string;
  targetProductId?: string;
  badge?: string;
  imageUrl?: string;
  active: boolean;
  order: number;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'banners'),
        where('active', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedBanners = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Banner[];
          
          // Sort locally in memory to avoid requiring a composite index in Firestore
          fetchedBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          setBanners(fetchedBanners);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching banners:", err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, []);

  return { banners, loading, error };
}
