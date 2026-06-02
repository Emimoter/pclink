const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "pclink-f6e0d"
});

const db = admin.firestore();

// ─── COMPLETE DESCRIPTIONS CATALOG ───────────────────────────────────────────
// Keys MUST match EXACT Firestore product names (case-sensitive, all-caps)

const DESCRIPTIONS = {
  // ═══════════════════════════════════════════════════════════════════════
  // CARTUCHOS ALTERNATIVOS HP (MARCA GENESIS)
  // ═══════════════════════════════════════════════════════════════════════
  "CARTUCHO ALT. HP 21 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 21 negro. Ideal para impresoras HP DeskJet serie 3900, D1400, D2300 y PSC 1400. Ofrece textos nítidos y buen rendimiento para impresión diaria de documentos a un costo accesible.",
  "CARTUCHO ALT. HP 22 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 22. Cian, magenta y amarillo en un solo cartucho para impresiones a color vívidas. Compatible con HP DeskJet serie 3900, D1400, D2300 y PSC 1400.",
  "CARTUCHO ALT. HP 60 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 60 negro. Para impresoras HP DeskJet D2500, F4200, F4400 y Photosmart C4600. Textos claros y definidos a precio económico.",
  "CARTUCHO ALT. HP 60 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 60. Colores vibrantes para impresiones cotidianas. Compatible con HP DeskJet D2500, F4200, F4400 y Photosmart C4600.",
  "CARTUCHO ALT. HP 75 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 75. Impresiones a color con buena saturación para HP DeskJet D4200, Officejet J5700 y Photosmart C4200. Alternativa económica de calidad.",
  "CARTUCHO ALT. HP 92 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 92 negro. Diseñado para HP DeskJet 5440, Photosmart 7800, C3100 y PSC 1500. Negro intenso para documentos profesionales a bajo costo.",
  "CARTUCHO ALT. HP 122 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 122 negro. Para impresoras HP DeskJet 1000, 2000, 2050 y 3050. Rendimiento confiable para documentos de texto con excelente relación calidad-precio.",
  "CARTUCHO ALT. HP 122 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 122. Cian, magenta y amarillo para impresiones a color equilibradas. Compatible con HP DeskJet 1000, 2000, 2050 y 3050.",
  "CARTUCHO ALT. HP 662 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 662 negro. Para impresoras HP Deskjet Ink Advantage 1015, 1515, 2515, 3515 y 4645. Textos legibles y contrastados a precio accesible.",
  "CARTUCHO ALT. HP 662 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 662. Colores balanceados para impresiones diarias. Compatible con HP Deskjet Ink Advantage 1015, 1515, 2515, 3515 y 4645.",
  "CARTUCHO ALT. HP 664 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 664 negro. Ideal para impresoras HP DeskJet Ink Advantage 1115, 2135, 3635, 3835 y 4535. Buen contraste y rendimiento a menor costo.",
  "CARTUCHO ALT. HP 664 COLOR": "Cartucho de tinta tricolor alternativo marca Genesis compatible con HP 664. Impresiones a color vibrantes. Compatible con HP DeskJet Ink Advantage 1115, 2135, 3635, 3835 y 4535.",
  "CARTUCHO ALT. HP 670 NEGRO": "Cartucho de tinta alternativo marca Genesis compatible con HP 670 negro. Para impresoras HP Deskjet Ink Advantage 3525, 4615, 4625 y 5525. Negro profundo para documentos con calidad Genesis.",

  // ═══════════════════════════════════════════════════════════════════════
  // CARTUCHOS ALTERNATIVOS EPSON (MARCA GENESIS)
  // ═══════════════════════════════════════════════════════════════════════
  "CARTUCHO ALT. EPSON T544 N/C": "Set de cartuchos de tinta alternativos marca Genesis compatible con Epson EcoTank serie T544. Incluye negro y colores (cian, magenta, amarillo). Ideal para impresoras Epson L1110, L3110, L3150, L5190. Excelente rendimiento a precio económico.",
  "CARTUCHO ALT. EPSON T504 COLOR": "Cartucho de tinta alternativo marca Genesis compatible con Epson T504 color. Para impresoras Epson EcoTank L4150, L4160, L6161, L6171 y L6191. Colores vibrantes y consistentes a un precio accesible.",
  "CARTUCHO ALT. EPSON COLOR 206": "Cartucho de tinta alternativo marca Genesis compatible con Epson 206 color. Para impresoras Epson XP-2101. Colores equilibrados para impresiones cotidianas con buena calidad Genesis.",
  "CARTUCHO ALT. EPSON NEGRO 206": "Cartucho de tinta alternativo marca Genesis compatible con Epson 206 negro. Para impresoras Epson XP-2101. Textos nítidos y definidos con rendimiento confiable.",

  // ═══════════════════════════════════════════════════════════════════════
  // CARTUCHOS ORIGINALES HP
  // ═══════════════════════════════════════════════════════════════════════
  "CARTUCHO ORIG. HP COLOR # 667": "Cartucho de tinta tricolor original HP 667. Compatible con impresoras HP DeskJet Plus serie 2700 y DeskJet Plus 4100. Calidad HP certificada con cian, magenta y amarillo para impresiones a color vívidas y detalladas.",
  "CARTUCHO ORIG. HP COLOR # 664": "Cartucho de tinta tricolor original HP 664. Para impresoras HP DeskJet Ink Advantage 1115, 2135, 3635, 3835 y 4535. Colores vibrantes con tecnología original HP para documentos y fotos de calidad.",

  // ═══════════════════════════════════════════════════════════════════════
  // CARTUCHOS ORIGINALES EPSON
  // ═══════════════════════════════════════════════════════════════════════
  "CARTUCHO ORIG. EPSON COLOR 206": "Cartucho de tinta original Epson 206 color (T206). Para impresoras Epson XP-2101. Tinta genuina Epson que garantiza colores precisos, protección del cabezal y máxima durabilidad en cada impresión.",
  "CARTUCHO ORIG. EPSON COLOR 133": "Cartucho de tinta original Epson 133 color (T133). Compatible con impresoras Epson Stylus TX130, TX133, TX135 y TX320F. Colores fieles con tinta original Epson para resultados profesionales.",
  "CARTUCHO ORIG. EPSON NEGRO 73": "Cartucho de tinta original Epson 73 negro (T073). Para impresoras Epson Stylus C79, CX3900, CX5900 y TX100. Negros profundos y textos nítidos con tinta genuina Epson.",
  "CARTUCHO ORIG. EPSON NEGRO 664 (L200)": "Cartucho de tinta original Epson 664 negro (T664120) para sistema EcoTank. Compatible con Epson L200, L210, L220, L355, L365, L375, L395, L455, L555 y L575. Alto rendimiento con tinta original de tanque.",

  // ═══════════════════════════════════════════════════════════════════════
  // TONERS ALTERNATIVOS
  // ═══════════════════════════════════════════════════════════════════════
  "TONER ALT. SAMSUNG D111L": "Tóner alternativo compatible con Samsung MLT-D111L de alta capacidad. Para impresoras Samsung Xpress M2020, M2022, M2070 y M2078. Rendimiento extendido con impresiones nítidas y definidas.",
  "TONER ALT. SAMSUNG D101S": "Tóner alternativo compatible con Samsung MLT-D101S. Para impresoras Samsung ML-2160, ML-2165, SCX-3400 y SCX-3405. Textos claros y profesionales a precio económico.",
  "TONER ALT. SAMSUNG D108": "Tóner alternativo compatible con Samsung MLT-D108S. Para impresoras Samsung ML-1640 y ML-2240. Rendimiento confiable para impresión de documentos de oficina.",
  "TONER ALT. SAMSUNG 406S": "Tóner alternativo compatible con Samsung CLT-406S. Para impresoras Samsung CLP-360, CLP-365, CLX-3300 y CLX-3305. Disponible en negro para documentos profesionales.",
  "TONER ALT. HP 17 A (M102) CON CHIP": "Tóner alternativo compatible con HP CF217A (17A) con chip incluido. Para impresoras HP LaserJet Pro M102 y MFP M130. Instalación plug & play sin configuración adicional. Textos nítidos para documentos de oficina.",
  "TONER ALT. HP 48 A": "Tóner alternativo compatible con HP CF248A (48A). Para impresoras HP LaserJet Pro M15 y MFP M28. Compacto y eficiente, ideal para impresión de bajo volumen con calidad profesional.",
  "TONER ALT. HP 78 A (P1606)": "Tóner alternativo compatible con HP CE278A (78A). Para impresoras HP LaserJet Pro P1606dn y MFP M1536dnf. Rendimiento confiable para documentos de uso diario.",
  "TONER ALT. HP 79 A (M12 SERIES)": "Tóner alternativo compatible con HP CF279A (79A). Para impresoras HP LaserJet Pro M12 y MFP M26. Textos definidos y gráficos claros para documentos profesionales.",
  "TONER ALT. HP 83 A": "Tóner alternativo compatible con HP CF283A (83A). Para impresoras HP LaserJet Pro M125, M127, M201 y M225. Rendimiento consistente para impresión de alto volumen en oficina.",
  "TONER ALT. HP 226A": "Tóner alternativo compatible con HP CF226A (26A). Para impresoras HP LaserJet Pro M402 y MFP M426. Calidad profesional con textos nítidos y negros profundos.",
  "TONER ALT. HP 280 A": "Tóner alternativo compatible con HP CF280A (80A). Para impresoras HP LaserJet Pro 400 M401 y MFP M425. Buen rendimiento y calidad de impresión para entornos de oficina.",
  "TONER ALT. HP 287 A": "Tóner alternativo compatible con HP CF287A (87A). Para impresoras HP LaserJet Enterprise M506 y MFP M527. Alta capacidad para entornos de impresión empresarial.",
  "TONER ALT. HP 350A": "Tóner alternativo compatible con HP CF350A (130A) negro. Para impresoras HP Color LaserJet Pro MFP M176n y M177fw. Impresiones en negro de calidad a precio accesible.",
  "TONER ALT. BROTHER TN-350": "Tóner alternativo compatible con Brother TN-350. Para impresoras Brother HL-2040, HL-2070N, DCP-7020 y MFC-7420. Rendimiento sólido para documentos en blanco y negro.",
  "TONER ALT. BROTHER TN-360": "Tóner alternativo compatible con Brother TN-360 de alta capacidad. Para impresoras Brother HL-2140, HL-2170W, DCP-7030, DCP-7040 y MFC-7340. Mayor rendimiento por tóner.",
  "TONER ALT. BROTHER TN-660/2370": "Tóner alternativo compatible con Brother TN-660 / TN-2370 de alta capacidad. Para impresoras Brother HL-L2300, HL-L2340, DCP-L2500 y MFC-L2700. Rendimiento extendido para impresión intensiva.",
  "TONER ALT. BROTHER TN221K": "Tóner alternativo compatible con Brother TN-221BK negro. Para impresoras Brother HL-3140CW, HL-3170CDW, MFC-9130CW y MFC-9330CDW. Negro profundo para documentos e impresiones a color.",
  "TONER ALT. XEROX 3020": "Tóner alternativo compatible con Xerox Phaser 3020 y WorkCentre 3025. Rendimiento confiable para impresión de documentos en oficina y hogar. Textos nítidos con buen contraste.",

  // ═══════════════════════════════════════════════════════════════════════
  // DRUMS (UNIDADES DE IMAGEN)
  // ═══════════════════════════════════════════════════════════════════════
  "DRUM BROTHER 1060": "Unidad de tambor (drum) alternativa compatible con Brother DR-1060. Para impresoras Brother HL-1110, HL-1112, DCP-1510 y MFC-1810. Reemplaza el cilindro de imagen para mantener la calidad de impresión óptima.",
  "DRUM BROTHER 2340": "Unidad de tambor (drum) alternativa compatible con Brother DR-2340. Para impresoras Brother HL-L2300, HL-L2360, DCP-L2500 y MFC-L2700. Prolonga la vida útil de tu impresora con impresiones claras y uniformes.",
  "DRUM BROTHER 420": "Unidad de tambor (drum) alternativa compatible con Brother DR-420. Para impresoras Brother HL-2240, HL-2270, DCP-7065 y MFC-7360. Garantiza transferencia de tóner precisa para impresiones de calidad.",

  // ═══════════════════════════════════════════════════════════════════════
  // AURICULARES
  // ═══════════════════════════════════════════════════════════════════════
  "AURICULAR BLUETOOTH SOUL BT50": "Auriculares Bluetooth Soul BT50 inalámbricos con diseño on-ear plegable. Batería recargable de larga duración, micrófono integrado para llamadas y controles en el auricular. Compatibles con celulares, tablets y notebooks vía Bluetooth.",
  "AURICULAR BLUETOOTH SOUL S150": "Auriculares Bluetooth Soul S150 tipo in-ear con banda para el cuello. Diseño deportivo resistente al sudor, micrófono HD integrado, batería de larga duración. Ideales para uso diario y actividad física.",
  "AURICULAR BLUETOOTH SOUL S600": "Auriculares Bluetooth Soul S600 inalámbricos over-ear con sonido envolvente. Almohadillas acolchadas ultra cómodas, micrófono integrado, plegables para fácil transporte. Batería de larga duración para música y llamadas todo el día.",
  "AURICULAR BLUETOOTH MIXOR": "Auriculares Bluetooth Mixor in-ear inalámbricos tipo TWS (True Wireless Stereo). Estuche de carga portátil, controles táctiles, micrófono integrado y conexión Bluetooth 5.0 estable. Compactos y cómodos para uso diario.",
  "AURICULAR BLUETOOTH F10-PLUS": "Auriculares Bluetooth F10-Plus tipo TWS inalámbricos con estuche de carga LED. Sonido estéreo de alta fidelidad, micrófono dual para llamadas claras, Bluetooth 5.0 con conexión rápida. Diseño ergonómico y ligero.",
  "AURICULAR BLUETOOTH F9-5": "Auriculares Bluetooth F9-5 tipo TWS con estuche de carga con pantalla LED indicadora de batería. Sonido estéreo envolvente, resistencia al agua IPX4, Bluetooth 5.0 y micrófono integrado. Ideales para deporte y uso diario.",
  "AURICULAR BLUETOOTH R193": "Auriculares Bluetooth R193 tipo TWS con diseño ultracompacto. Estuche de carga portátil, sonido claro y nítido, Bluetooth 5.0, micrófono integrado para llamadas. Cómodos y discretos para todo el día.",
  "AURICULAR BLUETOOTH SOUL CHILL BT300": "Auriculares Bluetooth Soul Chill BT300 over-ear con diseño premium. Sonido Hi-Fi con graves profundos, almohadillas de cuero sintético suave, plegables, micrófono integrado. Hasta 12 horas de reproducción continua. Ideales para música, podcasts y llamadas.",
  "AURICULAR BLUETOOTH SOUL TWS SPORT 100": "Auriculares Bluetooth Soul TWS Sport 100 inalámbricos con ganchos de oreja deportivos. Resistencia al agua y sudor, sonido potente, estuche de carga, Bluetooth 5.0. Diseñados para actividad física intensa sin que se caigan.",
  "AURICULAR GTC HSG-154": "Auriculares gaming GTC HSG-154 con micrófono regulable y sonido estéreo. Diadema ajustable acolchada, almohadillas suaves, cable con control de volumen. Compatible con PC, consolas y celulares vía conector de 3.5mm.",
  "AURICULAR GTC 151": "Auriculares GTC 151 estéreo con micrófono integrado y diadema ajustable. Diseño cómodo y liviano para uso prolongado, conector de 3.5mm universal. Ideales para videollamadas, gaming casual y música.",
  "AURICULAR SOUL XH-150": "Auriculares Soul XH-150 tipo in-ear con micrófono y botón multifunción en el cable. Sonido claro con buenos graves, aislamiento pasivo de ruido, 3 pares de gomitas intercambiables. Conector 3.5mm universal.",
  "AURICULAR SOUL S89 TIPO C": "Auriculares Soul S89 tipo in-ear con conector USB Tipo C. Compatibles con celulares y tablets modernos sin jack de 3.5mm. Micrófono integrado, botón multifunción y sonido nítido para llamadas y música.",
  "AURICULAR SOUL S589 IPHONE/TIPO C": "Auriculares Soul S589 tipo in-ear disponibles con conector Lightning (iPhone) o USB Tipo C. Micrófono integrado para llamadas, botón de control en cable y sonido de calidad. Compatibles con smartphones de última generación.",
  "AURICULAR SOUL L600": "Auriculares Soul L600 over-ear con sonido potente y diseño cómodo. Diadema acolchada ajustable, almohadillas suaves, cable desmontable con micrófono. Ideal para gaming, música y entretenimiento multimedia.",
  "AURICULAR NOGA STORMER 819 / 8620": "Auriculares gaming Noga Stormer 819/8620 con iluminación LED y micrófono flexible. Sonido envolvente con drivers de alta potencia, diadema ajustable, almohadillas acolchadas. Cable trenzado resistente, compatible con PC y consolas.",
  "AURICULAR NOGA GAMMER HYDRA": "Auriculares gaming Noga Gamer Hydra con diseño agresivo e iluminación RGB. Micrófono omnidireccional flexible, drivers de 50mm para sonido inmersivo, diadema con ajuste de acero. Ideales para gaming competitivo en PC.",
  "AURICULAR LOGITECH ASTRO A 10 GEN 1": "Auriculares gaming Logitech ASTRO A10 Gen 1 con audio de alta fidelidad. Micrófono flip-to-mute, diadema de acero inoxidable resistente a caídas, almohadillas de tela transpirable. Conector 3.5mm universal para PC, PlayStation, Xbox y Switch.",
  "AURICULAR LOGITECH H151": "Auriculares estéreo Logitech H151 con micrófono con cancelación de ruido. Diseño liviano on-ear con diadema ajustable, controles de volumen y silencio en cable. Conector de 3.5mm único. Ideales para videoconferencias y clases en línea.",
  "AURICULAR LOGITECH G535 WIR": "Auriculares gaming inalámbricos Logitech G535 LIGHTSPEED con sonido envolvente 7.1. Diseño ultraliviano de solo 236g, batería de hasta 33 horas, micrófono flip-to-mute. Conexión inalámbrica de baja latencia para PC y PlayStation.",
  "AURICULAR GENIUS HS-G600V": "Auriculares gaming Genius HS-G600V con vibración integrada para inmersión total. Micrófono ajustable, sonido envolvente virtual, almohadillas de cuero sintético cómodas. Control de volumen y vibración en línea. USB plug & play.",
  "AURICULAR GENIUS HS-M270 SPORT": "Auriculares deportivos Genius HS-M270 tipo in-ear con gancho de oreja ajustable. Resistentes al sudor, micrófono integrado con botón de llamada, cable plano anti-enredos. Conector 3.5mm. Ideales para deporte y actividades al aire libre.",

  // ═══════════════════════════════════════════════════════════════════════
  // TECLADOS
  // ═══════════════════════════════════════════════════════════════════════
  "TECLADO LOGITECH G413 MECHANICAL CARBON": "Teclado mecánico gaming Logitech G413 Carbon con switches Romer-G Tactile. Iluminación LED roja por tecla, carcasa de aleación de aluminio-magnesio, teclas de repuesto para gaming incluidas. USB passthrough, anti-ghosting completo. Premium y duradero.",
  "TECLADO GENIUS NUMERICO 110": "Teclado numérico Genius Numpad i110 compacto con conexión USB. Teclas de membrana silenciosas con respuesta cómoda, diseño slim. Ideal para contadores, oficinas y quienes necesitan un numpad independiente para notebooks.",
  "TECLADO SOUL XK 700 GAMING": "Teclado gaming Soul XK 700 de membrana con retroiluminación RGB multicolor. Teclas anti-ghosting, diseño ergonómico con reposamuñecas, teclas multimedia dedicadas. Construcción resistente para gaming y uso diario.",
  "TECLADO SOUL XK 800 MECANICO": "Teclado mecánico gaming Soul XK 800 con switches mecánicos Blue clicky y retroiluminación RGB personalizable. Anti-ghosting N-key rollover, construcción robusta, diseño compacto. Respuesta táctil precisa para gaming competitivo.",
  "TECLADO NOTEBOOK": "Teclado de reemplazo para notebook. Consultar modelo y compatibilidad antes de comprar. Instalación profesional recomendada. Conectores de cinta flex estándar.",
  "TECLADO GTC 207": "Teclado GTC 207 estándar con conexión USB. Teclas de membrana silenciosas, diseño compacto y liviano, layout español latinoamericano. Ideal para uso diario en oficina, hogar y estudio.",
  "TECLADO WIR SOUL OKW200": "Teclado inalámbrico Soul OKW200 con conexión wireless 2.4GHz. Diseño slim y silencioso con teclas de bajo perfil, receptor nano USB. Batería de larga duración. Ideal para escritorios limpios y sin cables.",
  "TECLADO NOGA NKB-Q80 BLUETOOTH": "Teclado Bluetooth Noga NKB-Q80 compacto con diseño moderno. Conexión Bluetooth para tablets, celulares y PCs. Teclas de bajo perfil silenciosas, batería recargable. Portátil y liviano para productividad en movimiento.",
  "TECLADO NOGA NKB-580": "Teclado Noga NKB-580 USB con diseño estándar y teclas de membrana confortables. Layout en español, construcción robusta para uso intensivo. Plug & play sin necesidad de drivers. Ideal para oficina y hogar.",
  "TECLADO KELYX USB": "Teclado Kelyx USB estándar con layout en español latinoamericano. Teclas de membrana con buena respuesta táctil, diseño resistente y compacto. Conexión USB plug & play. Opción económica y confiable para uso diario.",
  "TECLADO GENIUS LUXEMATE 100/110": "Teclado Genius LuxeMate 100/110 USB con diseño slim y elegante. Teclas chiclet de bajo perfil silenciosas, layout en español. Diseño ergonómico y compacto ideal para espacios reducidos. Plug & play sin drivers.",
  "TECLADO NOGANET NKB-78011/410": "Teclado Noga NKB-78011/410 USB con diseño estándar resistente. Teclas de membrana con buena respuesta, layout en español latinoamericano. Construcción robusta para uso diario en oficina, hogar y educación.",

  // ═══════════════════════════════════════════════════════════════════════
  // COMBOS TECLADO + MOUSE
  // ═══════════════════════════════════════════════════════════════════════
  "TECL Y MOUSE NOGA NKB-STEEL": "Combo teclado y mouse gaming Noga NKB-Steel con retroiluminación LED. Teclado de membrana con teclas anti-ghosting y mouse óptico con DPI ajustable. Diseño agresivo gamer, construcción resistente. Kit completo para gaming.",
  "TECL Y MOUSE GENIUS WIR Q8000": "Combo teclado y mouse inalámbrico Genius SlimStar Q8000. Diseño ultradelgado y silencioso, receptor nano USB 2.4GHz compartido. Teclado de bajo perfil con teclas chiclet y mouse ergonómico compacto. Elegante y funcional.",
  "TECL Y MOUSE BUSINESS MK 310": "Combo teclado y mouse Business MK 310 con diseño profesional. Teclado de membrana estándar y mouse óptico ergonómico, ambos con conexión USB. Ideal para entornos de oficina y uso empresarial diario.",
  "TECL Y MOUSE LOGITECH WIR MK-295": "Combo inalámbrico Logitech MK-295 Silent con tecnología SilentTouch. Teclado y mouse ultrasilenciosos con receptor nano USB unificante. Teclas de bajo perfil, mouse compacto. Hasta 36 meses de batería. Ideal para oficinas compartidas.",
  "TECL Y MOUSE GENIUS WIR 8100/8200": "Combo teclado y mouse inalámbrico Genius 8100/8200 con receptor nano 2.4GHz. Teclado slim multimedia con teclas de función dedicadas, mouse ergonómico con scroll. Diseño elegante para productividad sin cables.",
  "TECL Y MOUSE NOGA NKB-Q60C GAMER": "Combo gaming Noga NKB-Q60C con teclado de membrana retroiluminado RGB y mouse gaming con DPI ajustable. Teclas anti-ghosting, diseño agresivo gamer. Kit completo y económico para iniciarse en el gaming.",
  "TECL Y MOUSE NOGA S5700 WIRELESS": "Combo teclado y mouse inalámbrico Noga S5700 con receptor nano USB 2.4GHz. Diseño slim y cómodo, teclado con teclas de bajo perfil y mouse ergonómico. Batería de larga duración. Solución wireless económica y práctica.",

  // ═══════════════════════════════════════════════════════════════════════
  // MOUSE
  // ═══════════════════════════════════════════════════════════════════════
  "MOUSE LOGITECH G203": "Mouse gaming Logitech G203 Lightsync con sensor de 8.000 DPI y respuesta ultrarrápida de 1ms. Iluminación RGB personalizable en 3 zonas con Logitech G HUB, 6 botones programables, diseño clásico ergonómico. Un clásico que nunca falla.",
  "MOUSE LOGITECH G403 HERO": "Mouse gaming Logitech G403 HERO con sensor HERO 25K de hasta 25.600 DPI. Diseño ergonómico con agarre tipo palm, pesa opcional de 10g, 6 botones programables e iluminación LIGHTSYNC RGB. Cable ligero y flexible. Rendimiento profesional.",
  "MOUSE LOGITECH M 110 SILENT": "Mouse Logitech M110 Silent con clicks ultrasilenciosos, reducción de ruido del 90%. Sensor óptico de alta precisión, diseño ambidiestro cómodo con agarre de goma. USB plug & play. Ideal para oficinas, bibliotecas y espacios compartidos.",
  "MOUSE LOGITECH M 90 USB": "Mouse Logitech M90 USB con sensor óptico de 1000 DPI. Diseño ambidiestro simple y confortable, plug & play sin drivers. Cable de 1.8m. La opción más práctica y económica de Logitech para uso diario.",
  "MOUSE LOGITECH M 187 WIRELESS": "Mouse inalámbrico Logitech M187 ultra portátil con receptor nano USB. Diseño ultracompacto ideal para viajes y notebooks, sensor óptico de 1000 DPI, ambidiestro. Batería de hasta 6 meses. Pequeño pero preciso.",
  "MOUSE LOGITECH M 190 WIRELESS": "Mouse inalámbrico Logitech M190 tamaño completo con receptor nano USB. Diseño ergonómico contorneado, sensor óptico de 1000 DPI, hasta 18 meses de batería. Confortable para uso prolongado en oficina y hogar.",
  "MOUSE SOUL RGB XM600": "Mouse gaming Soul XM600 RGB con sensor óptico de DPI ajustable e iluminación RGB dinámica. Diseño ergonómico gamer, botones laterales programables, cable trenzado resistente. Ideal para gaming de gama media.",
  "MOUSE SOUL OMW250 WIR": "Mouse inalámbrico Soul OMW250 con receptor nano USB 2.4GHz. Diseño ergonómico compacto, sensor óptico preciso, botones silenciosos. Batería de larga duración. Ideal para productividad sin cables.",
  "MOUSE SOUL OMW200 WIR": "Mouse inalámbrico Soul OMW200 con conexión wireless 2.4GHz y receptor nano USB. Diseño cómodo y ligero, sensor óptico de buena precisión. Ideal para notebooks y escritorios limpios.",
  "MOUSE SOUL M150": "Mouse Soul M150 con cable USB y sensor óptico. Diseño ergonómico compacto, botones con click suave, scroll central. Plug & play sin drivers. Opción económica y confiable para uso diario.",
  "MOUSE GENIUS DX-110 PS2": "Mouse Genius DX-110 con conexión PS/2. Sensor óptico de 1000 DPI, diseño ergonómico clásico ambidiestro, 3 botones. Compatible con PCs con puerto PS/2. Opción económica para equipos con conexión legacy.",
  "MOUSE GENIUS DX-120 USB": "Mouse Genius DX-120 USB con sensor óptico de 1000 DPI. Diseño ergonómico cómodo y resistente, 3 botones con scroll. Plug & play universal. Ideal para uso diario en oficina y hogar.",
  "MOUSE GENIUS DX-MINI": "Mouse Genius DX-Mini ultracompacto con cable USB retráctil. Sensor óptico de 1000 DPI, diseño portátil ideal para notebooks y viajes. Plug & play, ambidiestro. El compañero perfecto para tu laptop.",
  "MOUSE GENIUS WIR. NX-8000": "Mouse inalámbrico Genius NX-8000S Silent con clicks silenciosos y receptor nano 2.4GHz. Sensor óptico BlueEye de 1200 DPI que funciona en cualquier superficie, diseño ergonómico, batería de larga duración.",
  "MOUSE GTC 107": "Mouse GTC 107 con cable USB y sensor óptico. Diseño estándar ergonómico, 3 botones con scroll, plug & play. Opción básica y confiable para uso de oficina y hogar.",
  "MOUSE XTRIKE GM215 - 310 - 510": "Mouse gaming Xtrike ME serie GM215/310/510 con sensor óptico de DPI ajustable e iluminación RGB. Diseño ergonómico gamer con botones laterales, cable trenzado resistente. Ideal para gaming a precio accesible.",

  // ═══════════════════════════════════════════════════════════════════════
  // PADS DE MOUSE
  // ═══════════════════════════════════════════════════════════════════════
  "PAD DE MOUSE HYPERX 450x400 (LARGE)": "Mousepad gaming HyperX FURY S Pro tamaño Large (450x400mm). Superficie de tela cosida anti-deshilachado optimizada para sensores ópticos y láser. Base de goma natural antideslizante. Tamaño amplio para movimientos amplios.",
  "PAD DE MOUSE HYPERX 360x300 (MEDIUM)": "Mousepad gaming HyperX FURY S Pro tamaño Medium (360x300mm). Superficie de tela de alta calidad con bordes cosidos, base de goma antideslizante. Grosor optimizado para comodidad. Ideal para gaming y productividad.",
  "PAD DE MOUSE NOGA XXL ST-G9": "Mousepad gaming Noga XXL ST-G9 tamaño extendido que cubre teclado y mouse. Superficie de microtextura para control preciso, bordes cosidos resistentes, base de goma antideslizante. Ideal para setups gaming amplios.",
  "PAD DE MOUSE NOGA XL ST-27": "Mousepad gaming Noga XL ST-27 de tamaño extendido. Superficie de tela suave con buena tracción para el mouse, bordes cosidos, base de goma estable. Amplio espacio para teclado y mouse.",
  "PAD DE MOUSE GEL MTX-018": "Mousepad con reposamuñecas de gel MTX-018 para soporte ergonómico. Superficie de tela suave para deslizamiento preciso, gel de silicona que alivia la presión en la muñeca. Ideal para largas jornadas de trabajo.",
  "PAD DE MOUSE SOUL OFFICE OMP50": "Mousepad Soul Office OMP50 de tamaño estándar con superficie suave y base antideslizante. Diseño sobrio ideal para oficina y hogar. Bordes limpios y grosor cómodo para uso diario.",
  "PAD DE MOUSE SOUL GEL OMP 100": "Mousepad Soul Gel OMP 100 con reposamuñecas de gel ergonómico. Superficie de tela lisa para deslizamiento preciso, gel suave que reduce la fatiga. Diseño profesional para uso prolongado en oficina.",

  // ═══════════════════════════════════════════════════════════════════════
  // GABINETES
  // ═══════════════════════════════════════════════════════════════════════
  "GABINETE KELYX LC 727": "Gabinete Kelyx LC 727 Mid Tower ATX con diseño funcional. Compatible con placas ATX, Micro-ATX y Mini-ITX. Panel lateral con ventana, bahías para discos HDD/SSD, espacio para cable management. Opción económica para armado de PCs.",
  "GABINETE THERMALTAKE H100": "Gabinete Thermaltake H100 TG Mid Tower con panel frontal de malla y lateral de vidrio templado. Excelente flujo de aire, incluye ventilador ARGB preinstalado, compatible con ATX/Micro-ATX/Mini-ITX. Diseño gaming premium con óptima ventilación.",
  "GABINETE AZZA FORTALEZA KIT GAMMER": "Kit gamer Gabinete AZZA Fortaleza Mid Tower con accesorios incluidos. Panel lateral de vidrio templado, ventiladores RGB preinstalados, diseño agresivo gamer. Compatible con ATX/Micro-ATX. Incluye accesorios para un setup completo.",
  "GABINETE SHURE ATX-134": "Gabinete Shure ATX-134 Mid Tower con diseño compacto y funcional. Compatible con placas ATX, Micro-ATX y Mini-ITX. Bahías para discos, fuente inferior. Opción económica para PCs de oficina y uso general.",
  "GABINETE RAPTOR THUNDER STRIKE": "Gabinete gaming Raptor Thunder Strike Mid Tower con diseño agresivo y panel lateral de vidrio templado. Ventiladores con iluminación incluidos, amplio espacio para componentes, filtros de polvo removibles. Para builds gaming con estilo.",

  // ═══════════════════════════════════════════════════════════════════════
  // FUENTES DE ALIMENTACIÓN
  // ═══════════════════════════════════════════════════════════════════════
  "FUENTE SHURE 550 W": "Fuente de alimentación Shure de 550W. Ventilador de 120mm silencioso, conectores SATA y Molex estándar. Protecciones básicas OVP/SCP. Opción económica para PCs de uso general y oficina.",
  "FUENTE KELYX 550 W": "Fuente de alimentación Kelyx de 550W. Ventilador de enfriamiento silencioso, conectores estándar ATX con SATA y Molex. Protecciones eléctricas integradas. Solución confiable y accesible para PCs de uso doméstico.",

  // ═══════════════════════════════════════════════════════════════════════
  // MEMORIAS RAM
  // ═══════════════════════════════════════════════════════════════════════
  "MEMORIA DDR3 8GB": "Módulo de memoria RAM DDR3 de 8GB. Compatible con motherboards y notebooks que usen tecnología DDR3. Ideal para upgrades de equipos de generaciones anteriores. Consultar velocidad y formato (DIMM/SODIMM) según equipo.",
  "MEMORIA DDR4 8GB": "Módulo de memoria RAM DDR4 de 8GB. Compatible con plataformas Intel y AMD actuales con soporte DDR4. Mejora significativa en multitarea y rendimiento general. Consultar velocidad específica según motherboard.",
  "MEMORIA DDR4 16 GB HYPERX RGB": "Módulo de memoria RAM HyperX DDR4 de 16GB con iluminación RGB dinámica. Disipador de aluminio de bajo perfil, perfil XMP para overclocking automático. Capacidad ideal para gaming exigente, streaming y edición de video.",
  "MEMORIA DDR5 16 GB": "Módulo de memoria RAM DDR5 de 16GB de última generación. Mayor ancho de banda y eficiencia energética que DDR4. Compatible con plataformas Intel 12va/13va/14ta gen y AMD AM5. Para builds de última generación.",
  "MEMORIA SODIMM DDR4 8 GB": "Módulo de memoria SODIMM DDR4 de 8GB para notebooks y mini PCs. Upgrade directo para mejorar el rendimiento y multitarea de tu laptop. Consultar velocidad compatible con tu equipo.",
  "SODIMM DDR2 2GB": "Módulo de memoria SODIMM DDR2 de 2GB para notebooks de generaciones anteriores. Ideal para revivir o ampliar la memoria de laptops con tecnología DDR2. Formato compacto para portátiles.",

  // ═══════════════════════════════════════════════════════════════════════
  // ALMACENAMIENTO
  // ═══════════════════════════════════════════════════════════════════════
  "DISCO M.2 NVME 1TB GIGA": "Disco SSD M.2 NVMe de 1TB marca Gigabyte con interfaz PCIe Gen 3/4. Velocidades de lectura/escritura ultrarrápidas en formato M.2 2280. Amplio espacio para sistema operativo, juegos y archivos. Rendimiento superior al SATA.",
  "DISCO SSD 960 GB": "Disco SSD de 960GB con interfaz SATA III (6Gb/s) en formato 2.5\". Velocidades de hasta 500MB/s de lectura. Gran capacidad para almacenar sistema operativo, programas y juegos. Ideal para darle nueva vida a cualquier PC.",
  "MEM. DIGITAL MICRO SD 256 GB KINGSTON": "Tarjeta de memoria Micro SD Kingston de 256GB con adaptador SD incluido. Clase 10, UHS-I para velocidades de transferencia rápidas. Ideal para celulares, cámaras, drones y consolas Nintendo Switch.",
  "MEM. DIGITAL MICRO SD 64 GB HIKSEMI 4K": "Tarjeta de memoria Micro SD Hiksemi de 64GB optimizada para grabación 4K. Clase 10, UHS-I U3 para video de alta resolución. Ideal para cámaras de seguridad, action cameras y drones con grabación en 4K.",
  "PEN DRIVE 64 GB CAJA": "Pen drive USB de 64GB en presentación con caja. Interfaz USB 2.0/3.0, diseño compacto con tapa protectora. Almacenamiento portátil confiable para documentos, fotos, música y archivos de todo tipo.",
  "PEN DRIVE 256 GB": "Pen drive USB de 256GB de alta capacidad. Interfaz USB para transferencias rápidas, diseño compacto y resistente. Gran espacio para backups, archivos pesados, películas y colecciones de música.",
  "PEN DRIVE 32 GB TIPO C": "Pen drive de 32GB con conector USB Tipo C. Compatible con celulares, tablets y notebooks modernos con puerto USB-C. Transferencia directa de archivos sin cables ni adaptadores. Compacto y práctico.",
  "CARRY DISCK HIKSEMI TIPO C": "Carry disk (enclosure) Hiksemi con conexión USB Tipo C para discos SSD/HDD de 2.5\". Convierte tu disco interno en almacenamiento externo portátil. Velocidades USB 3.0/3.1 para transferencias rápidas.",
  "CARRY DISK USB 3.0": "Carry disk (enclosure) USB 3.0 para discos HDD/SSD de 2.5\". Transforma cualquier disco de notebook en almacenamiento externo. Conexión USB 3.0 para velocidades de hasta 5Gbps. Sin herramientas, fácil instalación.",
  "GRABADORA DVD NEGRA SAMSUNG 22X SATA": "Grabadora de DVD Samsung 22X con interfaz SATA interna. Lectura y escritura de CD/DVD a alta velocidad, compatible con múltiples formatos. Color negro. Ideal para PCs de escritorio que necesiten unidad óptica.",

  // ═══════════════════════════════════════════════════════════════════════
  // PLACAS DE VIDEO
  // ═══════════════════════════════════════════════════════════════════════
  "VIDEO PCIE MSI GT 710 2GB": "Placa de video MSI GeForce GT 710 con 2GB de memoria DDR3. Solución gráfica de bajo consumo y perfil bajo, ideal para HTPCs y PCs de oficina que necesiten salida de video. Conectores VGA, DVI y HDMI. Silenciosa y eficiente.",
  "VIDEO PCIE MSI RX 570 ARMOR 8 GB": "Placa de video MSI Radeon RX 570 ARMOR con 8GB de memoria GDDR5. Diseño de refrigeración dual ARMOR con dos ventiladores, backplate de protección. 2048 Stream Processors. Ideal para gaming en 1080p con buen rendimiento.",

  // ═══════════════════════════════════════════════════════════════════════
  // CABLES
  // ═══════════════════════════════════════════════════════════════════════
  "CABLE HDMI - HDMI 1,8 MTS KOLKE 4K": "Cable HDMI a HDMI Kolke de 1.8 metros con soporte 4K. Conectores chapados en oro para máxima conductividad, blindaje para evitar interferencias. Compatible con TVs, monitores, consolas y PCs.",
  "CABLE HDMI - HDMI 3 MTS IGLUFIVE-SOUL 4K": "Cable HDMI a HDMI Iglufive/Soul de 3 metros con soporte 4K. Conectores premium chapados en oro, cable reforzado con blindaje triple. Ideal para home theater, gaming y setups de escritorio.",
  "CABLE HDMI - HDMI 3 MTS": "Cable HDMI a HDMI estándar de 3 metros. Compatible con resoluciones hasta 1080p/4K según versión. Conectores estándar para TV, monitor, consola, PC y proyector. Cable versátil de uso general.",
  "CABLE USB A IMPRESORA 3 M": "Cable USB tipo A a tipo B de 3 metros para impresoras. Conexión estándar para impresoras HP, Epson, Brother, Samsung y Canon. Blindaje para transferencia estable de datos.",
  "CABLE USB A TIPO C SOUL FULL JEAN / FLAT": "Cable USB a Tipo C Soul Full Jean / Flat de diseño textil o plano. Carga rápida y transferencia de datos para celulares y dispositivos USB-C. Construcción reforzada con terminales de aluminio para mayor durabilidad.",
  "CABLE USB A TIPO C METAL 3MTS.": "Cable USB a Tipo C de 3 metros con revestimiento metálico flexible. Carga y transferencia de datos a alta velocidad, extra largo para comodidad de uso. Conectores reforzados de aluminio.",
  "CABLE USB A TIPO C SOUL  MAGN. 30W": "Cable USB a Tipo C Soul magnético con carga rápida de 30W. Conector magnético que se engancha al puerto con facilidad, protege de tirones accidentales. Transferencia de datos incluida. Práctico e innovador.",
  "CABLE USB A TIPO C SOUL IRON FLEX": "Cable USB a Tipo C Soul Iron Flex con construcción ultra resistente. Revestimiento de acero flexible, carga rápida y sincronización de datos. Conectores reforzados de aluminio. Diseñado para durar.",
  "CABLE USB A IPHONE REPLICA": "Cable USB a Lightning réplica para carga y sincronización de iPhone y iPad. Funcional para carga diaria. Compatible con iPhone 5 en adelante y iPad con conector Lightning.",
  "CABLE USB A IPHONE SOUL FLAT 3.1": "Cable USB a Lightning Soul Flat 3.1 con diseño plano anti-enredos. Carga rápida y sincronización de datos para iPhone y iPad. Cable resistente con conectores reforzados de aluminio.",
  "CABLE USB A IPHONE SOUL IRON FLEX": "Cable USB a Lightning Soul Iron Flex con revestimiento de acero flexible ultra resistente. Carga rápida y sincronización para iPhone y iPad. Conectores de aluminio reforzados. Máxima durabilidad.",
  "CABLE USB SOUL LATA TIPOC": "Cable USB a Tipo C Soul Lata con diseño de cable enrollado tipo lata retráctil. Compacto y portátil, ideal para viajes. Carga y sincronización de datos para dispositivos USB-C.",
  "CABLE USB SOUL LATA MICRO USB": "Cable USB a Micro USB Soul Lata con diseño retráctil compacto. Carga y sincronización para dispositivos con puerto Micro USB. Portátil y práctico para llevar a cualquier parte.",
  "CABLE USB A MICRO USB SOUL 2 METROS": "Cable USB a Micro USB Soul de 2 metros de largo. Carga y sincronización de datos para celulares, tablets, controles y dispositivos con puerto Micro USB. Cable reforzado de buena longitud.",
  "CABLE TIPO C A IPHONE SOUL 1 MT.": "Cable Tipo C a Lightning Soul de 1 metro para carga rápida de iPhone y iPad desde cargadores USB-C. Sincronización de datos incluida. Compatible con iPhone 8 en adelante para carga rápida.",
  "CABLE USB A DISCO EXT.": "Cable USB para disco externo con conectores USB tipo A a Micro USB 3.0 (tipo B). Compatible con discos externos portátiles de 2.5\". Transferencia de datos a velocidad USB 3.0.",
  "CABLE USB A MINI USB": "Cable USB tipo A a Mini USB para conexión de dispositivos con puerto Mini USB (cámaras, MP3, controles, etc.). Transferencia de datos y carga. Cable estándar de uso general.",
  "CABLE UTP CAT 5 EXTERIOR": "Cable UTP Categoría 5e para exteriores con cubierta protectora resistente a la intemperie. Ideal para tendidos de red al aire libre o instalaciones expuestas. Conductor de cobre para conexiones Ethernet estables.",
  "CABLE SATA DATOS": "Cable SATA de datos para conexión de discos duros y unidades SSD/DVD a la motherboard. Conector estándar SATA III compatible con todas las velocidades. Cable esencial para armado de PCs.",
  "CABLE ALIMENTACION 220V 1.20M": "Cable de alimentación 220V de 1.20 metros con ficha tres patas (tipo IEC C13). Compatible con monitores, PCs de escritorio, impresoras y fuentes de alimentación. Cable estándar de energía.",
  "CABLE EXTENSION USB 1.8 MT": "Cable extensión USB de 1.8 metros (USB A macho a USB A hembra). Prolonga el alcance de cualquier dispositivo USB: mouse, teclado, webcam, pen drive. Plug & play sin pérdida de señal.",
  "CABLE MINI PLUG / RCA 1.8 MTS.": "Cable Mini Plug 3.5mm a 2 RCA de 1.8 metros. Conecta tu celular, notebook o reproductor de música a parlantes, equipos de audio o TVs con entrada RCA. Audio estéreo de buena calidad.",
  "CABLE MINI PLUG / MINI PLUG IGLUFIVE": "Cable Mini Plug 3.5mm a Mini Plug 3.5mm Iglufive. Cable auxiliar de audio estéreo para conectar celulares, notebooks o reproductores a parlantes, autos o auriculares. Conectores reforzados.",
  "CABLE MINI PLUG CONSOLAS": "Cable Mini Plug 3.5mm para auriculares de consolas gaming (PS4, Xbox One, Switch). Cable de repuesto o extensión para headsets con conector de 3.5mm. Audio claro para chat de voz.",
  "CABLE 3 RCA A 3 RCA": "Cable 3 RCA a 3 RCA (rojo, blanco, amarillo) para audio y video analógico. Conecta consolas retro, reproductores DVD, decodificadores a TVs con entrada RCA. Cable estándar de audio/video compuesto.",
  "CABLE DISPLAY PORT M-M 1.8 M 4K": "Cable DisplayPort macho a macho de 1.8 metros con soporte 4K a 60Hz. Conectores chapados en oro, blindaje para transferencia limpia de señal. Ideal para monitores gaming y estaciones de trabajo.",
  "CABLE DISPLAY PORT M-M 1,8 M": "Cable DisplayPort macho a macho de 1.8 metros. Soporte para resoluciones Full HD y superiores. Conectores estándar para monitores y placas de video con puerto DisplayPort.",
  "CABLE TIPO C A USB 3.0": "Cable adaptador USB Tipo C a USB 3.0 tipo A. Permite conectar dispositivos USB tradicionales a puertos USB-C de notebooks y tablets modernas. Transferencia de datos a velocidad USB 3.0.",
  "PATCH CORD 10 M": "Cable de red Patch Cord UTP de 10 metros Categoría 5e/6 con fichas RJ45. Para conexiones Ethernet de larga distancia dentro del hogar u oficina. Conectores moldeados resistentes.",
  "PATCH CORD 2 M": "Cable de red Patch Cord UTP de 2 metros Categoría 5e/6 con fichas RJ45. Cable corto ideal para conectar PC, consola o smart TV al router. Conectores moldeados de calidad.",

  // ═══════════════════════════════════════════════════════════════════════
  // ADAPTADORES
  // ═══════════════════════════════════════════════════════════════════════
  "ADAPTADOR HDMI - DISPLAYPORT 4K": "Adaptador HDMI a DisplayPort con soporte 4K. Convierte la salida HDMI a DisplayPort para conectar a monitores con entrada DP. Plug & play, compacto y portátil.",
  "ADAPTADOR HDMI - DISPAYPORT": "Adaptador HDMI a DisplayPort para conectar dispositivos con salida HDMI a monitores con entrada DisplayPort. Compacto y plug & play sin necesidad de drivers adicionales.",
  "ADAPTADOR HDMI A VGA SIN CABLE": "Adaptador compacto HDMI a VGA sin cable, tipo dongle. Convierte señal HDMI digital a VGA analógica para conectar notebooks y PCs modernos a monitores y proyectores VGA. Resolución hasta 1080p.",
  "ADAPTADOR MINIPLUG / TIPO C": "Adaptador Mini Plug 3.5mm a USB Tipo C. Permite conectar auriculares con jack de 3.5mm a celulares y tablets que solo tienen puerto USB-C. Compacto y práctico para uso diario.",
  "ADAPTADOR MINIPLUG / IPHONE": "Adaptador Mini Plug 3.5mm a Lightning para iPhone. Permite usar auriculares estándar con jack de 3.5mm en iPhones sin puerto de auriculares. Esencial para iPhones 7 en adelante.",
  "ADAPTADOR TIPO C A HDMI - USB A": "Adaptador multipuerto USB Tipo C a HDMI + USB A. Conecta tu notebook USB-C a un monitor HDMI y al mismo tiempo usa un puerto USB A para periféricos. Hub compacto 2 en 1.",
  "ADAPTADOR RJ45 A USB 3.0": "Adaptador de red RJ45 Ethernet a USB 3.0. Agrega conexión de red por cable a notebooks y PCs sin puerto Ethernet. Velocidad Gigabit, plug & play. Ideal para conexiones estables y rápidas.",
  "PLACA INAL. USB NOGA UW03": "Adaptador Wi-Fi USB Noga UW03 con antena para mayor alcance. Agrega conectividad inalámbrica a PCs de escritorio o mejora la recepción en notebooks. Plug & play con soporte para redes N/AC.",
  "PLACA DE AUDIO NOGA HE-282": "Placa de sonido USB externa Noga HE-282. Convierte un puerto USB en salida de audio y entrada de micrófono con jack de 3.5mm. Ideal para PCs o notebooks con audio dañado. Plug & play, chip de audio integrado.",

  // ═══════════════════════════════════════════════════════════════════════
  // REDES / ROUTERS / SWITCHES / MESH
  // ═══════════════════════════════════════════════════════════════════════
  "RANGE EXTENDER TP-LINK RE200": "Extensor de alcance Wi-Fi TP-Link RE200 de doble banda AC750. Amplía la cobertura de tu red Wi-Fi eliminando zonas muertas, velocidades de hasta 433Mbps en 5GHz y 300Mbps en 2.4GHz. Puerto Ethernet incluido. Fácil configuración.",
  "ROUTER TP-LINK C50 AC1200 4 ANTENAS": "Router Wi-Fi TP-Link Archer C50 AC1200 de doble banda con 4 antenas externas. Velocidades de hasta 867Mbps en 5GHz y 300Mbps en 2.4GHz. 4 puertos Ethernet, control parental y gestión vía app Tether. Cobertura amplia para hogar.",
  "SWITCH TPLINK GIGABIT 5 PUERTOS": "Switch de red TP-Link Gigabit de 5 puertos (10/100/1000 Mbps). Plug & play sin configuración, carcasa metálica resistente, bajo consumo energético con Green Ethernet. Ideal para ampliar puertos de red en oficina o hogar.",
  "SWITCH 8 BOCAS TPLINK": "Switch de red TP-Link de 8 puertos (10/100 Mbps). Plug & play sin configuración necesaria, diseño compacto de escritorio. Amplía las conexiones de red de tu router de forma simple y económica.",
  "MESH TPLINK DECO S7 (PACK-2)": "Sistema Mesh Wi-Fi TP-Link Deco S7 pack de 2 unidades AC1900. Cobertura Wi-Fi sin zonas muertas en hogares grandes (hasta 320m²), roaming seamless entre nodos, control parental avanzado. Gestión sencilla desde app Deco.",

  // ═══════════════════════════════════════════════════════════════════════
  // STREAMING / TV BOX
  // ═══════════════════════════════════════════════════════════════════════
  "TV BOX HEVC 4K": "TV Box Android con soporte HEVC y resolución 4K. Convierte tu TV en un Smart TV con acceso a YouTube, Netflix, apps de streaming y más. Control remoto incluido, puertos HDMI y USB. Navegación fluida.",
  "TV BOX - ROKU": "Roku Streaming Stick para TV con resolución HD/4K. Acceso a miles de canales y apps de streaming: Netflix, Disney+, HBO Max, YouTube y más. Control remoto con botones directos, interfaz intuitiva. Plug & play HDMI.",
  "CHROME CAST 3": "Google Chromecast 3ra generación. Transmite contenido desde tu celular, tablet o PC a tu TV vía Wi-Fi. Compatible con Netflix, YouTube, Spotify, Disney+ y más. Resolución Full HD 1080p. Compacto y fácil de usar.",
  "TV VOX STICK ONN": "TV Stick ONN de streaming con resolución Full HD. Acceso a apps de streaming populares, interfaz sencilla, control remoto incluido. Conecta directo al puerto HDMI de tu TV. Económico y funcional.",

  // ═══════════════════════════════════════════════════════════════════════
  // PARLANTES BLUETOOTH
  // ═══════════════════════════════════════════════════════════════════════
  "BLUE TOOTH PARLANTE SOUL ZOO": "Parlante Bluetooth portátil Soul Zoo con diseño divertido de animalitos. Sonido claro y potente para su tamaño, batería recargable, conexión Bluetooth. Ideal como regalo o para niños.",
  "BLUE TOOTH PARLANTE TG-117": "Parlante Bluetooth portátil TG-117 con diseño cilíndrico resistente. Resistencia al agua y polvo, sonido potente con buenos graves, batería de larga duración. Conexión Bluetooth y entrada auxiliar/USB/TF.",
  "BLUE TOOTH PARLANTE SOUL KARAOKE": "Parlante Bluetooth Soul Karaoke con micrófono incluido para cantar. Luces LED de colores, sonido potente, entrada auxiliar y Bluetooth. Batería recargable. Diversión garantizada para fiestas y reuniones.",
  "BLUE TOOTH PARLANTE SOUL PARTY": "Parlante Bluetooth Soul Party con potencia elevada y luces LED RGB festivas. Sonido envolvente para fiestas, batería de larga duración, entrada auxiliar, USB y Bluetooth. El alma de cualquier reunión.",

  // ═══════════════════════════════════════════════════════════════════════
  // RECEPTOR BLUETOOTH
  // ═══════════════════════════════════════════════════════════════════════
  "RECEPTOR BLUETOOTH SUONO": "Receptor Bluetooth Suono que convierte cualquier equipo de audio o parlante con entrada auxiliar en inalámbrico. Conexión Bluetooth 5.0, salida de audio 3.5mm, batería recargable USB. Compacto y versátil.",

  // ═══════════════════════════════════════════════════════════════════════
  // NOTEBOOKS / PCs / ALL-IN-ONE
  // ═══════════════════════════════════════════════════════════════════════
  "NOTEBOOK HP RYZEN 5 (7530) 15,6\" - 8GB - 512GB": "Notebook HP con procesador AMD Ryzen 5 7530U, pantalla de 15.6\" Full HD, 8GB de RAM DDR4 y SSD de 512GB. Diseño delgado y liviano, teclado numérico, webcam HD. Windows 11. Rendimiento sólido para estudio, trabajo y entretenimiento.",
  "NOTEBOOK DELL I5 (11) 15,6\" - 8GB - 250GB": "Notebook Dell con procesador Intel Core i5 de 11va generación, pantalla de 15.6\" Full HD, 8GB de RAM y SSD de 250GB. Construcción robusta Dell, teclado retroiluminado. Ideal para productividad y uso profesional.",
  "NOTEBOOK LENOVO RYZEN 7 5825 14\" - 16GB - 512GB": "Notebook Lenovo con procesador AMD Ryzen 7 5825U de 8 núcleos, pantalla de 14\" Full HD, 16GB de RAM DDR4 y SSD de 512GB. Rendimiento premium para multitarea, programación y creación de contenido. Diseño compacto y portátil.",
  "NOTEBOOK CX CEL. (4020) 8 GB 240 GB": "Notebook CX con procesador Intel Celeron N4020, 8GB de RAM y SSD de 240GB. Pantalla HD, diseño liviano y portátil. Ideal para tareas básicas como navegación web, ofimática, clases en línea y entretenimiento multimedia.",
  "PC INTEL CEL. (5109) KELYX- 8 GB - SSD 240 GB": "PC de escritorio Intel Celeron 5109 en gabinete Kelyx con 8GB de RAM y SSD de 240GB. Equipo compacto ideal para oficina, punto de venta, navegación web y ofimática. Bajo consumo y funcionamiento silencioso.",
  "PC RYZEN 7 (5700) GAMEMAX - 16 GB - 512 GB": "PC de escritorio gaming AMD Ryzen 7 5700 en gabinete GameMax con 16GB de RAM y SSD de 512GB. Potencia para gaming, streaming y creación de contenido. Configuración de alta gama lista para jugar.",
  "PC INTEL I5 (10MA) KELYX - 8 GB -  240 GB SSD": "PC de escritorio Intel Core i5 de 10ma generación en gabinete Kelyx con 8GB de RAM y SSD de 240GB. Rendimiento sólido para oficina, multitarea y uso profesional. Arranque rápido y funcionamiento fluido.",
  "SALDO AIO LENOVO 22\"": "All-in-One Lenovo de 22\" (saldo/outlet). Pantalla integrada Full HD, diseño compacto todo en uno sin cables. Ideal para espacios reducidos, oficina y hogar. Consultar especificaciones exactas disponibles en stock.",

  // ═══════════════════════════════════════════════════════════════════════
  // IMPRESORA
  // ═══════════════════════════════════════════════════════════════════════
  "IMPRESORA HP ADVANTAGE MF-2375": "Impresora multifunción HP DeskJet Ink Advantage 2375 con funciones de impresión, escaneo y copia. Conexión USB, velocidad de hasta 7.5 ppm en negro. Diseño compacto ideal para hogar y oficina pequeña. Usa cartuchos HP 667.",

  // ═══════════════════════════════════════════════════════════════════════
  // CÁMARAS WEB
  // ═══════════════════════════════════════════════════════════════════════
  "CAMARA WEB PHILIPS": "Cámara web Philips con resolución HD y micrófono integrado. Clip universal para monitores, corrección automática de luz. Compatible con Zoom, Teams, Google Meet y demás apps de videollamadas. Plug & play USB.",

  // ═══════════════════════════════════════════════════════════════════════
  // GAMEPAD / JOYSTICK / CONSOLA
  // ═══════════════════════════════════════════════════════════════════════
  "GAME PAD NOGA PS3 NG-2131": "Gamepad Noga NG-2131 con cable USB compatible con PS3 y PC. Diseño ergonómico similar al DualShock, vibración dual, sticks analógicos y gatillos. Plug & play para gaming en PC y PlayStation 3.",
  "GAME PAD LOGITECH F310 PC": "Gamepad Logitech F310 con cable USB para PC. Diseño clásico de consola con sticks analógicos, D-pad, 4 botones frontales y gatillos. Compatible con Steam y la mayoría de juegos de PC. Plug & play, robusto y confiable.",
  "GAME PAD LOGITECH F710 PC WIR": "Gamepad inalámbrico Logitech F710 para PC con receptor nano USB 2.4GHz. Diseño ergonómico con vibración dual, sticks analógicos, D-pad y gatillos. Compatible con Steam, modo XInput y DirectInput. La referencia en gamepads para PC.",
  "CONSOLA R400": "Presentador inalámbrico Logitech R400 con puntero láser rojo. Control remoto para presentaciones PowerPoint y Keynote con botones de avance/retroceso de diapositiva. Receptor nano USB, alcance de 15 metros. Ergonómico y profesional.",

  // ═══════════════════════════════════════════════════════════════════════
  // UPS / ESTABILIZADORES
  // ═══════════════════════════════════════════════════════════════════════
  "UPS LYONN 500VA": "UPS (Sistema de Alimentación Ininterrumpida) Lyonn de 500VA. Protege tu PC y periféricos ante cortes de luz, proporcionando minutos de respaldo para guardar tu trabajo. Protección contra sobretensiones y picos. Batería recargable.",
  "ESTABILIZADOR SURELECTRIC 1000 W": "Estabilizador de tensión Surelectric de 1000W. Regula el voltaje de la red eléctrica protegiendo tus equipos electrónicos contra fluctuaciones, sobretensiones y picos. Múltiples tomacorrientes, indicador LED de estado.",
  "ESTABILIZADOR LYONN 1200 W": "Estabilizador de tensión Lyonn de 1200W de alta capacidad. Protección completa contra variaciones de voltaje para PCs, monitores, impresoras y equipos sensibles. Múltiples salidas, corte automático por sobrecarga.",

  // ═══════════════════════════════════════════════════════════════════════
  // COOLERS
  // ═══════════════════════════════════════════════════════════════════════
  "COOLER 12 X 12 RGB COOLER MASTER MOTHER": "Ventilador Cooler Master de 120x120mm con iluminación RGB sincronizable con la motherboard. Conector ARGB de 3 pines, alto flujo de aire silencioso. Ideal para gabinetes gaming con control de iluminación centralizado.",
  "COOLER 80 X 80 LED": "Ventilador de 80x80mm con iluminación LED. Ideal para gabinetes que requieren ventilación adicional en espacios reducidos. Conector Molex o 3-pin. Buena relación entre flujo de aire y nivel de ruido.",
  "COOLER 80 X 80 COMUN": "Ventilador de 80x80mm estándar sin iluminación. Solución básica de ventilación para gabinetes, fuentes o equipos que necesiten refrigeración extra. Conector Molex o 3-pin. Silencioso y económico.",

  // ═══════════════════════════════════════════════════════════════════════
  // BASE NOTEBOOK
  // ═══════════════════════════════════════════════════════════════════════
  "BASE DE NOTEBOOK SOUL XC 100": "Base refrigerante para notebook Soul XC 100 con ventiladores para evitar el sobrecalentamiento. Diseño ergonómico inclinado para mayor comodidad, superficie de malla metálica, alimentación USB. Compatible con notebooks de hasta 17\".",

  // ═══════════════════════════════════════════════════════════════════════
  // HUBS USB
  // ═══════════════════════════════════════════════════════════════════════
  "HUB USB A 7 BOCAS KOLKE": "Hub USB Kolke de 7 puertos USB 2.0. Expande las conexiones USB de tu PC o notebook para conectar múltiples dispositivos simultáneamente. Diseño compacto de escritorio, plug & play. Ideal para teclados, mouse, pen drives.",
  "HUB USB TIPO C A USB 2.0 NETMARK": "Hub USB Tipo C a puertos USB 2.0 Netmark. Convierte un puerto USB-C en múltiples puertos USB-A para conectar periféricos a notebooks modernas. Compacto y portátil, plug & play.",
  "HUB USB 4 BOCAS BARRA TIPO C / USB": "Hub USB de 4 puertos en formato barra con entrada USB-A o Tipo C. Expande las conexiones USB de tu equipo de forma práctica, diseño delgado de escritorio. Plug & play sin drivers.",

  // ═══════════════════════════════════════════════════════════════════════
  // ZAPATILLAS ELÉCTRICAS
  // ═══════════════════════════════════════════════════════════════════════
  "ZAPATILLA 3 BOCAS + 4 USB (B09)": "Zapatilla eléctrica de 3 tomacorrientes con 4 puertos USB para carga directa de dispositivos. Protección contra sobretensión, cable reforzado, interruptor de encendido. Práctica para escritorios y mesas de luz.",
  "ZAPATILLA 4 BOBAS + 2 USB (424U)": "Zapatilla eléctrica de 4 tomacorrientes con 2 puertos USB integrados. Protección contra sobrecarga, interruptor con luz indicadora, cable largo. Ideal para oficina y hogar, carga celulares mientras usás tus equipos.",

  // ═══════════════════════════════════════════════════════════════════════
  // CARGADORES
  // ═══════════════════════════════════════════════════════════════════════
  "CARGADOR SOUL 2.4 A 2 USB MICRO USB": "Cargador de pared Soul de 2.4A con 2 puertos USB y cable Micro USB incluido. Carga rápida para celulares, tablets y dispositivos USB. Diseño compacto con protecciones contra sobrecarga y cortocircuito.",
  "CARGADOR NOTEBOOK TIPO C": "Cargador universal para notebooks con conector USB Tipo C. Compatible con notebooks que cargan vía USB-C (Lenovo, HP, Dell, MacBook y más). Potencia adecuada para carga durante el uso. Consultar wattaje según modelo.",

  // ═══════════════════════════════════════════════════════════════════════
  // ACCESORIOS VARIOS
  // ═══════════════════════════════════════════════════════════════════════
  "TRIPODE CELULAR": "Trípode para celular con soporte ajustable y patas extensibles. Ideal para videollamadas, transmisiones en vivo, fotos grupales y grabación de videos. Cabezal giratorio para orientación horizontal y vertical.",
  "HOLDER MAGNETICO FLAT": "Soporte magnético plano para celular. Se adhiere al tablero del auto o superficies lisas, sostiene el celular con imán potente. Diseño discreto y minimalista. Compatible con todos los celulares (con plaquita metálica).",
  "FUNDA SIGNO NEOPRENE 12\"-13\"": "Funda de neoprene Signo para notebooks y tablets de 12 a 13 pulgadas. Material acolchado que protege contra golpes y rayaduras, cierre con cremallera. Diseño slim para llevar dentro de mochilas o bolsos.",
  "BATERIA NOTEBOOK": "Batería de reemplazo para notebook. Consultar modelo y compatibilidad antes de comprar. Batería de litio con capacidad estándar para restaurar la autonomía de tu laptop. Instalación sencilla.",
  "SMARTWACH BAND MATCH 100": "Smartwatch Band Match 100 con pantalla táctil a color, monitor de frecuencia cardíaca, contador de pasos, notificaciones de celular, control de música y resistencia al agua. Batería de larga duración. Ideal para deporte y uso diario.",
  "LI GRASA SILICONADA JERINGA METAL": "Grasa siliconada térmica en formato jeringa metálica. Pasta térmica para aplicar entre el procesador y el disipador de calor, mejorando la transferencia térmica. Fácil aplicación con jeringa dosificadora.",
  "LI GRASA SILICONADA 3CC": "Grasa siliconada térmica de 3cc en tubo. Pasta conductora de calor para CPU y GPU. Aplicación sencilla para reemplazar la pasta térmica seca y mejorar las temperaturas de tu PC. Cantidad suficiente para varias aplicaciones.",
  "LI ESPUMA DE LIMPIEZA FOAM": "Espuma de limpieza Foam para equipos electrónicos. Limpia pantallas, teclados, gabinetes y superficies plásticas sin dañarlas. Fórmula antiestática que repele el polvo. Aplicación directa con spray.",
};

