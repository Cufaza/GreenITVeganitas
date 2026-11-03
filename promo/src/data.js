// Real numbers: computed by the app's own modules (imported read-only, never duplicated).
import { demoData } from '../../src/data/demo.js';
import { calcTotales, evaluarRecomendaciones, escenarioCombinado, RECOMENDACIONES } from '../../src/lib/calc.js';
import { fmt, fmtARS, fmtKwh, fmtPct } from '../../src/lib/format.js';
import { responder, SALUDO, PREGUNTAS } from '../../src/lib/watti.js';

export { fmt, fmtARS, fmtKwh, fmtPct, SALUDO };

const demo = demoData();
const ids = RECOMENDACIONES.map((r) => r.id);

const base = calcTotales(demo.items, demo.settings);
const combo = escenarioCombinado(demo.items, demo.settings, ids);
const recs = evaluarRecomendaciones(demo.items, demo.settings);

export const BASE = base.totales; // kWhMes, costoMes, co2Mes, ...
export const PLAN = combo.despues.totales;
export const SAVING = combo.ahorro; // .pct, .kWhMes, ...

export const MEASURES = recs.map((r) => ({
  id: r.id,
  titulo: r.titulo,
  kWhMes: r.ahorro.kWhMes,
  costoMes: r.ahorro.costoMes,
}));

const LABELS = { pc: 'PCs', monitor: 'Monitores', notebook: 'Notebooks', servidor: 'Servidores', red: 'Red' };
export const CATS = Object.keys(LABELS).map((k) => ({
  id: k,
  label: LABELS[k],
  base: { it: base.porCategoria[k].kWhMesIT, ref: base.porCategoria[k].kWhRefrig },
  plan: { it: combo.despues.porCategoria[k].kWhMesIT, ref: combo.despues.porCategoria[k].kWhRefrig },
}));

// Short sidebar name (full: DEMO_EMPRESA = 'UNLaM, DIIT (caso simulado)'), initials and subtitle
export const COMPANY = 'UNLaM · DIIT';
export const COMPANY_INITIALS = 'DI';
export const COMPANY_SUB = 'Caso simulado';

// Chart axis: round the largest bar up to a clean step so any demo data fits
const topBar = Math.max(...CATS.map((c) => c.base.it + c.base.ref));
const step = 10 ** Math.floor(Math.log10(topBar));
export const CHART_MAX = Math.ceil(topBar / step) * step;

// Watti: question + the real deterministic answer.
export const CHIPS = ['consumo-total', 'medida-top', 'plan-completo'].map((id) => PREGUNTAS.find((p) => p.id === id));
const ans = responder('medida-top', demo);
export const ANSWER = [
  ...ans.parrafos.map((text) => ({ kind: 'p', text })),
  ...(ans.lista || []).map((text) => ({ kind: 'li', text })),
];
export const ANSWER_CHARS = ANSWER.reduce((a, s) => a + s.text.length, 0);
