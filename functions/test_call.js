const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

async function test() {
  const productId = "2595";
  const override = true;

  try {
    const configDoc = await db.collection("settings").doc("gemini_config").get();
    let apiKey = configDoc.exists ? configDoc.data().apiKey : null;

    if (!apiKey) {
      console.log("❌ API Key not found in Firestore!");
      process.exit(1);
    }
    console.log("Using API Key:", apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4));

    const productRef = db.collection("products").doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      console.log("❌ Product not found in Firestore!");
      process.exit(1);
    }

    const product = productSnap.data();
    console.log("Found product:", product.name);
    console.log("Category:", product.category);

    const prompt = `Eres un redactor de contenido experto en e-commerce de tecnología para la tienda PClink.
Escribe una descripción comercial, detallada y persuasiva en español (con formato Markdown) para el siguiente producto:
Nombre: ${product.name}
Marca: ${product.brand || "Genérica"}
Modelo: ${product.model || ""}
Categoría: ${product.category || ""}

La descripción debe:
- Tener un tono profesional, tecnológico y persuasivo.
- Explicar para qué sirve el producto, quién se beneficia de él y sus ventajas o especificaciones destacadas.
- Usar negrita para destacar características clave.
- Estructurarse en 2 o 3 párrafos cortos y una lista con viñetas de especificaciones.
- Evitar redundancias y no usar palabras vacías. No comiences con frases típicas como "Presentamos el...".
- No inventar especificaciones técnicas precisas si no las conoces de forma segura (habla de sus prestaciones en general).
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    console.log("Calling Gemini API...");
    const response = await fetch(geminiUrl, {
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
                maxOutputTokens: 800
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.log("❌ Gemini API failed:", errText);
        process.exit(1);
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
        console.log("❌ No text generated!");
        process.exit(1);
    }

    console.log("✅ Description generated successfully!");
    console.log("Generated text length:", generatedText.length);
    console.log("Preview:\n", generatedText.substring(0, 300) + "...");

    // Try updating doc
    console.log("Updating Firestore document...");
    await productRef.update({
        description: generatedText.trim(),
        updatedAt: Date.now()
      });
    console.log("✅ Firestore document updated successfully!");

  } catch (err) {
    console.error("❌ Exception:", err);
  } finally {
    process.exit(0);
  }
}

test();
