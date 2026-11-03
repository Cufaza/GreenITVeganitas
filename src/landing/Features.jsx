import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { CATEGORIAS, SEMANAS_MES } from '../data/constants.js';
import { escenarioCombinado } from '../lib/calc.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { SALUDO, responder } from '../lib/watti.js';
import { DEMO, MEDIDA_CORTA } from './demo.js';
import { SectionHead, WattiAvatar, cx } from './ui.jsx';

const EASE = [0.16, 1, 0.3, 1];

/** Bento card: fades/rises in once when it enters the viewport. `visual` receives (active, reduce). */
function BentoCard({ span, i, visual, title, text, id }) {
  const ref = useRef(null);
  const active = useInView(ref, { once: true, margin: '-6%' });
  const reduce = useReducedMotion();
  return (
    <motion.article
      ref={ref}
      id={id}
      className={cx('l-card', span)}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={active ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE, delay: i * 0.07 }}
    >
      <div className="l-card-visual">{visual(active, reduce)}</div>
      <div className="l-card-foot">
        <h3 className="l-h3">{title}</h3>
        <p>{text}</p>
      </div>
    </motion.article>
  );
}

const pop = (reduce, delay = 0) => ({
  initial: reduce ? false : { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: EASE, delay },
});

/* Watti chat */
function WattiMock({ active, reduce }) {
  const [stage, setStage] = useState(reduce ? 3 : 0);
  useEffect(() => {
    if (!active || reduce) return undefined;
    const t = [setTimeout(() => setStage(1), 400), setTimeout(() => setStage(2), 1200), setTimeout(() => setStage(3), 2500)];
    return () => t.forEach(clearTimeout);
  }, [active, reduce]);
  const r = responder('consumo-total', { items: DEMO.items, settings: DEMO.settings });
  return (
    <div className="l-chat" aria-hidden="true">
      <div className="l-msg bot"><WattiAvatar /><div className="l-bubble">{SALUDO}</div></div>
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div key="q" className="l-msg user" {...pop(reduce)}>
            <div className="l-bubble">¿Cuánto consumo por mes en total?</div>
          </motion.div>
        )}
        {stage === 2 && (
          <motion.div key="t" className="l-msg bot" {...pop(reduce)} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <WattiAvatar /><div className="l-bubble"><span className="l-dots"><i /><i /><i /></span></div>
          </motion.div>
        )}
        {stage >= 3 && (
          <motion.div key="a" className="l-msg bot" {...pop(reduce)}>
            <WattiAvatar />
            <div className="l-bubble">{r.parrafos.map((p) => <p key={p}>{p}</p>)}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {stage >= 3 && (
        <motion.div className="l-chips" {...pop(reduce, 0.25)}>
          <span className="l-chip">¿Qué equipos consumen más?</span>
          <span className="l-chip">¿Cuál es la medida que más ahorra?</span>
        </motion.div>
      )}
    </div>
  );
}

/* How it works */
const STEPS = [
  ['Cargás tus equipos', 'PCs, monitores, servidores y red, con sus horas de uso.'],
  ['Calculamos con datos reales', 'kWh, costo y CO₂ con la tarifa y el factor de emisión de Argentina.'],
  ['Aplicás el plan de ahorro', 'Medidas ordenadas por impacto, con su ahorro estimado.'],
];
function StepsMock({ active, reduce }) {
  return (
    <ol className="l-steps">
      <motion.span
        className="l-steps-line"
        aria-hidden="true"
        initial={reduce ? false : { scaleY: 0 }}
        animate={active ? { scaleY: 1 } : undefined}
        transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.2 }}
      />
      {STEPS.map(([t, d], n) => (
        <motion.li
          key={t}
          className="l-step"
          initial={reduce ? false : { opacity: 0, x: -12 }}
          animate={active ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 + n * 0.3 }}
        >
          <span className="l-step-n">{n + 1}</span>
          <div><b>{t}</b><span>{d}</span></div>
        </motion.li>
      ))}
    </ol>
  );
}

