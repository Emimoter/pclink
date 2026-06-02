const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

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

// Helper function to get clean category descriptions
function getBaseDescription(productName, categoryId) {
  const name = productName || "este producto";
  const cat = (categoryId || "").toUpperCase();

  // Cartridges and Toners (INK_TONER)
  if (cat === "INK_TONER" || name.toLowerCase().includes("cartucho") || name.toLowerCase().includes("toner") || name.toLowerCase().includes("tóner")) {
    if (name.toLowerCase().includes("alt.") || name.toLowerCase().includes("alt")) {
      return `El **${name}** es un cartucho de tinta / tóner alternativo de alta calidad marca **Genesis**. Fabricado bajo estrictas normas de control de calidad para garantizar impresiones ultra nítidas, colores intensos y un rendimiento constante equivalente al original, a una fracción del costo. *Nota: Este es un consumible compatible alternativo marca Genesis, no es un producto original de Epson, HP o Canon.*`;
    } else {
      return `El **${name}** es un cartucho de tinta / tóner original. Diseñado específicamente por el fabricante para asegurar el óptimo funcionamiento de su impresora, máxima durabilidad del cabezal y una calidad de impresión libre de manchas y con definición profesional.`;
    }
  }

  // Placas de Video (GPU)
  if (cat === "GPU" || name.toLowerCase().includes("geforce") || name.toLowerCase().includes("radeon") || name.toLowerCase().includes("rtx") || name.toLowerCase().includes("rx ")) {
    return `La **${name}** es una placa de video de última generación optimizada para gaming competitivo en altas resoluciones, creación de contenido y tareas de renderizado en 3D. Equipada con disipación térmica avanzada y componentes premium para garantizar un rendimiento estable bajo máxima carga.`;
  }

  // Microprocesadores (CPU)
  if (cat === "CPU" || name.toLowerCase().includes("intel core") || name.toLowerCase().includes("ryzen")) {
    return `El **${name}** es un microprocesador multihilo de alto rendimiento diseñado para brindar velocidad, eficiencia y capacidad de respuesta excepcionales. Ideal para gaming extremo, productividad, creación de contenido y multitarea intensiva sin tirones.`;
  }

  // Almacenamiento (STORAGE)
  if (cat === "STORAGE" || name.toLowerCase().includes("ssd") || name.toLowerCase().includes("disco duro") || name.toLowerCase().includes("nvme") || name.toLowerCase().includes("kingston fury")) {
    return `El **${name}** es una unidad de almacenamiento rápido de alta fiabilidad. Optimiza significativamente los tiempos de arranque del sistema operativo, reduce a segundos la carga de aplicaciones y juegos, y acelera la transferencia de archivos masivos.`;
  }

  // Monitores (MONITOR)
  if (cat === "MONITOR" || name.toLowerCase().includes("monitor") || name.toLowerCase().includes("pantalla")) {
    return `El **${name}** es un monitor premium con panel de alta fidelidad cromática, excelente contraste y tiempos de respuesta mínimos. Diseñado para ofrecer una experiencia visual sumamente inmersiva y fluida, cuidando tu vista durante jornadas prolongadas de trabajo o gaming.`;
  }

  // Gabinetes (CASE)
  if (cat === "CASE" || name.toLowerCase().includes("gabinete") || name.toLowerCase().includes("case")) {
    return `El **${name}** es un gabinete para PC con diseño optimizado para un flujo de aire superior y una gestión de cables sencilla y prolija. Construcción sólida con estética gamer/minimalista para albergar y proteger tus componentes de manera eficiente.`;
  }

  // Fuentes de poder (PSU)
  if (cat === "PSU" || name.toLowerCase().includes("fuente de poder") || name.toLowerCase().includes("fuente modular") || name.toLowerCase().includes("80 plus")) {
    return `La **${name}** es una fuente de alimentación de alta eficiencia energética. Diseñada para entregar energía limpia, estable y segura a todo tu hardware, minimizando el ruido y protegiendo tus componentes de sobretensiones.`;
  }

  // Teclados (KEYBOARD)
  if (cat === "KEYBOARD" || name.toLowerCase().includes("teclado")) {
    return `El **${name}** es un teclado ergonómico de respuesta táctil rápida e intuitiva. Equipado con teclas de alta durabilidad e iluminación integrada, ideal para sesiones prolongadas de escritura, productividad o juego competitivo.`;
  }

  // Mouses (MOUSE)
  if (cat === "MOUSE" || name.toLowerCase().includes("mouse") || name.toLowerCase().includes("raton") || name.toLowerCase().includes("ratón")) {
    return `El **${name}** es un mouse ergonómico de alta precisión con sensor de seguimiento suave y botones configurables. Diseñado para ofrecer un agarre cómodo que reduce la fatiga de la mano durante jornadas extensas de uso diario.`;
  }

  // Auriculares (HEADPHONES)
  if (cat === "HEADPHONES" || name.toLowerCase().includes("auricular") || name.toLowerCase().includes("auriculares") || name.toLowerCase().includes("headset")) {
    return `El **${name}** es un auricular de alta definición con aislamiento acústico y micrófono integrado. Ofrece una inmersión auditiva excelente con graves definidos y agudos claros, ideal para comunicación fluida en llamadas, videollamadas o juegos.`;
  }

  // Memorias RAM (RAM)
  if (cat === "RAM" || name.toLowerCase().includes("memoria ram") || name.toLowerCase().includes("ddr4") || name.toLowerCase().includes("ddr5")) {
    return `La **${name}** es un módulo de memoria RAM de alto rendimiento diseñado para aumentar el ancho de banda del sistema. Permite una multitarea fluida, agiliza la velocidad del equipo y elimina los microtirones durante el procesamiento pesado.`;
  }

  // Cables y adaptadores (CABLES)
  if (cat === "CABLES" || name.toLowerCase().includes("cable") || name.toLowerCase().includes("adaptador") || name.toLowerCase().includes("hdmi") || name.toLowerCase().includes("usb")) {
    return `El **${name}** es un cable / adaptador de alta fidelidad construido con materiales reforzados y blindaje contra interferencias, garantizando una conexión de señal estable y sin pérdidas de velocidad.`;
  }

  // Motherboards (MOTHERBOARD)
  if (cat === "MOTHERBOARD" || name.toLowerCase().includes("motherboard") || name.toLowerCase().includes("placa madre") || name.toLowerCase().includes("b550") || name.toLowerCase().includes("b650") || name.toLowerCase().includes("h610")) {
    return `La **${name}** es una placa madre de alta estabilidad y gran conectividad. Diseñada para dar soporte robusto a componentes de última generación, con fases de energía de alta eficiencia para garantizar un rendimiento óptimo de tu procesador.`;
  }

  // Refrigeración (COOLING)
  if (cat === "COOLING" || name.toLowerCase().includes("cooler") || name.toLowerCase().includes("refrigeracion") || name.toLowerCase().includes("refrigeración") || name.toLowerCase().includes("ventilador")) {
    return `El **${name}** es un sistema de refrigeración de alta eficiencia diseñado para disipar el calor rápidamente. Mantiene las temperaturas de operación de tus componentes críticas dentro de rangos seguros y silenciosos bajo cualquier carga de trabajo.`;
  }

  // Redes / Routers (NETWORK)
  if (cat === "NETWORK" || name.toLowerCase().includes("router") || name.toLowerCase().includes("wifi") || name.toLowerCase().includes("switch") || name.toLowerCase().includes("antena")) {
    return `El **${name}** es un dispositivo de conectividad de alta velocidad. Ofrece un alcance de señal wifi extendido y estable, garantizando conexiones rápidas y seguras para streaming de video, teletrabajo y navegación en línea sin cortes.`;
  }

  // Impresoras (PRINTER)
  if (cat === "PRINTER" || name.toLowerCase().includes("impresora")) {
    return `La **${name}** es una impresora de alta definición y gran eficiencia de insumos. Ideal para hogares u oficinas por su velocidad de impresión, fiabilidad en el manejo de papel y bajo costo por página impresa.`;
  }

  // Notebooks (NOTEBOOK)
  if (cat === "NOTEBOOK" || name.toLowerCase().includes("notebook") || name.toLowerCase().includes("laptop")) {
    return `La **${name}** es una notebook potente, portátil y con una excelente autonomía de batería. Diseñada con hardware moderno para ofrecer fluidez en tus tareas diarias de estudio, trabajo, navegación multimedia y entretenimiento.`;
  }

  // Default / Gaming / Offers / Accesorios
  return `El **${name}** es un componente de hardware y tecnología de alta calidad seleccionado para ofrecer el mejor rendimiento y durabilidad en tu setup tecnológico diario.`;
}

