const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

const DESCRIPTIONS = {
  "MICROFONO PROFESIONAL CONDENSER": "Micrófono condensador profesional para estudio, streaming y podcast. Alta sensibilidad, patrón polar cardioide para aislamiento de ruido de fondo. Incluye brazo articulado, filtro anti-pop y soporte anti-vibración.",
  "CARTUCHO ALT. EPSON NEGRO 46": "Cartucho de tinta alternativo marca Genesis compatible con Epson 46 negro. Calidad y rendimiento a bajo costo para tus impresiones diarias.",
  "NVIDIA GeForce RTX 4070 Ti Super 16GB": "Placa de video NVIDIA GeForce RTX 4070 Ti SUPER con 16GB de memoria GDDR6X. Rendimiento extremo para gaming en 1440p y 4K con Ray Tracing y DLSS 3. Ideal para creadores y gamers exigentes.",
  "AMD Ryzen 7 7800X3D Box AM5": "Procesador AMD Ryzen 7 7800X3D de 8 núcleos con tecnología 3D V-Cache. El mejor procesador para gaming del mercado en plataforma AM5. Rendimiento sin igual en juegos.",
  "Memoria RAM Kingston Fury Beast 16GB DDR5 6000MHz": "Módulo de memoria RAM Kingston FURY Beast DDR5 de 16GB a 6000MHz. Velocidad extrema y baja latencia para las plataformas más modernas. Perfiles XMP/EXPO integrados.",
  "Monitor LG 27\" UltraGear 27GR75Q QHD 165Hz": "Monitor gaming LG UltraGear de 27 pulgadas con resolución QHD (2560x1440). Panel IPS con tasa de refresco de 165Hz y 1ms de respuesta. Compatible con G-Sync y FreeSync Premium.",
  "Gabinete Corsair 4000D Airflow Tempered Glass": "Gabinete Mid-Tower Corsair 4000D Airflow. Panel frontal de malla para ventilación óptima, lateral de vidrio templado. Excelente gestión de cables y espacio para refrigeración líquida.",
  "Fuente Corsair RM850e 850W 80 Plus Gold Modular": "Fuente de alimentación Corsair RM850e de 850W. Certificación 80 Plus Gold, diseño completamente modular, ventilador silencioso. Potencia estable y confiable para equipos de alta gama.",
  "Disco SSD M.2 NVMe Samsung 990 Pro 1TB": "Disco SSD M.2 NVMe Samsung 990 PRO de 1TB. Velocidades de lectura y escritura PCIe 4.0 líderes en la industria. Máximo rendimiento para gaming, edición 4K y análisis de datos.",
  "Teclado Mecanico Logitech G Pro X TKL": "Teclado mecánico gaming Logitech G PRO X TKL inalámbrico LIGHTSPEED. Switches táctiles intercambiables, diseño sin teclado numérico, teclas PBT de doble inyección. Creado con profesionales de eSports.",
  "Mouse Logitech G502 X Plus Wireless RGB": "Mouse gaming inalámbrico Logitech G502 X PLUS con LIGHTSPEED e interruptores óptico-mecánicos LIGHTFORCE. Sensor HERO 25K, iluminación LIGHTSYNC RGB de 8 zonas. La evolución de un ícono.",
  "Auriculares HyperX Cloud II Wireless": "Auriculares gaming inalámbricos HyperX Cloud II. Conexión de 2.4GHz de baja latencia, batería de hasta 30 horas, sonido envolvente 7.1 virtual, chasis de aluminio resistente y el legendario confort de HyperX.",
  "TABLETA DIGITALIZADORA GENIUS I608": "Tableta digitalizadora Genius MousePen i608X. Área de trabajo de 8\"x6\", lápiz inalámbrico sensible a la presión y mouse inalámbrico incluidos. Ideal para dibujo digital, diseño gráfico y firmas electrónicas.",
  "MEMORIA SODIMM DDR3 4GB": "Módulo de memoria SODIMM DDR3 de 4GB para notebooks. Amplía la capacidad de multitarea de tu laptop de generaciones anteriores. Consultar velocidad compatible.",
  "MOUSE GTC MGG-021": "Mouse gaming GTC MGG-021 con sensor óptico, DPI ajustable y retroiluminación LED. Diseño ergonómico con botones laterales. Opción accesible para iniciarse en el gaming.",
  "PAD DE MOUSE SOUL RGB": "Mousepad Soul con iluminación perimetral RGB personalizable. Superficie optimizada para sensores gaming, base antideslizante. Agrega estilo y color a tu escritorio.",
  "CARTUCHO ALT. EPSON NEGRO 63": "Cartucho de tinta alternativo marca Genesis compatible con Epson 63 negro. Para impresoras de la serie C, CX. Buen rendimiento para impresiones de texto estándar.",
  "CARTUCHO ALT. HP 667 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 667 negro. Opción económica para impresoras HP DeskJet Plus serie 2700 y 4100. Textos claros y legibles.",
  "AURICULAR SOUL L500 VINCHA": "Auriculares tipo vincha (over-ear) Soul L500. Diseño cómodo con almohadillas suaves, cable con micrófono integrado. Sonido estéreo de buena calidad para uso diario.",
  "ADAPTADOR USB M A TIPO C H": "Adaptador USB Tipo A macho a USB Tipo C hembra. Permite conectar cables y dispositivos con conector USB-C en puertos USB tradicionales de PC o cargadores.",
  "HUB USB 4 BOCAS 3.0 NOGA NGH-52": "Hub USB Noga NGH-52 de 4 puertos con velocidad USB 3.0. Expansión rápida de puertos para notebooks y PCs, ideal para transferencia de datos veloz.",
  "CARTUCHO ALT. EPSON T664 N/C": "Set de botellas de tinta alternativas Genesis compatibles con Epson T664 (negro y colores). Para impresoras EcoTank L200, L355, L555 y más. Impresión de alto volumen a costo mínimo.",
  "CARTUCHO ALT. EPSON NEGRO 297": "Cartucho de tinta alternativo marca Genesis compatible con Epson 297 negro de alta capacidad. Mayor cantidad de impresiones a precio reducido.",
  "CARGADOR SOUL PD 20W TIPO C": "Cargador de pared Soul con tecnología Power Delivery de 20W y puerto USB Tipo C. Carga rápida eficiente, ideal para iPhones y celulares Android modernos.",
  "CARTUCHO ORIG. EPSON NEGRO 90": "Cartucho de tinta original Epson 90 negro. Calidad genuina Epson que garantiza textos resistentes al agua, manchas y decoloración.",
  "FUENTE CORSAIR CV 650 W 80 PLUS": "Fuente de alimentación Corsair CV650 de 650W con certificación 80 Plus Bronze. Potencia continua garantizada, ventilador silencioso de 120mm. Ideal para armados gaming de gama media.",
  "CARTUCHO ORIG. EPSON COLOR 195": "Cartucho de tinta original Epson 195 color. Colores vivos y duraderos, protección del cabezal de impresión. Calidad garantizada por Epson.",
  "CARTUCHO ORIG. EPSON COLOR 196": "Cartucho de tinta original Epson 196 color. Impresiones brillantes y resistentes a decoloración para documentos y fotografías.",
  "CARTUCHO ALT. EPSON COLOR 196": "Cartucho de tinta alternativo marca Genesis compatible con Epson 196 color. Colores vibrantes y rendimiento confiable a un costo menor.",
  "CARTUCHO ALT. EPSON COLOR 47": "Cartucho de tinta alternativo marca Genesis compatible con Epson 47 color. Solución económica para impresiones a color diarias.",
  "CARTUCHO ALT. EPSON COLOR 63": "Cartucho de tinta alternativo marca Genesis compatible con Epson 63 color. Impresiones a color asequibles para equipos de la serie C y CX.",
  "PEN DRIVE 128 GB": "Pen drive USB de 128GB de capacidad. Almacenamiento portátil espacioso para documentos, archivos multimedia y backups completos. Compacto y fácil de transportar.",
  "LI AIRE COMPRIMIDO GTC": "Lata de aire comprimido GTC para limpieza de equipos electrónicos. Remueve el polvo y suciedad de lugares de difícil acceso como teclados, disipadores y ventiladores sin dañar los componentes.",
  "MEM. DIGITAL MICRO SD 64 GB KINGSTON": "Tarjeta de memoria Micro SD Kingston Canvas Select Plus de 64GB. Clase 10 UHS-I, incluye adaptador SD. Velocidad y confiabilidad para expandir el almacenamiento de tu celular o tablet.",
  "FUENTE AEROCOOL CYLON RGB 700 W": "Fuente de alimentación Aerocool Cylon de 700W con iluminación RGB y certificación 80 Plus. Potencia suficiente para placas de video de alto rendimiento con estilo gamer.",
  "HUB USB 4 BOCAS ONLY 2.0": "Hub USB compacto de 4 puertos 2.0. Expansión económica y sencilla de puertos para mouse, teclados y pendrives en PCs y notebooks.",
  "CARTUCHO ORIG. EPSON COLOR 296": "Cartucho de tinta original Epson 296 color. Colores vibrantes de secado rápido, ideales para impresiones duraderas de calidad fotográfica.",
  "FUENTE SHURE 650 W": "Fuente de alimentación Shure de 650W estándar. Ventilador silencioso, conectores ATX, SATA y Molex. Opción económica para reemplazo en PCs de escritorio convencionales.",
  "MICROFONO SOUL GAMER XMIC 450": "Micrófono de escritorio gaming Soul XMIC 450. Diseño con iluminación LED, cuello flexible ajustable, conexión USB/3.5mm. Ideal para chat en juegos y videollamadas.",
  "AURICULAR BLUETOOTH SOUL BT800": "Auriculares Bluetooth Soul BT800 premium over-ear. Sonido de alta definición, cancelación de ruido pasiva, almohadillas de máximo confort, batería de extra larga duración.",
  "ADAPTADOR OTG MICRO USB": "Adaptador OTG (On-The-Go) de Micro USB a USB A hembra. Permite conectar pendrives y otros periféricos USB a celulares y tablets compatibles con puerto Micro USB.",
  "MICROFONO SOUL XMIC 150": "Micrófono de escritorio Soul XMIC 150. Base estable, brazo flexible para orientarlo. Captura de voz clara para reuniones por Zoom o Skype, conexión de 3.5mm.",
  "PAD DE MOUSE GTC GEL 212": "Mousepad GTC con apoya muñecas de gel. Diseño ergonómico que previene la fatiga y lesiones tras largas horas de uso del mouse en la oficina o el hogar.",
  "TECL Y MOUSE LOGITECH MK120": "Combo de teclado y mouse con cable Logitech MK120. Conexión USB, teclado de bajo perfil resistente a derrames y mouse óptico preciso. Durabilidad garantizada Logitech.",
  "MOUSE GTC MGG-014": "Mouse GTC MGG-014 con diseño ergonómico y sensor óptico. Cable USB, 3 botones y scroll. Opción económica y confiable para tareas diarias.",
  "MOUSE LOGITECH M 170 WIRELESS": "Mouse inalámbrico Logitech M170. Conexión 2.4GHz confiable con receptor nano, diseño ambidiestro cómodo y batería de larga duración (hasta 12 meses).",
  "TECLADO SOUL NUMERICO": "Teclado numérico independiente Soul con conexión USB. Ideal para notebooks sin pad numérico y usuarios que ingresan muchos datos o usan hojas de cálculo.",
  "SILLA GAMER SOUL": "Silla gaming ergonómica Soul. Tapizado en ecocuero resistente, respaldo reclinable, apoyabrazos ajustables, almohadillas cervical y lumbar extraíbles. Confort para largas horas de juego.",
  "HOLDER SOP-Q450": "Soporte de escritorio para celular SOP-Q450. Diseño plegable, altura y ángulo ajustables. Ideal para ver videos, realizar videollamadas o seguir notificaciones de forma cómoda.",
  "CARGADOR USB DE AUTO SOUL C/CABLE": "Cargador USB para auto marca Soul con cable incluido (consultar ficha). Carga segura y rápida de tu dispositivo móvil mientras conduces.",
  "CABLE EXTENSION MINI PLUG 1,8 MTS": "Cable prolongador (extensión) Mini Plug de 3.5mm (macho a hembra) de 1.8 metros. Extiende el alcance de tus auriculares o parlantes sin pérdida de calidad de audio.",
  "FUNDA SIGNO NEOPRENE 14 \"-15\"-15,6\"": "Funda protectora de neoprene Signo para notebooks de 14 a 15.6 pulgadas. Material elástico y resistente que protege contra golpes, polvo y rayones.",
  "PC RYZEN 7 (5700) CX SLIM - 16 GB - 480 GB": "PC de escritorio AMD Ryzen 7 5700G en gabinete CX formato Slim. 16GB de RAM y SSD de 480GB. Gráficos integrados potentes en un equipo compacto y estético.",
  "HOLDER SOP-Q250": "Soporte para celular SOP-Q250 con pinza de agarre para bordes de escritorio o cama. Brazo largo y flexible para posicionar el dispositivo en el ángulo perfecto.",
  "CABLE USB A MICRO USB SOUL CLASSIC": "Cable USB a Micro USB Soul serie Classic. 1 metro de largo, transferencia de datos y carga segura para dispositivos con puerto Micro USB.",
  "CABLE ALIMENTACION OCHO 220 V": "Cable de alimentación tipo 'ocho' (IEC C7) de 220V. Utilizado comúnmente en cargadores de notebook, radios portátiles, impresoras y consolas.",
  "ADAPTADOR BLUETOOTH NOGA 5.0": "Adaptador USB Bluetooth 5.0 Noga. Agrega conectividad inalámbrica Bluetooth a tu PC de escritorio para conectar auriculares, teclados, mouses y celulares. Compacto y rápido.",
  "MEMORIA DDR4 16 GB COMUN": "Módulo de memoria RAM DDR4 de 16GB genérica/estándar (sin disipador). Actualización rentable para mejorar el rendimiento de PCs de escritorio en tareas pesadas.",
  "AURICULAR SOUL S89": "Auriculares in-ear Soul S89 con conector de 3.5mm. Micrófono integrado, diseño ergonómico, sonido balanceado. Ideales para música y llamadas del día a día.",
  "MOUSE GENIUS WIR. NX-7000": "Mouse inalámbrico Genius NX-7000. Sensor óptico BlueEye de 1200 DPI que funciona sobre casi cualquier superficie, diseño ergonómico, receptor USB Pico.",
  "TECLADO GENIUS KB-118 USB": "Teclado Genius KB-118 con conexión USB. Diseño clásico y robusto, teclas de respuesta suave, resistente a derrames. Un teclado básico de batalla para la oficina.",
  "MEMORIA SODIMM DDR3 8GB": "Módulo de memoria SODIMM DDR3 de 8GB para notebooks. Aumenta significativamente la capacidad de memoria de laptops más antiguas para mejorar la navegación y ofimática.",
  "MOTHER (AM4) GIGABYTE A520M-H": "Motherboard Gigabyte A520M H para socket AM4. Chipset A520, soporte para memoria DDR4, puerto M.2, salidas HDMI y DVI. Placa base confiable y económica para procesadores Ryzen.",
  "AURICULAR BLUETOOTH SOUL BT200": "Auriculares Bluetooth Soul BT200 on-ear. Conexión inalámbrica estable, micrófono para manos libres, diseño plegable, controles integrados y batería recargable.",
  "TECLADO LOGITECH K400 PLUS": "Teclado inalámbrico Logitech K400 Plus con touchpad integrado. Diseño compacto ideal para controlar tu Smart TV o PC de salón desde el sofá. Alcance de 10 metros.",
  "DISCO NOTEBOOK 500 GB SATA": "Disco duro mecánico (HDD) de 500GB para notebook (2.5 pulgadas) con interfaz SATA. Solución económica para expandir almacenamiento interno o usar como disco externo.",
  "CARTUCHO ORIG. EPSON NEGRO 195": "Cartucho de tinta original Epson 195 negro. Fórmula de tinta de pigmento para textos nítidos que resisten manchas, decoloración y agua en papeles comunes.",
  "MONITOR LED 22\" HP S3 PRO": "Monitor LED HP S3 PRO de 22 pulgadas. Diseño profesional de bisel estrecho, resolución Full HD, conectividad versátil. Ideal para entornos de trabajo corporativos.",
  "CARTUCHO ORIG. EPSON NEGRO 135": "Cartucho de tinta original Epson 135 negro. Textos oscuros y definidos, compatibilidad garantizada y protección contra el desgaste del cabezal de impresión.",
  "CABLE MINI PLUG / MINI PLUG MIXOR": "Cable auxiliar de audio (Mini Plug 3.5mm a Mini Plug) marca Mixor. Transmite sonido estéreo desde tu celular o reproductor al estéreo del auto o parlantes.",
  "CABLE HDMI - HDMI 1,5 MTS. MALLADO": "Cable HDMI de 1.5 metros con recubrimiento mallado trenzado. Mayor protección contra cortes, tirones e interferencias. Soporte para alta resolución.",
  "CARGADOR IMEGA IPHONE USB + C": "Cargador de pared iMega compatible con iPhone con puerto USB-A y USB-C. Carga rápida dual para dispositivos Apple y otros equipos compatibles.",
  "ESTABILIZADOR TVR 1200": "Estabilizador de tensión (AVR) TVR 1200 de 1200VA. Protege tus equipos informáticos y electrónicos contra picos, caídas y fluctuaciones de la red eléctrica."
};

async function addDescriptions() {
  console.log("🔍 Leyendo los últimos 73 productos...\n");
  const snapshot = await db.collection("products").get();
  let updated = 0;
  const missing = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    if (!name) continue;
    if (data.description && data.description.trim().length > 0) continue;

    const desc = DESCRIPTIONS[name];
    if (!desc) { missing.push(name); continue; }

    try {
      await db.collection("products").doc(doc.id).update({ description: desc });
      console.log(`✅ "${name}"`);
      updated++;
    } catch (e) {
      console.error(`❌ "${name}":`, e.message);
    }
  }

  console.log(`\n📊 Total actualizados: ${updated}`);
  if (missing.length > 0) {
    console.log("⚠️ Siguen faltando:");
    missing.forEach(p => console.log(`  - "${p}"`));
  }
  process.exit(0);
}

addDescriptions().catch(e => { console.error(e); process.exit(1); });
