import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { PUE } from '../data/constants.js';
import { fmt } from '../lib/format.js';
import { IEA } from './demo.js';
import ProblemDashboard from './ProblemDashboard.jsx';

// Real figures with their source (IEA, LBNL 2016). Ranges taken from the constants where they exist.
const pueRange = `${fmt(PUE.closet.valor, 1)} a ${fmt(PUE.sala.valor, 1)}`;
const FIGURES = [
  {
    label: 'Electricidad mundial',
    num: '1 a 1,3%',
    text: 'de la electricidad del mundo la usan los centros de datos: entre 240 y 340 TWh por año.',
    source: 'Fuente: Agencia Internacional de la Energía (IEA)',
    href: IEA.url,
  },
  {
    label: 'Servidor casi ocioso',
    num: '≈44%',
    text: 'de su potencia máxima sigue consumiendo un servidor que está prendido pero casi sin trabajar.',
    source: 'Fuente: LBNL, 2016',
  },
  {
    label: 'PUE de salas chicas',
    num: pueRange,
    text: `Por cada kWh de los equipos IT, entre ${fmt(PUE.closet.valor - 1, 0)} y ${fmt(PUE.sala.valor - 1, 1)} kWh más se van en refrigeración y pérdidas.`,
    source: 'Fuente: LBNL, 2016',
  },
];

export default function Problem() {
  const sectionRef = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });

  /* Text: fades in as the section enters, fades out as the user scrolls past it (sumar) */
  const rawY = useTransform(scrollYProgress, [0, 0.15, 0.38, 0.58], [50, 0, 0, -70]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.12, 0.35, 0.52], [0, 1, 1, 0]);
  const y = useSpring(rawY, { stiffness: 70, damping: 20 });
  const opacity = useSpring(rawOpacity, { stiffness: 70, damping: 20 });

  return (
    <section ref={sectionRef} className="block problem" id="problema" aria-labelledby="problema-title">
      <motion.div className="problem-center" style={reduce ? undefined : { y, opacity }}>
        <span className="sec-eyebrow">El problema real</span>
        <h2 className="sec-title" id="problema-title">
          Lo que no se mide,
          <br />
          <span className="problem-line2">
            <span className="problem-bold">no se puede </span>
            <span className="problem-serif-it">ahorrar.</span>
          </span>
        </h2>
        <p className="problem-lead">
          Los equipos prendidos consumen aunque nadie los use, y la sala de servidores suma refrigeración encima. Estos son los órdenes de magnitud con los que trabajamos.
        </p>
      </motion.div>

      <div className="problem-figures">
        {FIGURES.map((f, i) => (
          <div key={f.label} className={`reveal d${i + 1}`}>
            <figure className="p-card">
              <p className="p-card-label">{f.label}</p>
              <p className="p-card-value">{f.num}</p>
              <p className="p-card-sub">{f.text}</p>
              <figcaption className="p-card-src">
                {f.href ? <a href={f.href} target="_blank" rel="noreferrer">{f.source}</a> : f.source}
              </figcaption>
            </figure>
          </div>
        ))}
      </div>

      <ProblemDashboard />
    </section>
  );
}
