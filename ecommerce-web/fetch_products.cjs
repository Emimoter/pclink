const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
    console.log("Conectando a Firestore...");
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Se encontraron ${products.length} productos.`);
    const categories = new Set();
    products.forEach(p => categories.add(p.category || p.categoryId));
    console.log("Categorías encontradas:", Array.from(categories));
    
    console.log("Muestra de primeros 10 productos:");
    products.slice(0, 10).forEach(p => {
      console.log(`- ID: ${p.id} | Nombre: ${p.name} | Categoría: ${p.category || p.categoryId} | Precio: ${p.price} | Tiene desc: ${!!p.description}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

run();
