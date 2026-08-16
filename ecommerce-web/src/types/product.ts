export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  category: string;
  subCategory?: string;
  images: string[];
  isOffer: boolean;
  isFeatured: boolean;
  externalSource?: string;
  onDemand?: boolean;
  deliveryDays?: number;
  deliveryInfo?: string;
  brand?: string;
  model?: string;
  specs?: Record<string, string>;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}
