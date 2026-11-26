import { Product } from "@/types/product";
import { isPcCategory } from "@/lib/categories";

const INTERNAL_OR_WORKSHOP_PATTERNS = [
  /^pantalla\s+notebook\b/i,
  /^teclado\s+notebook\b/i,
  /^bateria\s+notebook\b/i,
  /^bisagra\s+notebook\b/i,
  /^flex\s+notebook\b/i,
  /^carcasa\s+notebook\b/i,
  /^pin\s+de\s+carga\b/i,
  /^saldo\b/i,
  /\bsoldar\b/i,
  /^repuesto\b/i,
  /^servicio\s+tecnico\b/i,
  /^mano\s+de\s+obra\b/i,
  /^instalacion\s+de\b/i,
  /^formateo\b/i,
  /^resma\b/i,
  /^papel\s+photo\b/i,
];

/**
 * Determina si un producto de Firestore es apto para mostrarse y venderse en la tienda online.
 * Exige simultáneamente:
 * 1. No estar oculto (isHidden !== true)
 * 2. Precio válido > $0
 * 3. Stock disponible > 0 (o ser una de las 4 PCs Gamer oficiales a pedido)
 * 4. Tener foto válida corroborada (o ser una PC con foto de gabinete garantizada)
 * 5. No ser ST, LI ni repuesto interno de taller
 */
export function isPublicProduct(product?: Product | null): boolean {
  if (!product) return false;
  if (product.isHidden === true) return false;

  const price = typeof product.price === "number" ? product.price : Number(product.price);
  if (!Number.isFinite(price) || price <= 0) return false;

  const cleanId = String(product.id || "").trim();
  const cleanName = String(product.name || "").trim();

  if (/^st(\b|[-_.\s])/i.test(cleanId) || /^st(\b|[-_.\s])/i.test(cleanName)) {
    return false;
  }

  if (/^li(\b|[-_.\s])/i.test(cleanId) || /^li(\b|[-_.\s])/i.test(cleanName)) {
    return false;
  }

  if (INTERNAL_OR_WORKSHOP_PATTERNS.some((rx) => rx.test(cleanName))) {
    return false;
  }

  // Exigir stock disponible (salvo las 4 configuraciones oficiales PC Gamer a pedido)
  const isOfficialPc = cleanId.toLowerCase().startsWith("pc-gamer-");
  const stock = typeof product.stock === "number" ? product.stock : Number(product.stock || 0);
  if (!isOfficialPc && (!Number.isFinite(stock) || stock <= 0)) {
    return false;
  }

  // Exigir imagen funcional presente (las PCs cuentan además con imagen local garantizada por gabinete)
  const hasImage =
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    typeof product.images[0] === "string" &&
    product.images[0].trim() !== "";

  if (!hasImage && !isPcCategory(product.category)) {
    return false;
  }

  return true;
}

/**
 * Determina si un producto pertenece a la vista de Ofertas reales.
 */
export function isOfferProduct(product: Product): boolean {
  const hasRealDiscount =
    typeof product.oldPrice === "number" &&
    typeof product.price === "number" &&
    product.oldPrice > product.price;

  return Boolean(
    product.isOffer ||
      product.onSale ||
      product.showInFlashDeals ||
      hasRealDiscount ||
      product.category === "OFFERS"
  );
}
