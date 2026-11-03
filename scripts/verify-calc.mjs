// Verifica el motor de cálculo contra cuentas hechas a mano. Uso: npm run verify
import { calcTotales, escenarioCombinado, evaluarRecomendaciones } from '../src/lib/calc.js';
import { demoData } from '../src/data/demo.js';
import { PREGUNTAS, interpretar, responder } from '../src/lib/watti.js';

let fallas = 0;
const check = (nombre, obtenido, esperado, tol = 0.05) => {
  const ok = Math.abs(obtenido - esperado) <= tol;
  if (!ok) fallas++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}: obtenido ${obtenido.toFixed(3)} | esperado ${esperado.toFixed(3)}`);
};

const { items, settings } = demoData();
const { filas, totales } = calcTotales(items, settings);
const S = 52 / 12;
const byId = Object.fromEntries(filas.map((f) => [f.id, f]));

// Cuentas a mano (potencias del catálogo, S = 52/12 semanas por mes, PUE 2,5 solo en la sala)
const labPcs = (60 * (100 * 60 + 50 * 108 + 1.5 * 0)) / 1000 * S; // 2964,0
const labMon = (60 * (30 * 60 + 2 * 108 + 0.5 * 0)) / 1000 * S; // 524,16
const admPcs = (10 * (100 * 40 + 50 * 128 + 1.5 * 0)) / 1000 * S; // 450,67
const admMon = (10 * (30 * 40 + 2 * 128 + 0.5 * 0)) / 1000 * S; // 63,09
const nb = (15 * (19 * 30 + 3 * 20)) / 1000 * S; // 40,95
const pSrv2 = 161 + 0.35 * (365 - 161); // 232,4 W
const srv2 = ((pSrv2 * 168) / 1000) * S * settings.pue;
const pSrv1 = 52 + 0.05 * (118 - 52); // 55,3 W
const srv1 = ((pSrv1 * 168) / 1000) * S * settings.pue;
const sw = ((3 * 15.9 * 168) / 1000) * S * settings.pue; // 3 switches de 24 puertos

check('PCs de laboratorios kWh/mes', byId['demo-1'].kWhMes, labPcs);
check('Monitores de laboratorios kWh/mes', byId['demo-2'].kWhMes, labMon);
check('PCs de administración kWh/mes', byId['demo-3'].kWhMes, admPcs);
check('Monitores de administración kWh/mes', byId['demo-4'].kWhMes, admMon);
check('Notebooks kWh/mes', byId['demo-5'].kWhMes, nb);
check('Servidor 2s kWh/mes (con refrigeración)', byId['demo-6'].kWhMes, srv2);
check('Servidor 1s kWh/mes (con refrigeración)', byId['demo-7'].kWhMes, srv1);
check('Switches kWh/mes (con refrigeración)', byId['demo-8'].kWhMes, sw);

const total = labPcs + labMon + admPcs + admMon + nb + srv2 + srv1 + sw;
check('Total kWh/mes', totales.kWhMes, total);
check('Total CO2 kg/mes', totales.co2Mes, total * 0.283);
check('Total costo ARS/mes', totales.costoMes, total * 216.572, 1);
check('CO2 anual = 12 × mensual', totales.co2Anio, totales.co2Mes * 12, 1e-6);

// El combinado nunca puede ser mayor que la suma de los individuales ni menor que el mayor individual
const recs = evaluarRecomendaciones(items, settings).filter((r) => r.esAplicable);
const suma = recs.reduce((a, r) => a + r.ahorro.kWhMes, 0);
const maxInd = Math.max(...recs.map((r) => r.ahorro.kWhMes));
const comb = escenarioCombinado(items, settings, recs.map((r) => r.id));
const okComb = comb.ahorro.kWhMes <= suma + 1e-9 && comb.ahorro.kWhMes >= maxInd - 1e-9;
if (!okComb) fallas++;
console.log(`${okComb ? 'OK  ' : 'FALLA'} Ahorro combinado ${comb.ahorro.kWhMes.toFixed(1)} kWh/mes (suma individual ${suma.toFixed(1)}, mayor individual ${maxInd.toFixed(1)})`);

console.log(`\nDemo: ${totales.kWhMes.toFixed(1)} kWh/mes | ${totales.co2Mes.toFixed(1)} kg CO2/mes | ARS ${Math.round(totales.costoMes)}/mes`);

// Watti: las respuestas salen de los mismos cálculos; `datos` expone los números crudos.
const checkIgual = (nombre, obtenido, esperado) => {
  const ok = obtenido === esperado;
  if (!ok) fallas++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}: obtenido ${obtenido} | esperado ${esperado}`);
};
const w = (id, its = items) => responder(id, { items: its, settings });
// Ahorros a mano. Apagar: las horas de reposo de PCs y monitores pasan a consumir la potencia de apagado.
const savApagar = ((60 * (50 - 1.5) * 108 + 60 * (2 - 0.5) * 108 + 10 * (50 - 1.5) * 128 + 10 * (2 - 0.5) * 128) / 1000) * S;
const savBaja = srv1; // el servidor con 5% de carga se retira completo, con su refrigeración
const savPueSolo = (srv2 + srv1 + sw) * (1 - 1.7 / settings.pue); // PUE 2,5 → 1,7 sobre toda la sala
const savPueTrasBaja = (srv2 + sw) * (1 - 1.7 / settings.pue); // el plan baja el servidor antes de mejorar la sala
const savPlan = savApagar + savBaja + savPueTrasBaja;
checkIgual('La medida que más ahorra sola es apagar fuera de horario', savApagar > savBaja && savApagar > savPueSolo, true);

