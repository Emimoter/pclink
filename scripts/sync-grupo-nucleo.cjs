#!/usr/bin/env node
/**
 * Sincronizador semanal + Motor de Recomendaciones de Grupo Núcleo (PC Link)
 *
 * Uso:
 *   node scripts/sync-grupo-nucleo.cjs --xlsx "<ruta-a-Listado.xlsx>" --usd 1630
 *
 * Acciones:
 *   1. Actualiza precios, stock (StockMdP) y visibilidad (isHidden / out_of_stock)
 *      de todos los productos ya importados con externalSource === "grupo_nucleo".
 *   2. Corrobora imágenes en caché (product_image_cache) para productos que recuperan stock.
 *   3. Analiza el listado completo de Grupo Núcleo contra el catálogo actual de PC Link
 *      y selecciona los 30 mejores productos nuevos recomendados (con stock en MdP,
 *      rubro informática/gaming/impresión/conectividad, priorizando categorías con poco
 *      surtido en la web y pre-verificando foto HTTPS funcional para publicar en 1 clic).
 *   4. Guarda estado y recomendaciones en Firestore:
 *      - settings/grupo_nucleo_sync_state
 *      - settings/grupo_nucleo_recommendations
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const admin = require(path.join(ROOT_DIR, 'functions', 'node_modules', 'firebase-admin'));
const XLSX = require(path.join(ROOT_DIR, 'admin-web', 'node_modules', 'xlsx'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'pclink-f6e0d' });
}
const db = admin.firestore();

const IMAGE_SEARCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BLOCKED_IMAGE_DOMAINS = [
  'mercadolibre.com',
  'mlstatic.com',
  'fravega.com',
  'garbarino.com',
  'musimundo.com',
  'cetrogar.com',
  'naldo.com',
  'shutterstock.com',
  'istockphoto.com',
  'depositphotos.com',
  'dreamstime.com',
  '123rf.com',
  'alamy.com',
  'youtube.com',
  'ytimg.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
];

const CATEGORY_LABELS = {
  GPU: 'Placas de Video',
  CPU: 'Microprocesadores',
  MOTHERBOARD: 'Motherboards',
  RAM: 'Memorias RAM',
  STORAGE: 'Almacenamiento',
  CASE: 'Gabinetes',
  PSU: 'Fuentes',
  COOLING: 'Refrigeración',
  MONITOR: 'Monitores',
  PERIPHERALS: 'Periféricos',
  PC_ARMADAS: 'PC Gamer',
  PC_OFICINA: 'PC Oficina',
  SILLAS_GAMER: 'Sillas Gamer',
  GAMING: 'Zona Gamer',
  CABLES: 'Cables y Adaptadores',
  CARGADORES: 'Cargadores y Baterías',
  PARLANTES: 'Parlantes y Audio',
  NOTEBOOK: 'Notebooks',
  MOUSE: 'Mouses',
  KEYBOARD: 'Teclados',
  HEADPHONES: 'Auriculares',
  PRINTER: 'Impresoras',
  INK_TONER: 'Cartuchos y Tóners',
  NETWORK: 'Redes y Conectividad',
  OTROS: 'Otros',
};

const TIER_1_BRANDS = new Set([
  'AMD', 'INTEL', 'ASUS', 'ASROCK', 'MSI', 'GIGABYTE', 'KINGSTON',
  'WESTERN DIGITAL', 'WD', 'ADATA', 'AOC', 'AGON', 'SAMSUNG', 'LG',
  'HP', 'EPSON', 'BROTHER', 'LOGITECH', 'HYPERX', 'CORSAIR',
  'COOLER MASTER', 'TP-LINK', 'UBIQUITI', 'WACOM', 'AEROCOOL',
  'FORMULA V', 'MICROSOFT', 'JBL', 'REDRAGON', 'RAZER', 'CRUCIAL',
  'THERMALTAKE', 'DEEPCOOL', 'SEASONIC', 'VIEWSONIC', 'LENOVO', 'DELL', 'ACER'
]);

const TIER_2_BRANDS = new Set([
  'CUDY', 'MERCUSYS', 'D-LINK', 'PCBOX', 'PANTUM', 'FORZA', 'APC',
  'KLIPXTREME', 'GENIUS', 'NISUTA', 'XTECH', 'PROBATTERY', 'CASE LOGIC', 'HIKVISION'
]);

function parseArgs(argv) {
  const out = { xlsx: '', usd: 0, margin: 30 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--xlsx' && argv[i + 1]) out.xlsx = argv[++i];
    else if (a === '--usd' && argv[i + 1]) out.usd = parseFloat(String(argv[++i]).replace(',', '.')) || 0;
    else if (a === '--margin' && argv[i + 1]) out.margin = parseFloat(argv[++i]) || 30;
  }
  return out;
}

function normalizeProductKey(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildCleanProductSearchQuery(name, brand, model) {
  const cleanPart = (val) => {
    const s = String(val || '').trim();
    if (!s || s === '—' || s === '-' || ['genérico', 'generico', 'pclink store', 'tecnologia', 'gaming', 'impresion', 'oficina'].includes(s.toLowerCase())) {
      return '';
    }
    return s;
  };

  let q = cleanPart(name)
    .replace(/\bWIR\.?\b/gi, 'Wireless')
    .replace(/\bINAL\.?\b/gi, 'Inalambrica WiFi')
    .replace(/\bMEM\.?\s*DIGITAL\b/gi, 'Memoria')
    .replace(/\bAURIC\.?\b|\bAUR\.?\b/gi, 'Auricular')
    .replace(/\bADAPT\.?\b/gi, 'Adaptador')
    .replace(/\bC\//gi, 'con ')
    .replace(/\bS\//gi, 'sin ')
    .replace(/\(\d{4,6}\)$/g, '')
    .replace(/\b(BLISTER|BOLSA|CAJA|UNIDAD|X\s*METRO|SOLO\s*PKIT)\b/gi, '')
    .replace(/[""]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const b = cleanPart(brand);
  const m = cleanPart(model);
  if (b && !q.toLowerCase().includes(b.toLowerCase())) {
    q = `${b} ${q}`;
  }
  if (m && !q.toLowerCase().includes(m.toLowerCase())) {
    q = `${q} ${m}`;
  }
  return q.trim();
}

async function fetchCandidateImageUrls(rawQuery) {
  const candidates = [];
  const seen = new Set();
  const addCandidate = (url) => {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (!clean.startsWith('https://')) return;
    const lower = clean.toLowerCase();
    if (lower.endsWith('.svg') || lower.includes('.svg?')) return;
    if (BLOCKED_IMAGE_DOMAINS.some((dom) => lower.includes(dom))) return;
    if (!seen.has(clean)) {
      seen.add(clean);
      candidates.push(clean);
    }
  };

  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(rawQuery)}&form=HDRSC2&first=1`;
    const bingRes = await fetch(bingUrl, {
      headers: {
        'User-Agent': IMAGE_SEARCH_UA,
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (bingRes.ok) {
      const html = await bingRes.text();
      const matches = html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g);
      for (const m of matches) {
        addCandidate(m[1]);
        if (candidates.length >= 10) break;
      }
    }
  } catch (_err) {
    // ignore
  }

  if (candidates.length < 3) {
    try {
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(rawQuery)}`;
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': IMAGE_SEARCH_UA },
        signal: AbortSignal.timeout(5000),
      });
      const html = await response.text();
      const vqdMatch = html.match(/vqd=["']?([0-9-]+)["']?/);
      if (vqdMatch) {
        const vqd = vqdMatch[1];
        const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(rawQuery)}&vqd=${vqd}&s=0&o=json&api=d.js`;
        const imageResponse = await fetch(imageUrl, {
          headers: { 'User-Agent': IMAGE_SEARCH_UA, Referer: 'https://duckduckgo.com/' },
          signal: AbortSignal.timeout(5000),
        });
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          if (Array.isArray(data.results)) {
            for (const r of data.results.slice(0, 8)) addCandidate(r.image);
          }
        }
      }
    } catch (_err) {
      // ignore
    }
  }

  return candidates;
}

async function verifyWorkingImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('https://')) return false;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': IMAGE_SEARCH_UA,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/') || ct.includes('svg')) return false;
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 2200) return false;
    return true;
  } catch (_err) {
    return false;
  }
}

async function resolveOrVerifyImage(productId, name, brand, model, existingUrl, cacheById, cacheByNormName) {
  if (existingUrl && existingUrl.startsWith('https://')) {
    const ok = await verifyWorkingImageUrl(existingUrl);
    if (ok) return existingUrl;
  }

  const cachedDirect = cacheById.get(String(productId));
  if (cachedDirect && cachedDirect.startsWith('https://')) {
    if (await verifyWorkingImageUrl(cachedDirect)) return cachedDirect;
  }

  const norm = normalizeProductKey(name);
  const cachedByName = cacheByNormName.get(norm);
  if (cachedByName && cachedByName.startsWith('https://')) {
    if (await verifyWorkingImageUrl(cachedByName)) return cachedByName;
  }

  const query = buildCleanProductSearchQuery(name, brand, model);
  const candidates = await fetchCandidateImageUrls(query);
  for (const c of candidates.slice(0, 7)) {
    if (await verifyWorkingImageUrl(c)) {
      await db.collection('product_image_cache').doc(String(productId)).set(
        {
          productId: String(productId),
          name,
          normalizedName: norm,
          imageUrl: c,
          verifiedAt: Date.now(),
        },
        { merge: true }
      );
      cacheById.set(String(productId), c);
      cacheByNormName.set(norm, c);
      return c;
    }
  }
  return '';
}

function guessPclinkCategory(item) {
  const cleanName = String(item.name || '').trim();
  const fullText = `${cleanName} ${item.brand || ''} ${item.subCategory || ''} ${item.supplierCategory || ''}`.toLowerCase();
  const sub = String(item.subCategory || '').toLowerCase();
  const cat = String(item.supplierCategory || '').toLowerCase();

  if (sub.includes('sillas gamer') || /\bsilla\s+gamer\b/i.test(fullText)) return 'SILLAS_GAMER';
  if (sub.includes('microprocesadores')) return 'CPU';
  if (sub.includes('mothers') || /^(mother|motherboard|mb)\b/i.test(cleanName)) return 'MOTHERBOARD';
  if (sub.includes('memorias') && !sub.includes('memorias sd')) return 'RAM';
  if (sub.includes('discos ssd') || sub.includes('discos rigidos') || sub.includes('pen drive') || sub.includes('memorias sd')) return 'STORAGE';
  if (sub.includes('fuentes') && !sub.includes('cctv')) return 'PSU';
  if (sub.includes('coolers')) return 'COOLING';
  if (cat.includes('monitores') || /^monitor\b/i.test(cleanName)) return 'MONITOR';
  if (cat.includes('notebooks') || /^(notebook|laptop|ultrabook)\b/i.test(cleanName)) return 'NOTEBOOK';
  if (cat.includes('impresoras')) return 'PRINTER';
  if (sub.includes('toners') || sub.includes('cartuchos')) return 'INK_TONER';
  if (cat.includes('conectividad')) return 'NETWORK';
  if (sub.includes('auriculares') || /^auricular/i.test(cleanName)) return 'HEADPHONES';
  if (sub.includes('mouses') || /^mouse\b/i.test(cleanName)) return 'MOUSE';
  if (sub.includes('teclados') || /^(teclado|combo\s+teclado)/i.test(cleanName)) return 'KEYBOARD';
  if (sub.includes('cargadores notebook')) return 'CARGADORES';
  if (sub.includes('parlantes') || /^parlante/i.test(cleanName)) return 'PARLANTES';
  if (sub.includes('cables y adaptadores')) return 'CABLES';
  if (/^(gpu|vga|placa\s+de\s+video)\b|\b(rtx\s*\d{3,4}|radeon\s+rx\s*\d{3,4})\b/i.test(fullText)) return 'GPU';
  if (String(item.linea || '').toLowerCase() === 'gaming' || /\b(gamepad|joystick|volante)\b/i.test(fullText)) return 'GAMING';
  if (cat.includes('computadoras')) return /^pc\s+gamer\b/i.test(cleanName) ? 'PC_ARMADAS' : 'PC_OFICINA';
  return 'OTROS';
}

function isRelevantForPcLink(item) {
  const linea = String(item.linea || '').toLowerCase().trim();
  const cat = String(item.supplierCategory || '').toLowerCase().trim();
  const sub = String(item.subCategory || '').toLowerCase().trim();
  const name = String(item.name || '').trim();

  // Excluir líneas fuera del rubro informático de PC Link
  const blockedLineas = new Set([
    'hogar', 'indefinido', 'movilidad', 'iluminacion', 'educacion', 'seguridad', 'bolsos', 'celulares'
  ]);
  if (blockedLineas.has(linea)) return false;

  if (linea === 'oficina') {
    // De Oficina solo nos interesan Sillas Gamer (no control de acceso, relojes biométricos ni valijas)
    if (!sub.includes('sillas gamer')) return false;
  }

  if (linea === 'audio - video') {
    // Solo memorias MicroSD o parlantes compactos de PC/BT (excluir tocadiscos, pilas, soportes GoPro, torres DJ > USD 130)
    if (sub.includes('memorias sd')) return true;
    if (sub.includes('parlantes') && item.costUsd <= 130) return true;
    return false;
  }

  // Excluir insumos irrelevantes, minería, kits OEM sueltos, packs mayoristas, repuestos o equipos obsoletos
  const excludeRx =
    /\b(mineria|add2psu|riser|solo\s*pkit|x\s*\d+\s*unidades|la\s*caja|repuesto|filmina|rollo\s+de\s+fax|cinta\s+gtc|resma|ficha\s+rj45|modulo\s+sfp|xpon\s+ont|smartslot\s+snmp|educativa\s+c5|hd500|jetson\s+agx|princesas)\b/i;
  if (excludeRx.test(name) || sub.includes('mineria') || sub.includes('cintas') || sub.includes('resmas') || sub.includes('rollo de fax')) {
    return false;
  }

  // Evitar cables/adaptadores ultra baratos (< USD 5) o empresariales extremos (> USD 750) en las recomendaciones destacadas
  if (item.costUsd < 5 || item.costUsd > 750) return false;

  // En Tecnología > Componentes > Gabinetes Pc a veces Grupo Núcleo mete un teclado OEM; validar coherencia mínima
  const pclinkCat = guessPclinkCategory(item);
  if (pclinkCat === 'INK_TONER' && item.costUsd < 8) return false;

  return true;
}

function parseExcelCatalog(xlsxPath) {
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`No existe el archivo Excel: ${xlsxPath}`);
  }
  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('El archivo Excel no contiene hojas.');
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  if (rawRows.length < 50) {
    throw new Error(`El archivo Excel tiene muy pocas filas (${rawRows.length}). Abortando por seguridad.`);
  }

  return rawRows
    .map((row) => {
      const normalized = {};
      for (const k of Object.keys(row)) {
        normalized[k.toLowerCase().trim()] = row[k];
        normalized[k.toLowerCase().replace(/\s+/g, '')] = row[k];
      }
      const getVal = (...keys) => {
        for (const k of keys) {
          const c = k.toLowerCase().trim();
          if (normalized[c] !== undefined) return normalized[c];
          const ns = c.replace(/\s+/g, '');
          if (normalized[ns] !== undefined) return normalized[ns];
        }
        return undefined;
      };

      const id = String(getVal('código', 'codigo', 'id') || '').trim();
      const partNumber = String(getVal('idfabricante', 'id fabricante') || '').trim();
      const name = String(getVal('descripción', 'descripcion', 'nombre') || '').trim();
      const costUsd = parseFloat(getVal('precio neto', 'precioneto', 'precio')) || 0;
      const currency = String(getVal('moneda') || 'USD').trim().toUpperCase();
      const rawTax = String(getVal('impuestos', 'iva') ?? '21').replace('%', '').trim();
      const tax = Number.isFinite(parseFloat(rawTax)) ? parseFloat(rawTax) : 21;
      const stockMdp = parseInt(getVal('stockmdp', 'stock mdp', 'stock'), 10) || 0;
      const stockCaba = parseInt(getVal('stockcaba', 'stock caba'), 10) || 0;
      const brand = String(getVal('marca') || 'Genérico').trim();
      const linea = String(getVal('linea', 'línea') || '').trim();
      const supplierCategory = String(getVal('categoría', 'categoria') || '').trim();
      const subCategory = String(getVal('subcategoría', 'subcategoria') || '').trim();

      return {
        id,
        partNumber,
        name,
        costUsd,
        currency,
        tax,
        stockMdp,
        stockCaba,
        brand,
        linea,
        supplierCategory,
        subCategory,
      };
    })
    .filter((i) => i.id && i.name);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.xlsx) {
    throw new Error('Falta --xlsx "<ruta-a-Listado.xlsx>"');
  }

  let usdRate = args.usd;
  if (!usdRate || usdRate <= 0) {
    const prevSync = await db.collection('settings').doc('grupo_nucleo_sync_state').get();
    if (prevSync.exists && prevSync.data().exchangeRate > 0) {
      usdRate = prevSync.data().exchangeRate;
    } else {
      throw new Error('Falta --usd <cotizacion> y no hay cotización previa guardada.');
    }
  }

  console.log(`[1/4] Leyendo ${args.xlsx} (Dólar GN = $${usdRate} ARS)...`);
  const catalogItems = parseExcelCatalog(args.xlsx);
  const byId = new Map(catalogItems.map((i) => [i.id, i]));
  console.log(`      Filas válidas en Excel: ${catalogItems.length}`);

  console.log('[2/4] Cargando productos y caché de imágenes desde Firestore...');
  const [productsSnap, cacheSnap] = await Promise.all([
    db.collection('products').get(),
    db.collection('product_image_cache').get(),
  ]);

  const cacheById = new Map();
  const cacheByNormName = new Map();
  for (const d of cacheSnap.docs) {
    const data = d.data();
    if (data.imageUrl && String(data.imageUrl).startsWith('https://')) {
      cacheById.set(d.id, data.imageUrl);
      if (data.normalizedName) cacheByNormName.set(data.normalizedName, data.imageUrl);
    }
  }

  const allProducts = productsSnap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));
  const gnProducts = allProducts.filter((p) => p.externalSource === 'grupo_nucleo');
  const localActiveProducts = allProducts.filter(
    (p) => p.externalSource !== 'grupo_nucleo' && !p.isHidden && (p.stock || 0) > 0 && (p.price || 0) > 0
  );

  console.log(`      Productos vinculados a Grupo Núcleo: ${gnProducts.length}`);

  // Sincronizar los 109 productos importados
  const now = Date.now();
  let inStockMdpCount = 0;
  let priceUpdatedCount = 0;
  let hiddenOutOfStockCount = 0;
  let restoredInStockCount = 0;
  let batch = db.batch();
  let ops = 0;

  for (const p of gnProducts) {
    const extId = String(p.externalId || p.id).trim();
    const row = byId.get(extId);
    const margin = typeof p.margin === 'number' ? p.margin : args.margin;
    const manuallyHidden = p.isHidden === true && p.hiddenReason === 'manual';

    if (row) {
      const costInArs = row.currency === 'USD' ? row.costUsd * usdRate : row.costUsd;
      const finalPrice = Math.round(costInArs * (1 + row.tax / 100) * (1 + margin / 100));
      const newStock = row.stockMdp;

      if (finalPrice !== p.price) priceUpdatedCount++;

      if (newStock > 0 && finalPrice > 0) {
        inStockMdpCount++;
        let currentImg = Array.isArray(p.images) && p.images[0] ? String(p.images[0]).trim() : '';
        let verified = p.imageVerified === true && currentImg.startsWith('https://');

        if (!verified) {
          const resolved = await resolveOrVerifyImage(
            p.id,
            p.name || row.name,
            p.brand || row.brand,
            row.partNumber || p.model || '',
            currentImg,
            cacheById,
            cacheByNormName
          );
          if (resolved) {
            currentImg = resolved;
            verified = true;
          }
        }

        const wasHidden = p.isHidden === true;
        const shouldShow = verified && !manuallyHidden;
        if (wasHidden && shouldShow) restoredInStockCount++;

        const updatePayload = {
          price: finalPrice,
          stock: newStock,
          costUsd: row.costUsd,
          taxRate: row.tax,
          lastExchangeRate: usdRate,
          isHidden: !shouldShow,
          hiddenReason: shouldShow ? null : manuallyHidden ? 'manual' : 'no_valid_image',
          imageVerified: verified,
          ...(verified && currentImg ? { images: p.images?.length > 1 ? p.images : [currentImg] } : {}),
          lastSyncedAt: now,
          updatedAt: now,
        };
        batch.update(p.ref, updatePayload);
        ops++;
      } else {
        // En el Excel pero con StockMdP = 0
        hiddenOutOfStockCount++;
        batch.update(p.ref, {
          ...(finalPrice > 0 ? { price: finalPrice } : {}),
          stock: 0,
          costUsd: row.costUsd,
          taxRate: row.tax,
          lastExchangeRate: usdRate,
          isHidden: true,
          hiddenReason: manuallyHidden ? 'manual' : 'out_of_stock',
          lastSyncedAt: now,
          updatedAt: now,
        });
        ops++;
      }
    } else {
      // No figura en el Excel de hoy => Sin stock en Grupo Núcleo
      hiddenOutOfStockCount++;
      batch.update(p.ref, {
        stock: 0,
        lastExchangeRate: usdRate,
        isHidden: true,
        hiddenReason: manuallyHidden ? 'manual' : 'out_of_stock',
        lastSyncedAt: now,
        updatedAt: now,
      });
      ops++;
    }

    if (ops >= 380) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(
    `      Sincronización completada: ${inStockMdpCount} activos en MdP (${restoredInStockCount} reactivados), ${hiddenOutOfStockCount} pausados sin stock, ${priceUpdatedCount} cambios de precio.`
  );

  // Recalcular conteo activo real por categoría luego de sincronizar
  const activeCatCounts = {};
  for (const p of localActiveProducts) {
    const c = p.category || 'OTROS';
    activeCatCounts[c] = (activeCatCounts[c] || 0) + 1;
  }
  for (const p of gnProducts) {
    const extId = String(p.externalId || p.id).trim();
    const row = byId.get(extId);
    if (row && row.stockMdp > 0 && !(p.isHidden === true && p.hiddenReason === 'manual')) {
      const c = p.category || 'OTROS';
      activeCatCounts[c] = (activeCatCounts[c] || 0) + 1;
    }
  }

  // Índices de duplicados contra stock local activo
  const localNormNames = new Set(localActiveProducts.map((p) => normalizeProductKey(p.name)));
  const localPartNumbers = new Set();
  for (const p of localActiveProducts) {
    const m = String(p.model || '').trim().toUpperCase();
    if (m.length >= 5) localPartNumbers.add(m);
  }
  const importedIds = new Set(gnProducts.map((p) => String(p.externalId || p.id).trim()));
  for (const p of allProducts) importedIds.add(String(p.id).trim());

  console.log('[3/4] Calculando ranking de nuevos productos recomendados para importar...');
  const scoredCandidates = [];

  for (const item of catalogItems) {
    if (item.stockMdp <= 0) continue;
    if (importedIds.has(item.id)) continue;
    if (!isRelevantForPcLink(item)) continue;

    // Evitar recomendar algo que ya está idéntico en el stock físico del local
    if (localNormNames.has(normalizeProductKey(item.name))) continue;
    if (item.partNumber && item.partNumber.length >= 5 && localPartNumbers.has(item.partNumber.toUpperCase())) {
      continue;
    }

    const category = guessPclinkCategory(item);
    const catCount = activeCatCounts[category] || 0;
    const catLabel = CATEGORY_LABELS[category] || category;

    let score = 0;
    const reasons = [];

    // 1. Hueco de surtido en la web de PC Link
    if (category !== 'OTROS' && category !== 'CABLES') {
      if (catCount <= 8) {
        score += 34;
        reasons.push(`Hueco en ${catLabel} (${catCount} en web)`);
      } else if (catCount <= 18) {
        score += 22;
        reasons.push(`Refuerza ${catLabel} (${catCount} en web)`);
      } else if (catCount <= 32) {
        score += 12;
      } else {
        score += 4;
      }
    } else {
      score += 3;
    }

    // 2. Disponibilidad inmediata en Grupo Núcleo Mar del Plata
    if (item.stockMdp >= 8) {
      score += 20;
      reasons.push(`Alto stock MdP (${item.stockMdp} u.)`);
    } else if (item.stockMdp >= 3) {
      score += 14;
      reasons.push(`Stock MdP (${item.stockMdp} u.)`);
    } else {
      score += 6;
    }

    // 3. Marca reconocida
    const upperBrand = item.brand.toUpperCase().trim();
    if (TIER_1_BRANDS.has(upperBrand)) {
      score += 22;
      reasons.push(`Marca top (${item.brand})`);
    } else if (TIER_2_BRANDS.has(upperBrand)) {
      score += 11;
    }

    // 4. Rango de ticket comercial atractivo
    if (item.costUsd >= 18 && item.costUsd <= 380) {
      score += 14;
    } else if (item.costUsd > 380 && ['NOTEBOOK', 'MONITOR', 'PRINTER', 'CPU', 'MOTHERBOARD', 'GPU'].includes(category)) {
      score += 12;
    } else if (item.costUsd >= 10) {
      score += 7;
    }

    // Bonus extra para categorías estrella de hardware/equipos completos
    if (['GPU', 'CPU', 'MOTHERBOARD', 'MONITOR', 'NOTEBOOK', 'PRINTER', 'SILLAS_GAMER', 'GAMING'].includes(category)) {
      score += 10;
    }

    const costInArs = item.currency === 'USD' ? item.costUsd * usdRate : item.costUsd;
    const suggestedPrice = Math.round(costInArs * (1 + item.tax / 100) * (1 + args.margin / 100));

    scoredCandidates.push({
      ...item,
      category,
      categoryLabel: catLabel,
      suggestedPrice,
      score,
      reasons: reasons.slice(0, 3),
    });
  }

  scoredCandidates.sort((a, b) => b.score - a.score || b.stockMdp - a.stockMdp);

  // Diversificación por categoría (máx 4 por categoría en primera pasada) para lograr un mix balanceado
  const preSelected = [];
  const perCat = {};
  for (const cand of scoredCandidates) {
    const c = cand.category;
    if ((perCat[c] || 0) >= 4) continue;
    perCat[c] = (perCat[c] || 0) + 1;
    preSelected.push(cand);
    if (preSelected.length >= 38) break;
  }
  if (preSelected.length < 36) {
    const pickedIds = new Set(preSelected.map((x) => x.id));
    for (const cand of scoredCandidates) {
      if (pickedIds.has(cand.id)) continue;
      preSelected.push(cand);
      if (preSelected.length >= 38) break;
    }
  }

  console.log(`      Pre-verificando fotos HTTPS de los mejores ${preSelected.length} candidatos...`);
  const finalRecommendations = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < preSelected.length && finalRecommendations.length < 30; i += CONCURRENCY) {
    const slice = preSelected.slice(i, i + CONCURRENCY);
    const resolvedSlice = await Promise.all(
      slice.map(async (cand) => {
        const img = await resolveOrVerifyImage(
          cand.id,
          cand.name,
          cand.brand,
          cand.partNumber || '',
          '',
          cacheById,
          cacheByNormName
        );
        return img ? { ...cand, previewImage: img } : null;
      })
    );
    for (const item of resolvedSlice) {
      if (item && finalRecommendations.length < 30) {
        finalRecommendations.push(item);
      }
    }
  }

  console.log(`[4/4] Guardando reporte y ${finalRecommendations.length} recomendados en Firestore...`);
  const prevStateSnap = await db.collection('settings').doc('grupo_nucleo_sync_state').get();
  const prevHistory = prevStateSnap.exists && Array.isArray(prevStateSnap.data().history)
    ? prevStateSnap.data().history
    : [];

  const summaryEntry = {
    syncedAt: now,
    exchangeRate: usdRate,
    sourceFileName: path.basename(args.xlsx),
    totalCatalogItems: catalogItems.length,
    syncedTotal: gnProducts.length,
    inStockMdpCount,
    priceUpdatedCount,
    hiddenOutOfStockCount,
    restoredInStockCount,
    recommendationsCount: finalRecommendations.length,
  };

  await Promise.all([
    db.collection('settings').doc('grupo_nucleo_sync_state').set({
      ...summaryEntry,
      lastSyncAt: now,
      history: [summaryEntry, ...prevHistory].slice(0, 12),
    }),
    db.collection('settings').doc('grupo_nucleo_recommendations').set({
      generatedAt: now,
      exchangeRate: usdRate,
      defaultMargin: args.margin,
      sourceFileName: path.basename(args.xlsx),
      items: finalRecommendations,
    }),
  ]);

  console.log('\n=== RESUMEN FINAL GRUPO NÚCLEO ===');
  console.log(JSON.stringify(summaryEntry, null, 2));
  console.log('\n=== TOP 12 RECOMENDADOS DE LA SEMANA ===');
  for (const r of finalRecommendations.slice(0, 12)) {
    console.log(
      `- [${r.categoryLabel}] (ID ${r.id}) ${r.name} | u$s ${r.costUsd} + ${r.tax}% IVA -> Sugerido $${r.suggestedPrice.toLocaleString('es-AR')} | Stock MdP: ${r.stockMdp} | ${r.reasons.join(' • ')}`
    );
  }
}

main().catch((err) => {
  console.error('ERROR EN SYNC GRUPO NÚCLEO:', err);
  process.exit(1);
});
