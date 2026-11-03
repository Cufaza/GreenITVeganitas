# GreenIT Calc

Prototipo web que calcula el consumo de energía, el costo y la huella de carbono de la infraestructura IT de una PyME, y propone medidas de ahorro. Proyecto del Equipo 1 Veganitas (Innovación y Emprendedorismo, Ingeniería Informática). Desafío 2: eficiencia energética y reducción de huella de carbono en infraestructura IT.

Stack: React 18 + Vite + React Router + Recharts. Sin backend: la demo guarda los datos en el navegador. La integración con Supabase está explicada en [SUPABASE.md](SUPABASE.md).

## Probar la demo

- Usuario: `demo@greenitcalc.com`
- Clave: `demo1234`
- O el botón **Entrar con la cuenta de demostración**.

Se carga una empresa ficticia (Estudio Contable Delta) con 12 PCs, 12 monitores, 4 notebooks, 2 servidores y un switch. Los equipos y horarios son inventados; los parámetros de cálculo son reales (ver más abajo).

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
src/lib/         calc.js (motor de cálculo), format.js
src/services/    auth.js e inventory.js (simulados; reemplazables por Supabase)
src/context/     AuthContext, DataContext
src/pages/       Login, Dashboard, Inventory, Plan, Calculations
supabase/        schema.sql, seed_catalog.sql, seed_demo.sql
scripts/         verify-calc.mjs
```
