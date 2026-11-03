import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { CtaError, PrimaryCta, SecondaryCta } from './ui.jsx';

// [lat, lon] of Argentine cities used as markers
const MARKERS = [
  [-34.6, -58.4], [-31.4, -64.2], [-32.9, -68.8], [-32.95, -60.65], [-26.8, -65.2], [-38.95, -68.06], [-45.86, -67.5], [-24.8, -65.4],
].map((location) => ({ location, size: 0.05 }));

// phi/theta that center the globe on lat/lon (cobe convention); the globe is half hidden, so we aim south of Argentina
const START_PHI = Math.PI - ((-64 * Math.PI) / 180 - Math.PI / 2);
const THETA = -0.85;

function Globe() {
  const wrap = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let globe;
    let phi = START_PHI;
    let visible = true;
    let timer = 0;

    const build = () => {
      globe?.destroy();
      const w = el.offsetWidth;
      if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      globe = createGlobe(el, {
        devicePixelRatio: dpr,
        width: w * dpr,
        height: w * dpr,
        phi,
        theta: THETA,
        dark: 1,
        diffuse: 1.1,
        mapSamples: 16000,
        mapBrightness: 5,
        baseColor: [0.06, 0.13, 0.09],
        markerColor: [0.48, 0.83, 0.54],
        glowColor: [0.05, 0.16, 0.1],
        markers: MARKERS,
        onRender: (state) => {
          if (!reduce && visible) phi += 0.0022;
          state.phi = phi;
        },
      });
      requestAnimationFrame(() => el.classList.add('is-ready'));
    };

    build();
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    };
    window.addEventListener('resize', onResize);
    // Pause the rotation when the hero is out of view
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (wrap.current) io.observe(wrap.current);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      globe?.destroy();
    };
  }, []);

  return (
    <div className="l-globe" ref={wrap} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}

const BEAMS = [8, 19, 31, 44, 56, 68, 79, 91];

export default function Hero({ cta }) {
  return (
    <section className="l-hero" id="top" aria-labelledby="hero-title">
      <div className="l-glow" aria-hidden="true" />
      <div className="l-beams" aria-hidden="true">
        {BEAMS.map((left, i) => (
          <span key={left} className="l-beam" style={{ left: `${left}%`, animationDelay: `${(i * 1.3) % 7}s`, animationDuration: `${6 + (i % 3) * 1.5}s` }} />
        ))}
      </div>
      <div className="l-container l-hero-in">
        <p className="l-eyebrow hero-rise">Calculadora de consumo y huella de carbono IT</p>
        <h1 className="l-h1 hero-rise h1" id="hero-title">
          Medí tu consumo,<br />
          <span className="l-muted">reducí tu <em>huella.</em></span>
        </h1>
        <p className="l-lead hero-rise h2">
          En 5 minutos sabés cuánta energía consume tu infraestructura IT, cuánto cuesta y cuánto CO₂ emite, con un plan de ahorro ordenado por impacto. Sin instalar nada y sin comprar hardware.
        </p>
        <div className="l-hero-cta hero-rise h3">
          <PrimaryCta cta={cta} />
          <SecondaryCta cta={cta} />
        </div>
        <div className="hero-rise h4"><CtaError cta={cta} /></div>
        <p className="l-hero-note hero-rise h5">Sin registro: la demo carga una empresa ficticia con datos de ejemplo.</p>
      </div>
      <Globe />
    </section>
  );
}
