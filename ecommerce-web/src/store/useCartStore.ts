import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';

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
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const calculateTotals = (items: CartItem[], coupon: AppliedCoupon | null) => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
  const totalPrice = subtotal - discount;
  return { totalItems, subtotal, totalPrice };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      subtotal: 0,
      totalPrice: 0,
      totalItems: 0,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          const newItems = existingItem
            ? state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [...state.items, { ...product, quantity }];
          return {
            items: newItems,
            isOpen: true,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== productId);
          return {
            items: newItems,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      updateQuantity: (productId, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          );
          return {
            items: newItems,
            ...calculateTotals(newItems, state.appliedCoupon),
          };
        });
      },
      clearCart: () => set({ items: [], appliedCoupon: null, subtotal: 0, totalPrice: 0, totalItems: 0 }),
      applyCoupon: (code) => {
        const regex = /^PCCLUB-(\d+)-[A-Z0-9]+$/i;
        const match = code.trim().match(regex);
        if (!match) {
          return { success: false, message: "Cupón inválido. Formato incorrecto." };
        }
        const discountPercent = parseInt(match[1], 10);
        if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
          return { success: false, message: "Porcentaje de descuento inválido." };
        }
        const coupon = {
          code: code.toUpperCase().trim(),
          discountPercent,
          description: `Descuento PClink Club del ${discountPercent}%`
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
    }
  )
);