async function addDescriptions() {
  console.log("🔍 Leyendo todos los productos de Firestore...\n");

  const snapshot = await db.collection("products").get();
  console.log(`📦 Total de productos encontrados: ${snapshot.size}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const missingProducts = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    const currentDesc = data.description;

    // Skip undefined names
    if (!name) {
      console.log(`⏭️  SKIP: doc "${doc.id}" — sin nombre (undefined).`);
      skipped++;
      continue;
    }

    // Skip products that already have a non-empty description
    if (currentDesc && currentDesc.trim().length > 0) {
      console.log(`⏭️  SKIP: "${name}" — ya tiene descripción.`);
      skipped++;
      continue;
    }

    // Look up description in our catalog
    const newDescription = DESCRIPTIONS[name];

    if (!newDescription) {
      console.log(`❓ NOT FOUND: "${name}" — no hay descripción en el catálogo.`);
      missingProducts.push(name);
      notFound++;
      continue;
    }

    // Update the product in Firestore
    try {
      await db.collection("products").doc(doc.id).update({
        description: newDescription,
      });
      console.log(`✅ UPDATED: "${name}"`);
      updated++;
    } catch (error) {
      console.error(`❌ ERROR updating "${name}":`, error.message);
    }
  }

  console.log("\n════════════════════════════════════════");
  console.log("📊 RESUMEN:");
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ⏭️  Ya tenían descripción (o sin nombre): ${skipped}`);
  console.log(`   ❓ Sin match en catálogo: ${notFound}`);
  console.log(`   📦 Total productos: ${snapshot.size}`);
  console.log("════════════════════════════════════════");

  if (missingProducts.length > 0) {
    console.log("\n⚠️  Productos sin descripción en el catálogo:");
    missingProducts.forEach((p) => console.log(`   - "${p}"`));
  }

  process.exit(0);
}

addDescriptions().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