/* Consumption analytics */
function PanelMock({ active, reduce }) {
  const cats = Object.entries(DEMO.calculo.porCategoria).sort((a, b) => b[1].kWhMes - a[1].kWhMes);
  const max = cats[0][1].kWhMes;
  return (
    <div aria-hidden="true">
      <div className="l-kpi acc" style={{ marginBottom: 18 }}>
        <p className="l-kpi-label">Consumo mensual</p>
        <p className="l-kpi-val">{fmt(DEMO.totales.kWhMes)} kWh</p>
        <p className="l-kpi-sub">{fmtARS(DEMO.totales.costoMes)} y {fmt(DEMO.totales.co2Mes)} kg CO₂ por mes</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
        {cats.map(([k, v], n) => (
          <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <motion.div
              style={{ height: `${(v.kWhMes / max) * 100}%`, display: 'flex', flexDirection: 'column', originY: 1, minHeight: 4 }}
              initial={reduce ? false : { scaleY: 0 }}
              animate={active ? { scaleY: 1 } : undefined}
              transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1], delay: 0.3 + n * 0.1 }}
            >
              <div style={{ height: `${(v.kWhRefrig / v.kWhMes) * 100}%`, background: 'rgba(243,156,18,.75)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ flex: 1, background: 'linear-gradient(180deg,#7bd389,#3f8f55)', borderRadius: v.kWhRefrig ? 0 : '4px 4px 0 0' }} />
            </motion.div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
        {cats.map(([k]) => <span key={k} style={{ flex: 1, textAlign: 'center' }}>{CATEGORIAS[k].split(' ')[0]}</span>)}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
        <span style={{ color: '#7bd389' }}>■</span> Equipos IT &nbsp; <span style={{ color: '#f39c12' }}>■</span> Refrigeración
      </p>
    </div>
  );
}

/* Transparent calculations */
function FormulaMock({ active, reduce }) {
  const f = DEMO.calculo.filas[0];
  const { pot } = f;
  const x = (v, d = 1) => fmt(v, d);
  const lines = [
    [<span className="c" key="c">{`// ${f.nombre}`}</span>],
    [`kWh/semana = ${f.cantidad} × (${x(pot.uso)} W × ${x(f.hUso, 0)} h + ${x(pot.reposo)} W × ${x(f.hReposo, 0)} h + ${x(pot.apagado)} W × ${x(f.hOff, 0)} h) ÷ 1000`],
    ['           = ', <span className="o" key="b">{x(f.kWhSemanaIT)} kWh</span>],
    [`kWh/mes     = ${x(f.kWhSemanaIT)} × ${x(SEMANAS_MES, 2)} = `, <span className="o" key="c2">{x(f.kWhMes)} kWh</span>],
    [`costo/mes   = ${x(f.kWhMes)} × ${x(DEMO.settings.tarifaARS, 3)} $/kWh = `, <span className="o" key="d">{fmtARS(f.costoMes)}</span>],
    [`CO₂/mes     = ${x(f.kWhMes)} × ${x(DEMO.settings.factorEmision, 3)} kg/kWh = `, <span className="o" key="e">{x(f.co2Mes)} kg CO₂</span>],
  ];
  return (
    <div className="l-code" aria-hidden="true">
      {lines.map((parts, n) => (
        <motion.span
          key={n}
          className="l-code-line"
          initial={reduce ? false : { opacity: 0, x: -8 }}
          animate={active ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.4, ease: EASE, delay: 0.2 + n * 0.18 }}
        >
          {parts}
        </motion.span>
      ))}
    </div>
  );
}

/* Savings plan with tickable measures (real, interactive) */
function PlanMock({ active, reduce }) {
  const aplicables = DEMO.recs.filter((r) => r.esAplicable);
  const [checked, setChecked] = useState(() => aplicables.map((r) => r.id));
  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const combo = escenarioCombinado(DEMO.items, DEMO.settings, checked);
  return (
    <div className="l-plan">
      {aplicables.map((r, n) => (
        <motion.label
          key={r.id}
          className="l-measure"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={active ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, ease: EASE, delay: 0.2 + n * 0.12 }}
        >
          <input type="checkbox" checked={checked.includes(r.id)} onChange={() => toggle(r.id)} />
          <span className="l-measure-t">{MEDIDA_CORTA[r.id]}</span>
          <span className="l-measure-v">−{fmt(r.ahorro.kWhMes)} kWh</span>
        </motion.label>
      ))}
      <div className="l-plan-total" aria-live="polite">
        <span>Ahorro combinado por mes</span>
        <b>{fmt(combo.ahorro.kWhMes)} kWh · {fmtPct(combo.ahorro.pct)}</b>
      </div>
    </div>
  );
}

/* Inventory + exports */
function InventoryMock({ active, reduce }) {
  const filas = [...DEMO.calculo.filas].sort((a, b) => b.kWhMes - a.kWhMes).slice(0, 4);
  return (
    <div aria-hidden="true">
      <table className="l-mini-table">
        <thead><tr><th>Equipo</th><th>Cant.</th><th>kWh/mes</th></tr></thead>
        <tbody>
          {filas.map((f, n) => (
            <motion.tr
              key={f.id}
              initial={reduce ? false : { opacity: 0 }}
              animate={active ? { opacity: 1 } : undefined}
              transition={{ duration: 0.4, delay: 0.2 + n * 0.1 }}
            >
              <td>{f.nombre.length > 30 ? `${f.nombre.slice(0, 29)}…` : f.nombre}</td>
              <td style={{ textAlign: 'right' }}>{f.cantidad}</td>
              <td>{fmt(f.kWhMes)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <div className="l-export"><span>Descargar CSV</span><span>Imprimir o guardar PDF</span></div>
    </div>
  );
}

export default function Features() {
  const cards = [
    { span: 'span-7', visual: (a, r) => <WattiMock active={a} reduce={r} />, title: 'Watti, tu asistente de energía', text: 'Preguntale cuánto consumís, qué equipos gastan más o qué medida conviene primero. Responde con tus números. En esta versión son respuestas predefinidas, sin IA real.' },
    { span: 'span-5', id: 'como-funciona', visual: (a, r) => <StepsMock active={a} reduce={r} />, title: 'Cómo funciona', text: 'Tres pasos y cinco minutos: cargás los equipos, calculamos con datos reales de Argentina y aplicás el plan de ahorro.' },
    { span: 'span-5', visual: (a, r) => <PanelMock active={a} reduce={r} />, title: 'Panel de consumo', text: 'kWh, costo y CO₂ por mes y por año, separando lo que usan los equipos de lo que se va en refrigeración.' },
    { span: 'span-7', visual: (a, r) => <FormulaMock active={a} reduce={r} />, title: 'Cálculos transparentes, paso a paso', text: 'Cada número tiene su cuenta visible y la fuente de cada parámetro. Nada de cajas negras.' },
    { span: 'span-7', visual: (a, r) => <PlanMock active={a} reduce={r} />, title: 'Plan de ahorro con medidas tildables', text: 'Tildá las medidas y mirá el ahorro combinado al instante. Probalo acá: esta tarjeta es interactiva.' },
    { span: 'span-5', visual: (a, r) => <InventoryMock active={a} reduce={r} />, title: 'Inventario y reportes', text: 'Cargá equipos, cantidades y horas de uso. Descargá el CSV o guardá el informe en PDF.' },
  ];
  return (
    <section className="l-section cv" id="funcionalidades" aria-labelledby="func-title">
      <div className="l-container">
        <SectionHead
          id="func-title"
          eyebrow="Funcionalidades"
          title={<>Todo lo que necesitás para <em>medir y ahorrar.</em></>}
          lead="Los números de estas tarjetas se calculan en vivo con el caso de demostración, igual que dentro de la herramienta."
        />
        <div className="l-bento">
          {cards.map((c, i) => <BentoCard key={c.title} i={i} {...c} />)}
        </div>
      </div>
    </section>
  );
}
