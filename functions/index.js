const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
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

    const tokenValue = (mpAccessToken.value() || "").trim();
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
            if (productData.isHidden === true || typeof productData.price !== "number" || productData.price <= 0) {
                throw new HttpsError("failed-precondition", `El producto "${productData.name || item.id}" no tiene un precio válido para venta online.`);
            }
            if (!item.quantity || item.quantity <= 0) {
                throw new HttpsError("invalid-argument", `Cantidad inválida para el producto: ${item.id}`);
            }
            
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

const IMAGE_SEARCH_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BLOCKED_IMAGE_DOMAINS = [
    "shutterstock.com",
    "istockphoto.com",
    "dreamstime.com",
    "depositphotos.com",
    "123rf.com",
    "vecteezy.com",
    "flaticon.com",
    "freepik.com",
    "alamy.com",
    "youtube.com",
    "ytimg.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com"
];

function normalizeProductKey(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function buildCleanProductSearchQuery(name, brand, model) {
    const cleanPart = (val) => {
        const s = String(val || "").trim();
        if (!s || s === "—" || s === "-" || s.toLowerCase() === "genérico" || s.toLowerCase() === "generico" || s.toLowerCase() === "pclink store") {
            return "";
        }
        return s;
    };

    let q = cleanPart(name)
        .replace(/\bWIR\.?\b/gi, "Wireless")
        .replace(/\bINAL\.?\b/gi, "Inalambrica WiFi")
        .replace(/\bPLACA\s+Inalambrica\b/gi, "Adaptador USB")
        .replace(/\bMEM\.?\s*DIGITAL\b/gi, "Memoria")
        .replace(/\bAURIC\.?\b|\bAUR\.?\b/gi, "Auricular")
        .replace(/\bADAPT\.?\b/gi, "Adaptador")
        .replace(/\bORIG\.?\b/gi, "Original")
        .replace(/\bALT\.?\b/gi, "Alternativo")
        .replace(/\bEXT\.?\b/gi, "Externo")
        .replace(/\bC\//gi, "con ")
        .replace(/\bS\//gi, "sin ")
        .replace(/\bMTS?\.?\b/gi, "metros")
        .replace(/\(\d{4,6}\)$/g, "") // quitar códigos internos al final como (7176)
        .replace(/\b(BLISTER|BOLSA|CAJA|UNIDAD|X\s*METRO)\b/gi, "")
        .replace(/[""]/g, " ")
        .replace(/\s+/g, " ")
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
        if (!url || typeof url !== "string") return;
        const clean = url.trim();
        if (!clean.startsWith("https://")) return;
        const lower = clean.toLowerCase();
        if (lower.endsWith(".svg") || lower.includes(".svg?")) return;
        if (BLOCKED_IMAGE_DOMAINS.some(dom => lower.includes(dom))) return;
        if (!seen.has(clean)) {
            seen.add(clean);
            candidates.push(clean);
        }
    };

    // 1. Proveedor Primario: Bing Images (excelente cobertura de marcas locales argentinas)
    try {
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(rawQuery)}&form=HDRSC2&first=1`;
        const bingRes = await fetch(bingUrl, {
            headers: {
                "User-Agent": IMAGE_SEARCH_UA,
                "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
            },
            signal: AbortSignal.timeout(6000)
        });
        if (bingRes.ok) {
            const html = await bingRes.text();
            const matches = html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g);
            for (const m of matches) {
                addCandidate(m[1]);
                if (candidates.length >= 12) break;
            }
        }
    } catch (err) {
        console.warn("Bing image search warning:", err.message);
    }

    // 2. Proveedor Secundario: DuckDuckGo Images si Bing devolvió pocos resultados
    if (candidates.length < 4) {
        try {
            const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(rawQuery)}`;
            const response = await fetch(searchUrl, {
                headers: { "User-Agent": IMAGE_SEARCH_UA },
                signal: AbortSignal.timeout(5000)
            });
            const html = await response.text();
            const vqdMatch = html.match(/vqd=["']?([0-9-]+)["']?/);
            if (vqdMatch) {
                const vqd = vqdMatch[1];
                const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(rawQuery)}&vqd=${vqd}&s=0&o=json&api=d.js`;
                const imageResponse = await fetch(imageUrl, {
                    headers: {
                        "User-Agent": IMAGE_SEARCH_UA,
                        "Referer": "https://duckduckgo.com/"
                    },
                    signal: AbortSignal.timeout(5000)
                });
                if (imageResponse.ok) {
                    const data = await imageResponse.json();
                    if (Array.isArray(data.results)) {
                        for (const r of data.results.slice(0, 8)) {
                            addCandidate(r.image);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("DDG image search warning:", err.message);
        }
    }

    return candidates;
}

async function verifyWorkingImageUrl(url) {
    if (!url || typeof url !== "string" || !url.startsWith("http")) return false;
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": IMAGE_SEARCH_UA,
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
            },
            redirect: "follow",
            signal: AbortSignal.timeout(5500)
        });
        if (!res.ok) return false;
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!ct.startsWith("image/") || ct.includes("svg")) return false;

        const buf = await res.arrayBuffer();
        if (!buf || buf.byteLength < 2200) return false;
        return true;
    } catch (_err) {
        return false;
    }
}

exports.searchProductImages = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para usar el buscador de imágenes.");
    }

    const { query } = request.data;
    if (!query) {
        throw new HttpsError("invalid-argument", "El término de búsqueda es requerido.");
    }

    try {
        const cleanQuery = buildCleanProductSearchQuery(query, "", "");
        const candidates = await fetchCandidateImageUrls(cleanQuery || query);
        const verified = [];

        for (const candidate of candidates) {
            const ok = await verifyWorkingImageUrl(candidate);
            if (ok) {
                verified.push(candidate);
                if (verified.length >= 6) break;
            }
        }

        return { urls: verified };
    } catch (error) {
        console.error("Error in searchProductImages function:", error);
        throw new HttpsError("internal", error.message || "Error al realizar la búsqueda de imágenes.");
    }
});

exports.resolveVerifiedProductImages = onCall({ timeoutSeconds: 300, memory: "512MiB" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const { productIds } = request.data || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
        return { success: true, results: [] };
    }

    const db = admin.firestore();
    const results = [];

    // Procesar con concurrencia controlada de a 4 productos en paralelo
    const CONCURRENCY = 4;
    for (let i = 0; i < productIds.length; i += CONCURRENCY) {
        const slice = productIds.slice(i, i + CONCURRENCY);
        const sliceResults = await Promise.all(slice.map(async (rawId) => {
            const productId = String(rawId || "").trim();
            if (!productId) return { id: rawId, status: "skipped" };

            try {
                const prodRef = db.collection("products").doc(productId);
                const cacheRef = db.collection("product_image_cache").doc(productId);

                const [prodSnap, cacheSnap] = await Promise.all([prodRef.get(), cacheRef.get()]);
                if (!prodSnap.exists) {
                    return { id: productId, status: "not_found" };
                }

                const p = prodSnap.data();
                const hasStock = (typeof p.stock === "number" && p.stock > 0) || productId.toLowerCase().startsWith("pc-gamer-");
                const hasValidPrice = typeof p.price === "number" && p.price > 0;
                const manuallyHidden = p.isHidden === true && p.hiddenReason === "manual";

                // 1. Si el producto ya tiene una imagen que fue verificada previamente, reutilizarla sin volver a buscar
                const existingImg = Array.isArray(p.images) && p.images[0] ? String(p.images[0]).trim() : "";
                if (existingImg && p.imageVerified === true) {
                    await cacheRef.set({
                        productId,
                        name: p.name || "",
                        normalizedName: normalizeProductKey(p.name || ""),
                        imageUrl: existingImg,
                        verifiedAt: p.imageVerifiedAt || Date.now()
                    }, { merge: true });
                    return { id: productId, status: "reused_existing", imageUrl: existingImg };
                }

                // Si tenía una URL cargada pero nunca verificada, corroboramos que funcione
                if (existingImg) {
                    const existingWorks = await verifyWorkingImageUrl(existingImg);
                    if (existingWorks) {
                        const shouldShow = hasStock && hasValidPrice && !manuallyHidden;
                        await Promise.all([
                            prodRef.update({
                                imageVerified: true,
                                imageVerifiedAt: Date.now(),
                                ...(shouldShow ? { isHidden: false, hiddenReason: null } : {}),
                                updatedAt: Date.now()
                            }),
                            cacheRef.set({
                                productId,
                                name: p.name || "",
                                normalizedName: normalizeProductKey(p.name || ""),
                                imageUrl: existingImg,
                                verifiedAt: Date.now()
                            }, { merge: true })
                        ]);
                        return { id: productId, status: "verified_existing", imageUrl: existingImg };
                    }
                }

                // 2. Revisar memoria persistente (product_image_cache por ID o por nombre normalizado)
                let cachedUrl = cacheSnap.exists ? (cacheSnap.data().imageUrl || "") : "";
                if (cachedUrl) {
                    const cacheStillWorks = await verifyWorkingImageUrl(cachedUrl);
                    if (!cacheStillWorks) cachedUrl = "";
                }

                if (!cachedUrl && p.name) {
                    const normName = normalizeProductKey(p.name);
                    if (normName.length >= 4) {
                        const byNameSnap = await db.collection("product_image_cache")
                            .where("normalizedName", "==", normName)
                            .limit(1)
                            .get();
                        if (!byNameSnap.empty) {
                            const candidateCacheUrl = byNameSnap.docs[0].data().imageUrl || "";
                            if (candidateCacheUrl && await verifyWorkingImageUrl(candidateCacheUrl)) {
                                cachedUrl = candidateCacheUrl;
                            }
                        }
                    }
                }

                if (cachedUrl) {
                    const shouldShow = hasStock && hasValidPrice && !manuallyHidden;
                    await Promise.all([
                        prodRef.update({
                            images: [cachedUrl],
                            imageVerified: true,
                            imageVerifiedAt: Date.now(),
                            isHidden: !shouldShow,
                            hiddenReason: shouldShow ? null : (manuallyHidden ? "manual" : (!hasValidPrice ? "zero_price" : "out_of_stock")),
                            updatedAt: Date.now()
                        }),
                        cacheRef.set({
                            productId,
                            name: p.name || "",
                            normalizedName: normalizeProductKey(p.name || ""),
                            imageUrl: cachedUrl,
                            verifiedAt: Date.now()
                        }, { merge: true })
                    ]);
                    return { id: productId, status: "restored_from_cache", imageUrl: cachedUrl };
                }

                // 3. No tenía imagen previa: ejecutar búsqueda inteligente y corroborar que cargue (200 OK + image/*)
                const cleanQuery = buildCleanProductSearchQuery(p.name || "", p.brand || "", p.model || "");
                const candidates = await fetchCandidateImageUrls(cleanQuery);
                let foundValidUrl = "";

                for (const candidate of candidates.slice(0, 8)) {
                    const ok = await verifyWorkingImageUrl(candidate);
                    if (ok) {
                        foundValidUrl = candidate;
                        break;
                    }
                }

                if (foundValidUrl) {
                    const shouldShow = hasStock && hasValidPrice && !manuallyHidden;
                    await Promise.all([
                        prodRef.update({
                            images: [foundValidUrl],
                            imageVerified: true,
                            imageVerifiedAt: Date.now(),
                            isHidden: !shouldShow,
                            hiddenReason: shouldShow ? null : (manuallyHidden ? "manual" : (!hasValidPrice ? "zero_price" : "out_of_stock")),
                            updatedAt: Date.now()
                        }),
                        cacheRef.set({
                            productId,
                            name: p.name || "",
                            normalizedName: normalizeProductKey(p.name || ""),
                            imageUrl: foundValidUrl,
                            verifiedAt: Date.now()
                        }, { merge: true })
                    ]);
                    return { id: productId, status: "found_and_verified", imageUrl: foundValidUrl };
                } else {
                    // No se encontró ninguna foto funcional -> ocultar de la tienda web
                    await prodRef.update({
                        images: [],
                        imageVerified: false,
                        imageSearchAttemptedAt: Date.now(),
                        isHidden: true,
                        hiddenReason: manuallyHidden ? "manual" : "no_valid_image",
                        updatedAt: Date.now()
                    });
                    return { id: productId, status: "hidden_no_image" };
                }
            } catch (err) {
                console.error(`Error resolving image for ${productId}:`, err);
                return { id: productId, status: "error", error: err.message };
            }
        }));

        results.push(...sliceResults);
    }

    return { success: true, results };
});

exports.proxyImage = onRequest({ cors: true }, async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        res.status(400).send("Falta el parámetro 'url'.");
        return;
    }

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            res.status(response.status).send(`Error al obtener la imagen: ${response.statusText}`);
            return;
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        res.setHeader("Content-Type", contentType);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (error) {
        console.error("Error proxying image:", error);
        res.status(500).send(`Error en el proxy: ${error.message}`);
    }
});

exports.mpWebhook = onRequest({ secrets: [mpAccessToken] }, async (req, res) => {
    try {
        // En algunas notificaciones el body viene como query params, pero generalmente es body
        const type = req.body?.type || req.query?.type;
        const dataId = req.body?.data?.id || req.query?.["data.id"];
        
        if (type === "payment" && dataId) {
            const tokenValue = (mpAccessToken.value() || "").trim();
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

    const apiKey = (resendApiKey.value() || "").trim();
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

exports.syncGrupoNucleoCron = onSchedule(
    { schedule: "every monday 08:30", timeZone: "America/Argentina/Buenos_Aires" },
    async (event) => {
    console.log("Starting Grupo Núcleo Monday sync job...");
    try {
        const credsDoc = await admin.firestore().collection("settings").doc("grupo_nucleo_config").get();
        if (!credsDoc.exists) {
            console.warn("Credentials missing. Skipping Grupo Núcleo API sync (using Monday Excel/Email workflow).");
            return;
        }
        const creds = credsDoc.data();
        if (!creds.clientId || !creds.username || !creds.password) {
            console.warn("Incomplete Grupo Núcleo API credentials. Skipping.");
            return;
        }
        
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
            const margin = parseFloat(product.margin) || 30;
            const manuallyHidden = product.isHidden === true && product.hiddenReason === "manual";

            if (!externalId) continue;

            const gnItem = gnMap.get(String(externalId));
            const productRef = docSnap.ref;

            if (gnItem && gnItem.stock > 0) {
                const costInARS = gnItem.currency === 'USD' ? (gnItem.price * exchangeRate) : gnItem.price;
                const taxRate = gnItem.tax || 21;
                const costWithTax = costInARS * (1 + taxRate / 100);
                const finalPrice = Math.round(costWithTax * (1 + margin / 100));
                const hasVerifiedImg = product.imageVerified === true || (Array.isArray(gnItem.images) && gnItem.images.length > 0);

                batch.update(productRef, {
                    price: finalPrice,
                    stock: gnItem.stock,
                    ...(Array.isArray(gnItem.images) && gnItem.images.length > 0 && (!product.images || !product.images[0])
                        ? { images: gnItem.images, imageVerified: true }
                        : {}),
                    isHidden: manuallyHidden || finalPrice <= 0 || !hasVerifiedImg,
                    hiddenReason: manuallyHidden ? "manual" : (finalPrice <= 0 ? "zero_price" : (!hasVerifiedImg ? "no_valid_image" : null)),
                    updatedAt: Date.now()
                });
                updateCount++;
            } else {
                batch.update(productRef, {
                    stock: 0,
                    isHidden: true,
                    hiddenReason: manuallyHidden ? "manual" : "out_of_stock",
                    updatedAt: Date.now()
                });
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

// ============================================================================
// ALERTAS AUTOMÁTICAS AL WHATSAPP DEL LOCAL (CallMeBot) + RESPALDO EMAIL
// ============================================================================

function normalizeArgentineE164(rawPhone) {
    if (!rawPhone) return "";
    const digits = String(rawPhone).replace(/\D/g, "");
    if (!digits) return "";

    let national = digits;
    if (digits.startsWith("0054")) national = digits.substring(4);
    else if (digits.startsWith("54")) national = digits.substring(2);

    if (national.startsWith("9") && national.length === 11) {
        national = national.substring(1);
    }
    if (national.startsWith("0")) {
        national = national.substring(1);
    }
    if (national.length === 12) {
        if (national.startsWith("1115")) national = "11" + national.substring(4);
        else if (national.substring(3, 5) === "15") national = national.substring(0, 3) + national.substring(5);
        else if (national.substring(4, 6) === "15") national = national.substring(0, 4) + national.substring(6);
    }

    if (national.length === 10) {
        return `549${national}`;
    }
    return digits;
}

function buildClientWaLink(rawPhone, prefilledText) {
    const clean = normalizeArgentineE164(rawPhone);
    if (!clean || clean.length < 10) return "";
    return `https://wa.me/${clean}?text=${encodeURIComponent(prefilledText)}`;
}

function formatShippingLine(addr) {
    if (!addr) return "No especificada";
    if (addr.street === "Sucursal Central") return "Retiro en Local (Mar del Plata)";
    const parts = [`${addr.street || ""} ${addr.number || ""}`.trim()];
    if (addr.apartment) parts.push(`Piso/Dpto ${addr.apartment}`);
    if (addr.city) parts.push(addr.city);
    if (addr.state && addr.city !== addr.state) parts.push(addr.state);
    return parts.filter(Boolean).join(", ");
}

function formatItemsLines(items) {
    if (!Array.isArray(items) || items.length === 0) return "• Sin detalle";
    return items
        .slice(0, 6)
        .map((it) => {
            const qty = it.quantity || 1;
            const name = it.productName || it.name || it.productId || "Artículo";
            const price = typeof it.price === "number" ? ` ($${it.price.toLocaleString("es-AR")})` : "";
            return `• ${qty}x ${name}${price}`;
        })
        .join("\n");
}

async function sendCallMeBotMessage(phone, apiKey, text) {
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const cleanKey = String(apiKey || "").trim();
    if (!cleanPhone || !cleanKey) {
        return { sent: false, reason: "missing_credentials" };
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(12000)
    });
    const bodyText = await res.text();
    const lower = bodyText.toLowerCase();

    if (!res.ok || lower.includes("apikey is invalid") || lower.includes("not activated")) {
        throw new Error(`CallMeBot rechazó el envío: ${bodyText.replace(/<[^>]+>/g, " ").trim().slice(0, 180)}`);
    }
    return { sent: true, response: bodyText.slice(0, 200) };
}

async function dispatchStoreAlert({ category, subject, whatsappText, resendSecret }) {
    const db = admin.firestore();
    const cfgSnap = await db.collection("admin_settings").doc("whatsapp_alerts").get();
    const cfg = cfgSnap.exists ? cfgSnap.data() : {};

    if (cfg.enabled === false) return;
    if (category === "order" && cfg.notifyNewOrders === false) return;
    if (category === "attempt" && cfg.notifyCheckoutAttempts === false) return;

    const targetPhone = cfg.phone || "5492235468972";
    const apiKey = cfg.apiKey || "";
    const backupEmail = cfg.backupEmail || "mario@pclinkcomputacion.com.ar";
    const sendEmailBackup = cfg.notifyEmailBackup !== false;

    // 1. Envío por WhatsApp vía CallMeBot (si ya cargó su API Key)
    if (targetPhone && apiKey) {
        try {
            await sendCallMeBotMessage(targetPhone, apiKey, whatsappText);
        } catch (waErr) {
            console.error("WhatsApp CallMeBot alert warning:", waErr.message);
        }
    }

    // 2. Respaldo instantáneo por Email (Resend) para no perder jamás un aviso
    if (sendEmailBackup && backupEmail && resendSecret) {
        const resendKey = (resendSecret.value() || "").trim();
        if (resendKey) {
            try {
                const escapedHtml = whatsappText
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/(https:\/\/wa\.me\/[^\s]+)/g, '<a href="$1" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Abrir chat de WhatsApp con el cliente</a>')
                    .replace(/\n/g, "<br/>");

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${resendKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        from: "Alertas PC Link <noreply@pclinkcomputacion.com.ar>",
                        to: [backupEmail],
                        subject,
                        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;line-height:1.5;color:#111827;">${escapedHtml}</div>`
                    })
                });
            } catch (mailErr) {
                console.error("Backup email alert warning:", mailErr.message);
            }
        }
    }
}

