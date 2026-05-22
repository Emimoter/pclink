const admin = require("firebase-admin");

// Initialize using application default credentials (works well if CLI is logged in)
admin.initializeApp({
  projectId: "pclink-f6e0d" 
});

const db = admin.firestore();
const email = "emiliano.gimenez.96@gmail.com";

async function makeAdmin() {
  try {
    await db.collection("admins").doc(email).set({
      role: "superadmin",
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Success: ${email} has been added to the admins collection.`);
  } catch (error) {
    console.error("❌ Error adding admin:", error);
  }
}

makeAdmin();
