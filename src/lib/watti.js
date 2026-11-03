// Watti, "tu asistente de energía". Motor de respuestas determinístico: sin IA, sin red, sin React.
// Cada respuesta se calcula con calc.js sobre los equipos y parámetros del usuario.
//
// Cómo conectar un modelo real más adelante (NO está implementado):
//   - Una función serverless de Vercel (`/api/watti`) recibe `{ message, conversationId }` y devuelve
//     `{ reply, conversationId }` (el mismo contrato que usa el estudio en su asistente).
//   - `responder(id, { items, settings })` queda como fallback determinístico y como "herramienta" que el
//     modelo puede invocar para obtener los números del usuario sin inventarlos.
//   - `datos` expone los números crudos de cada respuesta para pasárselos al modelo o para tests.

import { RECOMENDACIONES, calcTotales, categoriaDe, escenarioCombinado, evaluarRecomendaciones, num } from './calc.js';
import { FACTOR_EMISION, PUE, TARIFA_EDENOR_T1G } from '../data/constants.js';
import { fmt, fmtARS, fmtKg, fmtKwh, fmtPct } from './format.js';

export const SALUDO = 'Hola, soy Watti. Te cuento cuánto consume y cuánto cuesta tu infraestructura IT. ¿Qué querés saber?';
export const FUERA_DE_ALCANCE =
  'En esta versión de demostración solo entiendo las preguntas sugeridas. Elegí una de la lista y te respondo con tus números.';
export const AVISO = 'Asistente de demostración: respuestas predefinidas calculadas con tus datos. Sin IA real.';

export const PREGUNTAS = [
  { id: 'consumo-total', texto: '¿Cuánto consumo por mes en total?', claves: ['consumo', 'total', 'por mes', 'mensual', 'kwh', 'costo', 'gasto', 'cuanto pago por mes', 'cuanto gasto por mes', 'cuanto cuesta por mes'] },
  { id: 'equipos-top', texto: '¿Qué equipos consumen más?', claves: ['equipos', 'consumen mas', 'mas consume', 'quien consume', 'ranking'] },
  { id: 'costo-anual', texto: '¿Cuánto pago por año de energía de mi infraestructura IT?', claves: ['por ano', 'al ano', 'anual', 'costo anual', 'gasto anual', 'gasto al ano', 'cuanto pago por ano', 'cuanto gasto por ano'] },
  { id: 'pcs-fuera-horario', texto: '¿Cuánto gasto por dejar las PCs prendidas fuera de horario?', claves: ['pcs', 'pc', 'prendidas', 'fuera de horario', 'fuera del horario', 'noche', 'fin de semana', 'monitores'] },
  { id: 'servidor-ocioso', texto: '¿Conviene dar de baja el servidor casi sin uso?', claves: ['servidor', 'dar de baja', 'baja', 'ocioso', 'sin uso', 'conviene'] },
  { id: 'plan-completo', texto: '¿Qué ahorro logro aplicando todo el plan?', claves: ['todo el plan', 'plan', 'ahorro', 'ahorrar', 'aplicando', 'combinado'] },
  { id: 'medida-top', texto: '¿Cuál es la medida que más ahorra?', claves: ['medida', 'mas ahorra', 'mejor medida', 'prioridad', 'empezar', 'primero'] },
  { id: 'refrigeracion', texto: '¿Cuánto representa la refrigeración de la sala de servidores?', claves: ['refrigeracion', 'pue', 'aire', 'sala de servidores', 'climatiza', 'enfria'] },
  { id: 'huella-calculo', texto: '¿Cómo se calcula la huella de carbono?', claves: ['huella', 'carbono', 'co2', 'como se calcula', 'emision', 'emisiones'] },
  { id: 'datos-fuentes', texto: '¿Qué datos usa la herramienta y de dónde salen?', claves: ['datos', 'fuente', 'fuentes', 'de donde', 'herramienta', 'tarifa', 'exacto', 'confiable'] },
];

