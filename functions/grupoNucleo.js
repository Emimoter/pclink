const BASE_URL = 'https://api.gruponucleosa.com';

/**
 * Authenticates with the Grupo Núcleo API to obtain a JWT token.
 * Token is valid for 15 minutes.
 */
async function loginGrupoNucleo(clientId, username, password) {
  if (!username || !password) {
    throw new Error('API username and password must be configured');
  }

  const response = await fetch(`${BASE_URL}/Authentication/Login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: parseInt(clientId || '0', 10),
      username: username,
      password: password
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grupo Núcleo login failed: ${errText || response.statusText}`);
  }

  // Swagger docs say it returns the token string directly or in a JSON body.
  // Standard ASP.NET Core returns either plain text JWT token or JSON { token: "..." }.
  // We handle both resiliently.
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.token || json.data?.token || text;
  } catch (e) {
    return text.trim();
  }
}

/**
 * Fetches the USD exchange rate from Grupo Núcleo.
 */
async function getGrupoNucleoExchange(token) {
  const response = await fetch(`${BASE_URL}/API_V1/GetUSDExchange`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rate from Grupo Núcleo: ${response.statusText}`);
  }

  const text = await response.text();
  try {
    const val = parseFloat(text);
    if (!isNaN(val) && val > 0) return val;
    
    const json = JSON.parse(text);
    // Handle { cotizacion: 900 } or { usd: 900 } or similar properties
    const rate = json.cotizacion || json.cotizacionDolar || json.rate || json.value || json.dolar;
    if (rate) return parseFloat(rate);
  } catch (e) {
    console.error("Error parsing exchange rate response:", e);
  }
  
  // Default fallback if parsing fails, but we should return a sensible number
  return 1000;
}

/**
 * Fetches the entire products catalog from Grupo Núcleo.
 */
async function fetchGrupoNucleoCatalog(token) {
  const response = await fetch(`${BASE_URL}/API_V1/GetCatalog`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog from Grupo Núcleo: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Resilient parsing: GN API could wrap the array under "data" or "catalog" or return it directly.
  const rawItems = Array.isArray(data) ? data : (data.data || data.items || data.catalog || []);
  
  // Normalize items to a standard format used by our admin panel
  return rawItems.map(item => {
    // Resilient property matching for standard catalog keys
    const id = item.item_id || item.itemId || item.id || item.codigo || item.sku;
    const name = item.item_name || item.itemName || item.name || item.nombre || item.descripcion || '';
    
    // Cost can be named price, priceNet, unitPrice, cost, etc.
    const price = item.item_price || item.itemPrice || item.price || item.priceNet || item.precio || item.costo || 0;
    
    // Stock can be item_qty, stock, quantity, cantidad, etc.
    const stock = item.item_qty !== undefined ? item.item_qty : (item.stock !== undefined ? item.stock : (item.cantidad || 0));
    
    // Images: links to images (can be item_images, images, array or string)
    let images = [];
    if (item.images) {
      images = Array.isArray(item.images) ? item.images : [item.images];
    } else if (item.item_images) {
      images = Array.isArray(item.item_images) ? item.item_images : [item.item_images];
    } else if (item.imagen || item.image) {
      images = [item.imagen || item.image];
    }
    images = images.filter(img => typeof img === 'string' && img.length > 0);

    const brand = item.brand || item.marca || '';
    const model = item.model || item.modelo || '';
    
    // Tax rate (defaulting to 21% or 10.5% in Argentina, or whatever tax field is sent)
    const tax = item.tax || item.iva || item.impuestos || 21; // 21% default if not specified

    // Determine currency: default is USD, check if there is an explicit field
    const currency = (item.currency || item.moneda || 'USD').toUpperCase();

    return {
      id: String(id),
      name: String(name).trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      images: images,
      brand: String(brand).trim(),
      model: String(model).trim(),
      tax: parseFloat(tax) || 0,
      currency: currency
    };
  });
}

module.exports = {
  loginGrupoNucleo,
  getGrupoNucleoExchange,
  fetchGrupoNucleoCatalog
};
