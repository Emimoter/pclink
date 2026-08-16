const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "pclink-f6e0d" });
}

const db = admin.firestore();

async function testGrounding() {
    try {
        const configDoc = await db.collection("settings").doc("gemini_config").get();
        let apiKey = configDoc.exists ? configDoc.data().apiKey : null;
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key not found!");
            return;
        }

        const model = "gemini-2.5-flash";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        console.log("Sending query to Gemini with Google Search grounding...");
        const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "¿Qué producto es el SKU o código de proveedor 'CABX0910316'? Busca en internet si es necesario y dime el nombre exacto de este producto y su marca." }
                        ]
                    }
                ],
                tools: [
                    {
                        googleSearch: {}
                    }
                ]
            })
        });

        if (!response.ok) {
            console.error("Gemini grounding request failed:", await response.text());
            return;
        }

        const resData = await response.json();
        console.log("Gemini Response with Grounding:");
        console.log(JSON.stringify(resData, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testGrounding();
