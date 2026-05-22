# PClink Admin (web)

Panel de administración en **React + Vite + TypeScript**, alineado visualmente con la app Android PClink (cyan `#00BCD4`, fondos oscuros, tipografía DM Sans).

## Requisitos

- Node.js 20+
- Proyecto Firebase con **Authentication** (correo/contraseña y Google), **Firestore** y una app **Web** (variables `VITE_*`).

## Configuración

1. En Firebase Console, agregá una app **Web** y copiá la configuración.
2. En esta carpeta:

   ```bash
   cp .env.example .env
   ```

   Completá las variables `VITE_*` con los valores del snippet de Firebase.

3. En Authentication → **Google**, agregá el dominio local (`localhost`) y el de producción (p. ej. `pclink-f6e0d.web.app`) en dominios autorizados si hace falta.

4. Instalación y desarrollo:

   ```bash
   npm install
   npm run dev
   ```

5. Build estático para **Firebase Hosting**:

   ```bash
   npm run build
   ```

   La salida queda en `dist/`.

## Estructura de rutas

| Ruta              | Contenido                          |
| ----------------- | ----------------------------------- |
| `/login`          | Inicio de sesión                    |
| `/`               | Dashboard / estadísticas (placeholder) |
| `/productos`      | Catálogo (placeholder)              |
| `/importar`       | CSV exportado desde Access → colección `products` |
| `/sliders`        | Banners / home                      |
| `/notificaciones` | Borradores FCM                      |
| `/clientes`       | Clientes recurrentes (muestra)      |

## Importar catálogo (solo CSV → Firestore)

Flujo para el cliente: **Access → exportar tabla como CSV** (primera fila con encabezados) → subir en `/importar` → mapear columnas → escribir en Firestore.

### Qué tenés que configurar en Firebase para que funcione

1. **Firestore activo** en el mismo proyecto que la app Web.

2. **Usuarios que puedan entrar al admin** (correo/contraseña o Google), creados en **Authentication**.

3. **Reglas de Firestore** que permitan a esos usuarios **crear y actualizar** documentos en `products` (el cliente SDK hace `set` con merge). Ejemplo **solo para pruebas** (cualquier usuario logueado puede escribir productos):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{productId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   En producción conviene restringir con una colección `admins/{uid}` o **custom claims** (`request.auth.token.admin == true`).

4. Creá **al menos un documento manual** en `products` o probá un CSV chico: si las reglas deniegan escritura, el panel mostrará error de permisos.

**Cloud Storage** no hace falta para este flujo.
