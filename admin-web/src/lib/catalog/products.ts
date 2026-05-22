import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  type Firestore 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'
import type { CategoryIdValue } from './constants'

export interface Product {
  id: string
  name: string
  brand: string
  model: string
  category: CategoryIdValue
  price: number
  stock: number
  images: string[]
  updatedAt?: number
  [key: string]: any
}

export function subscribeToProducts(db: Firestore, callback: (products: Product[]) => void) {
  const q = query(collection(db, 'products'), orderBy('name', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Product))
    callback(products)
  })
}

export async function uploadProductImage(
  storage: FirebaseStorage,
  db: Firestore,
  productId: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const url = await getDownloadURL(snapshot.ref)
  
  // Update Firestore
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    images: [url], // For now we just replace with one image for simplicity, or we could append
    updatedAt: Date.now()
  })
  
  return url
}

export async function updateProductCategory(
  db: Firestore,
  productId: string,
  category: CategoryIdValue
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    category,
    updatedAt: Date.now()
  })
}

export async function updateProductFlag(
  db: Firestore,
  productId: string,
  flagKey: string,
  value: boolean
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    [flagKey]: value,
    updatedAt: Date.now()
  })
}

export async function updateProductImageUrls(
  db: Firestore,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    images: imageUrls,
    updatedAt: Date.now()
  })
}

export async function deleteProduct(db: Firestore, productId: string): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await deleteDoc(productRef)
}

