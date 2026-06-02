const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

async function check() {
  const snapshot = await db.collection("products").get();
  let withDesc = 0;
  let withoutDesc = 0;
  const missing = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    if (!name) continue; // skip undefined
    
    if (data.description && data.description.trim().length > 0) {
      withDesc++;
    } else {
      withoutDesc++;
      missing.push(name);
    }
  }

  console.log(`\n📊 Productos con nombre: ${withDesc + withoutDesc}`);
  console.log(`   ✅ Con descripción: ${withDesc}`);
  console.log(`   ❌ Sin descripción: ${withoutDesc}`);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Sin descripción (${missing.length}):`);
    missing.forEach(p => console.log(`   - "${p}"`));
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