const normalizar = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Una clave puntúa por su largo si aparece al comienzo de una palabra ("pc" matchea "pcs", no "especial").
const puntaje = (texto, claves) =>
  claves.reduce((a, c) => (new RegExp(`(?:^| )${escapar(c)}`).test(texto) ? a + c.length : a), 0);

/** Devuelve el id de la pregunta que mejor coincide con el texto libre, o null. */
export function interpretar(texto) {
  const t = normalizar(texto);
  if (!t) return null;
  let mejor = null;
  let max = 0;
  for (const p of PREGUNTAS) {
    const s = puntaje(t, p.claves.map(normalizar));
    if (s > max) {
      max = s;
      mejor = p.id;
    }
  }
  return mejor;
}

const SIN_EQUIPOS = {
  parrafos: ['Todavía no cargaste equipos, así que no tengo números para responderte. Primero cargá tu inventario y después preguntame de nuevo.'],
  accion: { to: '/inventario', label: 'Cargar inventario' },
  datos: { sinEquipos: true },
};

const ACCION = {
  panel: { to: '/panel', label: 'Ver el Panel' },
  inventario: { to: '/inventario', label: 'Ver el Inventario' },
  plan: { to: '/plan', label: 'Ver el Plan de ahorro' },
  calculos: { to: '/calculos', label: 'Ver los Cálculos' },
};

const esFactorPorDefecto = (fe) => Math.abs(Number(fe) - FACTOR_EMISION.valor) < 1e-9;
const hayEquiposEnSala = (items) => items.some((i) => i.ubicacion === 'sala_servidores' && num(i.cantidad) > 0);
const pctDe = (parte, total) => (total > 0 ? (parte / total) * 100 : 0);

const SIN_DATOS_OK = ['huella-calculo', 'datos-fuentes'];

