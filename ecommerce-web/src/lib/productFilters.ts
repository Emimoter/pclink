import { Product } from "@/types/product";

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
 * Bloquea en tiempo real:
 * 1. Productos marcados como ocultos (isHidden === true)
 * 2. Productos con precio $0, negativo o inválido
 * 3. Prefijos internos ST (Servicio Técnico) y LI (Insumos internos / Limpieza)
 * 4. Repuestos de taller, saldos genéricos y artículos excluidos
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
