// Verifica el motor de cálculo contra cuentas hechas a mano. Uso: npm run verify
import { calcTotales, escenarioCombinado, evaluarRecomendaciones } from '../src/lib/calc.js';
import { demoData } from '../src/data/demo.js';

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

// Cuentas a mano
const pcs = (12 * (100 * 40 + 50 * 128 + 1.5 * 0)) / 1000 * S; // 540,8
const mon = (12 * (30 * 40 + 2 * 128 + 0.5 * 0)) / 1000 * S; // 75,71
const nb = (4 * (19 * 30 + 3 * 20)) / 1000 * S; // 10,92
const pSrv2 = 161 + 0.35 * (365 - 161); // 232,4 W
const srv2 = ((pSrv2 * 168) / 1000) * S * settings.pue;
const pSrv1 = 52 + 0.05 * (118 - 52); // 55,3 W
const srv1 = ((pSrv1 * 168) / 1000) * S * settings.pue;
const sw = ((15.9 * 168) / 1000) * S * settings.pue;

check('PCs kWh/mes', byId['demo-1'].kWhMes, pcs);
check('Monitores kWh/mes', byId['demo-2'].kWhMes, mon);
check('Notebooks kWh/mes', byId['demo-3'].kWhMes, nb);
check('Servidor 2s kWh/mes (con refrigeración)', byId['demo-4'].kWhMes, srv2);
check('Servidor 1s kWh/mes (con refrigeración)', byId['demo-5'].kWhMes, srv1);
check('Switch kWh/mes (con refrigeración)', byId['demo-6'].kWhMes, sw);

const total = pcs + mon + nb + srv2 + srv1 + sw;
check('Total kWh/mes', totales.kWhMes, total);
check('Total CO2 kg/mes', totales.co2Mes, total * 0.283);
check('Total costo ARS/mes', totales.costoMes, total * 214.17, 1);
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
if (fallas) {
  console.error(`\n${fallas} verificaciones fallaron`);
  process.exit(1);
}
console.log('\nTodas las verificaciones pasaron');
