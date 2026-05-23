# Design System: PC Link (White Theme Redesign)

## 1. Visual Theme & Atmosphere
A restrained, gallery-airy interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is clinical, clean, and highly legible — like a well-lit premium tech boutique. Density is balanced (5), variance is slightly offset (6), and motion is fluid (6).

## 2. Color Palette & Roles
- **Canvas White** (`#F9FAFB`) — Primary background surface for the app
- **Pure Surface** (`#FFFFFF`) — Card and container fill, overlapping layers
- **Charcoal Ink** (`#18181B`) — Primary text, deep Zinc-950 depth for extreme contrast
- **Muted Steel** (`#71717A`) — Secondary text, descriptions, metadata
- **Whisper Border** (`rgba(226,232,240,0.6)`) — Card borders, 1px structural lines
- **Electric Cyan** (`#06B6D4`) — Single accent for primary CTAs, active states, focus rings. Saturation kept controlled. No neon glow.

## 3. Typography Rules
- **Display:** `Geist Sans` — Track-tight, controlled scale, weight-driven hierarchy.
- **Body:** `Geist Sans` — Relaxed leading, 65ch max-width, neutral secondary color.
- **Mono:** `Geist Mono` — For code, specs, metadata, timestamps, high-density numbers.
- **Banned:** `Inter`, generic system fonts, pure black text. No serif fonts in this tech context.

## 4. Component Stylings
- **Buttons:** Flat, no outer glow. Tactile -1px translate on active state. Accent fill for primary, ghost/outline with whisper borders for secondary.
- **Cards:** Generously rounded corners (`1.5rem` to `2rem`). Diffused whisper shadow only on hover. Flat by default to maintain the clinical aesthetic.
- **Inputs:** Label above, error below. Focus ring in accent color. No floating labels.
- **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
- **Empty States:** Composed, illustrated compositions — not just "No data" text.

## 5. Layout Principles
Grid-first responsive architecture. Asymmetric splits for Hero sections instead of generic centered text. Strict single-column collapse below 768px. Max-width containment (1400px). No flexbox percentage math. Generous internal padding between sections (`clamp(4rem, 8vw, 8rem)`). No overlapping text or unreadable contrasts.

## 6. Motion & Interaction
Spring physics for all interactive elements (Cards, Buttons). Staggered cascade reveals for product grids. Perpetual micro-loops for active states (like 'Sin Stock' or 'Oferta' badges). Hardware-accelerated transforms only (`transform` and `opacity`).

## 7. Anti-Patterns (Banned)
- No emojis anywhere
- No `Inter` font or generic serifs
- No pure black (`#000000`)
- No neon/outer glow shadows or AI Purple/Blue Neon gradients
- No 3-column equal grids for features; use asymmetric or masonry
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down"
- No overlapping elements — clean spatial separation always
- No centered Hero sections; must use split screen or asymmetric whitespace
