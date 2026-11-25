import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';
import { isPublicProduct } from '@/lib/productFilters';

interface CartItem extends Product {
  quantity: number;
}

interface AppliedCoupon {
  code: string;
  discountPercent: number;
  description: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: AppliedCoupon | null;
  subtotal: number;
  totalPrice: number;
  totalItems: number;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  sanitizeCart: () => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const filterValidCartItems = (items: CartItem[]): CartItem[] =>
  (items || []).filter(
    (item) =>
      isPublicProduct(item) &&
      typeof item.price === 'number' &&
      Number.isFinite(item.price) &&
      item.price > 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
  );

const calculateTotals = (items: CartItem[], coupon: AppliedCoupon | null) => {
  const valid = filterValidCartItems(items);
  const totalItems = valid.reduce((total, item) => total + item.quantity, 0);
  const subtotal = valid.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
  const totalPrice = Math.max(0, subtotal - discount);
  return { totalItems, subtotal, totalPrice };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      subtotal: 0,
      totalPrice: 0,
      totalItems: 0,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (product, quantity = 1) => {
        // Nunca permitir agregar al carrito artículos en $0, ocultos o internos
        if (!isPublicProduct(product) || typeof product.price !== 'number' || product.price <= 0 || quantity <= 0) {
          return;
        }
        set((state) => {
          const currentValid = filterValidCartItems(state.items);
          const existingItem = currentValid.find((item) => item.id === product.id);
          const newItems = existingItem
            ? currentValid.map((item) =>
                item.id === product.id
                  ? { ...item, price: product.price, quantity: item.quantity + quantity }
                  : item
              )
            : [...currentValid, { ...product, quantity }];
          return {
            items: newItems,
            isOpen: true,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      removeItem: (productId) => {
        set((state) => {
          const newItems = filterValidCartItems(state.items).filter((item) => item.id !== productId);
          return {
            items: newItems,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      updateQuantity: (productId, quantity) => {
        set((state) => {
          const newItems = filterValidCartItems(
            state.items.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            )
          );
          return {
            items: newItems,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      sanitizeCart: () => {
        set((state) => {
          const clean = filterValidCartItems(state.items);
          return {
            items: clean,
            ...calculateTotals(clean, state.appliedCoupon),
          };
        });
      },
      clearCart: () => set({ items: [], appliedCoupon: null, subtotal: 0, totalPrice: 0, totalItems: 0 }),
      applyCoupon: (code) => {
        const regex = /^PCCLUB-(\d+)-[A-Z0-9]+$/i;
        const match = code.trim().match(regex);
        if (!match) {
          return { success: false, message: 'Cupón inválido. Formato incorrecto.' };
        }
        const discountPercent = parseInt(match[1], 10);
        if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent >= 100) {
          return { success: false, message: 'Porcentaje de descuento inválido.' };
        }
        const coupon = {
          code: code.toUpperCase().trim(),
          discountPercent,
          description: `Descuento PClink Club del ${discountPercent}%`,
        };
        set((state) => ({
          appliedCoupon: coupon,
          ...calculateTotals(state.items, coupon),
        }));
        return { success: true, message: `¡Cupón de ${discountPercent}% aplicado con éxito!` };
      },
      removeCoupon: () => {
        set((state) => ({
          appliedCoupon: null,
          ...calculateTotals(state.items, null),
        }));
      },
    }),
    {
      name: 'pclink-cart-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sanitizeCart();
        }
      },
    }
  )
);
