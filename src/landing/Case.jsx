import { useLayoutEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { escenarioCombinado } from '../lib/calc.js';
import { CATEGORIAS } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { DEMO, MEDIDA_CORTA } from './demo.js';
import { cx } from './ui.jsx';

// Dark-surface chart tokens (the landing is outside the app's chart palette on purpose).
const C = { acc: '#7bd389', it: '#7bd389', refrig: '#f39c12', hoy: '#6b7280', grid: 'rgba(255,255,255,0.08)', tick: '#9ca3af', cursor: 'rgba(123,211,137,0.06)' };
const CORTO = { pc: 'PCs', monitor: 'Monitores', notebook: 'Notebooks', servidor: 'Servidores', red: 'Red' };
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
    <div className="cv-tip">
      <p>{label ?? d.name}</p>
      {rows(d).map(([name, val, color]) => (
        <div key={name}>{color && <i style={{ background: color }} />}<span>{name}</span><b>{val}</b></div>
      ))}
    </div>
  );
};

const Legend = ({ items }) => (
  <div className="cv-legend">{items.map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
);

/** Chart card body: header + a Recharts chart that fills the 16:9 mock area. */
const ChartMock = ({ title, legend, children }) => (
  <div className="cv-chart">
    <div className="cv-chart-head"><h3>{title}</h3><Legend items={legend} /></div>
    <div className="cv-chart-body" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  </div>
);

const Kpi = ({ label, val, sub, acc }) => (
  <div className={cx('cv-kpi', acc && 'acc')}>
    <p className="cv-kpi-label">{label}</p>
    <p className="cv-kpi-val">{val}</p>
    {sub && <p className="cv-kpi-sub">{sub}</p>}
  </div>
);

const KpiMock = ({ children }) => <div className="cv-kpis">{children}</div>;

function chartHoy() {
  const { calculo } = DEMO;
  const data = Object.entries(calculo.porCategoria).map(([k, v]) => ({ name: CORTO[k] ?? CATEGORIAS[k], it: Math.round(v.kWhMesIT), refrig: Math.round(v.kWhRefrig), total: v.kWhMes }));
  return (
    <ChartMock title="Consumo por tipo de equipo (kWh/mes)" legend={[['Equipos IT', C.it], ['Refrigeración', C.refrig]]}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 4 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="name" tick={TICK} {...AXIS} interval={0} />
        <YAxis tick={TICK} {...AXIS} width={46} />
        <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Equipos IT', `${fmt(d.it)} kWh`, C.it], ['Refrigeración', `${fmt(d.refrig)} kWh`, C.refrig], ['Total', `${fmt(d.total)} kWh`]]} />} />
        <Bar dataKey="it" stackId="a" fill={C.it} maxBarSize={38} />
        <Bar dataKey="refrig" stackId="a" fill={C.refrig} maxBarSize={38} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartMock>
  );
}

function kpisHoy() {
  const { totales } = DEMO;
  return (
    <KpiMock>
      <Kpi acc label="Consumo mensual" val={`${fmt(totales.kWhMes)} kWh`} sub={`${fmt(totales.kWhRefrig)} kWh son refrigeración`} />
      <Kpi label="Costo de energía" val={`${fmtARS(totales.costoMes)} por mes`} sub={`${fmtARS(totales.costoAnio)} por año`} />
      <Kpi label="Huella de carbono" val={`${fmt(totales.co2Mes)} kg CO₂ por mes`} sub={`${fmt(totales.co2Anio / 1000, 2)} t CO₂ por año`} />
    </KpiMock>
  );
}

function chartPlan() {
  const { totales, despues } = DEMO;
  const data = [
    { name: 'Hoy', kwh: totales.kWhMes, costo: totales.costoMes, co2: totales.co2Mes },
    { name: 'Con el plan', kwh: despues.kWhMes, costo: despues.costoMes, co2: despues.co2Mes },
  ];
  return (
    <ChartMock title="Consumo mensual, hoy vs. con el plan (kWh)" legend={[['Hoy', C.hoy], ['Con el plan', C.acc]]}>
      <BarChart data={data} margin={{ top: 28, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="name" tick={TICK} {...AXIS} />
        <YAxis tick={TICK} {...AXIS} width={46} />
        <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Consumo', `${fmt(d.kwh)} kWh`], ['Costo', `${fmtARS(d.costo)} por mes`], ['Huella', `${fmt(d.co2)} kg CO₂`]]} />} />
        <Bar dataKey="kwh" maxBarSize={64} radius={[6, 6, 0, 0]}>
          <Cell fill={C.hoy} />
          <Cell fill={C.acc} />
          <LabelList dataKey="kwh" position="top" formatter={(v) => `${fmt(v)} kWh`} style={{ fontSize: 13, fontWeight: 600, fill: '#f3f4f6' }} />
        </Bar>
      </BarChart>
    </ChartMock>
  );
}

function kpisPlan() {
  const { totales, despues, ahorro } = DEMO;
  return (
    <KpiMock>
      <Kpi acc label="Consumo con el plan" val={`${fmt(despues.kWhMes)} kWh`} sub={`Hoy ${fmt(totales.kWhMes)} kWh · −${fmtPct(ahorro.pct)}`} />
      <Kpi label="Costo con el plan" val={`${fmtARS(despues.costoMes)} por mes`} sub={`Hoy ${fmtARS(totales.costoMes)} · ${fmtARS(ahorro.costoAnio)} menos por año`} />
      <Kpi label="Huella con el plan" val={`${fmt(despues.co2Mes)} kg CO₂ por mes`} sub={`Hoy ${fmt(totales.co2Mes)} kg · ${fmt(ahorro.co2Anio / 1000, 1)} t menos por año`} />
    </KpiMock>
  );
}

function chartMedida() {
  const { recs, ahorro } = DEMO;
  const data = [
    ...recs.filter((r) => r.esAplicable).sort((a, b) => b.ahorro.kWhMes - a.ahorro.kWhMes).map((r) => ({ name: MEDIDA_CORTA[r.id], kwh: r.ahorro.kWhMes, costo: r.ahorro.costoMes, co2: r.ahorro.co2Mes, plan: false })),
    { name: 'Plan completo', kwh: ahorro.kWhMes, costo: ahorro.costoMes, co2: ahorro.co2Mes, plan: true },
  ];
  return (
    <ChartMock title="Ahorro por medida (kWh/mes)" legend={[['Medida individual', '#4b8f5a'], ['Plan completo', C.acc]]}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" tick={TICK} {...AXIS} />
        <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#d1d5db' }} {...AXIS} width={150} />
        <Tooltip cursor={{ fill: C.cursor }} content={<Tip rows={(d) => [['Ahorro', `${fmt(d.kwh)} kWh`], ['Costo', `${fmtARS(d.costo)} por mes`], ['Huella', `${fmt(d.co2)} kg CO₂`]]} />} />
        <Bar dataKey="kwh" maxBarSize={30} radius={[0, 6, 6, 0]}>
          {data.map((d) => <Cell key={d.name} fill={d.plan ? C.acc : '#4b8f5a'} />)}
          <LabelList dataKey="kwh" position="right" formatter={(v) => `${fmt(v)} kWh`} style={{ fontSize: 12, fontWeight: 600, fill: '#f3f4f6' }} />
        </Bar>
      </BarChart>
    </ChartMock>
  );
}

/** Interactive: tick the measures and the combined saving updates (real escenarioCombinado). */
function PlanPicker() {
  const aplicables = DEMO.recs.filter((r) => r.esAplicable);
  const [checked, setChecked] = useState(() => aplicables.map((r) => r.id));
  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const combo = escenarioCombinado(DEMO.items, DEMO.settings, checked);
  return (
    <div className="cv-plan">
      <p className="cv-plan-title">Tildá las medidas y mirá el ahorro</p>
      {aplicables.map((r) => (
        <label key={r.id} className="cv-measure">
          <input type="checkbox" checked={checked.includes(r.id)} onChange={() => toggle(r.id)} />
          <span className="cv-box" aria-hidden="true" />
          <span className="cv-measure-t">{MEDIDA_CORTA[r.id]}</span>
          <span className="cv-measure-v">−{fmt(r.ahorro.kWhMes)} kWh</span>
        </label>
      ))}
      <div className="cv-plan-total" aria-live="polite">
        <span>Ahorro combinado por mes</span>
        <b>{fmt(combo.ahorro.kWhMes)} kWh · {fmtPct(combo.ahorro.pct)}</b>
        <small>{fmtARS(combo.ahorro.costoMes)} y {fmt(combo.ahorro.co2Mes)} kg CO₂ menos</small>
      </div>
    </div>
  );
}

/** Per tab: [wide chart card, side card]. */
const CARDS = {
  hoy: [
    { key: 'chart', size: 'xl', mock: chartHoy, title: 'Dónde se va la energía', desc: 'Equipos IT y refrigeración de la sala de servidores, por tipo de equipo.' },
    { key: 'kpi', size: 'md', mock: kpisHoy, title: 'Tres números clave', desc: 'Consumo, costo y huella de carbono del mes, con la proyección anual.' },
  ],
  plan: [
    { key: 'chart', size: 'xl', mock: chartPlan, title: 'Antes y después del plan', desc: 'El mismo estudio aplicando las tres medidas, una sobre la otra.' },
    { key: 'kpi', size: 'md', mock: kpisPlan, title: 'Qué cambia', desc: 'Menos kWh, menos pesos y menos CO₂ por mes.' },
  ],
  medida: [
    { key: 'chart', size: 'xl', mock: chartMedida, title: 'Qué medida rinde más', desc: 'Cada barra es el ahorro de esa medida sola. El plan completo no es la suma: cada una se aplica sobre la anterior.' },
    { key: 'plan', size: 'md', mock: () => <PlanPicker />, title: 'Armá tu propio plan', desc: 'Esta tarjeta es interactiva: probala con las medidas.' },
  ],
};

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
    <details className="cv-details">
      <summary>Ver estos datos en una tabla</summary>
      <div className="g-table-wrap">
        <table className="g-table">
          <caption>{caption}</caption>
          <thead><tr>{head.map((h, i) => <th key={h} scope="col" className={i ? 'num' : ''}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={r[0]} className={n === rows.length - 1 && tab !== 'plan' ? 'total' : ''}>
                {r.map((c, i) => (i ? <td key={i} className="num">{c}</td> : <th key={i} scope="row">{c}</th>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Case() {
  const [filter, setFilter] = useState('hoy');
  const [hasFiltered, setHasFiltered] = useState(false);
  const filtersRef = useRef(null);
  const pillRefs = useRef({});

  // Sliding pill indicator (sumar): measured from the active pill
  useLayoutEffect(() => {
    const container = filtersRef.current;
    const active = pillRefs.current[filter];
    if (!container || !active) return undefined;
    const update = () => {
      container.style.setProperty('--ind-x', `${active.offsetLeft}px`);
      container.style.setProperty('--ind-w', `${active.offsetWidth}px`);
      container.style.setProperty('--ind-h', `${active.offsetHeight}px`);
      container.style.setProperty('--ind-y', `${active.offsetTop}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(active);
    return () => ro.disconnect();
  }, [filter]);

  const select = (id) => {
    setFilter(id);
    setHasFiltered(true);
  };
  const onKey = (e) => {
    const i = TABS.findIndex(([id]) => id === filter);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i + TABS.length - 1) % TABS.length : null;
    if (next === null) return;
    e.preventDefault();
    select(TABS[next][0]);
    pillRefs.current[TABS[next][0]]?.focus();
  };

  const onMouseMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const visible = CARDS[filter];

  return (
    <section className="block" id="caso" aria-labelledby="caso-title">
      <div className="cases-head">
        <div>
          <span className="sec-eyebrow reveal">Caso de demostración</span>
          <h2 className="sec-title reveal d1" id="caso-title">Estudio Contable Delta, <em>antes y después.</em></h2>
          <p className="cases-lead reveal d1">
            Es una empresa ficticia, inventada para esta demo: {equipos.join(', ')}. Los equipos y horarios son de ejemplo; los parámetros de cálculo son reales.
          </p>
        </div>
        <div className="cases-filters reveal d2" role="tablist" aria-label="Vistas del caso" ref={filtersRef} onKeyDown={onKey}>
          <span className="pill-indicator" aria-hidden="true" />
          {TABS.map(([id, label]) => (
            <button
              key={id}
              ref={(el) => { pillRefs.current[id] = el; }}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={filter === id}
              aria-controls="caso-panel"
              tabIndex={filter === id ? 0 : -1}
              className={`pill${filter === id ? ' active' : ''}`}
              onClick={() => select(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="cases-v2" id="caso-panel" role="tabpanel" aria-labelledby={`tab-${filter}`}>
        {visible.map((c, i) => (
          <article
            key={hasFiltered ? `${filter}-${c.key}` : c.key}
            className={`case-v2 size-${c.size}${hasFiltered ? ' case-enter' : ` reveal d${Math.min(i + 1, 4)}`}`}
            onMouseMove={onMouseMove}
            style={{ '--enter-i': i }}
          >
            <div className="case-v2-mock">{c.mock()}</div>
            <div className="case-v2-info">
              <h3 className="case-v2-title"><span className="case-v2-name">{c.title}</span></h3>
              <p className="case-v2-desc">{c.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <DataTable tab={filter} />
    </section>
  );
}