async function run() {
  try {
    console.log("Conectando a Firestore...");
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Se recuperaron ${products.length} productos de Firestore.`);

    // Filter products that don't have descriptions
    const pendingProducts = products.filter(p => {
      const desc = p.description;
      return desc === undefined || desc === null || desc === "" || desc === "undefined" || desc === "null";
    });

    console.log(`Se identificaron ${pendingProducts.length} productos sin descripción para actualizar.`);

    if (pendingProducts.length === 0) {
      console.log("Todos los productos ya cuentan con descripción. No es necesario realizar actualizaciones.");
      return;
    }

    // Split in batches of 400 (Firestore limit is 500 operations per batch)
    const BATCH_SIZE = 400;
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    let batchNumber = 1;

    for (let i = 0; i < pendingProducts.length; i++) {
      const p = pendingProducts[i];
      const generatedDesc = getBaseDescription(p.name, p.category || p.categoryId);
      
      const productRef = doc(db, "products", p.id);
      currentBatch.update(productRef, { description: generatedDesc });
      operationCount++;

      if (operationCount === BATCH_SIZE || i === pendingProducts.length - 1) {
        console.log(`Guardando lote ${batchNumber} (${operationCount} actualizaciones)...`);
        await currentBatch.commit();
        console.log(`¡Lote ${batchNumber} guardado correctamente!`);
        
        // Start next batch
        currentBatch = writeBatch(db);
        operationCount = 0;
        batchNumber++;
      }
    }

    console.log("¡Se completó la actualización de todas las descripciones en Firestore!");
  } catch (error) {
    console.error("Error al actualizar las descripciones en Firestore:", error);
  } finally {
    process.exit(0);
  }
}

run();
