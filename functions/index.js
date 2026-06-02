const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

admin.initializeApp();

const mpAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");

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