check('Watti P1 consumo kWh/mes', w('consumo-total').datos.kWhMes, total);
check('Watti P1 costo ARS/mes', w('consumo-total').datos.costoMes, total * 216.572, 1);
check('Watti P6 kWh/mes con el plan', w('plan-completo').datos.kWhDespues, total - savPlan);
check('Watti P6 ahorro %', w('plan-completo').datos.pct, (savPlan / total) * 100, 0.01);
check('Watti P7 ahorro de la medida top (kWh/mes)', w('medida-top').datos.top.kWhMes, savApagar);
checkIgual('Watti P7 medida top', w('medida-top').datos.top.id, 'apagar-fuera-horario');
check('Watti P3 t CO2/año', w('costo-anual').datos.co2AnioT, (total * 0.283 * 12) / 1000, 0.001);
checkIgual('Watti sin equipos → acción', w('consumo-total', []).accion.to, '/inventario');
checkIgual('Watti interpreta cada pregunta sugerida', PREGUNTAS.every((q) => interpretar(q.texto) === q.id), true);
checkIgual('Watti texto sin sentido → null', interpretar('hola qué tal'), null);

// Watti: refrigeración según haya equipos en la sala (no según kWhRefrig), preguntas sin datos y frases libres
const refrig1 = responder('refrigeracion', { items, settings: { ...settings, pue: 1 } });
checkIgual('Watti PUE=1 con servidores: hay sala', refrig1.datos.haySala, true);
checkIgual('Watti PUE=1 no dice que falten equipos', refrig1.parrafos[0].includes('No tenés equipos'), false);
const sinSala = responder('refrigeracion', { items: items.filter((i) => i.ubicacion !== 'sala_servidores'), settings });
checkIgual('Watti sin equipos en sala: haySala', sinSala.datos.haySala, false);
checkIgual('Watti huella sin inventario: ejemplo genérico', responder('huella-calculo', { items: [], settings }).datos.ejemplo, true);
checkIgual('Watti datos y fuentes sin inventario: responde', responder('datos-fuentes', { items: [], settings }).datos.sinEquipos, undefined);
checkIgual('Watti factor propio: no cita SNIGEI como valor usado', responder('datos-fuentes', { items, settings: { ...settings, factorEmision: 0.3 } }).lista[1].includes('valor que cargaste'), true);
const frases = {
  'cuánto pago por mes': 'consumo-total',
  'cuánto gasto por mes': 'consumo-total',
  'cuál es el costo mensual': 'consumo-total',
  'cuánto pago por año': 'costo-anual',
  'cuánto gasto al año': 'costo-anual',
  'costo anual': 'costo-anual',
};
for (const [f, id] of Object.entries(frases)) checkIgual(`Watti frase "${f}"`, interpretar(f), id);

if (fallas) {
  console.error(`\n${fallas} verificaciones fallaron`);
  process.exit(1);
}
console.log('\nTodas las verificaciones pasaron');
