# Integrar GreenIT Calc con Supabase

La demo actual guarda todo en `localStorage` (login simulado y datos mockeados). Este documento explica cómo pasar a Supabase sin tocar las pantallas ni el motor de cálculo: solo se reemplazan los dos servicios de `src/services/`.

## 1. Crear el proyecto y la base

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutar en este orden:
   1. `supabase/schema.sql`: tablas, trigger de registro, políticas RLS y funciones de demo.
   2. `supabase/seed_catalog.sql`: catálogo de equipos y potencias.
   3. (Opcional) `supabase/seed_demo.sql`: carga la empresa de demo en un usuario existente.
3. Para tener la cuenta de demo: **Authentication > Users > Add user**, email `demo@greenitcalc.com`, una contraseña, con "Auto Confirm User". Luego ejecutar `seed_demo.sql`.

## 2. Modelo de datos

| Tabla | Para qué sirve |
|---|---|
| `equipment_catalog` | Potencias de referencia por tipo de equipo. Lectura pública. |
| `organizations` | La PyME: tarifa, factor de emisión, PUE. Una por cuenta. |
| `profiles` | Une `auth.users` con su organización. |
| `inventory_items` | Equipos cargados (cantidad, horas, carga, potencias propias opcionales). |

Al registrarse un usuario, el trigger `handle_new_user` crea su organización y su perfil. Para pasar el nombre de la empresa, enviarlo en `options.data.empresa` del `signUp`.

Seguridad (RLS): cada usuario solo ve y modifica su organización y los equipos de esa organización. El catálogo es de solo lectura. Los perfiles no se pueden modificar desde el cliente, para que nadie cambie de organización. `cargar_demo()` solo reemplaza el inventario de la organización del usuario que la llama.

## 3. Variables de entorno

Copiar `.env.example` a `.env` y completar con los datos de **Project Settings > API**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

En Vercel, cargar las mismas dos variables en **Settings > Environment Variables**. La clave `anon` es pública por diseño; la seguridad la dan las políticas RLS. Nunca poner la clave `service_role` en el front.

## 4. Reemplazo de los servicios

Instalar el cliente: `npm i @supabase/supabase-js`.

`src/services/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
```

`src/services/auth.js` (misma interfaz que el actual: `getSession`, `login`, `loginDemo`, `register`, `logout`):

```js
import { supabase } from './supabase.js';

const toUser = (u) => u && { id: u.id, email: u.email, empresa: u.user_metadata?.empresa ?? '', demo: u.email === 'demo@greenitcalc.com' };

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return toUser(data.session?.user);
}
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email o contraseña incorrectos.');
  return toUser(data.user);
}
export const loginDemo = () => login('demo@greenitcalc.com', import.meta.env.VITE_DEMO_PASSWORD);
export async function register(email, password, empresa) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { empresa } } });
  if (error) throw new Error(error.message);
  return toUser(data.user);
}
export const logout = () => supabase.auth.signOut();
```

(Si se activa la confirmación por email en Supabase, `signUp` no devuelve sesión hasta que el usuario confirme.)

`src/services/inventory.js` (misma interfaz: `loadData`, `saveData`, `resetDemo`, `clearData`). Convierte entre `camelCase` de la app y `snake_case` de la base:

```js
import { supabase } from './supabase.js';

const toItem = (r) => ({
  id: r.id, catalogId: r.catalog_id, nombre: r.nombre, cantidad: r.cantidad, ubicacion: r.ubicacion,
  horasUso: Number(r.horas_uso), horasReposo: Number(r.horas_reposo), cargaPct: Number(r.carga_pct),
  ...(r.potencia_uso_w != null && { potenciaUsoW: Number(r.potencia_uso_w) }),
  ...(r.potencia_reposo_w != null && { potenciaReposoW: Number(r.potencia_reposo_w) }),
  ...(r.potencia_apagado_w != null && { potenciaApagadoW: Number(r.potencia_apagado_w) }),
  ...(r.potencia_max_w != null && { potenciaMaxW: Number(r.potencia_max_w) }),
});
const toRow = (i, orgId) => ({
  org_id: orgId, catalog_id: i.catalogId, nombre: i.nombre, cantidad: i.cantidad, ubicacion: i.ubicacion,
  horas_uso: i.horasUso, horas_reposo: i.horasReposo, carga_pct: i.cargaPct ?? 100,
  potencia_uso_w: i.potenciaUsoW ?? null, potencia_reposo_w: i.potenciaReposoW ?? null,
  potencia_apagado_w: i.potenciaApagadoW ?? null, potencia_max_w: i.potenciaMaxW ?? null,
});
const toSettings = (o) => ({
  empresa: o.nombre, tarifaTramo: o.tarifa_tramo, tarifaARS: Number(o.tarifa_ars),
  factorEmision: Number(o.factor_emision), factorAnio: o.factor_anio, tipoSala: o.tipo_sala, pue: Number(o.pue),
});

export async function loadData() {
  const { data: org, error } = await supabase.from('organizations').select('*').single(); // RLS: solo la propia
  if (error) throw error;
  const { data: rows } = await supabase.from('inventory_items').select('*').order('created_at');
  return { settings: toSettings(org), items: (rows ?? []).map(toItem), orgId: org.id };
}

export async function resetDemo() { await supabase.rpc('cargar_demo'); return loadData(); }
```

Punto a resolver: hoy `DataContext` guarda el estado completo en cada cambio (`saveData`). Con Supabase conviene que `addItem`, `updateItem`, `removeItem` y `updateSettings` hagan `insert`, `update`, `delete` sobre la fila correspondiente (`from('inventory_items').insert(toRow(item, orgId))`, etc.) y luego actualicen el estado local. Es el único cambio de lógica; `calc.js` no cambia.

## 5. Más adelante

- Guardar reportes: una tabla `reports` (org_id, fecha, totales en `jsonb`) para ver la evolución mes a mes.
- Facturas reales: tabla `bills` (org_id, periodo, kWh, importe) para comparar lo estimado contra lo facturado.
- Roles: tabla `memberships` si una organización necesita varios usuarios (hoy es 1 usuario = 1 organización).
