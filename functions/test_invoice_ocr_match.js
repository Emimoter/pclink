const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "pclink-f6e0d" });
}

const db = admin.firestore();

// Helper to query DuckDuckGo for product context
function decodeHtmlEntities(str) {
    if (!str) return "";
    return str
        .replace(/&ndash;/g, '-')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&middot;/g, '·')
        .replace(/&bull;/g, '•')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&deg;/g, '°')
        .replace(/&aacute;/g, 'á')
        .replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&Eacute;/g, 'É')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&Ntilde;/g, 'Ñ');
}

async function searchInternetForProduct(query) {
    if (!query || query.trim() === "") return [];
    try {
        console.log(`Searching Yahoo for: "${query}"...`);
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            console.error(`Yahoo search failed for query "${query}": Status ${response.status}`);
            return [];
        }
        const html = await response.text();
        
        const results = [];
        const compTextRegex = /<div[^>]*class="[^"]*compText[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = compTextRegex.exec(html)) !== null && results.length < 3) {
            const blockContent = match[1];
            const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(blockContent);
            if (pMatch) {
                let snippet = pMatch[1]
                    .replace(/<[^>]*>/g, '') // remove HTML tags
                    .replace(/\s+/g, ' ')
                    .trim();
                snippet = decodeHtmlEntities(snippet);
                
                const compTextIndex = match.index;
                const searchWindow = html.substring(Math.max(0, compTextIndex - 800), compTextIndex);
                
                let title = "";
                const titleRegex = /class="[^"]*w-500[^"]*">([\s\S]*?)<\/span>/gi;
                let titleMatch;
                let lastTitleMatch = null;
                while ((titleMatch = titleRegex.exec(searchWindow)) !== null) {
                    lastTitleMatch = titleMatch;
                }
                
                if (lastTitleMatch) {
                    title = lastTitleMatch[1]
                        .replace(/<[^>]*>/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    title = decodeHtmlEntities(title);
                } else {
                    const linkMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/gi.exec(searchWindow);
                    if (linkMatch) {
                        title = linkMatch[1]
                            .replace(/<[^>]*>/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                        title = decodeHtmlEntities(title);
                    }
                }
                
                if (snippet) {
                    results.push(`Título: "${title || "Sin título"}" | Resumen: "${snippet}"`);
                }
            }
        }
        return results;
    } catch (error) {
        console.error(`Error in searchInternetForProduct for query "${query}":`, error);
        return [];
    }
}