exports.sendTestWhatsAppAlert = onCall(async (request) => {
    if (!request.auth || !request.auth.token.email) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión como administrador.");
    }
    const adminDoc = await admin.firestore().collection("admins").doc(request.auth.token.email).get();
    if (!adminDoc.exists) {
        throw new HttpsError("permission-denied", "Solo administradores pueden probar alertas.");
    }

    const { phone, apiKey } = request.data || {};
    if (!phone || !apiKey) {
        throw new HttpsError("invalid-argument", "Falta teléfono o API Key de CallMeBot.");
    }

    try {
        const testText =
            "✅ *PC LINK COMPUTACIÓN — ALERTA ACTIVA*\n" +
            "Las notificaciones automáticas de nuevos pedidos, pagos de Mercado Pago e intentos de checkout ya están conectadas a este WhatsApp.";
        await sendCallMeBotMessage(phone, apiKey, testText);
        return {
            success: true,
            message: "¡Mensaje de prueba enviado con éxito! Revisá el WhatsApp del local en unos segundos."
        };
    } catch (err) {
        throw new HttpsError("failed-precondition", err.message || "Error al conectar con CallMeBot.");
    }
});

exports.onOrderCreatedAlert = onDocumentCreated(
    { document: "orders/{orderId}", secrets: [resendApiKey] },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const order = snap.data();
        const orderId = event.params.orderId;

        if (!order || typeof order.total !== "number" || order.total <= 0) return;

        // Marcar el borrador de checkout del usuario como convertido para no disparar carrito abandonado
        if (order.userId && order.userId !== "guest") {
            await admin.firestore().collection("checkout_leads").doc(order.userId).set({
                status: "converted",
                convertedOrderId: orderId,
                updatedAt: Date.now()
            }, { merge: true }).catch(() => {});
        }

        const isMpPending = order.paymentMethod === "Mercado Pago" && order.status === "PENDING";
        const orderNum = order.number || orderId;
        const clientName = order.userName || "Cliente Web";
        const clientPhone = order.userPhone || order.shippingAddress?.phone || "";
        const shippingStr = formatShippingLine(order.shippingAddress);
        const itemsStr = formatItemsLines(order.items);
        const totalFormatted = `$${Number(order.total).toLocaleString("es-AR")}`;

        if (isMpPending) {
            const waReply = buildClientWaLink(
                clientPhone,
                `¡Hola ${clientName}! Te escribimos de PC Link Computación por tu intento de compra (${orderNum}). ¿Pudiste completar el pago en Mercado Pago o necesitás ayuda / abonar por transferencia?`
            );

            const text =
                `🟡 *INTENTO DE CHECKOUT (Mercado Pago) ${orderNum}*\n` +
                `👤 Cliente: ${clientName}\n` +
                `📱 Tel: ${clientPhone || "Sin teléfono"} | ✉️ ${order.userEmail || "-"}\n` +
                `🚚 Entrega: ${shippingStr}\n` +
                `🛒 Artículos:\n${itemsStr}\n` +
                `💰 *Total: ${totalFormatted}*\n` +
                `⏳ Redirigido a Mercado Pago (esperando acreditación)` +
                (waReply ? `\n\n👉 Escribirle al cliente:\n${waReply}` : "");

            await dispatchStoreAlert({
                category: "attempt",
                subject: `🟡 Intento de compra Mercado Pago ${orderNum} - ${clientName} (${totalFormatted})`,
                whatsappText: text,
                resendSecret: resendApiKey
            });
        } else {
            const waReply = buildClientWaLink(
                clientPhone,
                `¡Hola ${clientName}! Somos de PC Link Computación. Recibimos tu pedido *${orderNum}* por ${totalFormatted} (${order.paymentMethod}). Te escribimos para coordinar el pago/entrega.`
            );

            const text =
                `🟢 *NUEVO PEDIDO WEB ${orderNum}*\n` +
                `👤 Cliente: ${clientName}\n` +
                `📱 Tel: ${clientPhone || "Sin teléfono"} | ✉️ ${order.userEmail || "-"}\n` +
                `💳 Pago: ${order.paymentMethod || "A coordinar"}\n` +
                `🚚 Entrega: ${shippingStr}\n` +
                `🛒 Artículos:\n${itemsStr}\n` +
                `💰 *Total: ${totalFormatted}*` +
                (waReply ? `\n\n👉 Coordinar con el cliente:\n${waReply}` : "");

            await dispatchStoreAlert({
                category: "order",
                subject: `🟢 Nuevo Pedido Web ${orderNum} - ${clientName} (${totalFormatted})`,
                whatsappText: text,
                resendSecret: resendApiKey
            });
        }
    }
);

