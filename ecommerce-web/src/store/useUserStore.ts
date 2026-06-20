import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';

export interface Coupon {
  code: string;
  discountPercent: number;
  redeemedAt: number;
}

interface UserStore {
  savedCoupons: Coupon[];
  pointsSpent: number;
  syncedUid: string | null;
  addSavedCoupon: (coupon: Coupon, costPoints: number) => Promise<void>;
  removeSavedCoupon: (code: string) => Promise<void>;
  syncWithFirestore: (uid: string) => Promise<void>;
  clearUserStore: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      savedCoupons: [],
      pointsSpent: 0,
      syncedUid: null,
      addSavedCoupon: async (coupon, costPoints) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
          // 1. Save coupon in Firestore
          await setDoc(doc(db, "users", user.uid, "coupons", coupon.code), {
            discountPercent: coupon.discountPercent,
            redeemedAt: coupon.redeemedAt,
          });

          // 2. Update points spent in Firestore user doc
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          const currentPointsSpent = userDoc.exists() ? (userDoc.data().pointsSpent || 0) : 0;
          await setDoc(userDocRef, { pointsSpent: currentPointsSpent + costPoints }, { merge: true });

          // 3. Update local Zustand state
          set((state) => {
            if (state.savedCoupons.some((c) => c.code === coupon.code)) {
              return state;
            }
            return {
              savedCoupons: [...state.savedCoupons, coupon],
              pointsSpent: state.pointsSpent + costPoints,
            };
          });
        } catch (err) {
          console.error("Error saving coupon to Firestore:", err);
        }
      },
      removeSavedCoupon: async (code) => {
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteDoc(doc(db, "users", user.uid, "coupons", code));
          } catch (err) {
            console.error("Error deleting coupon from Firestore:", err);
          }
        }
        set((state) => ({
          savedCoupons: state.savedCoupons.filter((c) => c.code !== code),
        }));
      },
      syncWithFirestore: async (uid) => {
        if (get().syncedUid === uid) return;

        try {
          // 1. Fetch user doc for pointsSpent
          const userDoc = await getDoc(doc(db, "users", uid));
          let dbPointsSpent = 0;
          if (userDoc.exists()) {
            dbPointsSpent = userDoc.data().pointsSpent || 0;
          }

          // 2. Fetch user's coupons subcollection
          const couponsSnap = await getDocs(collection(db, "users", uid, "coupons"));
          const dbCoupons: Coupon[] = [];
          couponsSnap.forEach((doc) => {
            const data = doc.data();
            dbCoupons.push({
              code: doc.id,
              discountPercent: data.discountPercent || 0,
              redeemedAt: data.redeemedAt || Date.now(),
            });
          });

          set({
            savedCoupons: dbCoupons,
            pointsSpent: dbPointsSpent,
            syncedUid: uid,
          });
        } catch (err) {
          console.error("Error syncing user store with Firestore:", err);
        }
      },
      clearUserStore: () => set({ savedCoupons: [], pointsSpent: 0, syncedUid: null }),
    }),
    {
      name: 'pclink-user-storage',
    }
  )
);
