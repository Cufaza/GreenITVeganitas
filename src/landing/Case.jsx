import { useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIAS } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { DEMO, MEDIDA_CORTA } from './demo.js';
import { Reveal, SectionHead } from './ui.jsx';

// Dark-surface chart tokens (the landing is outside the app's chart palette on purpose).
const C = { acc: '#7bd389', it: '#7bd389', refrig: '#60a5fa', hoy: '#6b7280', grid: 'rgba(255,255,255,0.08)', tick: '#9ca3af', cursor: 'rgba(123,211,137,0.06)' };
const TICK = { fontSize: 12, fill: C.tick };
const AXIS = { axisLine: false, tickLine: false };

const TABS = [
  ['hoy', 'Hoy'],
  ['plan', 'Con el plan'],
  ['medida', 'Por medida'],
];

const PLURAL = { pc: ['PC de escritorio', 'PCs de escritorio'], monitor: ['monitor', 'monitores'], notebook: ['notebook', 'notebooks'], servidor: ['servidor', 'servidores'], red: ['switch', 'switches'] };
const equipos = Object.entries(
  DEMO.calculo.filas.reduce((a, f) => ({ ...a, [f.categoria]: (a[f.categoria] || 0) + f.cantidad }), {}),
).map(([k, n]) => `${n} ${PLURAL[k]?.[n === 1 ? 0 : 1] ?? CATEGORIAS[k]}`);

const Tip = ({ active, payload, label, rows }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="l-tip">
      <p>{label ?? d.name}</p>
      {rows(d).map(([name, val, color]) => (
        <div key={name}>{color && <i style={{ background: color }} />}<span>{name}</span><b>{val}</b></div>
      ))}
    </div>
  );
};