exports.onOrderPaidAlert = onDocumentUpdated(
    { document: "orders/{orderId}", secrets: [resendApiKey] },
    async (event) => {
        const before = event.data?.before?.data();
        const after = event.data?.after?.data();
        if (!before || !after) return;

        if (before.status === "PAID" || after.status !== "PAID") return;
        if (after.whatsappPaidNotifiedAt) return;

        await event.data.after.ref.update({ whatsappPaidNotifiedAt: Date.now() }).catch(() => {});

        const orderNum = after.number || event.params.orderId;
        const clientName = after.userName || "Cliente Web";
        const clientPhone = after.userPhone || after.shippingAddress?.phone || "";
        const shippingStr = formatShippingLine(after.shippingAddress);
        const itemsStr = formatItemsLines(after.items);
        const totalFormatted = `$${Number(after.total || 0).toLocaleString("es-AR")}`;

        const waReply = buildClientWaLink(
            clientPhone,
            `¡Hola ${clientName}! Te avisamos de PC Link Computación que ya se acreditó tu pago del pedido *${orderNum}* (${totalFormatted}) y ya lo estamos preparando.`
        );

        const text =
            `✅ *PAGO ACREDITADO MERCADO PAGO ${orderNum}*\n` +
            `👤 Cliente: ${clientName}\n` +
            `📱 Tel: ${clientPhone || "-"}\n` +
            `🚚 Despachar / Retiro: ${shippingStr}\n` +
            `🛒 Preparar:\n${itemsStr}\n` +
            `💰 *Cobrado: ${totalFormatted}*` +
            (waReply ? `\n\n👉 Avisarle al cliente:\n${waReply}` : "");

        await dispatchStoreAlert({
            category: "order",
            subject: `✅ Pago Acreditado ${orderNum} - ${clientName} (${totalFormatted})`,
            whatsappText: text,
            resendSecret: resendApiKey
        });
    }
);

