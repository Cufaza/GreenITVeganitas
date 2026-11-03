import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { fmt } from '../lib/format.js';
import { DEMO } from './demo.js';
import { Reveal, SectionHead } from './ui.jsx';

const SLIDES = [
  ['7', 'Energía asequible y no contaminante', 'Saber cuánta electricidad consume tu infraestructura IT es el primer paso para usarla mejor y pagar menos.'],
  ['9', 'Industria, innovación e infraestructura', 'Una infraestructura IT más eficiente en las PyMEs, sin comprar hardware nuevo ni instalar nada.'],
  ['12', 'Producción y consumo responsables', 'Menos energía desperdiciada por cada servicio informático: apagar lo que no se usa y consolidar lo que está ocioso.'],
  ['13', 'Acción por el clima', `Cada plan muestra los kg de CO₂ que se evitan. En el caso de demostración son ${fmt(DEMO.ahorro.co2Anio / 1000, 1)} t de CO₂ menos por año.`],
];
const INTERVAL = 4500;

export default function Ods() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduce = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Autoplay (4.5 s): stops on hover/focus, with the play/pause button, and under reduced motion
  useEffect(() => {
    if (!playing || paused || reduce.current) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [playing, paused]);

  const go = (n) => setI((n + SLIDES.length) % SLIDES.length);
  const [num, name, text] = SLIDES[i];

  return (
    <section className="l-section cv" id="ods" aria-labelledby="ods-title">
      <div className="l-container">
        <SectionHead
          id="ods-title"
          eyebrow="Objetivos de Desarrollo Sostenible"
          title={<>Cuatro ODS, <em>una sola métrica.</em></>}
          lead="GreenIT Calc apunta a estos objetivos de las Naciones Unidas: cada kWh que se deja de consumir baja el costo y las emisiones."
        />
        <Reveal>
          <div
            className="l-carousel"
            role="group"
            aria-roledescription="carrusel"
            aria-label="Objetivos de Desarrollo Sostenible"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div key={i} className="l-slide" role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${SLIDES.length}`} aria-live={playing && !paused ? 'off' : 'polite'}>
              <div className="l-slide-num"><small>ODS</small>{num}</div>
              <div>
                <h3 className="l-h3" style={{ fontSize: 28 }}>{name}</h3>
                <p>{text}</p>
              </div>
            </div>
            <div className="l-carousel-ctrl">
              <button type="button" className="l-icon-btn" aria-label="ODS anterior" onClick={() => go(i - 1)}><ChevronLeft aria-hidden="true" /></button>
              <button type="button" className="l-icon-btn" aria-label="ODS siguiente" onClick={() => go(i + 1)}><ChevronRight aria-hidden="true" /></button>
              <button type="button" className="l-icon-btn" aria-label={playing ? 'Pausar el carrusel' : 'Reanudar el carrusel'} onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
              <div className="l-dot-nav">
                {SLIDES.map(([n], k) => (
                  <button key={n} type="button" aria-label={`Ir al ODS ${n}`} aria-current={k === i} onClick={() => setI(k)} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
