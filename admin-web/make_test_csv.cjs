const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Configuración de Firebase leída del archivo .env
const firebaseConfig = {
  apiKey: "AIzaSyA6rBjlZ62CULHi8CqADZqE-VO8Nm5faJA",
  authDomain: "pclink-f6e0d.firebaseapp.com",
  projectId: "pclink-f6e0d",
  storageBucket: "pclink-f6e0d.firebasestorage.app",
  messagingSenderId: "716411272758",
  appId: "1:716411272758:web:26e82f394e28e57e3de297"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Conectando a Firestore y obteniendo productos...");
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push(doc.data());
    });

    console.log(`Se encontraron ${products.length} productos registrados.`);
    
    // Encabezados del CSV: Código, Stock (con BOM para Excel y UTF-8)
    let csvContent = "\ufeffCódigo,Stock\n";
    
    if (products.length === 0) {
      console.log("No se encontraron productos en Firestore. Generando códigos de prueba...");
      for (let i = 1; i <= 10; i++) {
        csvContent += `PROD-${1000 + i},${Math.floor(Math.random() * 100)}\n`;
      }
    } else {
      products.forEach((p) => {
        const code = p.id || "";
        if (code) {
          const fakeStock = Math.floor(Math.random() * 95) + 5; // Stock aleatorio entre 5 y 100
          csvContent += `"${code}","${fakeStock}"\n`;
        }
      });
    }

    const outputPath = path.join(__dirname, "stock_test.csv");
    fs.writeFileSync(outputPath, csvContent, "utf-8");
    console.log(`¡Archivo de prueba creado exitosamente en: ${outputPath}`);
  } catch (error) {
    console.error("Error al generar el CSV de prueba:", error);
  } finally {
    process.exit(0);
  }
}

run();