exports.reportCheckoutAttempt = onCall({ secrets: [resendApiKey] }, async (request) => {
    if (!request.auth) return { ok: false };
    const uid = request.auth.uid;
    const data = request.data || {};
    if (!Array.isArray(data.items) || data.items.length === 0 || !(data.total > 0)) {
        return { ok: false };
    }

    const db = admin.firestore();
    const leadRef = db.collection("checkout_leads").doc(uid);
    const leadSnap = await leadRef.get();
    const now = Date.now();

    // Evitar spam: máximo 1 alerta de bloqueo cada 2 horas por usuario
    if (leadSnap.exists && leadSnap.data().lastBlockedAlertAt && now - leadSnap.data().lastBlockedAlertAt < 2 * 60 * 60 * 1000) {
        return { ok: true, deduplicated: true };
    }

    await leadRef.set({
        userId: uid,
        userName: data.userName || "Cliente Web",
        userEmail: data.userEmail || request.auth.token.email || "",
        userPhone: data.userPhone || "",
        items: data.items,
        total: data.total,
        lastBlockedReason: data.reason || "Intento incompleto",
        lastBlockedAlertAt: now,
        status: "notified",
        notifiedAt: now,
        updatedAt: now
    }, { merge: true });

    const clientName = data.userName || "Cliente Web";
    const clientPhone = data.userPhone || "";
    const totalFormatted = `$${Number(data.total).toLocaleString("es-AR")}`;
    const waReply = buildClientWaLink(
        clientPhone,
        `¡Hola ${clientName}! Te escribimos de PC Link Computación porque vimos que intentaste finalizar una compra en nuestra web. ¿Te podemos ayudar por acá para completarla?`
    );

    const text =
        `🟠 *INTENTO DE CHECKOUT FRENADO*\n` +
        `👤 Cliente: ${clientName}\n` +
        `📱 Tel: ${clientPhone || "No llegó a cargarlo"} | ✉️ ${data.userEmail || request.auth.token.email || "-"}\n` +
        `⚠️ Motivo: ${data.reason || "No pudo avanzar"}\n` +
        `🛒 Carrito:\n${formatItemsLines(data.items)}\n` +
        `💰 *Total aprox.: ${totalFormatted}*` +
        (waReply ? `\n\n👉 Asistir por WhatsApp:\n${waReply}` : "");

    await dispatchStoreAlert({
        category: "attempt",
        subject: `🟠 Intento de Checkout con dificultad - ${clientName} (${totalFormatted})`,
        whatsappText: text,
        resendSecret: resendApiKey
    });

    return { ok: true };
});

