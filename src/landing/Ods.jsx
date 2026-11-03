import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { fmt } from '../lib/format.js';
import { DEMO } from './demo.js';
import { useReducedMotionQuery } from './ui.jsx';

const SLIDES = [
  { n: '7', name: 'Energía asequible y no contaminante', text: 'Saber cuánta electricidad consume tu infraestructura IT es el primer paso para usarla mejor y pagar menos.' },
  { n: '9', name: 'Industria, innovación e infraestructura', text: 'Una infraestructura IT más eficiente en las PyMEs, sin comprar hardware nuevo ni instalar nada.' },
  { n: '12', name: 'Producción y consumo responsables', text: 'Menos energía desperdiciada por cada servicio informático: apagar lo que no se usa y consolidar lo que está ocioso.' },
  { n: '13', name: 'Acción por el clima', text: `Cada plan muestra los kg de CO₂ que se evitan. En el caso de demostración son ${fmt(DEMO.ahorro.co2Anio / 1000, 1)} t de CO₂ menos por año.` },
];

const AUTOPLAY_MS = 4500;
const N = SLIDES.length;

function shortestOffset(i, active) {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

/**
 * Sumar's testimonials stagger carousel with the ODS as content.
 * Autoplay only changes React state (CSS vars on the cards): it never focuses an element nor scrolls the page,
 * and it only runs while the carousel is on screen, the tab is visible and the user is not hovering/focusing it.
 */
export default function Ods() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const pausedRef = useRef(false);
  const stageRef = useRef(null);
  const reduce = useReducedMotionQuery();

  const next = useCallback(() => setActive((a) => (a + 1) % N), []);
  const prev = useCallback(() => setActive((a) => (a - 1 + N) % N), []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !playing || !onScreen) return undefined;
    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      next();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduce, playing, onScreen, next]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };
  const cur = SLIDES[active];

  return (
    <section className="block tests-section" id="ods" aria-labelledby="ods-title">
      <div className="tests-head">
        <span className="sec-eyebrow reveal">Objetivos de Desarrollo Sostenible</span>
        <h2 className="tests-title reveal d1" id="ods-title">
          Cuatro ODS,
          <br />
          <em>una sola métrica.</em>
        </h2>
        <p className="tests-lead reveal d1">GreenIT Calc apunta a estos objetivos de las Naciones Unidas: cada kWh que se deja de consumir baja el costo y las emisiones.</p>
      </div>

      <div
        ref={stageRef}
        className="stagger-stage reveal d2"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
        role="group"
        aria-roledescription="carrusel"
        aria-label="Objetivos de Desarrollo Sostenible"
      >
        {SLIDES.map((s, i) => {
          const offset = shortestOffset(i, active);
          const abs = Math.abs(offset);
          const visible = abs <= 2;
          return (
            <button
              key={s.n}
              type="button"
              className={`stag-card${offset === 0 ? ' is-active' : ''}`}
              style={{
                '--off': offset,
                '--abs': abs,
                '--sign': Math.sign(offset),
                zIndex: 10 - abs,
                pointerEvents: visible ? 'auto' : 'none',
                opacity: visible ? undefined : 0,
              }}
              onClick={() => setActive(i)}
              tabIndex={offset === 0 ? 0 : -1}
              aria-hidden={offset !== 0}
              aria-label={`ODS ${s.n}: ${s.name}`}
            >
              <div className="stag-avatar" aria-hidden="true">{s.n}</div>
              <q className="stag-quote">{s.text}</q>
              <div className="stag-meta">
                <span className="stag-who">ODS {s.n}</span>
                <span className="stag-sep">·</span>
                <span className="stag-role">{s.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live={playing && !reduce ? 'off' : 'polite'}>{`ODS ${cur.n}: ${cur.name}. ${cur.text}`}</p>

      <div className="stagger-nav">
        <button type="button" className="stag-nav-btn" onClick={prev} aria-label="ODS anterior">
          <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className="stag-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.n}
              type="button"
              aria-current={i === active}
              aria-label={`Ir al ODS ${s.n}`}
              className={`stag-dot${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <button type="button" className="stag-nav-btn" onClick={next} aria-label="ODS siguiente">
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        {!reduce && (
          <button type="button" className="stag-nav-btn stag-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pausar el carrusel' : 'Reanudar el carrusel'}>
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
