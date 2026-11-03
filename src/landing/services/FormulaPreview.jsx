import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import createGlobe from 'cobe';
import { fmt, fmtARS } from '../../lib/format.js';
import { DEMO } from '../demo.js';
import { useReducedMotionQuery } from '../ui.jsx';

// Token colors: comment, identifier, operator, number
const COLORS = { cm: '#848c96', id: '#d1d5d3', op: '#7d8582', nu: '#7bd389' };
const fila = DEMO.calculo.filas[0];

const CODE = [
  { parts: [{ t: 'cm', v: `// ${fila.nombre}` }] },
  { parts: [{ t: 'id', v: 'kWh_semana' }, { t: 'op', v: ' = ' }, { t: 'id', v: 'cantidad' }, { t: 'op', v: ' × (' }, { t: 'id', v: 'P_uso' }, { t: 'op', v: ' × ' }, { t: 'id', v: 'h_uso' }] },
  { parts: [{ t: 'op', v: '   + ' }, { t: 'id', v: 'P_reposo' }, { t: 'op', v: ' × ' }, { t: 'id', v: 'h_reposo' }] },
  { parts: [{ t: 'op', v: '   + ' }, { t: 'id', v: 'P_apagado' }, { t: 'op', v: ' × ' }, { t: 'id', v: 'h_apagado' }, { t: 'op', v: ') ÷ ' }, { t: 'nu', v: '1000' }] },
  { parts: [{ t: 'id', v: 'kWh_mes' }, { t: 'op', v: '    = ' }, { t: 'id', v: 'kWh_semana' }, { t: 'op', v: ' × ' }, { t: 'nu', v: '52' }, { t: 'op', v: ' ÷ ' }, { t: 'nu', v: '12' }] },
  { parts: [{ t: 'id', v: 'costo_mes' }, { t: 'op', v: '  = ' }, { t: 'id', v: 'kWh_mes' }, { t: 'op', v: ' × ' }, { t: 'id', v: 'tarifa' }] },
  { parts: [{ t: 'id', v: 'co2_mes' }, { t: 'op', v: '    = ' }, { t: 'id', v: 'kWh_mes' }, { t: 'op', v: ' × ' }, { t: 'id', v: 'factor_emision' }] },
];

const lineLen = (line) => line.parts.map((p) => p.v).join('').length;
const TOTAL = CODE.reduce((acc, l) => acc + lineLen(l) + 1, 0) - 1;
const FADE = [0.16, 1, 0.3, 1];

// Buenos Aires, the pinned location of the final globe
const MARKERS = [{ location: [-34.6, -58.4], size: 0.09 }, { location: [-31.4, -64.2], size: 0.05 }, { location: [-32.9, -68.8], size: 0.05 }];

function GlobeMini({ visible, reduce }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    let globe = null;
    let raf = 0;
    let phi = Math.PI - ((-64 * Math.PI) / 180 - Math.PI / 2);
    let alive = true;
    let frames = 0;
    const start = requestAnimationFrame(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth || 160;
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: w * dpr,
        height: w * dpr,
        phi,
        theta: -0.9,
        dark: 1,
        diffuse: 0.5,
        mapSamples: 8000,
        mapBrightness: 10,
        baseColor: [0.2, 0.28, 0.23],
        markerColor: [0.48, 0.83, 0.54],
        glowColor: [0.1, 0.2, 0.13],
        markers: MARKERS,
      });
      canvas.style.opacity = '1';
      const tick = () => {
        if (!alive) return;
        if (!reduce) phi += 0.005;
        globe.update({ phi });
        frames += 1;
        if (!reduce || frames < 90) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(start);
      cancelAnimationFrame(raf);
      globe?.destroy();
    };
  }, [visible, reduce]);

  return <canvas ref={ref} className="dev-globe" style={{ opacity: 0, transition: 'opacity 1s ease' }} aria-hidden="true" />;
}

