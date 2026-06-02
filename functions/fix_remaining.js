const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "pclink-f6e0d"
});

const db = admin.firestore();

// Last 10 products that were missed
const DESCRIPTIONS = {
  "IMPRESORA HP ADVANTAGE MF-2375": "Impresora multifunción HP DeskJet Ink Advantage 2375 con funciones de impresión, escaneo y copia. Conexión USB, velocidad de hasta 7.5 ppm en negro. Diseño compacto ideal para hogar y oficina pequeña. Usa cartuchos HP 667.",
  "AURICULAR GTC 151": "Auriculares GTC 151 estéreo con micrófono integrado y diadema ajustable. Diseño cómodo y liviano para uso prolongado, conector de 3.5mm universal. Ideales para videollamadas, gaming casual y música.",
  "CARGADOR SOUL 2.4 A 2 USB MICRO USB": "Cargador de pared Soul de 2.4A con 2 puertos USB y cable Micro USB incluido. Carga rápida para celulares, tablets y dispositivos USB. Diseño compacto con protecciones contra sobrecarga y cortocircuito.",
  "CABLE USB A IPHONE SOUL IRON FLEX": "Cable USB a Lightning Soul Iron Flex con revestimiento de acero flexible ultra resistente. Carga rápida y sincronización para iPhone y iPad. Conectores de aluminio reforzados. Máxima durabilidad.",
  "CARGADOR NOTEBOOK TIPO C": "Cargador universal para notebooks con conector USB Tipo C. Compatible con notebooks que cargan vía USB-C (Lenovo, HP, Dell, MacBook y más). Potencia adecuada para carga durante el uso. Consultar wattaje según modelo.",
  "ROUTER TP-LINK C50 AC1200 4 ANTENAS": "Router Wi-Fi TP-Link Archer C50 AC1200 de doble banda con 4 antenas externas. Velocidades de hasta 867Mbps en 5GHz y 300Mbps en 2.4GHz. 4 puertos Ethernet, control parental y gestión vía app Tether. Cobertura amplia para hogar.",
  "MOUSE SOUL OMW200 WIR": "Mouse inalámbrico Soul OMW200 con conexión wireless 2.4GHz y receptor nano USB. Diseño cómodo y ligero, sensor óptico de buena precisión. Ideal para notebooks y escritorios limpios.",
  "AURICULAR LOGITECH H151": "Auriculares estéreo Logitech H151 con micrófono con cancelación de ruido. Diseño liviano on-ear con diadema ajustable, controles de volumen y silencio en cable. Conector de 3.5mm único. Ideales para videoconferencias y clases en línea.",
  "SALDO AIO LENOVO 22\"": "All-in-One Lenovo de 22\" (saldo/outlet). Pantalla integrada Full HD, diseño compacto todo en uno sin cables. Ideal para espacios reducidos, oficina y hogar. Consultar especificaciones exactas disponibles en stock.",
  "NOTEBOOK CX CEL. (4020) 8 GB 240 GB": "Notebook CX con procesador Intel Celeron N4020, 8GB de RAM y SSD de 240GB. Pantalla HD, diseño liviano y portátil. Ideal para tareas básicas como navegación web, ofimática, clases en línea y entretenimiento multimedia.",
  "MEMORIA DDR4 8GB": "Módulo de memoria RAM DDR4 de 8GB. Compatible con plataformas Intel y AMD actuales con soporte DDR4. Mejora significativa en multitarea y rendimiento general. Consultar velocidad específica según motherboard.",
  "CABLE USB A DISCO EXT.": "Cable USB para disco externo con conectores USB tipo A a Micro USB 3.0 (tipo B). Compatible con discos externos portátiles de 2.5\". Transferencia de datos a velocidad USB 3.0.",
};

async function fixRemaining() {
  console.log("🔧 Actualizando los 10 productos faltantes...\n");

  const snapshot = await db.collection("products").get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    if (!name) continue;

    // Only update if it doesn't have a description
    if (data.description && data.description.trim().length > 0) continue;

    const newDescription = DESCRIPTIONS[name];
    if (!newDescription) continue;

    try {
      await db.collection("products").doc(doc.id).update({
        description: newDescription,
      });
      console.log(`✅ UPDATED: "${name}"`);
      updated++;
    } catch (error) {
      console.error(`❌ ERROR: "${name}":`, error.message);
    }
  }

  console.log(`\n📊 Total actualizados en esta ronda: ${updated}`);
  process.exit(0);
}

fixRemaining().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
