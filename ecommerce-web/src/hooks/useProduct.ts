import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';

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
            setProduct({
              id: docSnap.id,
              ...docSnap.data()
            } as Product);
          } else {
            setProduct(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching product:", err);
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
