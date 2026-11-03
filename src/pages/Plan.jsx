import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { escenarioCombinado, evaluarRecomendaciones } from '../lib/calc.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { CATEGORIAS } from '../data/constants.js';

function descargarCSV(filas, settings) {
  const cab = ['Equipo', 'Tipo', 'Cantidad', 'kWh IT/mes', 'kWh refrigeración/mes', 'kWh total/mes', `Costo/mes (ARS, ${settings.tarifaARS} $/kWh)`, `kg CO2/mes (${settings.factorEmision} kg/kWh)`];
  const rows = filas.map((f) => [f.nombre, CATEGORIAS[f.categoria], f.cantidad, f.kWhMesIT.toFixed(2), f.kWhRefrig.toFixed(2), f.kWhMes.toFixed(2), f.costoMes.toFixed(0), f.co2Mes.toFixed(2)]);
  const csv = [cab, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'greenit-calc-inventario.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Plan() {
  const { items, settings, calculo } = useData();
  const [excluidas, setExcluidas] = useState([]);
  const recs = evaluarRecomendaciones(items, settings);
  const elegidas = recs.filter((r) => r.esAplicable && !excluidas.includes(r.id)).map((r) => r.id);
  const comb = escenarioCombinado(items, settings, elegidas);
  const toggle = (id) => setExcluidas((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  if (!items.length) {
    return <div className="card empty"><h1>Plan de ahorro</h1><p>Primero cargá equipos en <Link to="/inventario">Inventario</Link>.</p></div>;
  }
  const b = comb.base.totales, d = comb.despues.totales;
  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Plan de ahorro</h1>
          <p>Elegí las medidas y mirá el efecto combinado. Cada una se simula sobre una copia de tu inventario.</p>
        </div>
        <div className="actions no-print">
          <button className="btn btn-ghost" onClick={() => descargarCSV(calculo.filas, settings)}>Descargar CSV</button>
          <button className="btn" onClick={() => window.print()}>Imprimir o guardar PDF</button>
        </div>
      </header>

      <section className="plan-list">
        {recs.map((r) => (
          <article key={r.id} className={`card rec ${r.esAplicable ? '' : 'off'}`}>
            <label className="rec-check no-print">
              <input type="checkbox" disabled={!r.esAplicable} checked={elegidas.includes(r.id)} onChange={() => toggle(r.id)} />
            </label>
            <div>
              <h3>{r.titulo}</h3>
              <p>{r.descripcion}</p>
              <p className="hint">{r.supuesto}</p>
              {r.esAplicable ? (
                <p className="rec-save">
                  Por sí sola ahorra <strong>{fmt(r.ahorro.kWhMes)} kWh/mes</strong> ({fmtPct(r.ahorro.pct)}),
                  <strong> {fmtARS(r.ahorro.costoMes)}/mes</strong> y <strong>{fmt(r.ahorro.co2Mes)} kg CO₂/mes</strong>.
                </p>
              ) : (
                <p className="hint">No aplica a tu inventario actual.</p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Resultado de las medidas elegidas</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Indicador</th><th className="num">Hoy</th><th className="num">Con el plan</th><th className="num">Ahorro</th></tr></thead>
            <tbody>
              <tr><td>Consumo (kWh/mes)</td><td className="num">{fmt(b.kWhMes, 1)}</td><td className="num">{fmt(d.kWhMes, 1)}</td><td className="num">{fmt(comb.ahorro.kWhMes, 1)} ({fmtPct(comb.ahorro.pct)})</td></tr>
              <tr><td>Costo de energía (ARS/mes)</td><td className="num">{fmtARS(b.costoMes)}</td><td className="num">{fmtARS(d.costoMes)}</td><td className="num">{fmtARS(comb.ahorro.costoMes)}</td></tr>
              <tr><td>Huella (kg CO₂/mes)</td><td className="num">{fmt(b.co2Mes, 1)}</td><td className="num">{fmt(d.co2Mes, 1)}</td><td className="num">{fmt(comb.ahorro.co2Mes, 1)}</td></tr>
              <tr><td>Costo de energía (ARS/año)</td><td className="num">{fmtARS(b.costoAnio)}</td><td className="num">{fmtARS(d.costoAnio)}</td><td className="num">{fmtARS(comb.ahorro.costoAnio)}</td></tr>
              <tr><td>Huella (t CO₂/año)</td><td className="num">{fmt(b.co2Anio / 1000, 2)}</td><td className="num">{fmt(d.co2Anio / 1000, 2)}</td><td className="num">{fmt(comb.ahorro.co2Anio / 1000, 2)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="hint">
          El ahorro combinado no es la suma de los individuales: las medidas se aplican en orden y cada una parte del resultado de la anterior
          (por ejemplo, si se retira un servidor, mejorar el PUE ahorra menos). Los importes usan solo el cargo variable de energía, sin cargo fijo ni impuestos.
          Revisá el método en <Link to="/calculos">Cálculos</Link>.
        </p>
      </section>
    </>
  );
}
