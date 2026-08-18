export interface Province {
  id: string;
  name: string;
  band: "banda_1" | "banda_2" | "banda_3";
}

export const PROVINCES: Province[] = [
  // Banda 1: Buenos Aires, CABA, Córdoba, Santa Fe, Entre Ríos, La Pampa
  { id: "BA", name: "Buenos Aires (Interior / GBA)", band: "banda_1" },
  { id: "CABA", name: "Ciudad Autónoma de Buenos Aires (CABA)", band: "banda_1" },
  { id: "CBA", name: "Córdoba", band: "banda_1" },
  { id: "SF", name: "Santa Fe", band: "banda_1" },
  { id: "ER", name: "Entre Ríos", band: "banda_1" },
  { id: "LP", name: "La Pampa", band: "banda_1" },

  // Banda 2: Mendoza, Tucumán, Chaco, Neuquén, Río Negro, etc.
  { id: "MZ", name: "Mendoza", band: "banda_2" },
  { id: "TU", name: "Tucumán", band: "banda_2" },
  { id: "CH", name: "Chaco", band: "banda_2" },
  { id: "NQ", name: "Neuquén", band: "banda_2" },
  { id: "RN", name: "Río Negro", band: "banda_2" },
  { id: "SJ", name: "San Juan", band: "banda_2" },
  { id: "SL", name: "San Luis", band: "banda_2" },
  { id: "CR", name: "Corrientes", band: "banda_2" },
  { id: "MS", name: "Misiones", band: "banda_2" },
  { id: "FO", name: "Formosa", band: "banda_2" },
  { id: "SE", name: "Santiago del Estero", band: "banda_2" },
  { id: "SA", name: "Salta", band: "banda_2" },
  { id: "JU", name: "Jujuy", band: "banda_2" },
  { id: "CA", name: "Catamarca", band: "banda_2" },
  { id: "LR", name: "La Rioja", band: "banda_2" },

  // Banda 3: Chubut, Santa Cruz, Tierra del Fuego
  { id: "CHB", name: "Chubut", band: "banda_3" },
  { id: "SC", name: "Santa Cruz", band: "banda_3" },
  { id: "TF", name: "Tierra del Fuego", band: "banda_3" },
];

export interface ShippingQuoteResult {
  isMarDelPlata: boolean;
  localOptions?: {
    standard: { cost: number; deliveryTime: string; label: string };
    immediate: { cost: number; deliveryTime: string; label: string };
    pickup: { cost: number; deliveryTime: string; label: string };
  };
  andreaniOptions?: {
    homeDelivery: { cost: number; deliveryTime: string; label: string };
    branchPickup: { cost: number; deliveryTime: string; label: string };
  };
}

export interface ZoneRates {
  home: number;
  branch: number;
}

// Tarifas comprobadas para envíos de PCs / Bultos Andreani
export const DEFAULT_ANDREANI_RATES: Record<string, ZoneRates> = {
  banda_1: { home: 108836, branch: 104134 },
  banda_2: { home: 133970, branch: 127968 },
  banda_3: { home: 163086, branch: 156763 },
};

/**
 * Checks if a postal code corresponds to Mar del Plata / General Pueyrredón
 */
export function isMarDelPlataZip(zip: string): boolean {
  const clean = zip.replace(/\D/g, "");
  // Mar del Plata and surrounding zone: 7600, 7601, 7603, 7605, 7607, 7609, 7611, 7612, 7613
  const mdpZips = ["7600", "7601", "7603", "7605", "7607", "7609", "7611", "7612", "7613", "7615"];
  return mdpZips.includes(clean);
}

/**
 * Calculates delivery rates based on province and postal code
 */
export function calculateShippingQuote(
  provinceId: string,
  zipCode: string,
  customRates?: Record<string, ZoneRates>
): ShippingQuoteResult {
  const isMdp = isMarDelPlataZip(zipCode);

  if (isMdp) {
    return {
      isMarDelPlata: true,
      localOptions: {
        standard: {
          cost: 4500,
          deliveryTime: "24 a 48 hs hábiles",
          label: "Envío Estándar (Mar del Plata)",
        },
        immediate: {
          cost: 8500,
          deliveryTime: "En el día (Express)",
          label: "Envío Inmediato (Mar del Plata)",
        },
        pickup: {
          cost: 0,
          deliveryTime: "Inmediato en horario comercial",
          label: "Retiro en Local (Gratis)",
        },
      },
    };
  }

  // Find province band
  const province = PROVINCES.find((p) => p.id === provinceId);
  const band = province ? province.band : "banda_1";

  const rates = customRates || DEFAULT_ANDREANI_RATES;
  const bandRate = rates[band] || DEFAULT_ANDREANI_RATES["banda_1"]!;

  return {
    isMarDelPlata: false,
    andreaniOptions: {
      homeDelivery: {
        cost: bandRate.home,
        deliveryTime: band === "banda_3" ? "4 a 6 días hábiles" : "3 a 5 días hábiles",
        label: "Andreani a Domicilio (Estándar)",
      },
      branchPickup: {
        cost: bandRate.branch,
        deliveryTime: band === "banda_3" ? "3 a 5 días hábiles" : "2 a 4 días hábiles",
        label: "Andreani a Sucursal Oficial",
      },
    },
  };
}
