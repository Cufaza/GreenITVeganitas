import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  ArrowDownRight, Bell, Calculator, ClipboardList, FileText, LayoutDashboard, Leaf, Plus, Server, Settings, Zap,
} from 'lucide-react';
import { CATEGORIAS } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { DEMO, MEDIDA_CORTA } from './demo.js';
import { arcPath, curvePath, fillPath, toPoints } from './svg.js';

/* Data: every number comes from the demo case, computed at runtime */

const { totales, despues, ahorro, calculo, plan, recs } = DEMO;
const CORTO = { pc: 'PCs', monitor: 'Monitores', notebook: 'Notebooks', servidor: 'Servidores', red: 'Red' };
const cats = Object.entries(calculo.porCategoria).sort((a, b) => b[1].kWhMes - a[1].kWhMes);
const DONUT_COLORS = ['#14532d', '#2e7d32', '#66bb6a', '#a5d6a7', '#d4ead6'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DONUT = cats.map(([k, v], i) => ({ label: CORTO[k] ?? CATEGORIAS[k], value: Math.round((v.kWhMes / totales.kWhMes) * 100), color: DONUT_COLORS[i % DONUT_COLORS.length] }));
// Projection with today's tariff and no seasonality: cumulative energy cost over 12 months, with and without the plan
const COST_HOY = MONTHS.map((_, i) => totales.costoMes * (i + 1));
const COST_PLAN = MONTHS.map((_, i) => despues.costoMes * (i + 1));
const BAR_GROUPS = cats.map(([k, v]) => ({ label: CORTO[k] ?? CATEGORIAS[k], hoy: v.kWhMes, plan: plan.despues.porCategoria[k]?.kWhMes ?? 0 }));

const KPIS = [
  { label: 'Consumo mensual', value: `${fmt(totales.kWhMes)} kWh`, change: `${fmt(totales.kWhRefrig)} kWh de refrigeración`, Icon: Zap },
  { label: 'Costo por mes', value: fmtARS(totales.costoMes), change: `${fmtARS(totales.costoAnio)} por año`, Icon: FileText },
  { label: 'Huella de carbono', value: `${fmt(totales.co2Mes)} kg`, change: `${fmt(totales.co2Anio / 1000, 2)} t CO₂ por año`, Icon: Leaf },
  { label: 'Ahorro con el plan', value: fmtPct(ahorro.pct), change: `${fmt(despues.kWhMes)} kWh por mes`, Icon: ArrowDownRight, up: true },
];

const MEDIDAS = recs.filter((r) => r.esAplicable).sort((a, b) => b.ahorro.kWhMes - a.ahorro.kWhMes);

const NAV = [
  { label: 'Panel', Icon: LayoutDashboard },
  { label: 'Inventario', Icon: Server },
  { label: 'Plan de ahorro', Icon: ClipboardList },
  { label: 'Cálculos', Icon: Calculator },
  { label: 'Reportes', Icon: FileText },
  { label: 'Ajustes', Icon: Settings },
];

/* Spring config (sumar) */
const SPRING = { stiffness: 80, damping: 22, restDelta: 0.001 };

export default function ProblemDashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const [hovBar, setHovBar] = useState(null);
  const [hovPt, setHovPt] = useState(null);
  const reduce = useReducedMotion();

  const wrapperRef = useRef(null);
  const inViewRef = useRef(null);
  const inView = useInView(inViewRef, { once: true, margin: '-8%' });

  /* scroll progress: 0 when the dashboard top hits the bottom of the viewport, 1 when its center reaches the center */
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start end', 'center center'] });
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const rawRotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const scale = useSpring(rawScale, SPRING);
  const rotateX = useSpring(rawRotateX, SPRING);
  const opacity = useSpring(rawOpacity, { stiffness: 80, damping: 20 });

  /* line chart (two series on one shared scale) */
  const LW = 480;
  const LH = 130;
  const range = [0, COST_HOY[COST_HOY.length - 1]];
  const ptsHoy = toPoints(COST_HOY, LW, LH, 12, range);
  const ptsPlan = toPoints(COST_PLAN, LW, LH, 12, range);
  const lineHoy = curvePath(ptsHoy);
  const linePlan = curvePath(ptsPlan);
  const areaPlan = fillPath(ptsPlan, LH);

  /* bar chart */
  const BH = 96;
  const BW = 13;
  const BGAP = 54;
  const barMax = Math.max(...BAR_GROUPS.map((b) => b.hoy));

  /* donut */
  let cumDeg = 0;
  const arcs = DONUT.map((seg) => {
    const start = cumDeg;
    const end = cumDeg + (seg.value / 100) * 360 - 1.5;
    cumDeg += (seg.value / 100) * 360;
    return { ...seg, start, end };
  });

  const shown = reduce ? true : inView;
  const tilt = reduce ? { transformOrigin: 'center bottom' } : { scale, rotateX, opacity, transformOrigin: 'center bottom' };

  return (
    /* perspective wrapper: needed for the 3-D tilt to work */
    <div ref={wrapperRef} className="dash-wrapper" style={{ perspective: '1400px' }}>
      <motion.div ref={inViewRef} style={tilt}>
        {/* browser chrome */}
        <div className="dash-chrome" aria-hidden="true">
          <div className="dash-chrome-dots"><span /><span /><span /></div>
          <div className="dash-chrome-bar">greenit-calc.app/panel</div>
          <div className="dash-chrome-live"><span className="dash-live-dot" />Datos de demo</div>
        </div>

        {/* dashboard frame (decorative preview of the real panel) */}
        <div
          className="dash-frame"
          role="img"
          aria-label={`Vista previa del panel con el caso de demostración: ${fmt(totales.kWhMes)} kWh por mes, ${fmtARS(totales.costoMes)} por mes y ${fmt(totales.co2Mes)} kg de CO₂ por mes.`}
        >
          <aside className="dash-sidebar">
            <div className="dash-brand">
              <div className="dash-brand-icon"><Leaf size={14} strokeWidth={2.2} /></div>
              <div className="dash-brand-name">GreenIT<span>Calc</span></div>
            </div>
            <nav className="dash-nav">
              {NAV.map(({ label, Icon }, i) => (
                <button key={label} type="button" tabIndex={-1} className={`dash-nav-item${activeNav === i ? ' active' : ''}`} onClick={() => setActiveNav(i)}>
                  <Icon size={14} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="dash-sidebar-foot">
              <div className="dash-av">DI</div>
              <div className="dash-user"><span>DIIT · UNLaM</span><span>Caso simulado</span></div>
            </div>
          </aside>

          <div className="dash-main">
            <header className="dash-header">
              <div>
                <div className="dash-page-title">Panel</div>
                <div className="dash-page-sub">DIIT, UNLaM · caso simulado.</div>
              </div>
              <div className="dash-header-acts">
                <button type="button" tabIndex={-1} className="dash-btn-ghost" aria-label="Notificaciones"><Bell size={14} strokeWidth={1.8} /></button>
                <button type="button" tabIndex={-1} className="dash-btn-primary"><Plus size={12} strokeWidth={2.5} />Agregar equipo</button>
              </div>
            </header>

            <div className="dash-kpis">
              {KPIS.map(({ label, value, change, up, Icon }, i) => (
                <motion.div
                  key={label}
                  className="dash-kpi"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={shown ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2, transition: { duration: 0.12 } }}
                >
                  <div className="dash-kpi-top">
                    <span className="dash-kpi-label">{label}</span>
                    <div className="dash-kpi-icon-wrap"><Icon size={12} strokeWidth={1.8} /></div>
                  </div>
                  <div className="dash-kpi-val">{value}</div>
                  <div className={`dash-kpi-chg ${up ? 'up' : 'nt'}`}>{change}</div>
                </motion.div>
              ))}
            </div>

            <div className="dash-charts-row">
              <div className="dash-card dash-line-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-title">Costo de energía acumulado</div>
                    <div className="dash-card-sub">Proyección a 12 meses · tarifa actual</div>
                  </div>
                  <div className="dash-badge">−{fmtPct(ahorro.pct)} con el plan</div>
                </div>
                <svg viewBox={`0 0 ${LW} ${LH}`} className="dash-line-svg" preserveAspectRatio="none" onMouseLeave={() => setHovPt(null)}>
                  <defs>
                    <linearGradient id="lgrd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#2e7d32" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1={0} y1={LH * f} x2={LW} y2={LH * f} stroke="#ebebeb" strokeWidth="1" />
                  ))}
                  <motion.path d={areaPlan} fill="url(#lgrd)" initial={reduce ? false : { opacity: 0 }} animate={shown ? { opacity: 1 } : {}} transition={{ delay: 0.9, duration: 0.8 }} />
                  <motion.path
                    d={lineHoy} fill="none" stroke="#9ca3a0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4"
                    initial={reduce ? false : { pathLength: 0 }} animate={shown ? { pathLength: 1 } : {}} transition={{ delay: 0.4, duration: 1.4, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d={linePlan} fill="none" stroke="#2e7d32" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
                    initial={reduce ? false : { pathLength: 0 }} animate={shown ? { pathLength: 1 } : {}} transition={{ delay: 0.5, duration: 1.4, ease: 'easeInOut' }}
                  />
                  {ptsPlan.map((pt, i) => (
                    <g key={MONTHS[i]}>
                      <circle cx={pt.x} cy={pt.y} r={18} fill="transparent" style={{ cursor: 'crosshair' }} onMouseEnter={() => setHovPt(i)} />
                      <motion.circle
                        cx={pt.x} cy={pt.y} r={hovPt === i ? 4.5 : 2.8} fill={hovPt === i ? '#2e7d32' : '#fff'} stroke="#2e7d32" strokeWidth="1.6"
                        style={{ transition: 'r 0.12s, fill 0.12s' }}
                        initial={reduce ? false : { opacity: 0 }} animate={shown ? { opacity: 1 } : {}} transition={{ delay: 0.85 + i * 0.04 }}
                      />
                      {hovPt === i && (
                        <g>
                          <line x1={pt.x} y1={0} x2={pt.x} y2={LH} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3 3" />
                          <rect x={Math.min(Math.max(pt.x - 46, 0), LW - 92)} y={Math.max(pt.y - 30, 0)} width={92} height={20} rx={5} fill="#10241a" />
                          <text x={Math.min(Math.max(pt.x, 46), LW - 46)} y={Math.max(pt.y - 16, 14)} fill="#fff" fontSize="9.5" textAnchor="middle" fontFamily="inherit" fontWeight="600">
                            {fmtARS(COST_PLAN[i])}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}
                </svg>
                <div className="dash-line-months">{MONTHS.map((m) => <span key={m}>{m}</span>)}</div>
              </div>

              <div className="dash-card dash-donut-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-title">Dónde se va la energía</div>
                    <div className="dash-card-sub">Por tipo de equipo</div>
                  </div>
                </div>
                <div className="dash-donut-body">
                  <svg viewBox="0 0 160 160" className="dash-donut-svg">
                    {arcs.map((seg, i) => (
                      <motion.path
                        key={seg.label} d={arcPath(80, 80, 52, seg.start, seg.end)} fill="none" stroke={seg.color} strokeWidth="20" strokeLinecap="butt"
                        initial={reduce ? false : { pathLength: 0 }} animate={shown ? { pathLength: 1 } : {}} transition={{ delay: 0.6 + i * 0.18, duration: 0.65, ease: 'easeOut' }}
                      />
                    ))}
                    <text x="80" y="76" textAnchor="middle" fontSize="17" fontWeight="700" fill="#111" fontFamily="inherit">{fmt(totales.kWhMes)}</text>
                    <text x="80" y="90" textAnchor="middle" fontSize="8" fill="#999" fontFamily="inherit">kWh por mes</text>
                  </svg>
                  <div className="dash-donut-legend">
                    {DONUT.map((seg) => (
                      <div key={seg.label} className="dash-leg-item">
                        <span className="dash-leg-dot" style={{ background: seg.color }} />
                        <span className="dash-leg-lbl">{seg.label}</span>
                        <span className="dash-leg-val">{seg.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-bottom-row">
              <div className="dash-card dash-bar-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-title">Consumo por tipo de equipo</div>
                    <div className="dash-card-sub">kWh por mes, hoy vs. con el plan</div>
                  </div>
                  <div className="dash-bar-leg">
                    <span><em className="dot-lt" />Hoy</span>
                    <span><em className="dot-dk" />Con el plan</span>
                  </div>
                </div>
                <svg viewBox={`0 0 ${BAR_GROUPS.length * BGAP + 16} ${BH + 18}`} className="dash-bar-svg" preserveAspectRatio="xMidYMid meet">
                  {BAR_GROUPS.map((g, i) => {
                    const x = 8 + i * BGAP;
                    const hHoy = (g.hoy / barMax) * BH;
                    const hPlan = (g.plan / barMax) * BH;
                    const hover = hovBar === i;
                    return (
                      <g key={g.label} onMouseEnter={() => setHovBar(i)} onMouseLeave={() => setHovBar(null)}>
                        <motion.rect
                          x={x} width={BW} rx={2} fill={hover ? '#c0c0c0' : '#dedede'}
                          initial={reduce ? false : { height: 0, y: BH }} animate={shown ? { height: hHoy, y: BH - hHoy } : {}}
                          transition={{ delay: 0.55 + i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.rect
                          x={x + BW + 3} width={BW} rx={2} fill={hover ? '#1b5e20' : '#2e7d32'}
                          initial={reduce ? false : { height: 0, y: BH }} animate={shown ? { height: hPlan, y: BH - hPlan } : {}}
                          transition={{ delay: 0.62 + i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <text x={x + BW + 1.5} y={BH + 13} textAnchor="middle" fontSize="7.5" fill="#9a9a9a" fontFamily="inherit">{g.label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="dash-card dash-act-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-title">Plan de ahorro</div>
                    <div className="dash-card-sub">Medidas ordenadas por impacto</div>
                  </div>
                </div>
                <div className="dash-act-list">
                  {MEDIDAS.map((r, i) => (
                    <motion.div
                      key={r.id}
                      className="dash-act-item"
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={shown ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                    >
                      <div className="dash-act-av">{i + 1}</div>
                      <div className="dash-act-info">
                        <span className="dash-act-name">{MEDIDA_CORTA[r.id]}</span>
                        <span className="dash-act-action">{fmtARS(r.ahorro.costoMes)} menos por mes</span>
                      </div>
                      <div className="dash-act-right">
                        <span className="dash-act-amt up">−{fmt(r.ahorro.kWhMes)} kWh</span>
                        <span className="dash-act-time">{fmtPct(r.ahorro.pct)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
