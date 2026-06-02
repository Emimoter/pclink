const admin = require("firebase-admin");
admin.initializeApp({ projectId: "pclink-f6e0d" });
const db = admin.firestore();

const DESCRIPTIONS = {
  // ═══ PCs ═══
  "PC RYZEN 7 KELYX - 16 GB - 240 GB - VIDEO": "PC de escritorio AMD Ryzen 7 en gabinete Kelyx con 16GB de RAM, SSD de 240GB y placa de video dedicada. Equipo potente para gaming, diseño y productividad avanzada. Lista para usar.",
  "PC INTEL I3 (12DA) PCBOX - 8 GB - 240 GB SSD": "PC de escritorio Intel Core i3 de 12va generación en gabinete PCBox con 8GB de RAM y SSD de 240GB. Buen rendimiento para oficina, estudio y multitarea. Arranque ultra rápido.",

  // ═══ NOTEBOOKS ═══
  "NOTEBOOK LENOVO RYZEN 7 3700 15,6\" - 8GB - 512GB": "Notebook Lenovo con procesador AMD Ryzen 7 3700U, pantalla de 15.6\" Full HD, 8GB de RAM y SSD de 512GB. Potente para productividad, programación y edición multimedia. Portátil y eficiente.",
  "NOTEBOOK DELL I3 (11) 15,6\" - 8GB - 250GB": "Notebook Dell con procesador Intel Core i3 de 11va generación, pantalla de 15.6\" Full HD, 8GB de RAM y SSD de 250GB. Ideal para estudio, oficina y uso diario. Construcción Dell robusta.",
  "NOTEBOOK HP RYZEN 3 (7330) 15,6\" - 8GB - 256GB": "Notebook HP con procesador AMD Ryzen 3 7330U, pantalla de 15.6\" Full HD, 8GB de RAM y SSD de 256GB. Equipo compacto ideal para navegación, ofimática, streaming y tareas cotidianas.",

  // ═══ TABLET ═══
  "TABLET LENOVO TAB 10": "Tablet Lenovo Tab 10 con pantalla de 10 pulgadas HD, procesador eficiente, cámara trasera y frontal. Ideal para navegación web, videos, lectura y apps educativas. Portátil y ligera.",

  // ═══ MONITORES ═══
  "MONITOR LED 22\"  HIKVISION HDMI/VGA": "Monitor LED Hikvision de 22 pulgadas con resolución Full HD y conectividad HDMI + VGA. Diseño sin bordes, ángulos de visión amplios. Ideal para oficina, vigilancia y uso diario.",
  "MONITOR LED 24\" ASUS HDMI (100 MHZ)": "Monitor LED ASUS de 24 pulgadas con resolución Full HD y tasa de refresco de 100Hz. Entrada HDMI, panel IPS con colores vivos. Ideal para gaming casual, diseño y productividad.",
  "MONITOR LED 24\" LG MK430H": "Monitor LED LG 24MK430H de 24 pulgadas Full HD con panel IPS y tecnología Flicker Safe. Conectividad HDMI y VGA, diseño sin bordes en 3 lados. Colores precisos para trabajo y entretenimiento.",

  // ═══ MOTHERBOARDS ═══
  "MOTHER AMD RYZEN 7 16 GB": "Combo motherboard AMD con procesador Ryzen 7 y 16GB de RAM incluidos. Plataforma AM4 lista para armar, ideal para gaming y productividad. Consultar chipset y especificaciones exactas.",
  "MOTHER (AM4) GIGABYTE B550M H": "Motherboard Gigabyte B550M-H formato Micro-ATX con socket AM4. Chipset AMD B550 con soporte PCIe 4.0, 2 slots DDR4, ranura M.2 NVMe, USB 3.2 Gen 1. Base confiable para builds AMD Ryzen.",
  "MOTHER (AM4) MSI A520-A": "Motherboard MSI A520M-A PRO formato Micro-ATX con socket AM4. Chipset AMD A520, 2 slots DDR4 hasta 4600MHz (OC), ranura M.2, USB 3.2 Gen 1. Opción económica para builds Ryzen.",

  // ═══ PROCESADORES ═══
  "MICRO AMD RYZEN 3 3200G (AM4)": "Procesador AMD Ryzen 3 3200G con gráficos Radeon Vega 8 integrados. 4 núcleos, 4 hilos, frecuencia base 3.6GHz con boost hasta 4.0GHz. Socket AM4. Ideal para PCs de bajo presupuesto sin GPU dedicada.",

  // ═══ PLACAS DE VIDEO ═══
  "VIDEO PCIE MSI GT 730 2GB DDR3": "Placa de video MSI GeForce GT 730 con 2GB de memoria DDR3. GPU de bajo consumo y bajo perfil, ideal para PCs de oficina que necesiten salida de video. Conectores VGA, DVI, HDMI. Silenciosa.",

  // ═══ MEMORIAS RAM ═══
  "MEMORIA DDR3 4GB": "Módulo de memoria RAM DDR3 de 4GB. Para motherboards y notebooks con soporte DDR3. Upgrade para equipos de generaciones anteriores. Consultar velocidad y formato según equipo.",
  "MEMORIA DDR4 8GB HYPERX": "Módulo de memoria RAM HyperX DDR4 de 8GB con disipador de calor. Perfil XMP para overclocking automático. Mayor rendimiento para gaming y multitarea. Compatible con plataformas Intel y AMD DDR4.",
  "MEMORIA DDR4 16 GB HYPERX FURY": "Módulo de memoria RAM HyperX FURY DDR4 de 16GB con disipador de aluminio. Perfil XMP, latencia optimizada. Capacidad ideal para gaming exigente, streaming y edición de contenido.",
  "MEMORIA SODIMM DDR4 16GB": "Módulo de memoria SODIMM DDR4 de 16GB para notebooks y mini PCs. Gran capacidad para multitarea pesada, edición de video y máquinas virtuales en laptops. Consultar velocidad según equipo.",
  "MEMORIA SODIMM DDR4 32 GB": "Módulo de memoria SODIMM DDR4 de 32GB para notebooks profesionales y estaciones de trabajo portátiles. Máxima capacidad para tareas extremas como virtualización, compilación y edición 4K.",

  // ═══ ALMACENAMIENTO ═══
  "DISCO SSD 120 GB": "Disco SSD de 120GB con interfaz SATA III en formato 2.5\". Ideal como disco de sistema operativo para acelerar el arranque y las aplicaciones. Económico y eficiente.",
  "DISCO SSD 240 GB": "Disco SSD de 240GB con interfaz SATA III en formato 2.5\". Espacio suficiente para sistema operativo y aplicaciones principales. Velocidades de lectura/escritura superiores a un disco mecánico.",
  "DISCO SSD 480 GB": "Disco SSD de 480GB con interfaz SATA III en formato 2.5\". Capacidad amplia para SO, programas y juegos. Mejora drástica en velocidad respecto a discos HDD tradicionales.",
  "DISCO M.2 500 GB": "Disco SSD M.2 de 500GB con interfaz NVMe/SATA en formato M.2 2280. Velocidades ultrarrápidas, formato compacto sin cables. Ideal para sistema operativo y aplicaciones de uso frecuente.",
  "DISCO NOTEBOOK 1 TB. SATA II": "Disco duro mecánico HDD de 1TB para notebook con interfaz SATA II en formato 2.5\". Gran capacidad de almacenamiento para archivos, documentos, fotos y videos. Ideal como disco secundario.",
  "DISCO EXTERNO USB 3.0 1 TB": "Disco externo USB 3.0 de 1TB portátil. Almacenamiento adicional para backups, archivos pesados y transporte de datos. Alimentación por USB, compacto y resistente. Plug & play.",
  "DISCO EXTERNO USB 3.0 2 TB": "Disco externo USB 3.0 de 2TB portátil. Gran capacidad para resguardar documentos, fotos, videos y backups completos. Alimentación por USB, compatible con PC y Mac.",
  "DISCO EXTERNO USB 3.0 4 TB": "Disco externo USB 3.0 de 4TB de alta capacidad. Almacenamiento masivo para archivos multimedia, backups de servidores y colecciones digitales. Ideal para profesionales y creadores.",
  "CARRY DISK USB 2.0": "Carry disk (enclosure) USB 2.0 para discos HDD/SSD de 2.5\". Transforma tu disco interno en almacenamiento externo portátil. Instalación sin herramientas. Económico y funcional.",
  "MEM. DIGITAL MICRO SD 128 GB HIKSEMI": "Tarjeta Micro SD Hiksemi de 128GB Clase 10 UHS-I. Velocidad de transferencia rápida para celulares, cámaras y tablets. Gran capacidad para apps, fotos, música y videos.",
  "MEM. DIGITAL MICRO SD 128 GB HIKSEMI 4K": "Tarjeta Micro SD Hiksemi de 128GB optimizada para grabación 4K. Clase 10 UHS-I U3 para video de alta resolución. Ideal para cámaras de seguridad, action cameras y drones.",
  "MEM. DIGITAL MICRO SD 128 GB KINGSTON": "Tarjeta Micro SD Kingston Canvas Select Plus de 128GB. Clase 10 UHS-I con velocidades de lectura de hasta 100MB/s. Compatible con celulares, tablets, cámaras y Nintendo Switch.",
  "PEN DRIVE 64 GB": "Pen drive USB de 64GB. Almacenamiento portátil para documentos, fotos, música y archivos. Diseño compacto, interfaz USB. Compatible con PCs, notebooks, consolas y smart TVs.",
  "LECTOR DE MEMORIAS 3 EN 1": "Lector de tarjetas de memoria 3 en 1 con conexión USB. Soporta SD, Micro SD y otros formatos. Transferencia rápida de archivos desde cámaras, celulares y dispositivos de almacenamiento.",
  "LECTOR DE MEMORIAS MICRO SD": "Lector de tarjetas Micro SD con conexión USB. Compacto y portátil, transfiere archivos de tu tarjeta de memoria al PC o notebook al instante. Plug & play sin drivers.",

  // ═══ CARTUCHOS ALTERNATIVOS EPSON ═══
  "CARTUCHO ALT. HP 564 N/C": "Set de cartuchos alternativos marca Genesis compatible con HP 564 negro y color. Para impresoras HP Photosmart 5510, 5520, 6510, 7510 y B8550. Buena calidad de impresión a precio accesible.",
  "CARTUCHO ALT. EPSON NEGRO 73": "Cartucho de tinta alternativo marca Genesis compatible con Epson 73 negro (T073). Para impresoras Epson Stylus C79, CX3900, CX5900, TX100. Textos nítidos a precio económico.",
  "CARTUCHO ALT. EPSON COLOR 73": "Cartucho de tinta alternativo marca Genesis compatible con Epson 73 color (T073). Para impresoras Epson Stylus C79, CX3900 y TX100. Colores vibrantes con calidad Genesis.",
  "CARTUCHO ALT. EPSON NEGRO 90": "Cartucho de tinta alternativo marca Genesis compatible con Epson 90 negro (T090). Para impresoras Epson Stylus C92, CX5600. Negro intenso para documentos de texto.",
  "CARTUCHO ALT. EPSON NEGRO 117": "Cartucho de tinta alternativo marca Genesis compatible con Epson 117 negro (T117). Para impresoras Epson Stylus T23, T24, TX105. Rendimiento confiable a menor costo.",
  "CARTUCHO ALT. EPSON NEGRO 115": "Cartucho de tinta alternativo marca Genesis compatible con Epson 115 negro (T115). Para impresoras Epson Stylus T33. Impresiones de texto claras y legibles con buena relación precio-calidad.",
  "CARTUCHO ALT. EPSON NEGRO 135": "Cartucho de tinta alternativo marca Genesis compatible con Epson 135 negro (T135). Para impresoras Epson Stylus TX120, TX130, TX135. Negro definido para documentos. Marca Genesis.",
  "CARTUCHO ALT. EPSON COLOR/NEGRO 133": "Cartuchos de tinta alternativos marca Genesis compatible con Epson 133 negro y color (T133). Para impresoras Epson Stylus TX120, TX130, TX320F y TX430W. Set completo de colores.",
  "CARTUCHO ALT. EPSON NEGRO 197": "Cartucho de tinta alternativo marca Genesis compatible con Epson 197 negro de alta capacidad (T197). Para impresoras Epson Expression XP-201, XP-204, XP-401. Mayor rendimiento por cartucho.",
  "CARTUCHO ALT. EPSON COLOR 296": "Cartucho de tinta alternativo marca Genesis compatible con Epson 296 color (T296). Para impresoras Epson Expression XP-231, XP-241, XP-431. Colores vivos a precio económico.",
  "CARTUCHO ALT. EPSON COLOR 82": "Cartucho de tinta alternativo marca Genesis compatible con Epson 82 color (T082). Para impresoras Epson Stylus Photo R270, R290, RX590. Colores intensos para fotografías.",
  "CARTUCHO ALT. EPSON T504 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con Epson T504 negro. Para impresoras Epson EcoTank L4150, L4160, L6161, L6171. Negro profundo con calidad Genesis.",
  "CARTUCHO ALT. HP GT51 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP GT51 negro. Para impresoras HP DeskJet GT 5810, 5820 e Ink Tank 310, 410, 415. Tinta de alto rendimiento a menor costo.",
  "CARTUCHO ALT. HP GT52 COLOR": "Cartucho de tinta alternativo marca Genesis compatible con HP GT52 color. Para impresoras HP DeskJet GT e Ink Tank. Colores vibrantes con excelente relación calidad-precio.",
  "CARTUCHO ALT. HP 667 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 667. Para impresoras HP DeskJet Plus 2700 y 4100. Cian, magenta y amarillo en un cartucho económico.",

  // ═══ CARTUCHOS ORIGINALES HP ═══
  "CARTUCHO ORIG. HP NEGRO # 662": "Cartucho de tinta original HP 662 negro. Para impresoras HP DeskJet Ink Advantage 1515, 2515, 3515 y 4645. Textos nítidos con tinta original HP. Calidad garantizada.",
  "CARTUCHO ORIG. HP NEGRO # 664": "Cartucho de tinta original HP 664 negro. Para impresoras HP DeskJet Ink Advantage 1115, 2135, 3635, 3835. Negros profundos y textos definidos con tecnología HP.",
  "CARTUCHO ORIG. HP NEGRO # 667": "Cartucho de tinta original HP 667 negro. Para impresoras HP DeskJet Plus 2700 y 4100. Calidad HP original con textos claros y durables.",
  "CARTUCHO ORIG. HP COLOR # 662": "Cartucho de tinta tricolor original HP 662. Para impresoras HP DeskJet Ink Advantage. Cian, magenta y amarillo para impresiones a color vívidas con calidad HP.",
  "CARTUCHO ORIG. HP COLOR # 920 XL": "Cartucho de tinta original HP 920 XL de alta capacidad. Para impresoras HP Officejet 6000, 6500, 7000, 7500. Mayor rendimiento por cartucho con colores intensos.",

  // ═══ CARTUCHOS ORIGINALES EPSON ═══
  "CARTUCHO ORIG. EPSON NEGRO 544": "Cartucho de tinta original Epson T544 negro para sistema EcoTank. Compatible con Epson L1110, L3110, L3150, L5190. Alto rendimiento con tinta genuina Epson.",
  "CARTUCHO ORIG. EPSON COLOR 544": "Cartucho de tinta original Epson T544 color para sistema EcoTank (cian, magenta o amarillo). Compatible con Epson L1110, L3110, L3150, L5190. Colores precisos y duraderos.",
  "CARTUCHO ORIG. EPSON NEGRO 504": "Cartucho de tinta original Epson T504 negro para EcoTank. Compatible con Epson L4150, L4160, L6161, L6171. Negros profundos con tinta Epson genuina.",
  "CARTUCHO ORIG. EPSON COLOR 504": "Cartucho de tinta original Epson T504 color para EcoTank (cian, magenta o amarillo). Compatible con Epson L4150, L4160, L6161. Colores fieles con tinta original.",
  "CARTUCHO ORIG. EPSON NEGRO 206": "Cartucho de tinta original Epson 206 negro (T206). Para impresoras Epson XP-2101. Textos nítidos y definidos con tinta genuina Epson.",
  "CARTUCHO ORIG. EPSON COLOR 664 (L200)": "Cartucho de tinta original Epson 664 color (T664) para EcoTank. Compatible con Epson L200, L210, L355, L375, L455. Colores vibrantes con tinta original de tanque.",

  // ═══ TONERS ALTERNATIVOS ═══
  "TONER ALT. HP 12A (1010 SERIES)": "Tóner alternativo compatible con HP Q2612A (12A). Para impresoras HP LaserJet 1010, 1012, 1015, 1018, 1020, 1022, 3015, 3020 y 3050. Rendimiento confiable para uso diario.",
  "TONER ALT. HP 35/78/85 A (1100/1102W/M1130)": "Tóner alternativo universal compatible con HP 35A/78A/85A. Para HP LaserJet P1005, P1006, P1102, P1102W, M1130, M1132, M1212. Versatilidad para múltiples modelos.",
  "TONER ALT. HP 105 A CON CHIP": "Tóner alternativo compatible con HP W1105A (105A) con chip preinstalado. Para HP Laser 107, MFP 135, MFP 137. Plug & play sin configuración, impresiones nítidas.",
  "TONER ALT. BROTHER TN410-TN450": "Tóner alternativo compatible con Brother TN-410/TN-450. Para impresoras Brother HL-2130, HL-2240, DCP-7055, DCP-7065, MFC-7360, MFC-7460. Compatible con múltiples modelos.",
  "TONER ALT. BROTHER TN-1060": "Tóner alternativo compatible con Brother TN-1060. Para impresoras Brother HL-1110, HL-1112, DCP-1510, DCP-1512 y MFC-1810. Compacto y económico para impresión básica.",

  // ═══ DRUMS ═══
  "DRUM HP 19 A": "Unidad de imagen (drum) alternativa compatible con HP CF219A (19A). Para impresoras HP LaserJet Pro M102, M104, MFP M130, M132. Reemplaza el cilindro para mantener la calidad de impresión.",
  "DRUM BROTHER DR-350": "Unidad de tambor alternativa compatible con Brother DR-350. Para impresoras Brother HL-2040, HL-2070, DCP-7020, MFC-7220, MFC-7420. Prolonga la vida de impresión.",

  // ═══ IMPRESORAS ═══
  "IMPRESORA BROTHER LASER HL-1200": "Impresora láser monocromática Brother HL-1200 compacta. Velocidad de hasta 20ppm, resolución de 600x600dpi, bandeja de 150 hojas. Conexión USB. Ideal para bajo volumen en hogar y oficina.",
  "IMPRESORA BROTHER LASER HL-1212 W": "Impresora láser monocromática Brother HL-1212W con conectividad Wi-Fi. Velocidad de hasta 20ppm, resolución de 2400x600dpi. Impresión desde celular vía app Brother. Compacta y eficiente.",
  "IMPRESORA EPSON ECOTANK L-3210": "Impresora multifunción Epson EcoTank L3210 con sistema de tanque de tinta. Impresión, escaneo y copia con conexión USB. Rendimiento de hasta 4.500 páginas en negro por juego de tintas. Costo por página ultra bajo.",

  // ═══ FUENTES DE ALIMENTACIÓN ═══
  "FUENTE KELYX 450 W SLIM": "Fuente de alimentación Kelyx de 450W formato slim/SFX. Diseño compacto para gabinetes pequeños, ventilador silencioso, conectores estándar. Ideal para PCs de oficina y gabinetes slim.",
  "FUENTE AEROCOOL CYLON RGB 600 W": "Fuente de alimentación Aerocool Cylon RGB de 600W con ventilador de 120mm con iluminación RGB. Diseño semi-modular, protecciones OVP/OCP/SCP. Estilo gaming con rendimiento confiable.",

  // ═══ GABINETES ═══
  "GABINETE RAPTOR BLAZE FORCE": "Gabinete gaming Raptor Blaze Force Mid Tower con panel lateral de vidrio templado y ventiladores RGB preinstalados. Diseño agresivo, filtros de polvo, amplio espacio para componentes. ATX/Micro-ATX.",
  "GABINETE KELYX SLIM": "Gabinete Kelyx formato Slim/SFF compacto para PCs de escritorio. Diseño vertical delgado ideal para espacios reducidos y puntos de venta. Compatible con fuentes slim y placas Micro-ATX/Mini-ITX.",

  // ═══ COOLERS ═══
  "COOLER 12 X 12  LED NETMARK GABINETE": "Ventilador Netmark de 120x120mm con iluminación LED para gabinetes de PC. Alto flujo de aire para mantener temperaturas bajas, conector Molex/3-pin. Fácil instalación.",
  "COOLER 80 X 80 RULEMAN": "Ventilador de 80x80mm con rodamiento de rulemán (ball bearing) de mayor durabilidad. Vida útil extendida comparado con ventiladores de buje. Ideal para equipos que funcionan 24/7.",
  "COOLER THERMALTAKE RGB AMD/INTEL": "Cooler CPU Thermaltake con iluminación RGB compatible con AMD e Intel. Disipador de aluminio con heatpipes y ventilador RGB sincronizable. Instalación universal para sockets AM4/LGA1200/1700.",
  "COOLER NOGANET INTEL 1150": "Cooler CPU Noga compatible con socket Intel LGA 1150/1151/1155/1156. Disipador de aluminio con ventilador silencioso. Reemplazo económico para el cooler de stock de Intel.",

  // ═══ AURICULARES ═══
  "AURICULAR SOUL S389": "Auriculares Soul S389 tipo in-ear con micrófono y botón multifunción. Sonido claro con buenos graves, gomitas intercambiables para ajuste perfecto. Conector 3.5mm universal.",
  "AURICULAR SOUL XH-250": "Auriculares Soul XH-250 tipo in-ear con micrófono en cable y sonido de alta fidelidad. Aislamiento pasivo de ruido, cable resistente con conector 3.5mm. Ideales para música y llamadas.",
  "AURICULAR SOUL BLISTER S49-S59": "Auriculares Soul S49/S59 tipo in-ear económicos en presentación blíster. Sonido claro, diseño ligero, conector 3.5mm. Ideales como auriculares de repuesto o uso diario.",
  "AURICULAR GENIUS HS-05A": "Auriculares Genius HS-05A estéreo con micrófono ajustable y diadema acolchada. Conector de 3.5mm, diseño liviano y cómodo. Ideales para videollamadas, estudio y oficina.",
  "AURICULAR GENIUS HS-04S": "Auriculares Genius HS-04S estéreo con micrófono flexible y diadema ajustable. Almohadillas suaves, conector de 3.5mm. Versátiles para videollamadas, gaming casual y música.",
  "AURICULAR GENIUS HS-04SU": "Auriculares Genius HS-04SU estéreo con micrófono y conexión USB. Audio digital de calidad, diadema acolchada ajustable. Plug & play para videollamadas profesionales.",
  "AURICULAR GENIUS HS-02B": "Auriculares Genius HS-02B on-ear con micrófono integrado y diseño plegable compacto. Conector de 3.5mm, cable ligero. Prácticos para viajes y uso diario.",
  "AURICULAR LOGITECH H390 USB": "Auriculares Logitech H390 USB con micrófono con cancelación de ruido y almohadillas de espuma acolchadas. Controles en cable (volumen y silencio). Audio digital claro. Ideales para home office.",
  "AURICULAR LOGITECH H111": "Auriculares Logitech H111 estéreo con micrófono giratorio. Diseño ultraliviano y cómodo, conector de 3.5mm TRRS único. Compatibles con PC, Mac, tablets y celulares. Opción económica Logitech.",
  "AURICULAR LOGITECH ASTRO A 10 GEN 2": "Auriculares gaming Logitech ASTRO A10 Gen 2 con audio de alta fidelidad mejorado. Micrófono flip-to-mute, diadema de acero ajustable, almohadillas de tela transpirable. Conector 3.5mm. Más cómodos y resistentes que Gen 1.",
  "AURICULAR LOGITECH G435 WIR": "Auriculares gaming inalámbricos Logitech G435 LIGHTSPEED con Bluetooth dual. Diseño ultraliviano de 165g, batería de hasta 18 horas, micrófono beamforming integrado. Compatible con PC, PS5, Switch y celular.",
  "AURICULAR LOGITECH G432": "Auriculares gaming Logitech G432 con sonido envolvente 7.1. Drivers de 50mm, micrófono flip-to-mute, almohadillas de cuero sintético, diadema de acero ajustable. Conector 3.5mm + adaptador USB para 7.1.",
  "AURICULAR BLUETOOTH SOUL CAT": "Auriculares Bluetooth Soul con diseño de orejas de gato con iluminación LED. Inalámbricos on-ear, micrófono integrado, plegables. Diseño divertido ideal como regalo para niños y jóvenes.",
  "AURICULAR BLUETOOTH SOUL BT350": "Auriculares Bluetooth Soul BT350 over-ear inalámbricos con sonido potente. Almohadillas acolchadas, micrófono integrado, batería de larga duración. Plegables para fácil transporte.",
  "AURICULAR BLUETOOTH SOUL BT400": "Auriculares Bluetooth Soul BT400 over-ear premium con sonido Hi-Fi envolvente. Bluetooth 5.0, batería extendida, almohadillas de memory foam, micrófono integrado. Diseño elegante y cómodo.",
  "AURICULAR BLUETOOTH SOUL TWS 1000": "Auriculares Bluetooth Soul TWS 1000 inalámbricos con estuche de carga. Sonido de alta calidad, Bluetooth 5.0, controles táctiles, micrófono dual. Resistentes al agua para deporte y uso diario.",
  "AURICULAR JBL T110": "Auriculares JBL T110 tipo in-ear con sonido JBL Pure Bass potente. Micrófono integrado con botón de un toque, cable plano anti-enredos, conector 3.5mm. Livianos, cómodos y con el sello de calidad JBL.",
  "AURICULAR MOTOROLA EARBUS": "Auriculares Motorola Earbuds tipo in-ear con micrófono integrado. Sonido claro y equilibrado, diseño ergonómico ligero, cable con conector de 3.5mm. Ideales para uso diario con calidad Motorola.",
  "AURICULAR R24 TIPO C": "Auriculares R24 tipo in-ear con conector USB Tipo C. Para celulares y tablets sin jack de 3.5mm. Micrófono integrado, botón multifunción. Sonido claro y conexión directa digital.",

  // ═══ TECLADOS ═══
  "TECLADO GENIUS SLIMSTAR 230": "Teclado Genius SlimStar 230 USB con diseño slim y teclas chiclet de bajo perfil. Layout en español, teclas multimedia. Diseño elegante y compacto ideal para oficina y espacios reducidos.",
  "TECLADO XTRIKE ME KB 302": "Teclado gaming Xtrike ME KB-302 con retroiluminación LED multicolor. Teclas de membrana con respuesta rápida, diseño resistente. Ideal para gaming de gama de entrada.",
  "TECLADO LOGITECH K835 TKL MECANICO": "Teclado mecánico Logitech K835 TKL compacto sin teclado numérico. Switches mecánicos con marco de aluminio cepillado, diseño minimalista premium, conectividad USB-C. Para productividad y gaming con estilo.",
  "TECLADO LOGITECH K120": "Teclado Logitech K120 USB con diseño clásico resistente a derrames. Teclas silenciosas con perfil cómodo, layout en español. Durabilidad Logitech probada para uso diario intensivo en oficina.",
  "TECLADO LOGITECH G213 RGB PRODIGY": "Teclado gaming Logitech G213 Prodigy con retroiluminación RGB en 5 zonas. Teclas Mech-Dome con respuesta táctil similar a mecánico, reposamuñecas integrado, teclas multimedia. Resistente a derrames.",
  "TECLADO GENIUS SCORPION K220": "Teclado gaming Genius Scorpion K220 con retroiluminación LED. Teclas de membrana con anti-ghosting, diseño gamer agresivo, resistente a derrames. Opción económica para gaming.",
  "TECLADO GENIUS SMART KB-102 / 113 / 117": "Teclado Genius Smart KB-102/113/117 USB estándar. Diseño clásico resistente con teclas de membrana cómodas, layout en español. Plug & play, ideal para oficina y uso doméstico.",
  "TECLADO SOUL XK 900 MECANICO": "Teclado mecánico gaming Soul XK 900 con switches mecánicos y retroiluminación RGB personalizable. Full anti-ghosting, construcción robusta, respuesta táctil precisa. Para gaming y typing de alto nivel.",
  "TECLADO MINI TV / CELULAR": "Mini teclado inalámbrico con touchpad integrado para smart TVs, TV Box, PCs y consolas. Compacto y portátil, retroiluminación LED, batería recargable. Control total desde el sofá.",
  "TECLADO MINI FK1000 PLEGABLE BLUETOOTH": "Teclado Bluetooth FK1000 plegable ultra portátil. Diseño plegable en tres secciones, conectividad Bluetooth para tablets, celulares y PCs. Ideal para productividad en movimiento. Batería recargable.",

  // ═══ COMBOS TECLADO + MOUSE ═══
  "TECL Y MOUSE LOGITECH WIR MK-235": "Combo inalámbrico Logitech MK-235 con teclado y mouse compactos. Receptor nano USB unificante, teclas de bajo perfil, mouse ergonómico. Batería de hasta 36 meses. Práctica solución wireless.",
  "TECL Y MOUSE LOGITECH WIR MK-270": "Combo inalámbrico Logitech MK-270 con teclado completo y mouse compacto. Receptor nano USB 2.4GHz, 8 teclas multimedia, batería de larga duración. Confiable para oficina y hogar.",
  "TECL Y MOUSE LOGITECH WIR MK-220": "Combo inalámbrico Logitech MK-220 ultra compacto. Teclado y mouse inalámbricos con receptor nano USB, diseño minimalista, teclas silenciosas. Ideal para espacios reducidos.",
  "TECL Y MOUSE TJ-808 WIRELESS": "Combo teclado y mouse inalámbrico TJ-808 con receptor nano USB 2.4GHz. Diseño slim, teclas de bajo perfil, mouse óptico compacto. Solución wireless económica y funcional.",
  "TECL Y MOUSE GTC WIR SOFT DUO": "Combo teclado y mouse inalámbrico GTC Soft Duo con receptor nano 2.4GHz. Teclado de membrana cómodo y mouse ergonómico silencioso. Diseño sobrio para oficina.",
  "TECL Y MOUSE TT ELITE RGB": "Combo gaming teclado y mouse TT Elite RGB con retroiluminación RGB sincronizada. Teclado de membrana con anti-ghosting y mouse gaming con DPI ajustable. Kit gamer completo con estilo.",
  "TECL Y MOUSE GENIUS KM-8206S": "Combo inalámbrico Genius KM-8206S Silent con clicks silenciosos. Teclado slim y mouse ergonómico, receptor nano 2.4GHz. Ideal para oficinas compartidas y ambientes silenciosos.",
  "TECL Y MOUSE GENIUS KM-200": "Combo teclado y mouse Genius KM-200 USB con cable. Teclado multimedia estándar y mouse óptico ergonómico. Plug & play, construcción resistente. Opción económica y confiable.",
  "TECL Y MOUSE + AUR. GENIUS KMH-200": "Kit completo Genius KMH-200: teclado USB, mouse óptico y auriculares con micrófono. Todo lo necesario para empezar a usar tu PC. Plug & play, calidad Genius.",

  // ═══ MOUSE ═══
  "MOUSE LOGITECH G300S": "Mouse gaming Logitech G300S con sensor óptico de 2.500 DPI y 9 botones programables. Diseño ambidiestro ergonómico, iluminación LED en 7 colores. Cable ligero. Excelente control para gaming.",
  "MOUSE LOGITECH G305 WIRELESS": "Mouse gaming inalámbrico Logitech G305 LIGHTSPEED con sensor HERO de 12.000 DPI. Conexión inalámbrica ultrarrápida de 1ms, hasta 250 horas de batería con pila AA. Diseño compacto y liviano.",
  "MOUSE LOGITECH G502 HERO": "Mouse gaming Logitech G502 HERO con sensor HERO 25K de hasta 25.600 DPI. 11 botones programables, sistema de pesas ajustable, scroll infinito/por pasos. Iluminación LIGHTSYNC RGB. El mouse gaming definitivo.",
  "MOUSE LOGITECH G603 WIRELESS": "Mouse gaming inalámbrico Logitech G603 LIGHTSPEED con sensor HERO de 12.000 DPI. Dual mode: LIGHTSPEED + Bluetooth. Hasta 500 horas con 2 pilas AA. Diseño ergonómico para diestros.",
  "MOUSE LOGITECH G703 WIRELESS": "Mouse gaming inalámbrico Logitech G703 LIGHTSPEED con sensor HERO 25K. Diseño ergonómico premium, peso ajustable con pesa de 10g, iluminación LIGHTSYNC RGB. Batería recargable, carga inalámbrica POWERPLAY compatible.",
  "MOUSE LOGITECH M 100": "Mouse Logitech M100 USB con sensor óptico de 1000 DPI. Diseño ambidiestro cómodo, cable de 1.8m, 3 botones con scroll. La opción más básica y confiable de Logitech para uso diario.",
  "MOUSE LOGITECH M 196 BT": "Mouse Bluetooth Logitech M196 sin receptor USB. Conexión directa Bluetooth para notebooks y tablets, diseño ambidiestro compacto, sensor óptico de 1000 DPI. Hasta 18 meses de batería.",
  "MOUSE GENIUS WIR. MINI 900S": "Mouse inalámbrico Genius Micro Traveler 900S ultracompacto. Receptor nano 2.4GHz, sensor óptico BlueEye de 1200 DPI. Portátil y ligero, ideal para viajes y notebooks.",
  "MOUSE GENIUS MINI NOTEBOOK RETRACTIL": "Mouse Genius con cable retráctil ultracompacto para notebooks. Diseño portátil, sensor óptico, cable que se enrolla dentro del mouse. Perfecto para viajes de negocios.",
  "MOUSE MALIBU MT300": "Mouse Malibu MT300 USB con sensor óptico y diseño ergonómico. 3 botones con scroll, cable estándar. Opción económica y funcional para uso básico de oficina y hogar.",
  "MOUSE BATOU INALAMBRICO": "Mouse inalámbrico Batou con receptor nano USB 2.4GHz. Diseño ergonómico cómodo, sensor óptico, botones silenciosos. Batería de larga duración. Opción económica para uso wireless.",
  "MOUSE RAPTOR STORM GRIP": "Mouse gaming Raptor Storm Grip con sensor óptico de DPI ajustable y diseño ergonómico con agarre texturizado. Iluminación LED, botones laterales. Cable trenzado resistente para gaming.",
  "MOUSE HYPERX PUSEFIRE": "Mouse gaming HyperX Pulsefire con sensor óptico de alta precisión. Diseño ergonómico liviano, switches Omron duraderos, cable trenzado. Iluminación RGB personalizable. Rendimiento competitivo.",
  "MOUSE KLIPXTREME KREST": "Mouse inalámbrico Klip Xtreme Krest con receptor nano USB 2.4GHz. Sensor óptico de 1600 DPI, diseño ergonómico compacto, switch de encendido/apagado. Batería eficiente.",
  "MOUSE SOUL OMW200 WIR": "Mouse inalámbrico Soul OMW200 con receptor nano USB 2.4GHz. Diseño cómodo y ligero, sensor óptico preciso. Ideal para notebooks y escritorios sin cables.",

  // ═══ PADS DE MOUSE ═══
  "PAD DE MOUSE SOUL OFFICE LARGE OMP 150": "Mousepad Soul Office OMP 150 tamaño Large con superficie suave extendida. Base antideslizante, bordes reforzados. Espacio amplio para movimientos cómodos. Diseño profesional para oficina.",
  "PAD DE MOUSE CLASICO": "Mousepad clásico de tamaño estándar con superficie de tela y base de goma antideslizante. Diseño simple y funcional. Económico y confiable para uso diario.",
  "PAD DE MOUSE XTRIKE RGB": "Mousepad gaming Xtrike con iluminación RGB perimetral y conexión USB. Superficie de tela para control preciso, base antideslizante. Efecto visual impactante para tu setup gaming.",

  // ═══ CÁMARAS WEB ═══
  "CAMARA WEB GENIUS 1000X": "Cámara web Genius iSlim 1000X con resolución HD y micrófono integrado. Clip universal para monitores, enfoque automático. Compatible con Zoom, Teams, Skype. Plug & play USB.",

  // ═══ PARLANTES ═══
  "PARLANTE GENIUS  SW-G 2.1 1250": "Sistema de parlantes Genius SW-G 2.1 1250 con subwoofer para graves profundos y 2 satélites. Potencia total de 38W, control de volumen y bajos. Conexión auxiliar 3.5mm. Sonido envolvente para PC y multimedia.",
  "PARLANTE GENIUS SP HF-180": "Parlantes Genius SP-HF180 estéreo USB de escritorio. Alimentación por USB, sonido claro para uso diario. Diseño compacto y elegante. Ideales para notebooks y PCs.",
  "PARLANTE GENIUS SP Q160": "Parlantes Genius SP-Q160 estéreo USB de escritorio con diseño compacto. Alimentación y audio por USB, volumen en línea. Sonido claro para videoconferencias, música y videos.",
  "PARLANTE SOUL XP200": "Parlante Bluetooth portátil Soul XP200 con sonido potente y diseño robusto. Batería de larga duración, entrada auxiliar, ranura Micro SD. Resistente para uso en exteriores.",
  "BLUE TOOTH PARLANTE SOUL XK50": "Parlante Bluetooth portátil Soul XK50 con sonido 360° envolvente. Batería recargable de larga duración, diseño compacto resistente al agua. Ideal para llevar a todas partes.",
  "BLUE TOOTH PARLANTE SOUL XS-100": "Parlante Bluetooth Soul XS-100 ultra portátil y compacto. Sonido claro sorprendente para su tamaño, batería recargable, mosquetón incluido. Perfecto para colgar en mochilas.",
  "BLUE TOOTH PARLANTE SOUL PETS": "Parlante Bluetooth Soul Pets con diseño de mascota adorable. Sonido agradable, batería recargable, tamaño compacto. Ideal como regalo divertido para niños.",
  "BLUE TOOTH PARLANTE PANACOM 3059": "Parlante Bluetooth Panacom SP-3059 portátil con sonido potente. Batería recargable, entrada auxiliar, USB y radio FM. Diseño robusto con asa de transporte.",
  "BLUE TOOTH PARLANTE PANACOM 3103": "Parlante Bluetooth Panacom SP-3103 con potencia elevada para fiestas. Iluminación LED multicolor, micrófono incluido para karaoke. Batería de larga duración, entrada USB y auxiliar.",
  "BLUE TOOTH PARLANTE N10": "Parlante Bluetooth N10 portátil compacto con sonido claro. Batería recargable, conexión Bluetooth 5.0 y entrada auxiliar. Diseño minimalista y ligero para llevar a cualquier parte.",

  // ═══ MICRÓFONOS ═══
  "MICROFONO JAHRO": "Micrófono condensador Jahro con soporte de escritorio y conexión USB o 3.5mm. Captación clara de voz para streaming, podcasts, videollamadas y grabaciones. Plug & play.",
  "MICROFONO SOUL CORBATERO": "Micrófono corbatero Soul tipo lavalier con clip de sujeción. Conector de 3.5mm para celulares, tablets y PCs. Captación omnidireccional clara. Ideal para grabación de videos y presentaciones.",
  "MICROFONO SOUL CORBATERO X 2": "Pack de 2 micrófonos corbateros Soul tipo lavalier con clip. Conector de 3.5mm para entrevistas y podcasts con dos interlocutores. Captación clara y discreta.",
  "PUNTERO GENIUS MEDIA POINTER": "Presentador Genius Media Pointer con puntero láser y receptor nano USB. Control remoto para diapositivas, botones de avance/retroceso, función de timer. Portátil y profesional.",

  // ═══ REDES / ROUTERS / MESH ═══
  "MESH TPLINK DECO E4 (PACK-1)": "Unidad Mesh Wi-Fi TP-Link Deco E4 individual (1 nodo) AC1200. Cobertura fluida sin zonas muertas, diseño compacto elegante. Puede agregarse a un sistema Deco existente o usarse como router principal.",
  "MESH TPLINK DECO E4 (PACK-2)": "Sistema Mesh Wi-Fi TP-Link Deco E4 pack de 2 unidades AC1200. Cobertura Wi-Fi sin interrupciones para hogares medianos, roaming seamless. Control parental y gestión vía app Deco.",
  "MODEM ROUTER ADSL TPLINK W8951 ND": "Modem router ADSL2+ TP-Link TD-W8951ND con Wi-Fi N de 150Mbps. Conexión a Internet por línea telefónica ADSL, 4 puertos Ethernet, firewall integrado. Para servicios de Internet por línea fija.",
  "ROUTER MERCUSYS MR60X": "Router Wi-Fi 6 Mercusys MR60X AX1500 de doble banda. Velocidades de hasta 1201Mbps en 5GHz con tecnología Wi-Fi 6 (802.11ax), OFDMA y MU-MIMO. 3 puertos Gigabit. Cobertura amplia y eficiente.",
  "ROUTER MERCUSYS MW302R": "Router Wi-Fi Mercusys MW302R N300 con 2 antenas de 5dBi. Velocidad de hasta 300Mbps en 2.4GHz. Configuración rápida vía app, control parental. Opción económica para hogares pequeños.",
  "ROUTER TOTO LINK N302": "Router Wi-Fi TOTOLINK N302R+ N300 con 2 antenas de 5dBi. Velocidad de hasta 300Mbps, 4 puertos LAN. Fácil configuración, control de ancho de banda. Económico y funcional.",
  "RANGE EXTENDER REPAETER 4 ANTENAS": "Extensor de señal Wi-Fi con 4 antenas para máxima cobertura. Amplía la red inalámbrica eliminando zonas muertas, doble banda, puerto Ethernet. Fácil configuración vía botón WPS.",
  "PLACA INAL. USB CON ANTENA NETMARK": "Adaptador Wi-Fi USB Netmark con antena externa para mayor alcance. Agrega conectividad inalámbrica a PCs de escritorio. Plug & play, compatible con redes N/AC.",
  "PLACA INAL. USB TPLINK WN722N": "Adaptador Wi-Fi USB TP-Link TL-WN722N con antena externa desmontable de 4dBi. Wi-Fi N de 150Mbps, compatible con modo monitor. Ideal para mejorar la recepción Wi-Fi.",
  "PLACA INAL. USB TPLINK AC600 T2U PLUS": "Adaptador Wi-Fi USB TP-Link Archer T2U Plus AC600 de doble banda con antena externa. Velocidades de hasta 433Mbps en 5GHz. Mejora significativa en alcance y velocidad inalámbrica.",
  "PLACA INAL. USB TPLINK TX20U AX1800": "Adaptador Wi-Fi USB TP-Link Archer TX20U AX1800 con tecnología Wi-Fi 6. Velocidades de hasta 1201Mbps en 5GHz, antena de alto rendimiento. Upgrade tu PC a Wi-Fi 6.",
  "PLACA INAL. USB TPLINK TX20U AX1800 NANO": "Adaptador Wi-Fi USB TP-Link TX20U Nano AX1800 ultra compacto con Wi-Fi 6. Formato nano que apenas sobresale del puerto USB. Wi-Fi 6 a 1800Mbps en un diseño minúsculo.",
  "PLACA INAL. USB TPLINK WN822N": "Adaptador Wi-Fi USB TP-Link TL-WN822N con 2 antenas externas de 3dBi. Wi-Fi N de 300Mbps, base con cable USB para mejor posicionamiento. Recepción superior para PCs de escritorio.",
  "PLACA INAL. TOTO LINK 2 ANTENAS": "Adaptador Wi-Fi USB TOTOLINK con 2 antenas externas para mejor recepción. Wi-Fi N de alta velocidad, plug & play. Ideal para PCs de escritorio que necesiten conectividad inalámbrica.",
  "ANTENA TPLINK 2414B 14 DBI": "Antena omnidireccional TP-Link TL-ANT2414B de 14dBi para exteriores. Mejora el alcance de la señal Wi-Fi en largas distancias, conector RP-SMA. Para enlaces inalámbricos y repetidores.",
  "ANTENA ROUTER TPLINK 2408C 8 DBI BASE": "Antena omnidireccional TP-Link TL-ANT2408C de 8dBi con base magnética. Mejora la cobertura del router, conector RP-SMA. Ideal para ampliar el alcance en interiores.",
  "ANTENA CABLE EXT.  ANT24EC12N": "Cable de extensión para antena Wi-Fi de baja pérdida. Conector RP-SMA, permite posicionar la antena en ubicación óptima. Para routers y adaptadores Wi-Fi con antena externa.",
  "ANTENA PIG TAIL ANT24PT": "Cable pigtail adaptador de antena Wi-Fi con conectores RP-SMA. Permite conectar antenas externas a routers y adaptadores con conectores diferentes. Cable corto de baja pérdida.",
  "SWITCH 5 BOCAS TPLINK": "Switch de red TP-Link de 5 puertos (10/100 Mbps). Plug & play, diseño compacto, bajo consumo energético. Amplía los puertos de red de tu router de forma sencilla y económica.",

  // ═══ CABLES ═══
  "CABLE HDMI - HDMI 1,5 MTS.": "Cable HDMI a HDMI de 1.5 metros estándar. Compatible con resoluciones hasta 1080p/4K. Conectores estándar para TV, monitor, PC, consola. Cable corto ideal para setups compactos.",
  "CABLE HDMI - HDMI 2 MT NOGA": "Cable HDMI a HDMI Noga de 2 metros. Conectores robustos, compatible con Full HD y 4K. Longitud versátil para conexiones entre dispositivos multimedia.",
  "CABLE HDMI - HDMI 5 MTS.": "Cable HDMI a HDMI de 5 metros de largo alcance. Ideal para instalaciones donde el dispositivo fuente está lejos del monitor o TV. Compatible con resoluciones HD y 4K.",
  "CABLE HDMI - MINI HDMI": "Cable HDMI a Mini HDMI para conectar cámaras, tablets y dispositivos con puerto Mini HDMI a TVs y monitores. Transmisión de audio y video en alta definición.",
  "CABLE HDMI - MICRO HDMI": "Cable HDMI a Micro HDMI para conectar dispositivos compactos con puerto Micro HDMI (cámaras, tablets, Raspberry Pi) a TVs y monitores. Audio y video Full HD.",
  "CABLE TIPO C A TIPO C SOUL  MAGN. 60W": "Cable Tipo C a Tipo C Soul magnético con carga rápida de 60W. Conector magnético de fácil enganche, protección contra tirones. Carga y datos de alta velocidad entre dispositivos USB-C.",
  "CABLE TIPO C A TIPO C SOUL 1 MT.": "Cable Tipo C a Tipo C Soul de 1 metro. Carga rápida y transferencia de datos entre dispositivos USB-C. Cable resistente con conectores de aluminio. Ideal para carga rápida de laptops y celulares.",
  "CABLE TIPO C A TIPO C IBOX 2 MTS.": "Cable Tipo C a Tipo C iBox de 2 metros. Mayor longitud para comodidad de uso, carga y datos entre dispositivos USB-C. Conectores reforzados.",
  "CABLE TIPO C A IPHONE REPLICA": "Cable Tipo C a Lightning réplica para carga de iPhone desde cargadores USB-C. Funcional para carga diaria. Compatible con iPhone 8 en adelante.",
  "CABLE USB A IPHONE SOUL FULL JEAN": "Cable USB a Lightning Soul Full Jean con revestimiento textil tipo jean ultra resistente. Carga y sincronización para iPhone y iPad. Estilo único y durabilidad.",
  "CABLE USB A TIPO C SOUL CLASSIC": "Cable USB a Tipo C Soul Classic con diseño estándar confiable. Carga y transferencia de datos para dispositivos USB-C. Conectores reforzados para durabilidad.",
  "CABLE USB A TIPO C XNY": "Cable USB a Tipo C XNY para carga y datos. Compatible con celulares, tablets y dispositivos con puerto USB-C. Cable resistente de uso diario.",
  "CABLE ALIMENTACION TREBOL": "Cable de alimentación tipo trébol (Mickey Mouse / IEC C5) para notebooks y cargadores. Ficha tres patas estándar de 220V. Cable esencial para alimentar tu laptop.",
  "CABLE VGA MACHO/ MACHO 1,5 MTS": "Cable VGA macho a macho de 1.5 metros para conexión analógica de video. Conectores HD-15, ferrita anti-interferencias. Para monitores y proyectores con entrada VGA.",
  "CABLE MINI PLUG CONSOLAS PLUS": "Cable Mini Plug 3.5mm reforzado para auriculares de consolas gaming. Mayor longitud y durabilidad que el estándar. Compatible con PS4, Xbox One, Switch.",
  "CABLE USB A IMPRESORA 2 M": "Cable USB tipo A a tipo B de 2 metros para impresoras. Conexión estándar universal para HP, Epson, Brother, Canon. Blindaje para transferencia estable.",
  "PATCH CORD 5 M": "Cable de red Patch Cord UTP de 5 metros Cat 5e/6 con fichas RJ45. Longitud intermedia para conexiones Ethernet en hogar u oficina. Conectores moldeados de calidad.",
  "PATCH CORD 3 M": "Cable de red Patch Cord UTP de 3 metros Cat 5e/6 con fichas RJ45. Cable versátil para conectar PC, consola o smart TV al router. Conectores moldeados.",
  "PATCH CORD 1 M": "Cable de red Patch Cord UTP de 1 metro Cat 5e/6 con fichas RJ45. Cable corto ideal para conexiones cercanas al router o switch. Conectores moldeados.",

  // ═══ ADAPTADORES ═══
  "ADAPTADOR DVI A VGA": "Adaptador DVI a VGA para conectar monitores VGA a salidas DVI de placas de video y PCs. Conversión de señal digital a analógica, compacto y plug & play.",
  "ADAPTADOR OTG TIPO C": "Adaptador OTG USB Tipo C a USB A hembra. Permite conectar pen drives, teclados, mouse y otros periféricos USB a celulares y tablets con puerto USB-C.",
  "ADAPTADOR TIPO C H A IPHONE M": "Adaptador USB Tipo C hembra a Lightning macho. Permite usar cables y cargadores USB-C con dispositivos Apple Lightning. Compacto y portátil.",
  "ADAPTADOR 5 EN 1 GTC": "Hub adaptador GTC 5 en 1 con múltiples puertos (USB, HDMI, lectores de tarjetas) desde un conector USB-C. Expande las conexiones de tu notebook moderna en un solo accesorio compacto.",
  "ADAPTADOR HDMI A VGA CON CABLE": "Adaptador HDMI a VGA con cable integrado. Convierte señal HDMI digital a VGA analógica para conectar a monitores y proyectores antiguos. Resolución hasta 1080p. Audio no incluido.",
  "ADAPTADOR RJ45 A USB TIPO C": "Adaptador de red Ethernet RJ45 a USB Tipo C. Agrega puerto de red por cable a notebooks y tablets con USB-C. Velocidad Gigabit, plug & play. Conexión estable sin Wi-Fi.",
  "HUB USB-TIPO C GTC 4 EN 1": "Hub USB-C GTC 4 en 1 con múltiples puertos USB para expandir la conectividad de notebooks modernas. Diseño compacto y portátil, plug & play sin drivers.",
  "HUB USB A 4 BOCAS NETMARK": "Hub USB Netmark de 4 puertos USB 2.0. Expande las conexiones USB de tu PC o notebook. Diseño compacto de escritorio, plug & play. Económico y funcional.",

  // ═══ CARGADORES ═══
  "CARGADOR KOSMO USB 2 A": "Cargador de pared Kosmo de 2A con puerto USB. Carga estándar para celulares y dispositivos USB. Protección contra sobrecarga, diseño compacto. Sin cable incluido.",
  "CARGADOR KOSMO USB + C": "Cargador de pared Kosmo con puerto USB A + USB Tipo C. Carga dos dispositivos simultáneamente, potencia optimizada. Compacto y seguro con protecciones eléctricas.",
  "CARGADOR NOTEBOOK UNIV. 90W": "Cargador universal para notebooks de 90W con múltiples puntas intercambiables. Compatible con la mayoría de marcas (HP, Dell, Lenovo, ASUS, Acer). Selector de voltaje automático.",
  "CARGADOR NOTEBOOK UNIV. 65W": "Cargador universal para notebooks de 65W con puntas intercambiables. Compatible con múltiples marcas y modelos. Ideal para notebooks de bajo y mediano consumo.",
  "CARGADOR NOTEBOOK UNIVERSAL": "Cargador universal para notebooks con puntas intercambiables para diferentes marcas y modelos. Voltaje ajustable, protecciones eléctricas integradas. Consultar compatibilidad.",
  "CARGADOR SOUL USB + C": "Cargador de pared Soul con puerto USB A + USB Tipo C. Carga inteligente para dos dispositivos, diseño compacto con protección contra sobrecarga. Potencia optimizada.",
  "CARGADOR SOUL PD 35 W TIPO C": "Cargador de pared Soul con tecnología Power Delivery (PD) de 35W y puerto USB Tipo C. Carga rápida para celulares, tablets y notebooks compatibles con PD. Compacto y eficiente.",
  "CARGADOR USB DE AUTO BALI TIPO C": "Cargador de auto Bali con puerto USB Tipo C. Carga rápida en el vehículo para celulares y dispositivos USB-C. Diseño compacto con protección contra sobrecarga.",
  "CARGADOR SOUL 2.4 A 1 USB MICRO USB": "Cargador de pared Soul de 2.4A con 1 puerto USB y cable Micro USB incluido. Carga rápida para celulares y dispositivos Micro USB. Compacto y seguro.",
  "CARGADOR SOUL 2.4 SIN CABLE": "Cargador de pared Soul de 2.4A con puerto USB sin cable incluido. Carga estándar rápida, diseño compacto. Usa tu propio cable (Micro USB, Tipo C o Lightning).",
  "CARGADOR TABLET": "Cargador para tablet con voltaje y amperaje adecuados. Compatible con tablets genéricas con puerto de carga estándar. Consultar compatibilidad según modelo.",
  "CARGADOR DE PILAS ENERGIZER": "Cargador de pilas recargables Energizer para pilas AA y AAA NiMH. Indicador LED de estado de carga, protección contra sobrecarga. Compatible con pilas Energizer recargables.",

  // ═══ PILAS ═══
  "PILA ALCALINA ENERGIZER AAA UNIDAD": "Pila alcalina Energizer tamaño AAA (LR03) por unidad. Energía de larga duración para controles remotos, linternas, juguetes y dispositivos de bajo consumo. Calidad Energizer.",
  "PILA ALCALINA ENERGIZER AA UNIDAD": "Pila alcalina Energizer tamaño AA (LR6) por unidad. Rendimiento duradero para dispositivos de uso diario: controles, relojes, mouse inalámbricos. Calidad Energizer reconocida.",
  "PILA RECARGABLE ENERGIZER AA 2500 UNIDAD": "Pila recargable Energizer tamaño AA de 2500mAh NiMH por unidad. Hasta 1000 ciclos de recarga, ideal para dispositivos de alto consumo como cámaras y controles de consola.",
  "PILA RECARGABLE ENERGIZER AAA 900 UNIDAD": "Pila recargable Energizer tamaño AAA de 900mAh NiMH por unidad. Recargable hasta 1000 veces, eco-friendly. Para dispositivos de bajo a mediano consumo.",
  "PILA LITIO CR 2016/2025/2032": "Pila de litio tipo botón CR2016, CR2025 o CR2032 (consultar modelo). Para relojes, llaves de auto, controles, motherboards (CMOS) y dispositivos electrónicos pequeños. Larga vida útil.",

  // ═══ POWER BANKS ═══
  "POWER BANK SOUL CON VISOR 10000": "Power bank Soul de 10.000mAh con pantalla LED indicadora de carga. Puertos USB duales para cargar dos dispositivos simultáneamente. Diseño compacto y portátil. Carga tu celular varias veces.",
  "POWER BANK NOGA PB300 5000 MA": "Power bank Noga PB300 de 5.000mAh compacto y ligero. Puerto USB para cargar celulares y dispositivos portátiles. Diseño de bolsillo, ideal para emergencias y viajes cortos.",
  "POWER BANK NOGA INALAMBRICO 10W": "Power bank Noga con carga inalámbrica Qi de 10W + puertos USB. Carga tu celular apoyándolo encima o con cable. Doble funcionalidad, diseño moderno. Compatible con dispositivos Qi.",

  // ═══ ACCESORIOS VARIOS ═══
  "GRABADORA DVD ASUS 24X": "Grabadora de DVD interna ASUS de 24X con interfaz SATA. Lectura y escritura de CD/DVD a alta velocidad, compatibilidad con múltiples formatos. Para PCs de escritorio que necesiten unidad óptica.",
  "GRABADORA DVD SLIM EXTERNA LG": "Grabadora de DVD externa LG ultra slim con conexión USB. Lectura y escritura de CD/DVD en formato portátil, alimentación por USB sin adaptador. Ideal para notebooks sin unidad óptica.",
  "LI KIT PANTALLAS DELICADAS GTC": "Kit de limpieza GTC para pantallas delicadas: monitores, notebooks, celulares y tablets. Incluye líquido limpiador especial y paño de microfibra. Deja las pantallas impecables sin rayar.",
  "LI CONTACMATIC SUPER 200 GR": "Limpia contactos Contacmatic Super de 200gr en aerosol. Limpia y protege contactos eléctricos y electrónicos, evapora rápido sin dejar residuos. Esencial para mantenimiento de PCs.",
  "LI GRASA SILICONADA JERINGA BLANCA": "Grasa siliconada térmica blanca en jeringa dosificadora. Pasta térmica para CPU y GPU, mejora la transferencia de calor entre procesador y disipador. Aplicación precisa con jeringa.",
  "HOLDER DOBLE CLIP": "Soporte de celular tipo doble clip para escritorio. Sujeción firme con pinza doble, brazo flexible ajustable. Compatible con todos los celulares. Ideal para videollamadas y seguir recetas.",
  "HOLDER SOP-Q300": "Soporte de celular SOP-Q300 para escritorio con diseño estable. Base antideslizante, ángulo ajustable, compatible con celulares de todos los tamaños. Práctico para video, lectura y carga.",
  "HOLDER CELULAR BICICLETA": "Soporte de celular para bicicleta con sujeción firme y segura. Montaje en manubrio, rotación 360°, compatible con celulares de 4.5\" a 7\". Ideal para GPS y tracking deportivo.",
  "ARO RGB 10 \" CON TRIPODE": "Aro de luz RGB de 10 pulgadas con trípode ajustable. Iluminación multicolor con diferentes modos, soporte para celular incluido. Ideal para streaming, TikTok, Instagram y videollamadas.",
  "BOLSO SIGNO 9\" A 17\"": "Bolso porta notebook Signo para equipos de 9 a 17 pulgadas. Material resistente con acolchado interno protector, bolsillos organizadores, correa de hombro ajustable. Protección y comodidad.",
  "BASE DE NOTEBOOK SOUL OB 100": "Base refrigerante para notebook Soul OB 100 con ventiladores para evitar sobrecalentamiento. Diseño ergonómico inclinado, superficie de malla, alimentación USB. Compatible con notebooks de hasta 17\".",
  "BASE DE NOTEBOOK GTC": "Base refrigerante para notebook GTC con ventilador para enfriamiento activo. Diseño ergonómico con inclinación, alimentación por USB. Compatible con notebooks de diferentes tamaños.",
  "RESMA BOREAL \"A4\" 70 GRAMOS": "Resma de papel Boreal tamaño A4 de 70 gramos por metro cuadrado. 500 hojas de papel blanco para impresión láser e inkjet. Gramaje ligero para uso diario y economía.",
  "RESMA BOREAL \"A4\" 75 GRAMOS": "Resma de papel Boreal tamaño A4 de 75 gramos por metro cuadrado. 500 hojas de papel blanco de gramaje estándar. Ideal para uso general en oficina, impresiones y fotocopias.",
  "RESMA BOREAL \"A4\" 80 GRAMOS": "Resma de papel Boreal tamaño A4 de 80 gramos por metro cuadrado. 500 hojas de papel blanco premium con mayor rigidez y opacidad. Ideal para documentos profesionales e impresiones de calidad.",
  "LOCALIZADOR TACKR": "Localizador Bluetooth Tackr para encontrar objetos perdidos. Se adhiere a llaves, billeteras u objetos personales. Localización vía app en celular, alarma sonora y rango Bluetooth.",
  "SMARTWACH BAND SLIM 100": "Smartwatch Band Slim 100 con pantalla táctil color, monitor de frecuencia cardíaca, contador de pasos, notificaciones y control de música. Diseño delgado y elegante con batería de larga duración.",
};

async function addDescriptions() {
  console.log("🔍 Leyendo todos los productos de Firestore...\n");
  const snapshot = await db.collection("products").get();
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const missing = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    if (!name) { skipped++; continue; }
    if (data.description && data.description.trim().length > 0) { skipped++; continue; }

    const desc = DESCRIPTIONS[name];
    if (!desc) { notFound++; missing.push(name); continue; }

    try {
      await db.collection("products").doc(doc.id).update({ description: desc });
      console.log(`✅ "${name}"`);
      updated++;
    } catch (e) {
      console.error(`❌ "${name}":`, e.message);
    }
  }

  console.log(`\n📊 RESUMEN: ✅ ${updated} actualizados | ⏭️ ${skipped} omitidos | ❓ ${notFound} sin match`);
  if (missing.length > 0) {
    console.log("\n⚠️ Sin match:");
    missing.forEach(p => console.log(`  - "${p}"`));
  }
  process.exit(0);
}

addDescriptions().catch(e => { console.error(e); process.exit(1); });
