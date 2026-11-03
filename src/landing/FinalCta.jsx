import { motion, useReducedMotion } from 'motion/react';
import { CtaError, PrimaryCta, Reveal, SecondaryCta } from './ui.jsx';

// Rough outline of Argentina as [lon, lat] (decorative; not a cartographic source)
const MAINLAND = [
  [-66.2, -21.9], [-62.6, -22.3], [-60.0, -24.0], [-57.8, -25.3], [-56.0, -27.3], [-54.7, -25.6], [-53.7, -26.2], [-54.0, -27.2], [-55.7, -28.2],
  [-56.5, -30.0], [-58.2, -32.5], [-58.4, -33.9], [-58.4, -34.6], [-57.2, -35.5], [-56.7, -36.4], [-57.5, -38.0], [-58.9, -38.5], [-62.3, -38.8],
  [-62.1, -40.6], [-64.9, -40.8], [-65.1, -41.2], [-63.6, -42.0], [-64.2, -42.6], [-65.0, -42.8], [-65.3, -44.9], [-67.5, -46.0], [-65.8, -47.8],
  [-67.7, -49.3], [-68.4, -50.4], [-69.2, -51.6], [-68.4, -52.35], [-69.5, -52.2], [-72.0, -51.6], [-72.9, -50.0], [-72.6, -48.5], [-72.0, -46.8],
  [-71.7, -45.4], [-71.6, -44.0], [-71.7, -42.2], [-71.8, -41.0], [-71.4, -39.5], [-70.6, -38.0], [-70.4, -36.2], [-69.9, -34.2], [-70.1, -32.5],
  [-69.8, -30.6], [-69.0, -28.5], [-68.4, -26.9], [-68.6, -25.0], [-67.0, -23.0],
];
const FUEGO = [[-68.6, -52.7], [-66.5, -54.0], [-65.2, -54.7], [-66.4, -55.0], [-68.6, -54.9]];

const inside = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const K = Math.cos((38 * Math.PI) / 180);
const S = 9; // px per degree of latitude
const project = ([lon, lat]) => [(lon + 74) * K * S, (-21 - lat) * S];
const DOTS = [];
for (let lat = -22; lat > -55; lat -= 0.75) {
  for (let lon = -73.5; lon < -53; lon += 0.75 / K) {
    if (inside([lon, lat], MAINLAND) || inside([lon, lat], FUEGO)) DOTS.push(project([lon, lat]));
  }
}
const BA = project([-58.4, -34.6]);
const W = Math.ceil(21 * K * S) + 6;
const H = 34 * S + 6;

function ArgentinaMap() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox={`-3 -3 ${W} ${H}`} role="img" aria-label="Mapa de puntos de Argentina">
      {DOTS.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="1.5"
          fill="#7bd389"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 0.28 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: (y / H) * 0.9 }}
        />
      ))}
      <circle cx={BA[0]} cy={BA[1]} r="3.4" fill="#7bd389" />
      {!reduce && <circle cx={BA[0]} cy={BA[1]} r="3.4" fill="none" stroke="#7bd389" strokeWidth="1">
        <animate attributeName="r" values="3.4;13" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0" dur="2.4s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}

export default function FinalCta({ cta }) {
  return (
    <section className="l-section" id="empezar" aria-labelledby="final-title">
      <div className="l-glow" aria-hidden="true" style={{ top: 0, left: '50%', marginLeft: -450 }} />
      <div className="l-container">
        <div className="l-final">
          <div>
            <Reveal as="p" className="l-eyebrow">Probalo ahora</Reveal>
            <Reveal as="h2" d={1} className="l-h2" id="final-title">
              Medí tu consumo, <em>reducí tu huella.</em>
            </Reveal>
            <Reveal as="p" d={2} className="l-lead">
              Entrá a la demo con una empresa ficticia ya cargada y recorré el panel, el plan de ahorro y las cuentas paso a paso. Son 5 minutos y no hace falta registrarse.
            </Reveal>
            <Reveal d={3} className="l-map"><ArgentinaMap /></Reveal>
          </div>
          <Reveal d={2}>
            <div className="l-final-card">
              <h3 className="l-h3" style={{ fontSize: 24 }}>Empezá con la demostración</h3>
              <p style={{ marginTop: 10 }}>Datos de ejemplo de Estudio Contable Delta. Todo queda guardado solo en tu navegador.</p>
              <div className="l-hero-cta">
                <PrimaryCta cta={cta} />
                <SecondaryCta cta={cta} />
              </div>
              <CtaError cta={cta} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
