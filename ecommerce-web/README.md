# PClink Web — E-Commerce de Hardware & Tecnología

![PClink Web Header](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=for-the-badge&logo=framer)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-764ABC?style=for-the-badge)

> Plataforma e-commerce web moderna para componentes de PC y hardware de alta gama. Diseñada bajo un **Design System limpio ("White Theme Redesign")**, enfocado en legibilidad, microinteracciones fluidas y rendimiento óptimo.

---

## 💻 PClink Ecosystem

Este repositorio forma parte del ecosistema **PClink**:
- 🌐 **PClink Web:** E-Commerce web construido con Next.js 16 App Router + Tailwind v4 + Framer Motion.
- 📱 **PClink Android:** App móvil nativa construida con Kotlin + Jetpack Compose + Material 3 + Room.

---

## ✨ Características Principales

- **Catálogo Inteligente & Filtros:** Exploración de componentes por categorías (GPUs, CPUs, RAM, Almacenamiento, etc.) con filtrado dinámico por specs, marcas y rango de precios.
- **Carrito & Checkout:** Gestión de estado global de compras optimizada mediante Zustand, persistencia y cálculo automático de montos.
- **PC Builder:** Herramienta interactiva para armar computadoras personalizadas con comprobación de compatibilidad de componentes.
- **Design System Custom (White Theme):**
  - Paleta equilibrada en tonos zinc/steel con acento Cyan Eléctrico (`#06B6D4`).
  - Animaciones y transiciones suaves con física de resortes (*Spring Physics*) mediante Framer Motion.
  - Tipografía optimizada con `Geist Sans` y `Geist Mono`.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework Web** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Estilos & UI** | Tailwind CSS v4 + Lucide Icons |
| **Animaciones** | Framer Motion 12 |
| **Estado Global** | Zustand |
| **Backend / DB** | Firebase / Firestore |

---

## 🚀 Instalación y Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Emimoter/Pclink-App.git
   cd Pclink-App/ecommerce-web
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📂 Estructura del Proyecto

```
ecommerce-web/
├── src/
│   ├── app/                # Rutas y páginas de Next.js (App Router)
│   ├── components/         # Componentes UI reutilizables y secciones
│   ├── lib/                # Utilidades, configuración de Firebase y helpers
│   └── store/              # Estado global (Zustand)
├── public/                 # Assets estáticos e imágenes
├── DESIGN.md               # Especificación completa del Design System
└── package.json            # Dependencias y scripts
```
