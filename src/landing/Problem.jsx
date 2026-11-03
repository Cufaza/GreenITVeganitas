import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { CATEGORIAS, PUE } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { DEMO, IEA } from './demo.js';
import { Reveal } from './ui.jsx';

const EASE = [0.16, 1, 0.3, 1];

// Real figures with their source (IEA, LBNL 2016). Ranges taken from the constants where they exist.
const pueRange = `${fmt(PUE.closet.valor, 1)} a ${fmt(PUE.sala.valor, 1)}`;
const FIGURES = [
  {
    num: '1 a 1,3',
    unit: '%',
    text: 'de la electricidad del mundo la usan los centros de datos: entre 240 y 340 TWh por año.',
    source: 'Fuente: Agencia Internacional de la Energía (IEA)',
    href: IEA.url,
  },
  {
    num: '≈44',
    unit: '%',
    text: 'de su potencia máxima sigue consumiendo un servidor que está prendido pero casi sin trabajar.',
    source: 'Fuente: LBNL, 2016',
  },
  {
    num: pueRange,
    unit: 'PUE',
    text: `es el PUE de las salas de servidores chicas. Por cada kWh de los equipos IT, entre ${fmt(PUE.closet.valor - 1, 0)} y ${fmt(PUE.sala.valor - 1, 1)} kWh más se van en refrigeración y pérdidas.`,
    source: 'Fuente: LBNL, 2016',
  },
];

function MiniDashboard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-6%' });
  const reduce = useReducedMotion();
  const { totales, despues, ahorro, calculo } = DEMO;
  const cats = Object.entries(calculo.porCategoria).sort((a, b) => b[1].kWhMes - a[1].kWhMes);
  const max = cats[0][1].kWhMes;
  const kpis = [
    { label: 'Consumo mensual', val: `${fmt(totales.kWhMes)} kWh`, sub: `${fmt(totales.kWhRefrig)} kWh de refrigeración` },
    { label: 'Costo por mes', val: fmtARS(totales.costoMes), sub: `${fmtARS(totales.costoAnio)} por año` },
    { label: 'Ahorro con el plan', val: fmtPct(ahorro.pct), sub: `${fmt(despues.kWhMes)} kWh por mes`, acc: true },
  ];
  return (
    <div className="l-mock" ref={ref}>
      <div className="l-mock-bar" aria-hidden="true"><i /><i /><i /><span>Panel · Estudio Contable Delta (empresa ficticia)</span></div>
      <div className="l-mock-body">
        <div className="l-kpis">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              className={`l-kpi${k.acc ? ' acc' : ''}`}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.12 }}
            >
              <p className="l-kpi-label">{k.label}</p>
              <p className="l-kpi-val">{k.val}</p>
              <p className="l-kpi-sub">{k.sub}</p>
            </motion.div>
          ))}
        </div>
        <div className="l-bars" role="list" aria-label="Consumo por tipo de equipo en kWh por mes">
          {cats.map(([k, v], i) => (
            <div key={k} className="l-bar-row" role="listitem">
              <span>{CATEGORIAS[k]}</span>
              <div className="l-bar-track">
                <motion.div
                  className="l-bar-fill"
                  style={{ width: `${(v.kWhMes / max) * 100}%`, originX: 0 }}
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : undefined}
                  transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.4 + i * 0.1 }}
                />
              </div>
              <b>{fmt(v.kWhMes)} kWh</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Problem() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // Scroll-linked fade/rise of the statement, smoothed with a spring
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'start 0.4'] });
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 20 });
  const opacity = useTransform(p, [0, 1], [0.12, 1]);
  const y = useTransform(p, [0, 1], [48, 0]);

  return (
    <section className="l-section l-problem" id="problema" aria-labelledby="problema-title">
      <div className="l-glow" aria-hidden="true" />
      <div className="l-container">
        <motion.div ref={ref} className="l-statement" style={reduce ? undefined : { opacity, y }}>
          <p className="l-eyebrow">El problema</p>
          <h2 className="l-h2" id="problema-title">
            Lo que no se mide, <em>no se puede ahorrar.</em>
          </h2>
          <p className="l-lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Los equipos prendidos consumen aunque nadie los use, y la sala de servidores suma refrigeración encima. Estos son los órdenes de magnitud con los que trabajamos.
          </p>
        </motion.div>

        <div className="l-figures">
          {FIGURES.map((f, i) => (
            <Reveal key={f.source + f.num} d={i + 1}>
              <figure className="l-figure" style={{ height: '100%' }}>
                <div className="l-figure-num">{f.num}<small>{f.unit}</small></div>
                <p>{f.text}</p>
                <cite>{f.href ? <a href={f.href} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{f.source}</a> : f.source}</cite>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal d={2} style={{ marginTop: 14 }}>
          <MiniDashboard />
        </Reveal>
      </div>
    </section>
  );
}
