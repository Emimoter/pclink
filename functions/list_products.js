const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "pclink-f6e0d"
});

const db = admin.firestore();

async function listProducts() {
  const snapshot = await db.collection("products").get();
  console.log(`Total products: ${snapshot.size}\n`);

  const withDesc = [];
  const withoutDesc = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name || "undefined";
    const desc = data.description;
    const hasDesc = desc && desc.trim().length > 0;

    if (hasDesc) {
      withDesc.push({ name, desc: desc.substring(0, 60) });
    } else {
      withoutDesc.push(name);
    }
  }

  console.log("═══ PRODUCTS WITH DESCRIPTION ═══");
  withDesc.forEach(p => console.log(`  ✅ "${p.name}" → "${p.desc}..."`));

  console.log(`\n═══ PRODUCTS WITHOUT DESCRIPTION (${withoutDesc.length}) ═══`);
  withoutDesc.forEach(p => console.log(`  ❌ "${p}"`));

  // Output as JSON for easy copy
  console.log("\n═══ JSON LIST (without description) ═══");
  console.log(JSON.stringify(withoutDesc, null, 2));

  process.exit(0);
}

listProducts().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
