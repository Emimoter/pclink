import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'

export interface Banner {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  accentColor: string
  gradientStart: string
  gradientEnd: string
  targetCategory: string | null
  targetProductId: string | null
  targetPath: string | null
  badge: string | null
  imageUrl: string | null
  active: boolean
  order: number
}

const DEFAULT_BANNERS: Omit<Banner, 'id'>[] = [
  {
    title: '',
    subtitle: '',
    ctaLabel: '',
    accentColor: '#00BCD4',
    gradientStart: '#0A0F14',
    gradientEnd: '#0A0F14',
    targetCategory: null,
    targetProductId: null,
    targetPath: null,
    badge: null,
    imageUrl: '/images/welcome_banner.png',
    active: true,
    order: 0,
  },
]

export function subscribeToBanners(db: Firestore, callback: (banners: Banner[]) => void) {
  const q = query(collection(db, 'banners'), orderBy('order', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const banners = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Banner[]
    callback(banners)
  })
}

export async function addBanner(db: Firestore, banner: Omit<Banner, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'banners'), banner)
  return ref.id
}

export async function updateBanner(db: Firestore, id: string, data: Partial<Omit<Banner, 'id'>>) {
  await updateDoc(doc(db, 'banners', id), data)
}

export async function deleteBanner(db: Firestore, id: string) {
  await deleteDoc(doc(db, 'banners', id))
}

export async function reorderBanners(db: Firestore, ids: string[]) {
  const batch = writeBatch(db)
  ids.forEach((id, index) => {
    batch.update(doc(db, 'banners', id), { order: index })
  })
  await batch.commit()
}

export async function seedDefaultBanners(db: Firestore) {
  const batch = writeBatch(db)
  DEFAULT_BANNERS.forEach((b) => {
    const ref = doc(collection(db, 'banners'))
    batch.set(ref, b)
  })
  await batch.commit()
}

export async function uploadBannerImage(
  storage: FirebaseStorage,
  db: Firestore,
  bannerId: string,
  file: File,
): Promise<string> {
  const storageRef = ref(storage, `banners/${bannerId}/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const url = await getDownloadURL(snapshot.ref)
  await updateDoc(doc(db, 'banners', bannerId), { imageUrl: url })
  return url
}
