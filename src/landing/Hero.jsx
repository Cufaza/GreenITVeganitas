import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { CtaError, PrimaryCta, SecondaryCta } from './ui.jsx';

// [lat, lon] of Argentine cities used as markers
const MARKERS = [
  [-34.6, -58.4], [-31.4, -64.2], [-32.9, -68.8], [-32.95, -60.65], [-26.8, -65.2], [-38.95, -68.06], [-45.86, -67.5], [-24.8, -65.4],
].map((location, i) => ({ location, size: i === 0 ? 0.034 : 0.022 }));

// phi/theta that center the globe on lat/lon (cobe convention). The globe is mostly below the fold,
// so we look from the south: Argentina sits in the visible cap.
const START_PHI = Math.PI - ((-64 * Math.PI) / 180 - Math.PI / 2);
const THETA = -1.25;

/** Sumar's BackgroundBeams (same positions, durations and delays). */
const BEAMS = [
  { left: '6%', duration: 7, delay: 2, height: '56px' },
  { left: '18%', duration: 9, delay: 0, height: '40px' },
  { left: '32%', duration: 11, delay: 3, height: '80px' },
  { left: '46%', duration: 6, delay: 1, height: '48px' },
  { left: '58%', duration: 8, delay: 5, height: '56px' },
  { left: '72%', duration: 5, delay: 2, height: '32px' },
  { left: '88%', duration: 10, delay: 4, height: '24px' },
];

function BackgroundBeams() {
  return (
    <div className="beams-wrap" aria-hidden="true">
      {BEAMS.map((b) => (
        <span key={b.left} className="beam" style={{ left: b.left, height: b.height, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }} />
      ))}
    </div>
  );
}

/**
 * Sumar's Globe port. cobe 2.x has no onRender, so we run our own rAF and call globe.update({ phi }).
 * The land-dot texture loads after the first draw, so frames must keep coming (we only stop when out of view).
 */
function Globe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;

    let phi = START_PHI;
    let globe = null;
    let raf = 0;
    let visible = document.visibilityState === 'visible';
    let inView = true;
    let resizeTimer = 0;
    let warm = 90; // keep drawing a moment even with reduced motion so the land texture shows

    const BASE_SPEED = 0.0014;
    const MAX_BOOST = 0.012;
    const BOOST_DECAY = 0.93;
    let scrollBoost = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();

    // The globe speeds up with scroll velocity, then decays back (sumar)
    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY;
      const dt = Math.max(now - lastScrollAt, 1);
      const delta = Math.min((Math.abs(dy) / dt) * 0.0035, MAX_BOOST);
      scrollBoost = Math.min(scrollBoost + delta, MAX_BOOST);
      lastScrollY = window.scrollY;
      lastScrollAt = now;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const frame = () => {
      raf = 0;
      if (!globe) return;
      if (!reduce) {
        phi += BASE_SPEED + scrollBoost;
        scrollBoost *= BOOST_DECAY;
      }
      globe.update({ phi });
      warm -= 1;
      if (visible && inView && (!reduce || warm > 0)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && globe && visible && inView) raf = requestAnimationFrame(frame);
    };

    const build = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      globe?.destroy();
      globe = null;
      const w = canvas.offsetWidth;
      if (!w) return;
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: w * dpr,
        height: w * dpr,
        phi,
        theta: THETA,
        dark: 1,
        diffuse: 0.4,
        mapSamples: isMobile ? 9000 : 14000,
        mapBrightness: 8,
        baseColor: [0.14, 0.16, 0.15],
        markerColor: [0.48, 0.83, 0.54],
        glowColor: [0.03, 0.06, 0.04],
        markers: MARKERS,
      });
      warm = 90;
      canvas.style.opacity = '1';
      kick();
    };
    build();

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    };
    window.addEventListener('resize', onResize, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
        kick();
      },
      { threshold: 0, rootMargin: '200px 0px' },
    );
    io.observe(canvas);
    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      kick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      globe?.destroy();
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} id="globe-canvas" style={{ opacity: 0, transition: 'opacity 1s ease' }} />;
}

export default function Hero({ cta }) {
  return (
    <header className="hero" id="inicio">
      <BackgroundBeams />
      <div className="hero-inner">
        <div className="hero-left">
          <span className="hero-eyebrow">Calculadora de consumo y huella de carbono IT</span>
          <h1 className="headline">
            <span className="l1">Medí tu consumo,</span>
            <span className="l2">
              <span className="muted">reducí tu </span>
              <em>huella.</em>
            </span>
          </h1>
          <p className="sub">
            En 5 minutos sabés cuánta energía consume tu infraestructura IT, cuánto cuesta y cuánto CO₂ emite.
            <br />
            {' '}Sin instalar nada y sin comprar hardware.
          </p>
          <div className="hero-ctas">
            <PrimaryCta cta={cta} />
            {cta.user ? (
              <a href="#como-funciona" className="link-sec magnet"><span className="arr">↓</span> Ver cómo funciona</a>
            ) : (
              <SecondaryCta cta={cta} />
            )}
          </div>
          <CtaError cta={cta} />
          {!cta.user && <p className="hero-note">Sin registro: la demo carga un departamento universitario simulado con datos de ejemplo.</p>}
        </div>
      </div>
      <div className="globe-wrap" aria-hidden="true">
        <Globe />
      </div>
    </header>
  );
}
