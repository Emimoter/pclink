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
  badge: string | null
  imageUrl: string | null
  active: boolean
  order: number
}

const DEFAULT_BANNERS: Omit<Banner, 'id'>[] = [
  {
    title: 'RTX 4090 al -12%',
    subtitle: 'Gaming sin límites con la GPU más potente',
    ctaLabel: 'Ver oferta',
    accentColor: '#00BCD4',
    gradientStart: '#06090C',
    gradientEnd: '#0E2B33',
    targetCategory: 'GPU',
    targetProductId: null,
    badge: 'FLASH SALE',
    imageUrl: null,
    active: true,
    order: 0,
  },
  {
    title: 'Arma tu PC ideal',
    subtitle: 'Con compatibilidad garantizada',
    ctaLabel: 'Empezar build',
    accentColor: '#26C6DA',
    gradientStart: '#002B36',
    gradientEnd: '#005662',
    targetCategory: null,
    targetProductId: null,
    badge: 'PC BUILDER',
    imageUrl: null,
    active: true,
    order: 1,
  },
  {
    title: 'Notebooks Gaming -15%',
    subtitle: 'Hasta 12 cuotas sin interés',
    ctaLabel: 'Ver notebooks',
    accentColor: '#4DD0E1',
    gradientStart: '#111820',
    gradientEnd: '#263238',
    targetCategory: 'NOTEBOOK',
    targetProductId: null,
    badge: 'TOP DEALS',
    imageUrl: null,
    active: true,
    order: 2,
  },
  {
    title: 'Periféricos Pro',
    subtitle: 'Logitech G, Razer, HyperX y más',
    ctaLabel: 'Explorar',
    accentColor: '#00BCD4',
    gradientStart: '#0A0F14',
    gradientEnd: '#1A2530',
    targetCategory: 'MOUSE',
    targetProductId: null,
    badge: null,
    imageUrl: null,
    active: true,
    order: 3,
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
