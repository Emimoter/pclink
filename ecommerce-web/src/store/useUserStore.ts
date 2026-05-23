import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Coupon {
  code: string;
  discountPercent: number;
  redeemedAt: number;
}

interface UserStore {
  savedCoupons: Coupon[];
  pointsSpent: number;
  addSavedCoupon: (coupon: Coupon, costPoints: number) => void;
  removeSavedCoupon: (code: string) => void;
  clearUserStore: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      savedCoupons: [],
      pointsSpent: 0,
      addSavedCoupon: (coupon, costPoints) => {
        set((state) => {
          // Avoid duplicate coupon codes
          if (state.savedCoupons.some((c) => c.code === coupon.code)) {
            return state;
          }
          return { 
            savedCoupons: [...state.savedCoupons, coupon],
            pointsSpent: state.pointsSpent + costPoints
          };
        });
      },
      removeSavedCoupon: (code) => {
        set((state) => ({
          savedCoupons: state.savedCoupons.filter((c) => c.code !== code),
        }));
      },
      clearUserStore: () => set({ savedCoupons: [], pointsSpent: 0 }),
    }),
    {
      name: 'pclink-user-storage',
    }
  )
);
