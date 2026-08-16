const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

async function run() {
  try {
    const docSnap = await db.collection("settings").doc("gemini_config").get();
    if (!docSnap.exists) {
      console.log("❌ Document 'settings/gemini_config' does not exist in Firestore!");
      process.exit(0);
    }

    const data = docSnap.data();
    console.log("Found gemini_config doc.");
    console.log("Updated at:", data.updatedAt ? new Date(data.updatedAt) : "N/A");
    
    const apiKey = data.apiKey;
    if (!apiKey) {
      console.log("❌ apiKey field is missing or empty inside the document!");
      process.exit(0);
    }
    
    console.log("API Key found in Firestore:", apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4));

    console.log("Testing API Key with Gemini (gemini-2.5-flash)...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hola, responde con 'OK'" }] }]
      })
    });

    if (response.ok) {
      const resData = await response.json();
      console.log("✅ API Key is working perfectly!");
      console.log("Gemini Response:", resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
    } else {
      const errText = await response.text();
      console.log("❌ Gemini API request failed!");
      console.log("Status:", response.status);
      console.log("Error body:", errText);
    }

  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    process.exit(0);
  }
}

run();
