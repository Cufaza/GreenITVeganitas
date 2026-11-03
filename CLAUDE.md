# GreenIT Calc

Calculadora de consumo, costo y huella de carbono de la infraestructura IT de una PyME.
La lógica de cálculo vive en `src/lib/calc.js` y se verifica con `npm run verify`: cualquier
cambio de UI debe dejar esa verificación igual.

## Diseño / UI — Sumar UI Kit sobre un repo existente

La estética canónica es el **Sumar UI Kit** (`./DESIGN.md`). Este repo **ya tiene stack propio**:
el kit manda en *cómo se ve y se compone*; los primitivos y tokens concretos son los de este repo.

**Antes de tocar UI:** leé la sección **R** de `DESIGN.md` (no el archivo entero) y después la
sección puntual de la tarea (ruteo al inicio del doc). Para charts / dashboards, **10.0** es obligatorio.

**Inventario:** Vite 5 + React 18 (JSX, sin TypeScript) + React Router 6 · Tailwind 3 con config
(`tailwind.config.js`, `tailwindcss-animate`) · componentes propios en `src/components/ui/` (sin shadcn) ·
tokens en `src/styles.css` · fuente Inter ✅ (Google Fonts en `index.html`) · íconos lucide · charts recharts 2 ·
marca `#2E7D32` en `--brand` (`src/styles.css`) y `BRAND` (`src/components/dashboard/shared.jsx`).

**Equivalencias (kit → este repo):**
| Kit | Acá |
|---|---|
| `cn()` (2) | `cn` en `src/components/ui/UIComponents.jsx` |
| `useModalAnimation` (2) | `useModalAnimation` en `UIComponents.jsx` |
| `backdropClose` (2) | `src/components/ui/backdropClose.js` |
| `bg-brand` (1.5) | `bg-brand` vía `--brand` en `src/styles.css` (HSL `123 46% 33%`) |
| Button / Input / Card / Badge / Table (3) | `UIComponents.jsx` (Button suma la variante `brand`) |
| Label canónico (3.3) | `Label` / `Field` en `UIComponents.jsx` |
| Select (3.9) | `src/components/ui/Select.jsx` (portal `position: fixed`, `z-[90]`) |
| Loader (3.12) | `src/components/ui/Loader.jsx` (ícono `Leaf`) |
| Modal de formulario (4.1) | estructura de `src/components/ItemForm.jsx` |
| ConfirmModal (4.2) | `src/components/ConfirmModal.jsx` |
| Header de página (4.4) | `PageHeader` en `UIComponents.jsx` |
| SectionTitle (4.6) | `SectionTitle` en `UIComponents.jsx` |
| KpiCard (4.6) | `src/components/KpiCard.jsx` |
| Empty state (9.3) | `EmptyState` en `UIComponents.jsx` |
| Tokens de chart / TooltipShell / TipRow (4.6, 10.0.4) | `src/components/dashboard/shared.jsx` |
| Toast (3.13), TooltipHost (3.14), Combobox (3.16), DatePicker (3.18) | no existen todavía: si hacen falta, se crean con el nombre del kit |

**Paleta de datos:** `SERIES = ['#2E7D32', '#2563eb']`, validada con el script de la skill `dataviz`
(light, superficie `#ffffff`: ALL PASS). Si se agrega una serie, se vuelve a correr el validador antes de usarla.
`DEEMPHASIS` (`#cbd5e1`) queda por debajo de 3:1 a propósito, así que siempre va con labels de valor directos.

**Excepciones aceptadas a la auditoría R.4:**
- `bg-black/60` en los backdrops de modal y drawer.
- `text-white`, `bg-white/*` y `bg-black/*` sobre `bg-brand` en el panel de marca del Login.
- Hex en `src/components/dashboard/shared.jsx` y en props de recharts (tokens de data-viz).
- `type="number"` para cantidades, horas, potencias (W), tarifa ($/kWh, 3 decimales), factor de emisión y PUE.
  No son montos en pesos con 2 decimales, así que `MoneyInput` no aplica.
- `bg-blue-50 / border-blue-200 / text-blue-700` en los banners informativos (azul = info, sección 1.4).
- `shadow-lg` en el tooltip de los charts y en el botón de submit del Login (secciones 4.6 y 12.1).

**Reglas fijas:** tokens semánticos siempre (nada de `bg-white` / `text-gray-*` / hex fuera de las excepciones);
un solo set de íconos (lucide); modales con la estructura de 4.1; estados loading / empty / error en toda lista;
reglas de oro (15). Una vista se da por terminada solo con la checklist **R.6** completa.

## Landing pública (fuera del kit)

`src/landing/` queda **intencionalmente fuera del Sumar UI Kit** por decisión del usuario (2026-11-03): imita la landing del estudio (sumar-web) con paleta oscura de GreenIT, `motion`, `lenis` y `cobe`. La auditoría R.4 no aplica ahí. El CSS vive en `src/landing/landing.css` bajo `.landing` y la ruta se carga con `React.lazy`, así que nada se filtra a la app. Los números se calculan en runtime desde `demoData()`.
El asistente **Watti** (`src/components/watti/`) sí vive dentro de la app y sigue el kit. Excepción R.4 nueva: `shadow-lg` en el botón flotante de Watti.