const RESPUESTAS = {
  'consumo-total': ({ t }) => {
    const parrafos = [`Tu infraestructura consume ${fmtKwh(t.kWhMes)} por mes, cuesta ${fmtARS(t.costoMes)} y emite ${fmtKg(t.co2Mes)}.`];
    parrafos.push(
      t.kWhRefrig > 0
        ? `De esos kWh, ${fmtKwh(t.kWhRefrig)} (${fmtPct(pctDe(t.kWhRefrig, t.kWhMes))}) son refrigeración y pérdidas de la sala de servidores.`
        : 'No hay equipos en la sala de servidores, así que no se suma refrigeración.',
    );
    return {
      parrafos,
      accion: ACCION.panel,
      datos: { kWhMes: t.kWhMes, costoMes: t.costoMes, co2Mes: t.co2Mes, kWhRefrig: t.kWhRefrig },
    };
  },

  'equipos-top': ({ calculo }) => {
    const top = [...calculo.filas].sort((a, b) => b.kWhMes - a.kWhMes).slice(0, 3);
    const total = calculo.totales.kWhMes;
    const datos = top.map((f) => ({ id: f.id, nombre: f.nombre, kWhMes: f.kWhMes, pct: pctDe(f.kWhMes, total) }));
    return {
      parrafos: [top.length === 1 ? 'El equipo que más consume es:' : `Los ${top.length} equipos que más consumen son:`],
      lista: datos.map((d) => `${d.nombre}: ${fmtKwh(d.kWhMes)} por mes (${fmtPct(d.pct)} del total)`),
      accion: ACCION.inventario,
      datos: { top: datos },
    };
  },

  'costo-anual': ({ t, settings }) => ({
    parrafos: [
      `Pagás ${fmtARS(t.costoAnio)} por año de energía (${fmtKwh(t.kWhAnio)} a ${fmt(settings.tarifaARS, 3)} $/kWh) y emitís ${fmt(t.co2Anio / 1000, 2)} t de CO₂ por año.`,
      'Es solo el cargo variable de energía, sin cargo fijo ni impuestos.',
    ],
    accion: ACCION.panel,
    datos: { costoAnio: t.costoAnio, kWhAnio: t.kWhAnio, co2AnioT: t.co2Anio / 1000 },
  }),

  'pcs-fuera-horario': ({ recs }) => {
    const r = recs['apagar-fuera-horario'];
    if (!r.esAplicable) {
      return {
        parrafos: ['Con tu inventario actual esta medida no aplica: no hay PCs ni monitores de oficina que pasen horas en reposo.'],
        accion: ACCION.plan,
        datos: { aplica: false },
      };
    }
    const a = r.ahorro;
    return {
      parrafos: [
        `Dejar las PCs y los monitores en reposo fuera de horario te cuesta de más ${fmtARS(a.costoMes)} por mes (${fmtARS(a.costoAnio)} por año).`,
        `Apagarlos ahorraría ${fmtKwh(a.kWhMes)} y ${fmtKg(a.co2Mes)} por mes, un ${fmtPct(a.pct)} del consumo total.`,
      ],
      accion: ACCION.plan,
      datos: { aplica: true, kWhMes: a.kWhMes, costoMes: a.costoMes, co2Mes: a.co2Mes, costoAnio: a.costoAnio, pct: a.pct },
    };
  },

  'servidor-ocioso': ({ items, recs }) => {
    const r = recs['baja-servidores-ociosos'];
    const base = 'Un servidor casi sin uso sigue consumiendo cerca del 44% de su potencia máxima (LBNL, 2016).';
    if (!r.esAplicable) {
      return {
        parrafos: [base, 'Hoy no tenés servidores con carga menor al 10%, así que esta medida no aplica.'],
        accion: ACCION.plan,
        datos: { aplica: false },
      };
    }
    const a = r.ahorro;
    const nombres = items.filter((i) => categoriaDe(i) === 'servidor' && num(i.cargaPct, 100) < 10 && num(i.cantidad) > 0).map((i) => i.nombre);
    return {
      parrafos: [
        base,
        `Dar de baja o consolidar ${nombres.length ? nombres.join(', ') : 'los servidores con poca carga'} ahorraría ${fmtKwh(a.kWhMes)}, ${fmtARS(a.costoMes)} y ${fmtKg(a.co2Mes)} por mes (${fmtPct(a.pct)} del total).`,
        `Supuesto: ${r.supuesto}`,
      ],
      accion: ACCION.plan,
      datos: { aplica: true, kWhMes: a.kWhMes, costoMes: a.costoMes, co2Mes: a.co2Mes, pct: a.pct, servidores: nombres },
    };
  },

  'plan-completo': ({ plan }) => {
    const a = plan.ahorro;
    const b = plan.base.totales;
    const d = plan.despues.totales;
    const datos = {
      aplicadas: plan.aplicadas,
      kWhAntes: b.kWhMes, kWhDespues: d.kWhMes,
      costoAntes: b.costoMes, costoDespues: d.costoMes,
      co2Antes: b.co2Mes, co2Despues: d.co2Mes,
      pct: a.pct, costoAnio: a.costoAnio, co2AnioT: a.co2Anio / 1000,
    };
    if (!plan.aplicadas.length) {
      return { parrafos: ['Con tu inventario actual no aplica ninguna medida del plan de ahorro.'], accion: ACCION.plan, datos };
    }
    return {
      parrafos: [
        `Aplicando las ${plan.aplicadas.length} medidas del plan pasás de ${fmtKwh(b.kWhMes)} a ${fmtKwh(d.kWhMes)} por mes: ${fmtPct(a.pct)} menos.`,
        `El costo baja de ${fmtARS(b.costoMes)} a ${fmtARS(d.costoMes)} por mes y la huella de ${fmtKg(b.co2Mes)} a ${fmtKg(d.co2Mes)}. Son ${fmtARS(a.costoAnio)} y ${fmt(a.co2Anio / 1000, 1)} t de CO₂ menos por año.`,
        'El ahorro combinado no es la suma de las medidas sueltas: cada una se aplica sobre el resultado de la anterior.',
      ],
      accion: ACCION.plan,
      datos,
    };
  },

  'medida-top': ({ recs }) => {
    const aplicables = Object.values(recs).filter((r) => r.esAplicable).sort((a, b) => b.ahorro.kWhMes - a.ahorro.kWhMes);
    if (!aplicables.length) {
      return { parrafos: ['Con tu inventario actual no aplica ninguna medida del plan de ahorro.'], accion: ACCION.plan, datos: { ranking: [] } };
    }
    const [top] = aplicables;
    return {
      parrafos: [
        `La que más ahorra es: ${top.titulo}. Ahorra ${fmtKwh(top.ahorro.kWhMes)} y ${fmtARS(top.ahorro.costoMes)} por mes.`,
        'Así quedan todas, de mayor a menor ahorro:',
      ],
      lista: aplicables.map((r) => `${r.titulo}: ${fmtKwh(r.ahorro.kWhMes)} por mes (${fmtPct(r.ahorro.pct)})`),
      accion: ACCION.plan,
      datos: {
        top: { id: top.id, kWhMes: top.ahorro.kWhMes, costoMes: top.ahorro.costoMes, co2Mes: top.ahorro.co2Mes },
        ranking: aplicables.map((r) => ({ id: r.id, kWhMes: r.ahorro.kWhMes })),
      },
    };
  },

  refrigeracion: ({ items, t, settings, recs }) => {
    const pue = Math.max(1, num(settings.pue, 1)); // same clamp as calc.js
    const r = recs['mejorar-refrigeracion'];
    if (!hayEquiposEnSala(items)) {
      return {
        parrafos: ['No tenés equipos cargados en la sala de servidores, así que hoy no se suma refrigeración.'],
        accion: ACCION.calculos,
        datos: { pue, kWhRefrig: 0, aplicaMejora: false, haySala: false },
      };
    }
    if (!(t.kWhRefrig > 0)) {
      return {
        parrafos: [`Con un PUE de ${fmt(pue, 2)} el modelo no suma refrigeración ni pérdidas a los equipos de la sala de servidores. Si tu sala usa aire acondicionado, cargá su PUE real en Inventario para ver cuánto pesa.`],
        accion: ACCION.calculos,
        datos: { pue, kWhRefrig: 0, aplicaMejora: false, haySala: true },
      };
    }
    const parrafos = [
      `Con un PUE de ${fmt(pue, 2)}, por cada kWh que usan los equipos de la sala se suman ${fmt(pue - 1, 2)} kWh de refrigeración y pérdidas. Son ${fmtKwh(t.kWhRefrig)} por mes: ${fmtPct(pctDe(t.kWhRefrig, t.kWhMes))} de tu consumo total.`,
    ];
    const datos = { pue, kWhRefrig: t.kWhRefrig, pctTotal: pctDe(t.kWhRefrig, t.kWhMes), aplicaMejora: r.esAplicable, haySala: true };
    if (r.esAplicable) {
      parrafos.push(
        `Con una mejor gestión de la sala (PUE ${fmt(PUE.mejorado, 1)}, escenario de LBNL 2016) la refrigeración bajaría a ${fmtKwh(r.despues.kWhRefrig)} y ahorrarías ${fmtKwh(r.ahorro.kWhMes)} y ${fmtARS(r.ahorro.costoMes)} por mes. Es un valor de referencia, no una garantía.`,
      );
      Object.assign(datos, { kWhRefrigMejorado: r.despues.kWhRefrig, ahorroKWh: r.ahorro.kWhMes, ahorroCosto: r.ahorro.costoMes });
    } else {
      parrafos.push(`Tu PUE ya está en ${fmt(PUE.mejorado, 1)} o menos, así que esa mejora no suma ahorro.`);
    }
    return { parrafos, accion: ACCION.calculos, datos };
  },

  'huella-calculo': ({ items, t, settings }) => {
    const fe = num(settings.factorEmision, FACTOR_EMISION.valor);
    const anio = settings.factorAnio ?? FACTOR_EMISION.anio;
    const porDefecto = esFactorPorDefecto(fe);
    // Without equipment there are no user numbers: use a generic 100 kWh example
    const sinDatos = !items.length;
    const kWh = sinDatos ? 100 : t.kWhMes;
    const co2 = kWh * fe;
    return {
      parrafos: ['La huella sale de multiplicar la energía que consumís por cuánto CO₂ emite generar cada kWh en la red eléctrica argentina:'],
      lista: [
        'kg CO₂ = kWh × factor de emisión',
        `Factor de emisión: ${fmt(fe, 3)} kg CO₂/kWh${porDefecto ? ` (${anio}, SNIGEI-AR 2025)` : ' (valor cargado por vos)'}`,
        sinDatos ? 'Ejemplo genérico, sin tus datos: 100 kWh' : `Tu consumo: ${fmtKwh(t.kWhMes)} por mes`,
        `Cuenta: ${fmt(kWh, 1)} × ${fmt(fe, 3)} = ${fmtKg(co2, 1)}${sinDatos ? '' : ' por mes'}`,
      ],
      accion: sinDatos ? ACCION.inventario : ACCION.calculos,
      datos: { kWhMes: kWh, factorEmision: fe, co2Mes: co2, ejemplo: sinDatos },
    };
  },

  'datos-fuentes': ({ settings }) => ({
    parrafos: [
      'Todo se calcula con parámetros públicos que podés editar en Inventario. Son estimaciones con valores de referencia, no mediciones: para más precisión cargá la potencia real de cada equipo. El detalle de cada cuenta está en Cálculos. Estos son los datos:',
    ],
    lista: [
      `Tarifa: Edenor T1-G, ${TARIFA_EDENOR_T1G.vigencia}. Hoy usás ${fmt(settings.tarifaARS, 3)} $/kWh.`,
      `Factor de emisión: ${fmt(settings.factorEmision, 3)} kg CO₂/kWh${esFactorPorDefecto(settings.factorEmision) ? ` (SNIGEI-AR 2025, serie hasta ${FACTOR_EMISION.anio})` : ' (valor que cargaste vos; el de referencia es SNIGEI-AR 2025)'}.`,
      `PUE y consumo de servidores: LBNL 2016. Tu PUE actual es ${fmt(Math.max(1, num(settings.pue, 1)), 2)}.`,
      'Potencias de PCs, monitores y red: valores de referencia de estudios publicados y hojas de datos.',
    ],
    accion: ACCION.calculos,
    datos: { tarifaARS: Number(settings.tarifaARS), factorEmision: Number(settings.factorEmision), pue: Math.max(1, num(settings.pue, 1)) },
  }),
};

/**
 * Responde una pregunta con los números del usuario. Devuelve `{ parrafos, lista?, accion?, datos }`
 * (o null si el id no existe). `datos` trae los números crudos usados.
 */
export function responder(id, { items = [], settings = {} } = {}) {
  const fn = RESPUESTAS[id];
  if (!fn) return null;
  // These two answers do not need the user's equipment
  if (!items.length && !SIN_DATOS_OK.includes(id)) return SIN_EQUIPOS;
  const calculo = calcTotales(items, settings);
  const recs = Object.fromEntries(evaluarRecomendaciones(items, settings).map((r) => [r.id, r]));
  const plan = escenarioCombinado(items, settings, RECOMENDACIONES.map((r) => r.id));
  return fn({ items, settings, calculo, t: calculo.totales, recs, plan });
}
