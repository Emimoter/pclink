import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';
import { isPublicProduct } from '@/lib/productFilters';

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    try {
      const docRef = doc(db, 'products', id);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const candidate = {
              id: docSnap.id,
              ...docSnap.data(),
            } as Product;

            setProduct(isPublicProduct(candidate) ? candidate : null);
          } else {
            setProduct(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching product:', err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [id]);

  return { product, loading, error };
}
