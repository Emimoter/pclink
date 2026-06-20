const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { loginGrupoNucleo, getGrupoNucleoExchange, fetchGrupoNucleoCatalog } = require("./grupoNucleo");

admin.initializeApp();

const mpAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");
const resendApiKey = defineSecret("RESEND_API_KEY");

exports.createPreference = onCall({ secrets: [mpAccessToken] }, async (request) => {
    // 1. Obtener datos del usuario (autenticado o invitado)
    const userId = request.auth ? request.auth.uid : "guest";
    const email = request.auth ? request.auth.token.email : (request.data.email || "guest@pclink.com");

    const tokenValue = mpAccessToken.value();
    if (!tokenValue) {
        throw new HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN no está configurado en Firebase Secrets.");
    }

    const client = new MercadoPagoConfig({ 
        accessToken: tokenValue,
        options: { timeout: 5000 }
    });

    const { items, shippingCost = 0, backUrls, orderId } = request.data;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new HttpsError("invalid-argument", "El carrito está vacío.");
    }

    try {
        const lineItems = [];
        
        // 2. Obtener precios reales desde Firestore para seguridad
        for (const item of items) {
            const productDoc = await admin.firestore().collection("products").doc(item.id).get();
            
            if (!productDoc.exists) {
                throw new HttpsError("not-found", `Producto no encontrado: ${item.id}`);
            }

            const productData = productDoc.data();
            
            lineItems.push({
                id: item.id,
                title: productData.name,
                unit_price: productData.price,
                quantity: item.quantity,
                currency_id: "ARS",
                picture_url: productData.images ? productData.images[0] : ""
            });
        }

        // 3. Agregar costo de envío si existe
        if (shippingCost > 0) {
            lineItems.push({
                title: "Costo de envío",
                unit_price: shippingCost,
                quantity: 1,
                currency_id: "ARS"
            });
        }

        // 4. Crear la preferencia en MercadoPago
        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: lineItems,
                payer: {
                    email: email
                },
                back_urls: backUrls || {
                    success: "pclink://checkout/success",
                    failure: "pclink://checkout/failure",
                    pending: "pclink://checkout/pending"
                },
                auto_return: "approved",
                statement_descriptor: "PCLINK APP",
                external_reference: orderId || `ORDER-${Date.now()}-${userId}`,
                notification_url: "https://us-central1-pclink-f6e0d.cloudfunctions.net/mpWebhook"
            }
        });

        return {
            preferenceId: response.id,
            initPoint: response.init_point
        };

    } catch (error) {
        console.error("Error creating MP preference:", error);
        throw new HttpsError("internal", error.message || "Error al procesar el pago con MercadoPago.");
    }
});