const Legend = ({ items }) => (
  <div className="l-legend">{items.map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
);

const Kpi = ({ label, val, sub, acc }) => (
  <div className={`l-kpi${acc ? ' acc' : ''}`}>
    <p className="l-kpi-label">{label}</p>
    <p className="l-kpi-val">{val}</p>
    {sub && <p className="l-kpi-sub">{sub}</p>}
  </div>
);

function HoyPanel() {
  const { totales, calculo } = DEMO;
  const data = Object.entries(calculo.porCategoria).map(([k, v]) => ({ name: CATEGORIAS[k], it: Math.round(v.kWhMesIT), refrig: Math.round(v.kWhRefrig), total: v.kWhMes, costo: v.costoMes, co2: v.co2Mes }));
  return (
    <>
      <div className="l-chart">
        <div className="l-chart-head"><h3>Consumo por tipo de equipo (kWh/mes)</h3><Legend items={[['Equipos IT', C.it], ['Refrigeración', C.refrig]]} /></div>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="name" tick={TICK} {...AXIS} interval={0} angle={-18} textAnchor="end" height={56} />
              <YAxis tick={TICK} {...AXIS} width={48} />
              <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Equipos IT', `${fmt(d.it)} kWh`, C.it], ['Refrigeración', `${fmt(d.refrig)} kWh`, C.refrig], ['Total', `${fmt(d.total)} kWh`]]} />} />
              <Bar dataKey="it" stackId="a" fill={C.it} maxBarSize={40} />
              <Bar dataKey="refrig" stackId="a" fill={C.refrig} maxBarSize={40} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="l-case-side">
        <Kpi label="Consumo mensual" val={`${fmt(totales.kWhMes)} kWh`} sub={`${fmt(totales.kWhRefrig)} kWh son refrigeración`} />
        <Kpi label="Costo de energía" val={`${fmtARS(totales.costoMes)} por mes`} sub={`${fmtARS(totales.costoAnio)} por año`} />
        <Kpi label="Huella de carbono" val={`${fmt(totales.co2Mes)} kg CO₂ por mes`} sub={`${fmt(totales.co2Anio / 1000, 2)} t CO₂ por año`} />
      </div>
    </>
  );
}

function PlanPanel() {
  const { totales, despues, ahorro } = DEMO;
  const data = [
    { name: 'Hoy', kwh: totales.kWhMes, costo: totales.costoMes, co2: totales.co2Mes },
    { name: 'Con el plan', kwh: despues.kWhMes, costo: despues.costoMes, co2: despues.co2Mes },
  ];
  return (
    <>
      <div className="l-chart">
        <div className="l-chart-head"><h3>Consumo mensual, hoy vs. con el plan (kWh)</h3><Legend items={[['Hoy', C.hoy], ['Con el plan', C.acc]]} /></div>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 28, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="name" tick={TICK} {...AXIS} />
              <YAxis tick={TICK} {...AXIS} width={48} />
              <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Consumo', `${fmt(d.kwh)} kWh`], ['Costo', `${fmtARS(d.costo)} por mes`], ['Huella', `${fmt(d.co2)} kg CO₂`]]} />} />
              <Bar dataKey="kwh" maxBarSize={56} radius={[6, 6, 0, 0]}>
                <Cell fill={C.hoy} />
                <Cell fill={C.acc} />
                <LabelList dataKey="kwh" position="top" formatter={(v) => `${fmt(v)} kWh`} style={{ fontSize: 13, fontWeight: 600, fill: '#f3f4f6' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="l-case-side">
        <Kpi acc label="Consumo con el plan" val={`${fmt(despues.kWhMes)} kWh`} sub={`Hoy ${fmt(totales.kWhMes)} kWh · −${fmtPct(ahorro.pct)}`} />
        <Kpi label="Costo con el plan" val={`${fmtARS(despues.costoMes)} por mes`} sub={`Hoy ${fmtARS(totales.costoMes)} · ${fmtARS(ahorro.costoAnio)} menos por año`} />
        <Kpi label="Huella con el plan" val={`${fmt(despues.co2Mes)} kg CO₂ por mes`} sub={`Hoy ${fmt(totales.co2Mes)} kg · ${fmt(ahorro.co2Anio / 1000, 1)} t menos por año`} />
      </div>
    </>
  );
}

function MedidaPanel() {
  const { recs, ahorro, despues, totales } = DEMO;
  const data = [
    ...recs.filter((r) => r.esAplicable).sort((a, b) => b.ahorro.kWhMes - a.ahorro.kWhMes).map((r) => ({ name: MEDIDA_CORTA[r.id], kwh: r.ahorro.kWhMes, costo: r.ahorro.costoMes, co2: r.ahorro.co2Mes, plan: false })),
    { name: 'Plan completo', kwh: ahorro.kWhMes, costo: ahorro.costoMes, co2: ahorro.co2Mes, plan: true },
  ];
  return (
    <>
      <div className="l-chart">
        <div className="l-chart-head"><h3>Ahorro por medida (kWh/mes)</h3><Legend items={[['Medida individual', '#4b8f5a'], ['Plan completo', C.acc]]} /></div>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" tick={TICK} {...AXIS} />
              <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#d1d5db' }} {...AXIS} width={170} />
              <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Ahorro', `${fmt(d.kwh)} kWh`], ['Costo', `${fmtARS(d.costo)} por mes`], ['Huella', `${fmt(d.co2)} kg CO₂`]]} />} />
              <Bar dataKey="kwh" maxBarSize={32} radius={[0, 6, 6, 0]}>
                {data.map((d) => <Cell key={d.name} fill={d.plan ? C.acc : '#4b8f5a'} />)}
                <LabelList dataKey="kwh" position="right" formatter={(v) => `${fmt(v)} kWh`} style={{ fontSize: 12, fontWeight: 600, fill: '#f3f4f6' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="l-case-side">
        <Kpi acc label="Ahorro del plan completo" val={`${fmt(ahorro.kWhMes)} kWh por mes`} sub={`${fmtPct(ahorro.pct)} del consumo de hoy`} />
        <Kpi label="Ahorro en pesos" val={`${fmtARS(ahorro.costoMes)} por mes`} sub={`Pasa de ${fmtARS(totales.costoMes)} a ${fmtARS(despues.costoMes)}`} />
        <Kpi label="Menos CO₂" val={`${fmt(ahorro.co2Mes)} kg por mes`} sub="No es la suma de las tres medidas: cada una se aplica sobre la anterior." />
      </div>
    </>
  );
}

/** Table version of the chart (accessible alternative). */
function DataTable({ tab }) {
  const { totales, despues, ahorro, recs, calculo } = DEMO;
  let head;
  let rows;
  let caption;
  if (tab === 'hoy') {
    caption = 'Consumo actual por tipo de equipo';
    head = ['Tipo', 'Equipos IT (kWh)', 'Refrigeración (kWh)', 'Costo por mes', 'kg CO₂ por mes'];
    rows = Object.entries(calculo.porCategoria).map(([k, v]) => [CATEGORIAS[k], fmt(v.kWhMesIT), fmt(v.kWhRefrig), fmtARS(v.costoMes), fmt(v.co2Mes)]);
    rows.push(['Total', fmt(totales.kWhMesIT), fmt(totales.kWhRefrig), fmtARS(totales.costoMes), fmt(totales.co2Mes)]);
  } else if (tab === 'plan') {
    caption = 'Hoy vs. con el plan completo';
    head = ['Escenario', 'Consumo (kWh/mes)', 'Costo por mes', 'kg CO₂ por mes'];
    rows = [
      ['Hoy', fmt(totales.kWhMes), fmtARS(totales.costoMes), fmt(totales.co2Mes)],
      ['Con el plan', fmt(despues.kWhMes), fmtARS(despues.costoMes), fmt(despues.co2Mes)],
      ['Ahorro', `${fmt(ahorro.kWhMes)} (−${fmtPct(ahorro.pct)})`, fmtARS(ahorro.costoMes), fmt(ahorro.co2Mes)],
    ];
  } else {
    caption = 'Ahorro de cada medida por separado y del plan completo';
    head = ['Medida', 'Ahorro (kWh/mes)', 'Ahorro por mes', 'kg CO₂ menos por mes'];
    rows = recs.filter((r) => r.esAplicable).map((r) => [r.titulo, fmt(r.ahorro.kWhMes), fmtARS(r.ahorro.costoMes), fmt(r.ahorro.co2Mes)]);
    rows.push(['Plan completo', fmt(ahorro.kWhMes), fmtARS(ahorro.costoMes), fmt(ahorro.co2Mes)]);
  }
  return (
    <div className="l-table-wrap">
      <table className="l-table">
        <caption>{caption}</caption>
        <thead><tr>{head.map((h, i) => <th key={h} scope="col" className={i ? 'num' : ''}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, n) => (
            <tr key={r[0]} className={n === rows.length - 1 && tab !== 'plan' ? 'total' : ''}>
              {r.map((c, i) => (i ? <td key={i} className="num">{c}</td> : <th key={i} scope="row" style={{ textAlign: 'left', fontWeight: 500, padding: '13px 20px', color: '#e5e7eb', borderTop: '1px solid var(--line-soft)' }}>{c}</th>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Case() {
  const [tab, setTab] = useState('hoy');
  const refs = useRef({});
  const onKey = (e) => {
    const i = TABS.findIndex(([id]) => id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i + TABS.length - 1) % TABS.length : null;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next][0]);
    refs.current[TABS[next][0]]?.focus();
  };
  return (
    <section className="l-section" id="caso" aria-labelledby="caso-title">
      <div className="l-container">
        <SectionHead
          id="caso-title"
          eyebrow="Caso de demostración"
          title={<>Estudio Contable Delta, <em>antes y después.</em></>}
          lead={`Es una empresa ficticia, inventada para esta demo: ${equipos.join(', ')}. Los equipos y horarios son de ejemplo; los parámetros de cálculo son reales.`}
        />
        <Reveal>
          <div className="l-tabs" role="tablist" aria-label="Vistas del caso" onKeyDown={onKey}>
            {TABS.map(([id, label]) => (
              <button
                key={id}
                ref={(el) => { refs.current[id] = el; }}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                className="l-tab"
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </Reveal>
        <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          <div className="l-case-panel">
            {tab === 'hoy' && <HoyPanel />}
            {tab === 'plan' && <PlanPanel />}
            {tab === 'medida' && <MedidaPanel />}
          </div>
          <DataTable tab={tab} />
        </div>
      </div>
    </section>
  );
}
