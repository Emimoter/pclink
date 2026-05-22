# PClink — App Android nativa de e-commerce de tecnología

App Android moderna escrita 100% en **Kotlin + Jetpack Compose + Material 3** para PClink: una tienda de productos de computación y componentes de PC inspirada en la experiencia de Amazon, AliExpress, MercadoLibre y Newegg.

> **Estado**: proyecto totalmente funcional con datos simulados, listo para ser conectado a un backend real (Firebase, Supabase, Node.js o Spring Boot) sin reescribir la UI ni la arquitectura.

---

## ✨ Características principales

### Comercio
- **Home** con carrusel auto-rotativo de banners, accesos rápidos a categorías, ofertas flash, productos destacados, más vendidos, nuevos ingresos y recomendaciones personalizadas.
- **17 categorías** (GPUs, CPUs, motherboards, RAM, gabinetes, fuentes, monitores, mouse, teclados, auriculares, impresoras, cables, almacenamiento, refrigeración, notebooks, gaming, redes).
- **Catálogo** rico con 35+ productos reales (NVIDIA RTX 40, AMD Ryzen 7000, Samsung 990 Pro, Logitech G Pro, etc.) con galerías, especificaciones, reviews y stock.
- **Buscador inteligente** con resultados en tiempo real (debounce de 220 ms), historial de búsquedas persistente en Room, sugerencias automáticas y tendencias.
- **Filtros avanzados**: precio mín/máx, marca, rating, socket (CPU/MOBO), envío gratis, solo ofertas, solo en stock.
- **Ordenamientos**: relevancia, más vendidos, menor/mayor precio, mejor valorados, más recientes.
- **Carrito persistente** (Room) con cupones (PCLINK10, GAMER15, PRO20), envío gratis sobre $80.000, modificación de cantidades y resumen.
- **Checkout multi-paso**: dirección, método de envío (Estándar / Express / Pickup), método de pago (Mercado Pago, Visa/Mastercard, Stripe, PayPal, Transferencia), resumen y confirmación animada.
- **Wishlist / Favoritos** persistente, **historial de pedidos**, **direcciones**, **métodos de pago**, **notificaciones** y **configuración** (modo oscuro, push, idioma, privacidad).

### Premium extras
- **PC Builder** con 8 slots (CPU, MOBO, RAM, GPU, Storage, PSU, Case, Cooling), validación de **compatibilidad de socket** y compra del build completo en un click.
- **Comparador** lado a lado de hasta 4 productos con scroll horizontal y picker en bottom sheet.

### UX y branding
- Identidad visual **PClink**: cyan eléctrico (`#00BCD4`) sobre negros profundos y blancos limpios.
- **Material 3** con tema custom (colores, tipografía, shapes).
- **Animaciones suaves**: pager auto-rotativo, fade transitions, scale animations, pulsing checkmark al confirmar pedido, slide del bottom bar.
- **Shimmer loading** en home, listados de categoría y filas de productos.
- **Edge-to-edge** + status bar transparente + insets respetados.
- **Splash screen** nativo (`androidx.splashscreen`).
- Diseño **mobile-first** y responsive a distintos tamaños de pantalla.

---

## 🏗️ Arquitectura

```
app/
└── com.pclink.app/
    ├── MainActivity.kt                 // Entry point + Hilt + Splash
    ├── PClinkApp.kt                    // Application class (HiltAndroidApp)
    ├── di/                             // Hilt modules
    │   └── DatabaseModule.kt
    ├── domain/                         // Domain layer (modelos puros, sin Android deps)
    │   └── model/
    │       ├── Product.kt
    │       ├── Category.kt
    │       ├── Cart.kt
    │       ├── User.kt
    │       ├── Order.kt
    │       ├── Banner.kt
    │       └── Filters.kt
    ├── data/                           // Data layer
    │   ├── local/                      // Room DB
    │   │   ├── PClinkDatabase.kt
    │   │   ├── dao/                    // FavoriteDao, CartDao, SearchHistoryDao
    │   │   └── entity/
    │   ├── repository/                 // Repositorios (single source of truth)
    │   │   ├── ProductRepository.kt
    │   │   ├── CartRepository.kt
    │   │   ├── FavoritesRepository.kt
    │   │   ├── SearchHistoryRepository.kt
    │   │   ├── UserRepository.kt
    │   │   └── OrderRepository.kt
    │   └── mock/MockCatalog.kt         // Catálogo simulado de 35+ productos
    └── ui/                             // Presentation layer (Compose)
        ├── theme/                      // Color, Type, Shape, Theme (Material 3)
        ├── components/                 // Componentes reutilizables (ProductCard, Shimmer, FiltersSheet, TopBar, Logo)
        ├── navigation/                 // NavGraph, BottomBar, Routes
        ├── screens/                    // Una carpeta por feature
        │   ├── home/
        │   ├── categories/
        │   ├── categoryproducts/
        │   ├── search/
        │   ├── product/
        │   ├── cart/
        │   ├── checkout/
        │   ├── wishlist/
        │   ├── profile/
        │   ├── auth/
        │   ├── extras/                 // PC Builder + Comparator
        │   └── misc/                   // Orders, Addresses, Payments, Notifications, Settings
        ├── util/Format.kt              // Helpers de moneda, ratings, cuotas
        ├── PClinkAppRoot.kt            // Scaffold (TopBar + BottomBar)
        └── AppShellViewModel.kt
```