exports.searchProductImages = onCall(async (request) => {
    // 1. Validar autenticación
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para usar el buscador de imágenes.");
    }

    const { query } = request.data;
    if (!query) {
        throw new HttpsError("invalid-argument", "El término de búsqueda es requerido.");
    }

    try {
        // 2. Obtener el token de consulta VQD de DuckDuckGo
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        
        const html = await response.text();
        const vqdMatch = html.match(/vqd=["']?([0-9-]+)["']?/);
        if (!vqdMatch) {
            throw new Error("No se pudo iniciar la consulta de imágenes.");
        }
        const vqd = vqdMatch[1];

        // 3. Consultar la API interna de imágenes
        const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&s=0&o=json&api=d.js`;
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://duckduckgo.com/'
            }
        });
        
        const data = await imageResponse.json();

        if (!data.results || data.results.length === 0) {
            return { urls: [] };
        }

        // Devolvemos las 5 mejores URLs para dar más variedad al administrador
        const urls = data.results.slice(0, 5).map(r => r.image);
        return { urls };

    } catch (error) {
        console.error("Error in searchProductImages function:", error);
        throw new HttpsError("internal", error.message || "Error al realizar la búsqueda de imágenes.");
    }
});

exports.mpWebhook = onRequest({ secrets: [mpAccessToken] }, async (req, res) => {
    try {
        // En algunas notificaciones el body viene como query params, pero generalmente es body
        const type = req.body?.type || req.query?.type;
        const dataId = req.body?.data?.id || req.query?.["data.id"];
        
        if (type === "payment" && dataId) {
            const tokenValue = mpAccessToken.value();
            const client = new MercadoPagoConfig({ accessToken: tokenValue, options: { timeout: 5000 } });
            const paymentClient = new Payment(client);
            
            const paymentInfo = await paymentClient.get({ id: dataId });
            
            if (paymentInfo.status === "approved" && paymentInfo.external_reference) {
                const orderId = paymentInfo.external_reference;
                
                // Actualizar la orden en Firestore
                await admin.firestore().collection("orders").doc(orderId).update({
                    status: "PAID",
                    [`statusHistory.PAID`]: Date.now(),
                    paymentId: paymentInfo.id
                });
            }
        }
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error webhook MP:", error);
        // Respondemos 200 para que MP no reintente infinitamente si es un error parseando algo
        res.status(200).send("Error interno gestionado");
    }
});

exports.sendOTP = onCall({ secrets: [resendApiKey] }, async (request) => {
    // 1. Validar autenticación
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para verificar tu correo.");
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email;

    if (!email) {
        throw new HttpsError("invalid-argument", "El usuario no tiene un correo electrónico asociado.");
    }

    const apiKey = resendApiKey.value();
    if (!apiKey) {
        throw new HttpsError("failed-precondition", "RESEND_API_KEY no está configurado en Firebase Secrets.");
    }

    // 2. Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutos

    try {
        // 3. Guardar el código OTP en Firestore (verification_codes/{uid})
        await admin.firestore().collection("verification_codes").doc(uid).set({
            code: code,
            email: email,
            createdAt: now,
            expiresAt: expiresAt
        });

        // 4. Enviar el email mediante Resend REST API
        // Usar el sandbox de Resend para el correo del propietario, y el dominio verificado para los demás destinatarios
        const isTestingEmail = email.toLowerCase() === "emiliano.gimenez.96@gmail.com";
        const fromEmail = isTestingEmail 
            ? "PClink Computación <onboarding@resend.dev>" 
            : "PClink Computación <noreply@pclinkcomputacion.com.ar>";
        
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [email],
                subject: `Código de verificación: ${code}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
                        <h2 style="color: #0E2B33; text-align: center;">Verificación de Correo</h2>
                        <p>Hola,</p>
                        <p>Ingresá el siguiente código de 6 dígitos en la aplicación o el sitio web para completar tu registro y verificar tu dirección de correo electrónico:</p>
                        <div style="background-color: #f4f9fa; padding: 15px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #00bcd4; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="font-size: 12px; color: #777; text-align: center;">Este código expirará en 10 minutos y solo puede ser usado una vez.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #999; text-align: center;">PClink Computación</p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Resend API error:", errText);
            throw new Error(`Error en el servicio de email (Resend): ${errText}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error in sendOTP:", error);
        throw new HttpsError("internal", error.message || "Error al enviar el código de verificación.");
    }
});

exports.verifyOTP = onCall(async (request) => {
    // 1. Validar autenticación
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para verificar tu correo.");
    }

    const uid = request.auth.uid;
    const { code } = request.data;

    if (!code || code.trim().length !== 6) {
        throw new HttpsError("invalid-argument", "El código debe ser de 6 dígitos.");
    }

    try {
        const docRef = admin.firestore().collection("verification_codes").doc(uid);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new HttpsError("not-found", "No se encontró ningún código de verificación activo para este usuario. Solicita uno nuevo.");
        }

        const data = docSnap.data();
        const now = Date.now();

        if (now > data.expiresAt) {
            await docRef.delete();
            throw new HttpsError("failed-precondition", "El código de verificación ha expirado. Solicita uno nuevo.");
        }

        if (data.code !== code.trim()) {
            throw new HttpsError("invalid-argument", "El código de verificación ingresado es incorrecto.");
        }

        // Código válido! 
        // 2. Actualizar emailVerified en Firebase Auth
        await admin.auth().updateUser(uid, {
            emailVerified: true
        });

        // 3. Actualizar isEmailVerified en la colección users de Firestore
        await admin.firestore().collection("users").doc(uid).set({
            isEmailVerified: true
        }, { merge: true });

        // 4. Eliminar el código para evitar reuso
        await docRef.delete();

        return { success: true };
    } catch (error) {
        throw new HttpsError("internal", error.message || "Error al verificar el código.");
    }
});

exports.getGrupoNucleoCatalog = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    
    const email = request.auth.token.email;
    const adminDoc = await admin.firestore().collection("admins").doc(email).get();
    if (!adminDoc.exists) {
        throw new HttpsError("permission-denied", "Acceso denegado.");
    }

    try {
        const credsDoc = await admin.firestore().collection("settings").doc("grupo_nucleo_config").get();
        if (!credsDoc.exists) {
            return { success: false, error: "CREDENTIALS_MISSING", message: "Credenciales de Grupo Núcleo no configuradas." };
        }
        const creds = credsDoc.data();
        const token = await loginGrupoNucleo(creds.clientId, creds.username, creds.password);
        const catalog = await fetchGrupoNucleoCatalog(token);
        const exchangeRate = await getGrupoNucleoExchange(token);

        return { success: true, catalog, exchangeRate };
    } catch (error) {
        console.error("Error fetching GN catalog:", error);
        throw new HttpsError("internal", error.message || "Error al obtener catálogo de Grupo Núcleo.");
    }
});

exports.syncGrupoNucleoCron = onSchedule("every 24 hours", async (event) => {
    console.log("Starting Grupo Núcleo sync job...");
    try {
        const credsDoc = await admin.firestore().collection("settings").doc("grupo_nucleo_config").get();
        if (!credsDoc.exists) {
            console.warn("Credentials missing. Skipping Grupo Núcleo sync.");
            return;
        }
        const creds = credsDoc.data();
        
        const token = await loginGrupoNucleo(creds.clientId, creds.username, creds.password);
        const catalog = await fetchGrupoNucleoCatalog(token);
        const exchangeRate = await getGrupoNucleoExchange(token);
        console.log(`Fetched GN Catalog with ${catalog.length} items. USD exchange rate: ${exchangeRate}`);

        const gnMap = new Map();
        for (const item of catalog) {
            gnMap.set(String(item.id), item);
        }

        const productsSnapshot = await admin.firestore()
            .collection("products")
            .where("externalSource", "==", "grupo_nucleo")
            .get();

        console.log(`Found ${productsSnapshot.size} products to sync in Firestore.`);
        
        let batch = admin.firestore().batch();
        let updateCount = 0;

        for (const docSnap of productsSnapshot.docs) {
            const product = docSnap.data();
            const externalId = product.externalId;
            const margin = parseFloat(product.margin) || 0;

            if (!externalId) continue;

            const gnItem = gnMap.get(String(externalId));
            const productRef = docSnap.ref;

            if (gnItem) {
                const costInARS = gnItem.currency === 'USD' ? (gnItem.price * exchangeRate) : gnItem.price;
                const taxRate = gnItem.tax || 0;
                const costWithTax = costInARS * (1 + taxRate / 100);
                const finalPrice = Math.round(costWithTax * (1 + margin / 100));

                batch.update(productRef, {
                    price: finalPrice,
                    stock: gnItem.stock,
                    updatedAt: Date.now()
                });
                updateCount++;
            } else {
                batch.update(productRef, {
                    stock: 0,
                    updatedAt: Date.now()
                });
                console.log(`Product ${docSnap.id} (GN ID ${externalId}) not found in catalog. Setting stock to 0.`);
                updateCount++;
            }

            if (updateCount % 400 === 0) {
                await batch.commit();
                batch = admin.firestore().batch();
            }
        }

        if (updateCount % 400 !== 0) {
            await batch.commit();
        }

        console.log(`Successfully synced ${updateCount} products.`);
    } catch (error) {
        console.error("Error running Grupo Núcleo sync cron:", error);
    }
});

exports.generateProductDescription = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para generar descripciones.");
    }

    const { productId, override = false } = request.data;
    if (!productId) {
        throw new HttpsError("invalid-argument", "El ID del producto es requerido.");
    }

    try {
        const configDoc = await admin.firestore().collection("settings").doc("gemini_config").get();
        let apiKey = configDoc.exists ? configDoc.data().apiKey : null;

        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY;
        }

        if (!apiKey) {
            throw new HttpsError("failed-precondition", "La API Key de Gemini no está configurada en la base de datos.");
        }

        const productRef = admin.firestore().collection("products").doc(productId);
        const productSnap = await productRef.get();
        if (!productSnap.exists) {
            throw new HttpsError("not-found", "Producto no encontrado.");
        }

        const product = productSnap.data();
        
        if (product.description && !override && product.description !== `Producto importado de Grupo Núcleo. Cód: ${productId}.`) {
            return { success: true, description: product.description, updated: false };
        }

        const prompt = `Eres un redactor técnico experto en e-commerce de tecnología. Genera la ficha técnica para el siguiente producto basándote en su información y en tus conocimientos de hardware y tecnología.

Información disponible del producto:
Nombre: ${product.name}
Marca: ${product.brand || "Genérica"}
Modelo: ${product.model || ""}
Categoría: ${product.category || ""}

REGLAS DE FORMATO Y CONTENIDO (SÍGUELAS ESTRICTAMENTE):
1. Genera ÚNICAMENTE una lista con viñetas de especificaciones técnicas detalladas.
2. Cada línea debe usar estrictamente el formato: - Característica o Componente: Valor detallado. Ejemplo:
   - Marca: ASUS
   - Modelo: Prime A520M-K
   - Zócalo (Socket): AM4
3. Está TOTALMENTE PROHIBIDO incluir textos introductorios o de cierre (NO agregues frases como "Aquí tienes la descripción...", "Ficha técnica:", etc.). Comienza directamente con la primera viñeta y termina con la última viñeta.
4. Está TOTALMENTE PROHIBIDO incluir frases comerciales, publicitarias o de marketing (NO uses palabras subjetivas como "excelente", "potente", "diseñado para llevar tu juego al siguiente nivel", "increíble", "ideal para ti", etc.). Todo debe ser 100% objetivo y factual.
5. Si no conoces con total certeza alguna especificación detallada basada en el nombre/modelo del producto, NO la inventes. Deduce solo detalles técnicos estándares y seguros que correspondan directamente a este modelo y categoría de hardware de forma certera. Omite cualquier dato dudoso.
`;

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
        let response;
        let lastError;

        for (const model of modelsToTry) {
            let retries = 2;
            while (retries >= 0) {
                try {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    response = await fetch(geminiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        { text: prompt }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 2048
                            }
                        })
                    });

                    if (response.ok) {
                        lastError = null;
                        retries = -1;
                        break;
                    } else {
                        const errText = await response.text();
                        lastError = new Error(`API ${model} falló (Status ${response.status}): ${errText}`);
                        if ((response.status === 503 || response.status === 429) && retries > 0) {
                            console.warn(`Error temporal ${response.status} en modelo ${model}. Reintentando en 2s...`);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            retries--;
                        } else {
                            retries = -1;
                        }
                    }
                } catch (err) {
                    lastError = err;
                    if (retries > 0) {
                        console.warn(`Error de red en modelo ${model}. Reintentando en 2s...`, err);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        retries--;
                    } else {
                        retries = -1;
                    }
                }
            }
            if (!lastError) {
                break;
            }
        }

        if (lastError || !response || !response.ok) {
            throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini.");
        }

        const resData = await response.json();
        const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No se pudo generar texto de descripción.");
        }

        const finalDesc = generatedText.trim();

        await productRef.update({
            description: finalDesc,
            updatedAt: Date.now()
        });

        return { success: true, description: finalDesc, updated: true };

    } catch (error) {
        console.error("Error in generateProductDescription:", error);
        throw new HttpsError("internal", error.message || "Error al generar la descripción del producto.");
    }
});

exports.generateBatchProductDescriptions = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const { productIds, override = false } = request.data;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new HttpsError("invalid-argument", "Los IDs de los productos son requeridos.");
    }

    try {
        const configDoc = await admin.firestore().collection("settings").doc("gemini_config").get();
        let apiKey = configDoc.exists ? configDoc.data().apiKey : null;
        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY;
        }

        if (!apiKey) {
            throw new HttpsError("failed-precondition", "La API Key de Gemini no está configurada.");
        }

        const processSingleProduct = async (productId) => {
            try {
                const productRef = admin.firestore().collection("products").doc(productId);
                const docSnap = await productRef.get();
                if (!docSnap.exists) {
                    return { id: productId, status: "error", error: "Product not found" };
                }

                const product = docSnap.data();
                if (product.description && !override && product.description !== `Producto importado de Grupo Núcleo. Cód: ${productId}.`) {
                    return { id: productId, status: "skipped" };
                }

                const prompt = `Eres un redactor técnico experto en e-commerce de tecnología. Genera la ficha técnica para el siguiente producto basándote en su información y en tus conocimientos de hardware y tecnología.

Información disponible del producto:
Nombre: ${product.name}
Marca: ${product.brand || "Genérica"}
Modelo: ${product.model || ""}
Categoría: ${product.category || ""}

REGLAS DE FORMATO Y CONTENIDO (SÍGUELAS ESTRICTAMENTE):
1. Genera ÚNICAMENTE una lista con viñetas de especificaciones técnicas detalladas.
2. Cada línea debe usar estrictamente el formato: - Característica o Componente: Valor detallado. Ejemplo:
   - Marca: ASUS
   - Modelo: Prime A520M-K
   - Zócalo (Socket): AM4
3. Está TOTALMENTE PROHIBIDO incluir textos introductorios o de cierre (NO agregues frases como "Aquí tienes la descripción...", "Ficha técnica:", etc.). Comienza directamente con la primera viñeta y termina con la última viñeta.
4. Está TOTALMENTE PROHIBIDO incluir frases comerciales, publicitarias o de marketing (NO uses palabras subjetivas como "excelente", "potente", "diseñado para llevar tu juego al siguiente nivel", "increíble", "ideal para ti", etc.). Todo debe ser 100% objetivo y factual.
5. Si no conoces con total certeza alguna especificación detallada basada en el nombre/modelo del producto, NO la inventes. Deduce solo detalles técnicos estándares y seguros que correspondan directamente a este modelo y categoría de hardware de forma certera. Omite cualquier dato dudoso.
`;

                const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
                let response;
                let lastError;

                for (const model of modelsToTry) {
                    let retries = 2;
                    while (retries >= 0) {
                        try {
                            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                            response = await fetch(geminiUrl, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    contents: [{ parts: [{ text: prompt }] }],
                                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                                })
                            });

                            if (response.ok) {
                                lastError = null;
                                retries = -1;
                                break;
                            } else {
                                const errText = await response.text();
                                lastError = new Error(`API ${model} falló (Status ${response.status}): ${errText}`);
                                if ((response.status === 503 || response.status === 429) && retries > 0) {
                                    console.warn(`Error temporal ${response.status} en modelo ${model}. Reintentando en 2s...`);
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    retries--;
                                } else {
                                    retries = -1;
                                }
                            }
                        } catch (err) {
                            lastError = err;
                            if (retries > 0) {
                                console.warn(`Error de red en modelo ${model}. Reintentando en 2s...`, err);
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                retries--;
                            } else {
                                retries = -1;
                            }
                        }
                    }
                    if (!lastError) {
                        break;
                    }
                }

                if (lastError || !response || !response.ok) {
                    throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini.");
                }

                const resData = await response.json();
                const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (generatedText) {
                    const finalDesc = generatedText.trim();
                    await productRef.update({
                        description: finalDesc,
                        updatedAt: Date.now()
                    });
                    return { id: productId, status: "updated" };
                } else {
                    return { id: productId, status: "error", error: "No text generated" };
                }
            } catch (err) {
                console.error(`Error generating for product ${productId}:`, err);
                return { id: productId, status: "error", error: err.message };
            }
        };

        const results = await Promise.all(productIds.map(id => processSingleProduct(id)));

        return { success: true, results };
    } catch (error) {
        console.error("Error in generateBatchProductDescriptions:", error);
        throw new HttpsError("internal", error.message || "Error al procesar el lote.");
    }
});

// Helper to query DuckDuckGo for product context using HTML search
async function searchInternetForProduct(query) {
    if (!query || query.trim() === "") return [];
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            console.error(`DuckDuckGo search failed for query "${query}": Status ${response.status}`);
            return [];
        }
        const html = await response.text();
        
        const snippets = [];
        const titles = [];
        
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;
        
        let match;
        while ((match = snippetRegex.exec(html)) !== null) {
            let snippet = match[1]
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            snippets.push(snippet);
        }
        
        while ((match = titleRegex.exec(html)) !== null) {
            let title = match[1]
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            titles.push(title);
        }
        
        const results = [];
        for (let i = 0; i < Math.min(titles.length, snippets.length, 3); i++) {
            results.push(`Título: "${titles[i]}" | Resumen: "${snippets[i]}"`);
        }
        return results;
    } catch (error) {
        console.error(`Error in searchInternetForProduct for query "${query}":`, error);
        return [];
    }
}

exports.processInvoiceImage = onCall(async (request) => {
    const { imageBase64, mimeType = "image/jpeg" } = request.data;
    if (!imageBase64) {
        throw new HttpsError("invalid-argument", "La imagen en base64 de la factura es requerida.");
    }

    try {
        const db = admin.firestore();

        // 1. Obtener la API Key de Gemini
        const configDoc = await db.collection("settings").doc("gemini_config").get();
        let apiKey = configDoc.exists ? configDoc.data().apiKey : null;
        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY;
        }

        if (!apiKey) {
            throw new HttpsError("failed-precondition", "La API Key de Gemini no está configurada.");
        }

        // 2. Obtener el catálogo completo de Firestore para matchear
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
            
            // Si el producto tiene un código de barra, lo registramos en el mapa
            if (product.barcode && product.barcode.trim() !== "") {
                barcodeToProductMap.set(product.barcode.trim(), product);
            }
        });

        // 3. Etapa 1: Llamar a Gemini para extraer los ítems impresos de la factura
        const extractPrompt = `Analiza la imagen de esta factura de proveedor e identifica todas las filas de productos en la tabla.
Extrae la información tal como está impresa en la factura. No intentes buscar anotaciones en lapicera en los márgenes.

Para cada producto de la factura, debes extraer los siguientes datos:
1. "barcode": El número de código de barras impreso en la factura (usualmente de 12 o 13 dígitos) o código de barras/GTIN del producto en esa fila. Si no tiene, busca el código o SKU de proveedor (por ejemplo: CABX0910316). Si no hay ninguno, devuelve null.
2. "description": La descripción del producto impresa en la factura (por ejemplo "CABLE USB TIP").
3. "quantity": La cantidad de unidades que ingresan (por ejemplo, de "3,00 x" la cantidad es 3).
4. "cost_price": El precio unitario de costo (el valor unitario antes de impuestos u otros cargos, por ejemplo de "3,00 x 2.058,7537", el costo es 2058.75).

Devuelve un arreglo JSON válido donde cada elemento siga exactamente este esquema JSON:
{
  "barcode": "string (o null)",
  "description": "string",
  "quantity": number,
  "cost_price": number
}

REGLA CRÍTICA: Devuelve ÚNICAMENTE el código JSON. No incluyas explicaciones, no agregues bloques de código markdown (\`\`\`json ... \`\`\`). Tu respuesta debe ser parseable directamente con JSON.parse().`;

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
        let response;
        let lastError;

        for (const model of modelsToTry) {
            let retries = 2;
            while (retries >= 0) {
                try {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    response = await fetch(geminiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        { text: extractPrompt },
                                        {
                                            inlineData: {
                                                mimeType: mimeType,
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

                    if (response.ok) {
                        lastError = null;
                        retries = -1;
                        break;
                    } else {
                        const errText = await response.text();
                        lastError = new Error(`API ${model} falló en Extracción (Status ${response.status}): ${errText}`);
                        if ((response.status === 503 || response.status === 429) && retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            retries--;
                        } else {
                            retries = -1;
                        }
                    }
                } catch (err) {
                    lastError = err;
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        retries--;
                    } else {
                        retries = -1;
                    }
                }
            }
            if (!lastError) {
                break;
            }
        }

        if (lastError || !response || !response.ok) {
            throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini para la extracción.");
        }

        const resData = await response.json();
        const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No se pudo extraer información de la factura.");
        }

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

        // 4. Intentar emparejar por código de barra localmente, o buscar en internet
        const unmatchedItems = [];
        const finalItems = [];

        for (const item of extractedItems) {
            let matchedProduct = null;
            
            // Intento 1: Match exacto de código de barra
            if (item.barcode && item.barcode.trim() !== "") {
                const cleanedBarcode = item.barcode.trim();
                matchedProduct = barcodeToProductMap.get(cleanedBarcode);
            }

            if (matchedProduct) {
                // Si matcheó directamente por código de barra, lo agregamos al resultado final
                finalItems.push({
                    barcode: item.barcode,
                    description: item.description,
                    quantity: item.quantity,
                    cost_price: item.cost_price,
                    handwritten_id: matchedProduct.id
                });
            } else {
                // Si no matcheó, lo agregamos a la lista de pendientes para búsqueda y matching cognitivo
                unmatchedItems.push({
                    ...item,
                    web_search_results: [],
                    handwritten_id: null
                });
            }
        }

        // 5. Enriquecer ítems no emparejados con búsqueda en internet en paralelo
        if (unmatchedItems.length > 0) {
            console.log(`Realizando búsqueda web para ${unmatchedItems.length} ítems no emparejados...`);
            const searchPromises = unmatchedItems.map(async (item) => {
                // Formular consulta: preferiblemente código de barra + descripción para precisión
                let query = "";
                if (item.barcode && item.barcode.trim() !== "") {
                    query = `${item.barcode} ${item.description}`;
                } else {
                    query = item.description;
                }
                
                // Ejecutar búsqueda
                const searchResults = await searchInternetForProduct(query);
                item.web_search_results = searchResults;
            });

            await Promise.all(searchPromises);

            // 6. Etapa 2: Llamada cognitiva a Gemini para matchear con base de datos usando contexto de internet
            const catalogStr = catalogList.map(p => 
                `- ID: "${p.id}" | Nombre: "${p.name}" | Marca: "${p.brand}" | Modelo: "${p.model}" | Código Barras: "${p.barcode}"`
            ).join("\n");

            const itemsToMatchStr = unmatchedItems.map((item, index) => {
                return `Ítem Factura ${index}:
- Descripción impresa: "${item.description}"
- Código/SKU impreso: "${item.barcode || 'Ninguno'}"
- Información encontrada en Internet:
  ${item.web_search_results.length > 0 ? item.web_search_results.map(r => `  * ${r}`).join("\n") : "  * Ninguna"}
`;
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

            let matchResponse;
            let matchLastError;

            for (const model of modelsToTry) {
                let retries = 2;
                while (retries >= 0) {
                    try {
                        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                        matchResponse = await fetch(geminiUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        parts: [
                                            { text: matchPrompt }
                                        ]
                                    }
                                ],
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
                            matchLastError = new Error(`API ${model} falló en Matching (Status ${matchResponse.status}): ${errText}`);
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
                console.error("Fallo la etapa 2 de matching:", matchLastError);
                for (const item of unmatchedItems) {
                    finalItems.push({
                        barcode: item.barcode,
                        description: item.description,
                        quantity: item.quantity,
                        cost_price: item.cost_price,
                        handwritten_id: null
                    });
                }
            } else {
                const matchResData = await matchResponse.json();
                const matchText = matchResData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (matchText) {
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

                    try {
                        const matchResultsList = JSON.parse(matchJsonText);
                        const matchMap = new Map();
                        for (const r of matchResultsList) {
                            matchMap.set(r.index, r.matched_id);
                        }

                        // Asignar los IDs resultantes
                        unmatchedItems.forEach((item, index) => {
                            finalItems.push({
                                barcode: item.barcode,
                                description: item.description,
                                quantity: item.quantity,
                                cost_price: item.cost_price,
                                handwritten_id: matchMap.get(index) || null
                            });
                        });
                    } catch (parseErr) {
                        console.error("Error parseando JSON de match cognitivo:", parseErr, matchJsonText);
                        for (const item of unmatchedItems) {
                            finalItems.push({
                                barcode: item.barcode,
                                description: item.description,
                                quantity: item.quantity,
                                cost_price: item.cost_price,
                                handwritten_id: null
                            });
                        }
                    }
                } else {
                    console.error("No se generó texto de matching en etapa 2");
                    for (const item of unmatchedItems) {
                        finalItems.push({
                            barcode: item.barcode,
                            description: item.description,
                            quantity: item.quantity,
                            cost_price: item.cost_price,
                            handwritten_id: null
                        });
                    }
                }
            }
        }

        return { success: true, items: finalItems };

    } catch (error) {
        console.error("Error in processInvoiceImage:", error);
        throw new HttpsError("internal", error.message || "Error al procesar la imagen de la factura.");
    }
});

exports.importInvoiceBatch = onCall(async (request) => {
    const { batch } = request.data;
    if (!batch || !batch.items) {
        throw new HttpsError("invalid-argument", "El lote es requerido.");
    }

    try {
        const db = admin.firestore();
        const firestoreBatch = db.batch();
        const productsCol = db.collection("products");
        const batchesCol = db.collection("invoice_batches");

        // 1. Procesar cada ítem
        for (const item of batch.items) {
            // El artículo puede venir de handwrittenId o tempHandwrittenId
            const articleId = item.handwrittenId || item.tempHandwrittenId;
            if (!articleId || articleId.trim() === "") continue;

            const productDocRef = productsCol.doc(articleId);
            const productSnapshot = await productDocRef.get();

            const calculatedPrice = item.calculatedPrice || Math.round(item.costPrice * (1 + item.marginPercent / 100));

            if (productSnapshot.exists) {
                // Sumar al stock y actualizar precio
                const currentStock = productSnapshot.data().stock || 0;
                const newStock = currentStock + parseInt(item.quantity || 0);
                
                const updates = {
                    price: calculatedPrice,
                    stock: newStock,
                    updatedAt: Date.now()
                };

                if (item.barcode && item.barcode.trim() !== "") {
                    updates.barcode = item.barcode;
                }

                firestoreBatch.update(productDocRef, updates);
            } else {
                // Crear borrador
                const newProductMap = {
                    name: item.description,
                    brand: "PClink Store",
                    model: "",
                    category: "GAMING",
                    price: calculatedPrice,
                    stock: parseInt(item.quantity || 0),
                    description: "Producto ingresado mediante PClink Stock Manager.",
                    releasedAt: Date.now(),
                    updatedAt: Date.now(),
                    images: [],
                    specs: [],
                    tags: ["NEW"]
                };

                if (item.barcode && item.barcode.trim() !== "") {
                    newProductMap.barcode = item.barcode;
                }

                firestoreBatch.set(productDocRef, newProductMap);
            }
        }

        // 2. Guardar el registro de la factura en el historial
        const batchDocRef = batchesCol.doc();
        const batchMap = {
            invoiceNumber: batch.invoiceNumber || `Factura-${Date.now()}`,
            date: batch.date || Date.now(),
            processedBy: batch.processedBy || "admin@pclink.com",
            itemCount: batch.items.length,
            items: batch.items.map(item => ({
                barcode: item.barcode || null,
                description: item.description || "",
                quantity: item.quantity || 1,
                costPrice: item.costPrice || 0,
                handwrittenId: item.handwrittenId || item.tempHandwrittenId,
                calculatedPrice: item.calculatedPrice || Math.round(item.costPrice * (1 + item.marginPercent / 100))
            }))
        };
        firestoreBatch.set(batchDocRef, batchMap);

        await firestoreBatch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error in importInvoiceBatch:", error);
        throw new HttpsError("internal", error.message || "Error al importar el lote en Firestore.");
    }
});

exports.getRecentBatches = onCall(async (request) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection("invoice_batches")
            .orderBy("date", "desc")
            .limit(20)
            .get();

        const batches = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                invoiceNumber: data.invoiceNumber || "",
                date: data.date || 0,
                processedBy: data.processedBy || "",
                itemCount: data.itemCount || 0,
                items: data.items || []
            };
        });

        return { success: true, batches };
    } catch (error) {
        console.error("Error in getRecentBatches:", error);
        throw new HttpsError("internal", error.message || "Error al obtener historial.");
    }
});