async function runOCRAndMatch() {
    try {
        const imagePath = "C:\\Users\\Emi\\.gemini\\antigravity\\brain\\9bf150fa-e71b-4067-993a-49872219a492\\media__1781799072399.png";
        if (!fs.existsSync(imagePath)) {
            console.error("Image file not found at:", imagePath);
            return;
        }

        const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
        console.log("Image loaded and base64 encoded. Size:", imageBase64.length, "chars");

        // 1. Get API Key
        const configDoc = await db.collection("settings").doc("gemini_config").get();
        let apiKey = configDoc.exists ? configDoc.data().apiKey : null;
        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey) {
            console.error("API Key not found!");
            return;
        }

        // 2. Fetch Catalog
        console.log("Fetching local products catalog...");
        const productsSnapshot = await db.collection("products").get();
        const catalogList = [];
        const barcodeToProductMap = new Map();
        
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            const product = {
                id: doc.id,
                name: data.name || "",
                brand: data.brand || "",
                model: data.model || "",
                barcode: data.barcode || ""
            };
            catalogList.push(product);
            if (product.barcode && product.barcode.trim() !== "") {
                barcodeToProductMap.set(product.barcode.trim(), product);
            }
        });
        console.log(`Loaded ${catalogList.length} catalog products.`);

        const model = "gemini-2.5-flash";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const extractPrompt = `Analiza la imagen de esta factura de proveedor e identifica todas las filas de productos en la tabla.
Extrae la información tal como está impresa en la factura. No intentes buscar anotaciones en lapicera en los márgenes.

Para cada producto de la factura, debes extraer los siguientes datos:
1. "supplier_code": El código o SKU del proveedor impreso en la factura (usualmente una mezcla de letras y números al inicio o entre corchetes, por ejemplo: CABX0910316, HOLXC205902, TV CON0400BC002).
2. "barcode": El número de código de barras impreso en la factura (usualmente de 12 o 13 dígitos numéricos, por ejemplo: 1113090410316, 1108020405902). Si no hay ninguno, devuelve null.
3. "description": La descripción del producto impresa en la factura (por ejemplo "CABLE USB TIP").
4. "quantity": La cantidad de unidades que ingresan (por ejemplo, de "3,00 x" la cantidad es 3).
5. "cost_price": El precio unitario de costo (el valor unitario antes de impuestos u otros cargos, por ejemplo de "3,00 x 2.058,7537", el costo es 2058.75).

Devuelve un arreglo JSON válido donde cada elemento siga exactamente este esquema JSON:
{
  "supplier_code": "string (o null)",
  "barcode": "string (o null)",
  "description": "string",
  "quantity": number,
  "cost_price": number
}

REGLA CRÍTICA: Devuelve ÚNICAMENTE el código JSON. No incluyas explicaciones, no agregues bloques de código markdown (\`\`\`json ... \`\`\`). Tu respuesta debe ser parseable directamente con JSON.parse().`;
        
        let response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: extractPrompt },
                            {
                                inlineData: {
                                    mimeType: "image/png",
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            console.error("Extraction failed:", await response.text());
            return;
        }

        const resData = await response.json();
        const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        let jsonText = generatedText.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7);
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.substring(3);
        }
        if (jsonText.endsWith("```")) {
            jsonText = jsonText.substring(0, jsonText.length - 3);
        }
        jsonText = jsonText.trim();

        const extractedItems = JSON.parse(jsonText);
        console.log("Extracted Items from Invoice:", extractedItems);

        const unmatchedItems = [];
        const finalItems = [];
        for (const item of extractedItems) {
            let matchedProduct = null;
            if (item.barcode && item.barcode.trim() !== "") {
                matchedProduct = barcodeToProductMap.get(item.barcode.trim());
            }

            if (matchedProduct) {
                console.log(`Direct Barcode Match for "${item.description}" -> ID: ${matchedProduct.id} (${matchedProduct.name})`);
                finalItems.push({
                    supplier_code: item.supplier_code || null,
                    barcode: item.barcode,
                    description: item.description,
                    quantity: item.quantity,
                    cost_price: item.cost_price,
                    handwritten_id: matchedProduct.id,
                    match_method: "Direct Barcode"
                });
            } else {
                unmatchedItems.push({
                    ...item,
                    web_search_results: [],
                    handwritten_id: null
                });
            }
        }

        // 5. Enrich with Web Search
        if (unmatchedItems.length > 0) {
            console.log(`Running Web Search for ${unmatchedItems.length} unmatched items...`);
            for (const item of unmatchedItems) {
                let query = "";
                if (item.supplier_code && item.supplier_code.trim() !== "") {
                    query = item.supplier_code.trim();
                } else if (item.barcode && item.barcode.trim() !== "") {
                    query = `${item.barcode.trim()} ${item.description}`;
                } else {
                    query = item.description;
                }
                let searchResults = await searchInternetForProduct(query);
                
                if (searchResults.length === 0 && item.supplier_code && item.description) {
                    console.log(`Web search for SKU "${query}" returned no results. Falling back to description "${item.description}"...`);
                    // Clean description from metadata like (21,0) representing tax percent
                    const cleanDesc = item.description.replace(/\(\d+[\.,]\d+\)/g, '').trim();
                    searchResults = await searchInternetForProduct(cleanDesc);
                }
                item.web_search_results = searchResults;
                console.log(`Web search results for item:`, item.web_search_results);
            }

            // 6. Etapa 2: Cognitive Matching
            console.log("Running Stage 2 (Cognitive Matching via Gemini)...");
            const catalogStr = catalogList.map(p => 
                `- ID: "${p.id}" | Nombre: "${p.name}" | Marca: "${p.brand}" | Modelo: "${p.model}" | Código Barras: "${p.barcode}"`
            ).join("\n");

            const itemsToMatchStr = unmatchedItems.map((item, index) => {
                return `Ítem Factura ${index}:
- Descripción impresa: "${item.description}"
- Código de Proveedor (SKU): "${item.supplier_code || 'Ninguno'}"
- Código de barras impreso: "${item.barcode || 'Ninguno'}"
- Información encontrada en Internet:
  ${item.web_search_results.length > 0 ? item.web_search_results.map(r => `  * ${r}`).join("\n") : "  * Ninguna"}`;
            }).join("\n---\n");

            const matchPrompt = `Eres un asistente de catálogo para PClink Computación. Tu tarea es encontrar el producto equivalente de nuestra base de datos (catálogo local) para cada uno de los ítems de la factura de proveedor utilizando su descripción, código impreso y el contexto de los resultados de búsqueda web.

Aquí tienes el catálogo local de productos de nuestro sistema (Firestore):
${catalogStr}

Aquí tienes los ítems de la factura que debes emparejar con nuestro catálogo local:
${itemsToMatchStr}

Para cada uno de los ítems de la factura que te listé arriba, debes encontrar si existe un producto idéntico o muy similar en nuestro catálogo local:
- Si encuentras un producto coincidente en el catálogo local, devuelve su "ID" correspondiente (por ejemplo, "990", "2727", etc.).
- Si consideras que es un producto totalmente nuevo que NO existe en nuestro catálogo local, o la información es insuficiente para emparejarlo con certeza, devuelve null.

Devuelve tu respuesta únicamente en un arreglo JSON de objetos, respetando el índice del ítem enviado, con el siguiente esquema JSON exacto:
[
  {
    "index": number,
    "matched_id": "string (o null)"
  }
]

REGLA CRÍTICA: Devuelve ÚNICAMENTE el código JSON. No incluyas explicaciones, no agregues bloques de código markdown. Tu respuesta debe ser parseable directamente con JSON.parse().`;

            const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
            let matchResponse;
            let matchLastError;

            for (const modelName of modelsToTry) {
                let retries = 2;
                while (retries >= 0) {
                    try {
                        const testGeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                        matchResponse = await fetch(testGeminiUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: matchPrompt }] }],
                                generationConfig: {
                                    temperature: 0.1,
                                    maxOutputTokens: 4096,
                                    responseMimeType: "application/json"
                                }
                            })
                        });

                        if (matchResponse.ok) {
                            matchLastError = null;
                            retries = -1;
                            break;
                        } else {
                            const errText = await matchResponse.text();
                            matchLastError = new Error(`API ${modelName} falló en Matching (Status ${matchResponse.status}): ${errText}`);
                            if ((matchResponse.status === 503 || matchResponse.status === 429) && retries > 0) {
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                retries--;
                            } else {
                                retries = -1;
                            }
                        }
                    } catch (err) {
                        matchLastError = err;
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            retries--;
                        } else {
                            retries = -1;
                        }
                    }
                }
                if (!matchLastError) {
                    break;
                }
            }

            if (matchLastError || !matchResponse || !matchResponse.ok) {
                console.error("Matching Stage 2 failed:", matchLastError);
                for (const item of unmatchedItems) {
                    finalItems.push({
                        barcode: item.barcode,
                        description: item.description,
                        quantity: item.quantity,
                        cost_price: item.cost_price,
                        handwritten_id: null,
                        match_method: "Failed"
                    });
                }
            } else {
                const matchResData = await matchResponse.json();
                const matchText = matchResData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                let matchJsonText = matchText.trim();
                if (matchJsonText.startsWith("```json")) {
                    matchJsonText = matchJsonText.substring(7);
                } else if (matchJsonText.startsWith("```")) {
                    matchJsonText = matchJsonText.substring(3);
                }
                if (matchJsonText.endsWith("```")) {
                    matchJsonText = matchJsonText.substring(0, matchJsonText.length - 3);
                }
                matchJsonText = matchJsonText.trim();

                const matchResultsList = JSON.parse(matchJsonText);
                const matchMap = new Map();
                for (const r of matchResultsList) {
                    matchMap.set(r.index, r.matched_id);
                }

                unmatchedItems.forEach((item, index) => {
                    const matchedId = matchMap.get(index);
                    const catalogItem = matchedId ? catalogList.find(p => p.id === matchedId) : null;
                    console.log(`Cognitive Match for "${item.description}" -> ID: ${matchedId || 'null'} (${catalogItem ? catalogItem.name : 'No matched'})`);
                    finalItems.push({
                        barcode: item.barcode,
                        description: item.description,
                        quantity: item.quantity,
                        cost_price: item.cost_price,
                        handwritten_id: matchedId || null,
                        match_method: "Web Search + Gemini Cognitive Match"
                    });
                });
            }
        }

        console.log("\n=================== FINAL SYSTEM OUTPUT ===================");
        console.log(JSON.stringify(finalItems, null, 2));

    } catch (err) {
        console.error("Error running OCR & Match field test:", err);
    }
}

runOCRAndMatch();
