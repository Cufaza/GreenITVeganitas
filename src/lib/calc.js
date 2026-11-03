// Motor de cálculo de GreenIT Calc. Sin dependencias de React, para poder verificarlo desde Node.
//
// Modelo (por equipo, semana tipo de 168 horas):
//   horasApagado   = 168 − horasUso − horasReposo
//   kWh/semana IT  = cantidad × (P_uso × hUso + P_reposo × hReposo + P_apagado × hApagado) ÷ 1000
//   kWh/mes IT     = kWh/semana × 52/12
//   refrigeración  = kWh/mes IT × (PUE − 1)          (solo equipos en sala de servidores)
//   kWh/mes total  = kWh/mes IT + refrigeración
//   costo/mes      = kWh/mes total × tarifa ($/kWh)
//   CO₂/mes (kg)   = kWh/mes total × factor de emisión (kg CO₂/kWh)
//   Servidores: P_uso = P_reposo + carga% × (P_max − P_reposo)

import { HORAS_SEMANA, SEMANAS_MES, PUE } from '../data/constants.js';
import { CATALOGO_POR_ID } from '../data/catalog.js';

export const num = (v, d = 0) => {
  if (v === undefined || v === null || v === '') return d;
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export const categoriaDe = (item) => CATALOGO_POR_ID[item.catalogId]?.categoria || 'otro';

export function potencias(item) {
  const cat = CATALOGO_POR_ID[item.catalogId] || {};
  const carga = Math.min(100, Math.max(0, num(item.cargaPct, 100)));
  const reposo = num(item.potenciaReposoW, num(cat.potenciaReposoW));
  const apagado = num(item.potenciaApagadoW, num(cat.potenciaApagadoW));
  const hayMax =
    (item.potenciaMaxW !== undefined && item.potenciaMaxW !== null && item.potenciaMaxW !== '') ||
    cat.potenciaMaxW !== undefined;
  const max = hayMax ? num(item.potenciaMaxW, num(cat.potenciaMaxW)) : null;
  const uso = hayMax
    ? reposo + (carga / 100) * (max - reposo)
    : num(item.potenciaUsoW, num(cat.potenciaUsoW));
  return { uso, reposo, apagado, max, carga, interpolado: hayMax };
}

export function calcItem(item, settings) {
  const cantidad = Math.max(0, num(item.cantidad));
  const hUso = Math.max(0, num(item.horasUso));
  const hReposo = Math.max(0, num(item.horasReposo));
  const hOff = Math.max(0, HORAS_SEMANA - hUso - hReposo);
  const excedeHoras = hUso + hReposo > HORAS_SEMANA;
  const pot = potencias(item);
  const enSala = item.ubicacion === 'sala_servidores';
  const pue = Math.max(1, num(settings.pue, 1));
  const tarifa = num(settings.tarifaARS);
  const fe = num(settings.factorEmision);

  const whSemanaUnidad = pot.uso * hUso + pot.reposo * hReposo + pot.apagado * hOff;
  const kWhSemanaIT = (cantidad * whSemanaUnidad) / 1000;
  const kWhMesIT = kWhSemanaIT * SEMANAS_MES;
  const kWhRefrig = enSala ? kWhMesIT * (pue - 1) : 0;
  const kWhMes = kWhMesIT + kWhRefrig;
  const costoMes = kWhMes * tarifa;
  const co2Mes = kWhMes * fe;

  return {
    id: item.id,
    nombre: item.nombre,
    catalogId: item.catalogId,
    categoria: categoriaDe(item),
    ubicacion: item.ubicacion,
    enSala,
    cantidad,
    hUso,
    hReposo,
    hOff,
    excedeHoras,
    pot,
    pue,
    tarifa,
    fe,
    whSemanaUnidad,
    kWhSemanaIT,
    kWhMesIT,
    kWhRefrig,
    kWhMes,
    costoMes,
    co2Mes,
  };
}

export function calcTotales(items, settings) {
  const filas = items.map((i) => calcItem(i, settings));
  const sum = (k) => filas.reduce((a, f) => a + f[k], 0);
  const totales = {
    kWhMesIT: sum('kWhMesIT'),
    kWhRefrig: sum('kWhRefrig'),
    kWhMes: sum('kWhMes'),
    costoMes: sum('costoMes'),
    co2Mes: sum('co2Mes'),
  };
  totales.kWhAnio = totales.kWhMes * 12;
  totales.costoAnio = totales.costoMes * 12;
  totales.co2Anio = totales.co2Mes * 12;
  totales.pueEfectivo = totales.kWhMesIT > 0 ? totales.kWhMes / totales.kWhMesIT : 1;

  const porCategoria = {};
  for (const f of filas) {
    const c = (porCategoria[f.categoria] ||= { kWhMesIT: 0, kWhRefrig: 0, kWhMes: 0, costoMes: 0, co2Mes: 0 });
    c.kWhMesIT += f.kWhMesIT;
    c.kWhRefrig += f.kWhRefrig;
    c.kWhMes += f.kWhMes;
    c.costoMes += f.costoMes;
    c.co2Mes += f.co2Mes;
  }
  return { filas, totales, porCategoria };
}

// ---------------------------------------------------------------------------
// Recomendaciones: cada una se evalúa como un escenario (copia del inventario modificada).
// ---------------------------------------------------------------------------

export const RECOMENDACIONES = [
  {
    id: 'apagar-fuera-horario',
    titulo: 'Apagar PCs y monitores fuera del horario de trabajo',
    descripcion:
      'Las horas que hoy quedan en reposo pasan a estar apagadas (consumo de espera del equipo apagado).',
    supuesto: 'Se aplica a PCs y monitores ubicados en la oficina. Las horas de uso no cambian.',
    aplica: (items) =>
      items.some(
        (i) =>
          ['pc', 'monitor'].includes(categoriaDe(i)) &&
          i.ubicacion !== 'sala_servidores' &&
          num(i.horasReposo) > 0 &&
          num(i.cantidad) > 0,
      ),
    aplicar: (items, settings) => ({
      settings,
      items: items.map((i) =>
        ['pc', 'monitor'].includes(categoriaDe(i)) && i.ubicacion !== 'sala_servidores'
          ? { ...i, horasReposo: 0 }
          : i,
      ),
    }),
  },
  {
    id: 'baja-servidores-ociosos',
    titulo: 'Dar de baja o consolidar servidores con carga menor al 10%',
    descripcion:
      'Un servidor casi sin uso sigue consumiendo cerca del 44% de su potencia máxima. Se retira y su carga se absorbe en otro equipo.',
    supuesto:
      'Se asume que la carga del servidor retirado se absorbe sin costo energético adicional relevante en los demás servidores.',
    aplica: (items) => items.some((i) => categoriaDe(i) === 'servidor' && num(i.cargaPct, 100) < 10 && num(i.cantidad) > 0),
    aplicar: (items, settings) => ({
      settings,
      items: items.map((i) =>
        categoriaDe(i) === 'servidor' && num(i.cargaPct, 100) < 10 ? { ...i, cantidad: 0 } : i,
      ),
    }),
  },
  {
    id: 'mejorar-refrigeracion',
    titulo: 'Mejorar la gestión de la sala (PUE 1,7)',
    descripcion:
      'Ordenar pasillos de aire, sellar espacios y ajustar el set-point lleva la sala al PUE del escenario "Improved Management" de LBNL (2016).',
    supuesto: `Requiere inversión y obra menor. Se usa PUE = ${PUE.mejorado} como objetivo, un valor de referencia, no una garantía.`,
    aplica: (items, settings) =>
      num(settings.pue, 1) > PUE.mejorado && items.some((i) => i.ubicacion === 'sala_servidores' && num(i.cantidad) > 0),
    aplicar: (items, settings) => ({ items, settings: { ...settings, pue: PUE.mejorado } }),
  },
];

const diff = (base, nuevo) => {
  const d = {
    kWhMes: base.kWhMes - nuevo.kWhMes,
    costoMes: base.costoMes - nuevo.costoMes,
    co2Mes: base.co2Mes - nuevo.co2Mes,
  };
  d.kWhAnio = d.kWhMes * 12;
  d.costoAnio = d.costoMes * 12;
  d.co2Anio = d.co2Mes * 12;
  d.pct = base.kWhMes > 0 ? (d.kWhMes / base.kWhMes) * 100 : 0;
  return d;
};

export function evaluarRecomendaciones(items, settings) {
  const base = calcTotales(items, settings).totales;
  return RECOMENDACIONES.map((r) => {
    if (!r.aplica(items, settings)) return { ...r, esAplicable: false, ahorro: null };
    const esc = r.aplicar(items, settings);
    const t = calcTotales(esc.items, esc.settings).totales;
    return { ...r, esAplicable: true, ahorro: diff(base, t), despues: t };
  });
}

// Aplica en orden las recomendaciones elegidas sobre el resultado de la anterior,
// por eso el ahorro combinado NO es la suma de los individuales.
export function escenarioCombinado(items, settings, ids) {
  const base = calcTotales(items, settings);
  let cur = { items, settings };
  const aplicadas = [];
  for (const r of RECOMENDACIONES) {
    if (ids.includes(r.id) && r.aplica(cur.items, cur.settings)) {
      cur = r.aplicar(cur.items, cur.settings);
      aplicadas.push(r.id);
    }
  }
  const despues = calcTotales(cur.items, cur.settings);
  return { base, despues, ahorro: diff(base.totales, despues.totales), aplicadas, items: cur.items, settings: cur.settings };
}