### Patrones aplicados
- **MVVM** con `@HiltViewModel` + `StateFlow`.
- **Repository pattern** + **Clean Architecture** (capas domain → data → ui).
- **Dependency Injection** con **Hilt**.
- **Single source of truth** para favoritos, carrito y sesión.
- **Coroutines + Flow** en toda la cadena (suspend funcs en repos, `stateIn(...)` en VMs).
- **Navigation Compose** con type-safe args.

---

## 🛠️ Stack tecnológico

| Categoría     | Librerías                                                                   |
|---------------|------------------------------------------------------------------------------|
| Lenguaje      | Kotlin 2.0.20                                                                |
| UI            | Jetpack Compose (BOM 2024.09.03), Material 3                                 |
| Arquitectura  | Hilt 2.51.1, Navigation Compose 2.8.2                                        |
| Persistencia  | Room 2.6.1, DataStore Preferences 1.1.1                                      |
| Async         | Kotlin Coroutines 1.9.0, Flow                                                |
| Imágenes      | Coil 2.7.0                                                                   |
| Serialización | kotlinx.serialization 1.7.3                                                  |
| Min/Target SDK| 24 / 34                                                                      |

---

## 🚀 Cómo correr

### Requisitos
- **Android Studio Koala (2024.1.1)** o superior.
- **JDK 17**.
- **Android SDK 34**.

### Pasos
1. Abrí la carpeta `Pclink App/` en Android Studio.
2. Esperá a que termine el sync (o ejecutá `./gradlew sync` si tenés Gradle 8.7+ instalado).
3. Ejecutá la configuración **app** en un emulador o dispositivo físico (Android 7.0+).

### Cómo construir desde CLI
```bash
./gradlew assembleDebug          # APK debug en app/build/outputs/apk/debug
./gradlew installDebug           # Instala en el dispositivo conectado
```

> Nota: este proyecto incluye `gradle-wrapper.properties` apuntando a Gradle 8.7. La primera vez que abras el proyecto en Android Studio, se descargará automáticamente el wrapper.

---

## 🔌 Integración con un backend real

La capa de datos está totalmente desacoplada de la UI. Para conectar a un backend real:

1. Crear un nuevo `ProductRemoteDataSource` (Retrofit / Firebase / Supabase).
2. Reemplazar el cuerpo de los métodos de `ProductRepository.kt` para que consuman el data source remoto en vez del `MockCatalog`.
3. Idem para `OrderRepository`, `UserRepository`, etc.
4. La UI **no requiere ningún cambio**: todos los `ViewModels` y `Composables` siguen funcionando porque dependen solo de los repositorios.

Compatible nativamente con:
- **Firebase** (Auth, Firestore, Cloud Messaging, Storage)
- **Supabase**
- **Node.js / Express** (Retrofit + Moshi/kotlinx.serialization)
- **Spring Boot**
- **MercadoPago / Stripe / PayPal SDKs**

---

## 🎨 Branding

| Elemento              | Color                |
|-----------------------|----------------------|
| Cyan PClink           | `#00BCD4`            |
| Cyan profundo         | `#0097A7`            |
| Negro PClink          | `#0A0F14`            |
| Blanco                | `#FFFFFF`            |
| Gris superficie       | `#F7F8FA`            |
| Verde precio          | `#1AA86B`            |
| Rojo oferta           | `#E03131`            |

Logo: la “P” cyan sobre negro y el wordmark `PClink` (en `res/drawable/ic_pclink_logo.xml` y `ic_pclink_wordmark.xml`).

---

## 📋 Roadmap de evolución (preparado pero no implementado en esta primera versión)

- [ ] Backend real con Firebase (Auth + Firestore + FCM).
- [ ] Pagos productivos con MercadoPago Checkout Pro.
- [ ] Notificaciones push reales con FCM.
- [ ] Panel administrativo (CRUD de productos, gestión de stock, pedidos, usuarios y promos).
- [ ] Tests unitarios y de UI (JUnit + Compose UI Test).
- [ ] CI/CD con GitHub Actions.
- [ ] Tracking analítico (Firebase Analytics o Mixpanel).

---

## 📝 Licencia

Proyecto desarrollado a medida para **PClink**. Todos los derechos reservados.
