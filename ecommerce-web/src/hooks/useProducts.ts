import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';

interface UseProductsOptions {
  category?: string;
  isOffer?: boolean;
  isFeatured?: boolean;
  limit?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (options.category) {
        constraints.push(where('category', '==', options.category));
      }
      if (options.isOffer) {
        constraints.push(where('isOffer', '==', true));
      }
      if (options.isFeatured) {
        constraints.push(where('isFeatured', '==', true));
      }
      
      // We generally want to order by creation or alphabetically, but indexing might be required.
      // If the admin app doesn't have complex indexes, we might just query and filter client side for some things.
      // For now, let's just use the basic constraints.
      
      const q = query(collection(db, 'products'), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedProducts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          setProducts(fetchedProducts);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching products:", err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [options.category, options.isOffer, options.isFeatured]);

  return { products, loading, error };
}