exports.checkAbandonedCheckoutsCron = onSchedule(
    { schedule: "every 15 minutes", timeZone: "America/Argentina/Buenos_Aires", secrets: [resendApiKey] },
    async () => {
        const db = admin.firestore();
        const now = Date.now();
        const minAge = now - 12 * 60 * 1000; // al menos 12 min sin concretar
        const maxAge = now - 24 * 60 * 60 * 1000; // últimas 24h

        const snap = await db.collection("checkout_leads")
            .where("status", "==", "filling")
            .get();

        for (const docSnap of snap.docs) {
            const lead = docSnap.data();
            if (!lead.updatedAt || lead.updatedAt > minAge || lead.updatedAt < maxAge) continue;
            if (!lead.total || lead.total <= 0 || !lead.userPhone) continue;

            // Verificar que no haya creado una orden recientemente
            const recentOrderSnap = await db.collection("orders")
                .where("userId", "==", docSnap.id)
                .limit(5)
                .get();
            const convertedRecently = recentOrderSnap.docs.some((o) => {
                const od = o.data();
                return od.createdAt && od.createdAt >= lead.updatedAt - 5 * 60 * 1000;
            });

            if (convertedRecently) {
                await docSnap.ref.update({ status: "converted", updatedAt: now });
                continue;
            }

            await docSnap.ref.update({ status: "notified", notifiedAt: now });

            const clientName = lead.userName || "Cliente Web";
            const totalFormatted = `$${Number(lead.total).toLocaleString("es-AR")}`;
            const waReply = buildClientWaLink(
                lead.userPhone,
                `¡Hola ${clientName}! Somos de PC Link Computación. Vimos que estabas completando tu pedido en la web y quedó pendiente. ¿Tenés alguna consulta sobre el envío o el medio de pago?`
            );

            const text =
                `🟡 *CARRITO ABANDONADO EN CHECKOUT*\n` +
                `👤 Cliente: ${clientName}\n` +
                `📱 Tel: ${lead.userPhone} | ✉️ ${lead.userEmail || "-"}\n` +
                `📍 Destino: ${lead.city || "Mar del Plata"}\n` +
                `🛒 Quiso comprar:\n${formatItemsLines(lead.items)}\n` +
                `💰 *Subtotal: ${totalFormatted}*` +
                (waReply ? `\n\n👉 Recuperar venta por WhatsApp:\n${waReply}` : "");

            await dispatchStoreAlert({
                category: "attempt",
                subject: `🟡 Carrito abandonado en Checkout - ${clientName} (${totalFormatted})`,
                whatsappText: text,
                resendSecret: resendApiKey
            });
        }
    }
);




