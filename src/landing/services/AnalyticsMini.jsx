import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { fmt, fmtARS, fmtPct } from '../../lib/format.js';
import { DEMO } from '../demo.js';
import { curvePath, toPoints } from '../svg.js';

const { totales, despues, calculo } = DEMO;
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CORTO = { pc: 'PCs', monitor: 'Monitor', notebook: 'Notebook', servidor: 'Servidor', red: 'Red' };
const COST_HOY = MONTHS.map((_, i) => totales.costoMes * (i + 1));
const COST_PLAN = MONTHS.map((_, i) => despues.costoMes * (i + 1));
const BARS = Object.entries(calculo.porCategoria).sort((a, b) => b[1].kWhMes - a[1].kWhMes).map(([k, v]) => ({ label: CORTO[k] ?? k, value: v.kWhMes }));
const BAR_MAX = Math.max(...BARS.map((b) => b.value));

const KPIS = [
  { label: 'Consumo', target: totales.kWhMes, format: (n) => `${fmt(n)} kWh`, chg: `${fmtPct((totales.kWhRefrig / totales.kWhMes) * 100)} es refrigeración` },
  { label: 'Costo por mes', target: totales.costoMes / 1000, format: (n) => `$${fmt(n)}k`, chg: `${fmtARS(totales.costoAnio)} por año` },
  { label: 'Huella', target: totales.co2Mes, format: (n) => `${fmt(n)} kg`, chg: `${fmt(totales.co2Anio / 1000, 1)} t CO₂ por año` },
];

function KpiCard({ label, target, format, chg, delay, inView, reduce }) {
  const [val, setVal] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const DURATION = 1800;
    let rafId = 0;
    // start after the card's fade-in animation
    const tid = setTimeout(() => {
      let startTs = null;
      const step = (ts) => {
        if (!startTs) startTs = ts;
        const p = Math.min((ts - startTs) / DURATION, 1);
        setVal(target * (1 - (1 - p) ** 3)); // ease-out cubic
        if (p < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }, delay * 1000 + 150);
    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(rafId);
    };
  }, [inView, reduce, target, delay]);

  return (
    <motion.div
      className="an-kpi"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.12 } }}
    >
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-val">{format(val)}</div>
      <div className="an-kpi-chg">{chg}</div>
    </motion.div>
  );
}

/** Sumar's AnalyticsMini: browser frame, count-up KPIs, a line that draws itself and bars that grow. */
export default function AnalyticsMini() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const seen = useInView(ref, { once: true, margin: '-10%' });
  const inView = reduce ? true : seen;

  const range = [0, COST_HOY[COST_HOY.length - 1]];
  const ptsHoy = toPoints(COST_HOY, 260, 55, 6, range);
  const ptsPlan = toPoints(COST_PLAN, 260, 55, 6, range);
  const hoyPath = curvePath(ptsHoy);
  const planPath = curvePath(ptsPlan);
  const areaPath = `${planPath} L 260,55 L 0,55 Z`;
  const slot = 260 / BARS.length;

  return (
    <div ref={ref} className="an-wrap">
      <div className="an-chrome" aria-hidden="true">
        <div className="an-dots"><span /><span /><span /></div>
        <div className="an-url">greenit-calc.app/panel</div>
        <div className="an-live"><span className="dash-live-dot" />Datos de demo</div>
      </div>

      <div className="an-frame" role="img" aria-label={`Panel de ejemplo: ${fmt(totales.kWhMes)} kWh por mes, ${fmtARS(totales.costoMes)} por mes y ${fmt(totales.co2Mes)} kg de CO₂ por mes.`}>
        <div className="an-head">
          <div className="an-title">Panel <span className="an-yr">· DIIT UNLaM</span></div>
        </div>

        <div className="an-kpis">
          {KPIS.map((k, i) => <KpiCard key={k.label} {...k} delay={0.3 + i * 0.08} inView={inView} reduce={reduce} />)}
        </div>

        <div className="an-card">
          <div className="an-card-label">Costo acumulado: hoy (punteada) vs. con el plan</div>
          <svg viewBox="0 0 260 55" className="an-line-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#2e7d32" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.33, 0.66].map((f) => <line key={f} x1={0} y1={55 * f} x2={260} y2={55 * f} stroke="#f0f0f0" strokeWidth="1" />)}
            <motion.path d={areaPath} fill="url(#anGrad)" initial={reduce ? false : { opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.0, duration: 0.6 }} />
            <motion.path
              d={hoyPath} fill="none" stroke="#9ca3a0" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 0.5, duration: 1.2, ease: 'easeInOut' }}
            />
            <motion.path
              d={planPath} fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 0.6, duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>
          <div className="an-months">{MONTHS.map((m) => <span key={m}>{m}</span>)}</div>
        </div>

        <div className="an-card">
          <div className="an-card-label">kWh por mes, por tipo de equipo</div>
          <svg viewBox="0 0 260 48" className="an-bar-svg" preserveAspectRatio="xMidYMid meet">
            {BARS.map((b, i) => {
              const bh = (b.value / BAR_MAX) * 36;
              const x = i * slot + (slot - 28) / 2;
              return (
                <g key={b.label}>
                  <motion.rect
                    x={x} width={28} rx={3} fill="#2e7d32"
                    initial={reduce ? false : { height: 0, y: 36 }} animate={inView ? { height: bh, y: 36 - bh } : {}}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <text x={x + 14} y={46} textAnchor="middle" fontSize="7" fill="#8a8a8a" fontFamily="inherit">{b.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
