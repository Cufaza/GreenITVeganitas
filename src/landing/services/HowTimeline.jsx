import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { fmtPct } from '../../lib/format.js';
import { DEMO } from '../demo.js';
import { useReducedMotionQuery } from '../ui.jsx';

const tipos = Object.keys(DEMO.calculo.porCategoria).length;

const STEPS = [
  { label: 'Cargás tus equipos', sub: 'PCs, monitores, servidores y red, con sus horas de uso', badge: `${tipos} tipos de equipo en el caso demo` },
  { label: 'Calculamos con datos reales', sub: 'Tarifa Edenor y factor de emisión de Argentina', badge: null },
  { label: 'Ves consumo, costo y huella', sub: 'kWh, pesos y kg de CO₂ por mes y por año', badge: null },
  { label: 'Aplicás el plan de ahorro', sub: 'Medidas ordenadas por impacto', badge: `${fmtPct(DEMO.ahorro.pct)} menos de consumo en el caso demo` },
];

const getState = (i, active) => (i < active ? 'done' : i === active ? 'active' : 'pending');

function SvgSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="auto-svg-spin" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="9 29" />
    </svg>
  );
}

/** Sumar's AutoTimeline: steps complete one after another, a glow runs down the active connector. */
export default function HowTimeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduce = useReducedMotionQuery();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const timer = setInterval(() => setActive((prev) => (prev + 1) % STEPS.length), 2000);
    return () => clearInterval(timer);
  }, [inView, reduce]);

  const current = reduce ? STEPS.length : active;

  return (
    <div ref={ref} className="auto-wrap">
      <ol className="auto-timeline" aria-label="Cómo funciona, en cuatro pasos">
        {STEPS.map((s, i) => {
          const state = getState(i, current);
          return (
            <motion.li
              key={s.label}
              className={`auto-step auto-step--${state}`}
              initial={reduce ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="auto-track">
                <div className={`auto-icon auto-icon--${state}`} aria-hidden="true">
                  {state === 'done' && '✓'}
                  {state === 'active' && <SvgSpinner />}
                  {state === 'pending' && i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`auto-connector auto-connector--${state}`} aria-hidden="true">
                    {state === 'active' && (
                      <motion.div
                        className="auto-connector-glow"
                        animate={{ y: ['-100%', '250%'] }}
                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="auto-body">
                <div className="auto-label">{s.label}</div>
                <div className="auto-sub">{s.sub}</div>
                {s.badge && <div className="auto-badge">{s.badge}</div>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
