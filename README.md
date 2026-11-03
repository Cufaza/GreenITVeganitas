# GreenIT Calc

Prototipo web que calcula el consumo de energía, el costo y la huella de carbono de la infraestructura IT de una PyME, y propone medidas de ahorro. Proyecto del Equipo 1 Veganitas (Innovación y Emprendedorismo, Ingeniería Informática). Desafío 2: eficiencia energética y reducción de huella de carbono en infraestructura IT.

Stack: React 18 + Vite + React Router + Recharts. La landing pública suma `motion`, `lenis` y `cobe` (solo se cargan en `/`). Sin backend: la demo guarda los datos en el navegador. La integración con Supabase está explicada en [SUPABASE.md](SUPABASE.md).

## Probar la demo

- Usuario: `demo@greenitcalc.com`
- Clave: `demo1234`
- O el botón **Entrar con la cuenta de demostración**.

Se carga una empresa ficticia (Estudio Contable Delta) con 12 PCs, 12 monitores, 4 notebooks, 2 servidores y un switch. Los equipos y horarios son inventados; los parámetros de cálculo son reales (ver más abajo).

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Landing pública (carga diferida). Si ya hay sesión, los botones dicen "Ir al panel" |
| `/login` | Ingresar, crear cuenta o entrar con la demo. Después va a `/panel` |
| `/panel` | Panel de consumo, costo y huella |
| `/inventario` | Equipos y parámetros de cálculo |
| `/plan` | Plan de ahorro, CSV y PDF |
| `/calculos` | Fórmulas, fuentes y cuenta paso a paso |

Sin sesión, las rutas de la app redirigen a `/login`. Cualquier otra ruta vuelve a `/`.

La landing vive aislada en `src/landing/` (CSS propio bajo la clase `.landing`). Es un port de la landing del estudio (sumar-web) con una paleta oscura de GreenIT y queda fuera del Sumar UI Kit por decisión del equipo. Todos los números que muestra se calculan en runtime con el caso de demostración.

## Watti, el asistente de energía

Botón flotante en todas las pantallas de la app (`src/components/watti/WattiWidget.jsx`). Responde con **respuestas predefinidas calculadas con tus datos: no usa IA ni red**. Si escribís algo, busca palabras clave (sin acentos ni mayúsculas) y, si no entiende, vuelve a mostrar las preguntas sugeridas.

Las 10 preguntas:

1. ¿Cuánto consumo por mes en total?
2. ¿Qué equipos consumen más?
3. ¿Cuánto pago por año de energía de mi infraestructura IT?
4. ¿Cuánto gasto por dejar las PCs prendidas fuera de horario?
5. ¿Conviene dar de baja el servidor casi sin uso?
6. ¿Qué ahorro logro aplicando todo el plan?
7. ¿Cuál es la medida que más ahorra?
8. ¿Cuánto representa la refrigeración de la sala de servidores?
9. ¿Cómo se calcula la huella de carbono?
10. ¿Qué datos usa la herramienta y de dónde salen?

El motor es `src/lib/watti.js` (JS puro, sin React): `PREGUNTAS`, `interpretar(texto)` y `responder(id, { items, settings })`, que devuelve `{ parrafos, lista?, accion?, datos }` con los números crudos en `datos`. `npm run verify` lo chequea contra el caso de demostración.

**Cómo conectar un modelo real más adelante** (no está implementado): una función serverless de Vercel en `/api/watti` que reciba `{ message, conversationId }` y devuelva `{ reply, conversationId }`. `responder` queda como respaldo determinístico y como herramienta que el modelo puede invocar para obtener los números del usuario sin inventarlos.

## SEO y redes

`index.html` trae título, descripción, `theme-color`, Open Graph, Twitter Card y JSON-LD `WebApplication`. La imagen social es `public/og-image.png` (1200×630) y hay un `public/robots.txt`. Es una SPA, así que estos metadatos son globales. **Faltan `canonical`, `sitemap.xml` y las URLs absolutas de `og:image`: dependen del dominio final.**

## Correr en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # verifica el motor de cálculo contra cuentas hechas a mano
npm run build      # genera dist/
```

Requiere Node 18 o superior.

## Subir a GitHub y desplegar en Vercel

```bash
git init
git add .
git commit -m "GreenIT Calc"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/greenit-calc.git
git push -u origin main
```

1. Entrar a [vercel.com](https://vercel.com) con GitHub y elegir **Add New > Project**.
2. Importar el repositorio. Vercel detecta Vite solo; `vercel.json` ya tiene el build y la redirección para las rutas de React Router.
3. **Deploy**. No hacen falta variables de entorno para la demo.

## Cómo calcula

La pantalla **Cálculos** muestra todo en la app: parámetros con su fuente, fórmulas, la cuenta paso a paso de cada equipo, totales, método de ahorro, catálogo y supuestos. Resumen:

```
kWh semana (IT) = cantidad × (P_uso × h_uso + P_reposo × h_reposo + P_apagado × h_apagado) ÷ 1000
kWh mes (IT)    = kWh semana × 52 ÷ 12
refrigeración   = kWh mes (IT) × (PUE − 1)       solo en sala de servidores
costo mes       = kWh mes total × tarifa
CO₂ mes         = kWh mes total × factor de emisión
```

Datos reales usados:

| Dato | Valor | Fuente |
|---|---|---|
| Factor de emisión | 0,283 kg CO₂/kWh (2022) | Subsecretaría de Ambiente de la Nación, SNIGEI-AR 2025, Tabla 5 |
| Tarifa Edenor T1-G | $192,109 / 214,170 / 216,572 por kWh según tramo (abril 2026) | Cuadro tarifario ENRE |
| PUE | 2,0 armario, 2,5 sala, 1,7 mejorado | LBNL 2016, US Data Center Energy Usage Report |
| Servidores | máx. 118 W (1 socket) y 365 W (2+), reposo ≈ 44% del máximo | LBNL 2016 |
| PCs, monitores, notebooks | rangos medidos en estudios de Kawamoto, Roberson y Bluejay | DSSW, Review of Computer Energy Consumption |
| Switch 24 puertos | 14,5 W reposo, 15,9 W promedio | Hoja de datos Cisco C1000-24T-4G-L |

## Límites a tener presentes

- Las potencias del catálogo son valores de referencia. Los estudios de PCs y monitores son de 2000 a 2006; para precisión real hay que cargar la potencia de cada equipo.
- El costo es solo el cargo variable de energía, sin cargo fijo ni impuestos. El tramo de tarifa depende del consumo total del local.
- No hay una fuente verificada de consumo del aire acondicionado: se estima con el PUE.
- El login es simulado (localStorage) y no es seguro. Para producción, usar Supabase Auth.

## Estructura

```
src/data/        constantes con fuentes, catálogo de equipos, datos de demo
src/lib/         calc.js (motor de cálculo), watti.js (respuestas del asistente), format.js
src/services/    auth.js e inventory.js (simulados; reemplazables por Supabase)
src/context/     AuthContext, DataContext
src/pages/       Login, Dashboard, Inventory, Plan, Calculations
src/landing/     landing pública (componentes + styles/*.css, aislada de la app)
src/components/watti/  widget del asistente Watti
supabase/        schema.sql, seed_catalog.sql, seed_demo.sql
scripts/         verify-calc.mjs
```
