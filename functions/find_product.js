const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection("products").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name && data.name.toLowerCase().includes("adaptador")) {
      console.log(`ID: "${doc.id}" (Type: ${typeof doc.id}) | Name: "${data.name}"`);
    }
  });
  process.exit(0);
}

run();