/** Sumar's DevCodePreview: the calculation formulas type themselves; the result on the right appears as lines complete. */
export default function FormulaPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduce = useReducedMotionQuery();
  const [typed, setTyped] = useState(0);
  const count = reduce ? TOTAL : typed;

  useEffect(() => {
    if (!inView || reduce) return undefined;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= TOTAL) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [inView, reduce]);

  let remaining = count;
  const lineVisible = CODE.map((line) => {
    const len = lineLen(line);
    const vis = Math.max(0, Math.min(len, remaining));
    remaining = Math.max(0, remaining - len - 1);
    return vis;
  });
  const lineDone = CODE.map((line, i) => lineVisible[i] >= lineLen(line));
  const activeLineIdx = lineVisible.findIndex((vis, i) => vis < lineLen(CODE[i]) && vis > 0);

  const showName = lineDone[1];
  const showKwh = lineDone[4];
  const showCost = lineDone[5];
  const showCo2 = lineDone[6];

  const fade = (on, delay = 0) => ({ initial: false, animate: { opacity: on ? 1 : 0, y: on ? 0 : 6 }, transition: { duration: 0.45, ease: FADE, delay } });

  return (
    <div ref={ref} className="dev-wrap">
      {/* Left: code editor */}
      <div className="dev-editor">
        <div className="dev-tabs">
          <div className="dev-dots"><span className="dev-dot-r" /><span className="dev-dot-y" /><span className="dev-dot-g" /></div>
          <div className="dev-tab dev-tab--active">calculo.js</div>
          <div className="dev-tab">fuentes.js</div>
        </div>
        <div className="dev-code" role="img" aria-label="Fórmulas del cálculo: kWh por semana, kWh por mes, costo por mes y CO₂ por mes">
          {CODE.map((line, li) => {
            if (lineVisible[li] <= 0) return null;
            let pos = 0;
            const isCurrent = count < TOTAL && li === activeLineIdx;
            return (
              <div key={li} className="dev-line">
                <span className="dev-ln">{li + 1}</span>
                <span className="dev-text">
                  {line.parts.map((part, pi) => {
                    const start = pos;
                    pos += part.v.length;
                    const vis = Math.max(0, Math.min(part.v.length, lineVisible[li] - start));
                    if (vis <= 0) return null;
                    return <span key={pi} style={{ color: COLORS[part.t] }}>{part.v.slice(0, vis)}</span>;
                  })}
                  {isCurrent && <span className="dev-cursor">█</span>}
                  {count >= TOTAL && li === CODE.length - 1 && <span className="dev-cursor">█</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: the result, as the app shows it */}
      <div className="dev-preview" aria-hidden="true">
        <div className="dev-preview-bar"><div className="dev-preview-url">greenit-calc.app/calculos</div></div>
        <div className="dev-preview-page">
          <div className="dev-nav">
            <div className="dev-brand"><div className="dev-logo" /><span>GreenIT Calc</span></div>
            <div className="dev-nav-links"><span>Panel</span><span>Plan</span><span className="dev-nav-on">Cálculos</span></div>
          </div>

          <div className="dev-content-center">
            <div className="dev-hero">
              <motion.p className="dev-eyebrow" {...fade(showName)}>{fila.cantidad} × {fila.nombre}</motion.p>
              <motion.h4 className="dev-h1" {...fade(showKwh)}>{fmt(fila.kWhMes)} kWh por mes</motion.h4>
              <motion.p className="dev-desc" {...fade(showCost)}>{fmtARS(fila.costoMes)} de energía por mes</motion.p>
              <motion.div className="dev-ctas" {...fade(showCo2)}>
                <span className="dev-cta-primary">{fmt(fila.co2Mes)} kg CO₂ por mes</span>
              </motion.div>
            </div>
          </div>

          <motion.div className="dev-globe-wrap" initial={false} animate={{ opacity: showCo2 ? 1 : 0 }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}>
            <GlobeMini visible={showCo2} reduce={reduce} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
