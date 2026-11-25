import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';
import { isPublicProduct, isOfferProduct } from '@/lib/productFilters';
import { getFirestoreCategoryKey } from '@/lib/categories';

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
      const resolvedCategory = options.category
        ? getFirestoreCategoryKey(options.category)
        : undefined;

      if (resolvedCategory && resolvedCategory !== 'OFFERS') {
        constraints.push(where('category', '==', resolvedCategory));
      }
      if (options.isOffer) {
        constraints.push(where('isOffer', '==', true));
      }
      if (options.isFeatured) {
        constraints.push(where('isFeatured', '==', true));
      }

      const q = query(collection(db, 'products'), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let fetchedProducts = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Product[];

          // Filtro centralizado: excluye $0, ocultos, ST, LI y repuestos de taller
          fetchedProducts = fetchedProducts.filter(isPublicProduct);

          if (resolvedCategory === 'OFFERS') {
            fetchedProducts = fetchedProducts.filter(isOfferProduct);
          }

          setProducts(fetchedProducts);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching products:', err);
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
