// Every demo number on the landing is computed here at runtime from the demo inventory.
import { demoData } from '../data/demo.js';
import { RECOMENDACIONES, calcTotales, escenarioCombinado, evaluarRecomendaciones } from '../lib/calc.js';

const { items, settings } = demoData();
const calculo = calcTotales(items, settings);
const recs = evaluarRecomendaciones(items, settings);
const plan = escenarioCombinado(items, settings, RECOMENDACIONES.map((r) => r.id));

export const DEMO = {
  items,
  settings,
  calculo,
  totales: calculo.totales,
  recs,
  plan,
  despues: plan.despues.totales,
  ahorro: plan.ahorro,
};

/** Short labels for the three recommendations (the full titles live in calc.js). */
export const MEDIDA_CORTA = {
  'apagar-fuera-horario': 'Apagar PCs fuera de horario',
  'baja-servidores-ociosos': 'Dar de baja el servidor ocioso',
  'mejorar-refrigeracion': 'Mejorar la sala (PUE 1,7)',
};
