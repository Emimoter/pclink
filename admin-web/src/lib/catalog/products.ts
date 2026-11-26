import { 
  collection, 
  query, 
  orderBy, 
  limit,
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
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
  description?: string
  updatedAt?: number
  [key: string]: any
}

export function subscribeToProducts(db: Firestore, limitCount: number, callback: (products: Product[]) => void) {
  const q = query(collection(db, 'products'), orderBy('name', 'asc'), limit(limitCount))
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
  category: CategoryIdValue,
  lockCategory: boolean = true
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    category,
    categoryLocked: lockCategory,
    updatedAt: Date.now()
  })
}

export async function updateProductName(
  db: Firestore,
  productId: string,
  name: string
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    name,
    updatedAt: Date.now()
  })
}

export async function updateProductDescription(
  db: Firestore,
  productId: string,
  description: string
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    description,
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

function normalizeCacheName(name?: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function persistVerifiedProductImage(
  db: Firestore,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  const productRef = doc(db, 'products', productId)
  const snap = await getDoc(productRef)
  const data = snap.exists() ? snap.data() : {}

  const cleanUrls = (imageUrls || []).filter((u) => !!u && String(u).trim() !== '').slice(0, 3)
  const hasImage = cleanUrls.length > 0
  const hasStock = (typeof data.stock === 'number' && data.stock > 0) || productId.toLowerCase().startsWith('pc-gamer-') || !!data.onDemand
  const hasPrice = typeof data.price === 'number' && data.price > 0
  const wasHiddenForMissingImg =
    data.isHidden === true &&
    (data.hiddenReason === 'no_valid_image' || data.hiddenReason === 'pending_image')

  const updates: Record<string, any> = {
    images: cleanUrls,
    imageVerified: hasImage,
    updatedAt: Date.now(),
  }

  if (hasImage) {
    updates.imageVerifiedAt = Date.now()
    if (wasHiddenForMissingImg && hasStock && hasPrice) {
      updates.isHidden = false
      updates.hiddenReason = null
    }
    await setDoc(
      doc(db, 'product_image_cache', productId),
      {
        productId,
        name: data.name || '',
        normalizedName: normalizeCacheName(data.name),
        imageUrl: cleanUrls[0],
        verifiedAt: Date.now(),
      },
      { merge: true }
    )
  }

  await updateDoc(productRef, updates)
}

export async function updateProductImageUrls(
  db: Firestore,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  await persistVerifiedProductImage(db, productId, imageUrls)
}

export async function deleteProduct(db: Firestore, productId: string): Promise<void> {
  const productRef = doc(db, 'products', productId)
  await deleteDoc(productRef)
}

export async function uploadProductImageForSlot(
  storage: FirebaseStorage,
  db: Firestore,
  productId: string,
  existingImages: string[],
  file: File,
  slotIndex: number
): Promise<string> {
  const storageRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const url = await getDownloadURL(snapshot.ref)
  
  const currentImages = [...(existingImages || [])]
  currentImages[slotIndex] = url
  const finalImages = currentImages.filter(u => !!u).slice(0, 3)
  
  await persistVerifiedProductImage(db, productId, finalImages)
  
  return url
}

export async function removeProductImage(
  db: Firestore,
  productId: string,
  existingImages: string[],
  index: number
): Promise<void> {
  const currentImages = [...(existingImages || [])]
  currentImages.splice(index, 1)
  const finalImages = currentImages.filter(u => !!u).slice(0, 3)
  
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    images: finalImages,
    updatedAt: Date.now()
  })
}


