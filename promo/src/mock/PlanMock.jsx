import React from 'react';
import { spring, useVideoConfig, interpolate } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { Stagger } from '../core/Stagger.jsx';
import { Glass } from '../core/Glass.jsx';
import { hoverAmount, isPress } from '../core/cursorModel.js';
import { T, MEASURE_CLICKS, FPS } from '../timeline.js';
import { inter, geist, C } from '../theme.js';
import { BASE, PLAN, SAVING, MEASURES, CATS, fmt, fmtARS } from '../data.js';
import { MEASURE_RECT, APPLY_RECT, RESULT_RECT, PLAN_CHART_RECT } from './layout.js';
import { prog, lerp, tnum, Icon, OUT } from './ui.jsx';
import { StackedBars, Legend, LEGEND_STACK } from './Charts.jsx';

const Check = ({ on, f, since }) => {
  const { fps } = useVideoConfig();
  const pop = on ? spring({ frame: f - since, fps, config: { damping: 9, stiffness: 220, mass: 0.5 } }) : 0;
  const draw = on ? prog(f, since + 2, since + 12) : 0;
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: 12, boxSizing: 'border-box',
        border: on ? 'none' : '2px solid rgba(255,255,255,0.28)',
        background: on ? 'linear-gradient(135deg,#7BD389,#2E9B4A)' : 'rgba(255,255,255,0.04)',
        transform: `scale(${on ? 0.8 + 0.2 * pop : 1})`,
        display: 'grid', placeItems: 'center',
        boxShadow: on ? '0 0 24px rgba(123,211,137,0.5)' : 'none',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06130a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: on ? 1 : 0 }}>
        <path d="M5 12.5 10 17.5 19 7" strokeDasharray="22" strokeDashoffset={22 * (1 - draw)} />
      </svg>
    </div>
  );
};

const Measure = ({ i, f }) => {
  const r = MEASURE_RECT(i);
  const m = MEASURES[i];
  const since = MEASURE_CLICKS[i];
  const on = f >= since;
  const h = hoverAmount(`measure-${i}`, f);
  const press = isPress(`measure-${i}`, f);
  return (
    <Stagger start={T.pageSwitch + 6} i={i} delay={7} y={40} scale={0.94} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h }}>
      <Glass
        glow={on}
        style={{
          width: r.w, height: r.h, boxSizing: 'border-box', fontFamily: inter,
          background: on ? 'rgba(123,211,137,0.09)' : `rgba(255,255,255,${0.045 + 0.04 * h})`,
          borderColor: on ? 'rgba(123,211,137,0.5)' : `rgba(255,255,255,${0.09 + 0.1 * h})`,
          transform: press ? 'scale(0.985)' : undefined,
        }}
      >
        <div style={{ position: 'absolute', left: 24, top: 51 }}><Check on={on} f={f} since={since} /></div>
        <div style={{ position: 'absolute', left: 92, top: 22, right: 26 }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1.28 }}>{m.titulo}</div>
          <div style={{ marginTop: 10, fontSize: 21, color: C.green, fontWeight: 500, ...tnum }}>
            Ahorra {fmt(Math.round(m.kWhMes))} kWh por mes · {fmtARS(m.costoMes)}
          </div>
        </div>
      </Glass>
    </Stagger>
  );
};

const Burst = ({ f, t0 }) => {
  const a = f - t0;
  if (a < 0 || a > 40) return null;
  const k = a / 40;
  const e = 1 - Math.pow(1 - k, 3);
  return (
    <div style={{ position: 'absolute', left: 210, top: 42, pointerEvents: 'none' }}>
      {Array.from({ length: 14 }, (_, n) => {
        const ang = (n / 14) * Math.PI * 2;
        const r0 = 34 + e * 26;
        const r1 = r0 + 26 * (1 - k) + 6;
        return (
          <div
            key={n}
            style={{
              position: 'absolute', left: Math.cos(ang) * r0, top: Math.sin(ang) * r0, width: Math.hypot(Math.cos(ang) * (r1 - r0), Math.sin(ang) * (r1 - r0)) + 0, height: 5, borderRadius: 3,
              background: n % 3 === 0 ? C.orange : C.green, opacity: 1 - k, transformOrigin: '0 50%', transform: `rotate(${ang}rad)`,
            }}
          />
        );
      })}
      <div style={{ position: 'absolute', left: -60 * e - 20, top: -60 * e - 20, width: 120 * e + 40, height: 120 * e + 40, borderRadius: '50%', border: '3px solid rgba(123,211,137,0.8)', opacity: 1 - k }} />
    </div>
  );
};

const Metric = ({ i, label, a, b, fmtFn, unit, m, f }) => {
  const v = lerp(a, b, m);
  return (
    <div style={{ position: 'absolute', left: 30, right: 30, top: 84 + i * 100, height: 92, fontFamily: inter }}>
      <div style={{ fontSize: 20, color: C.muted }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4, ...tnum }}>
        <span style={{ fontFamily: geist, fontWeight: 600, fontSize: 52, letterSpacing: -1, color: m > 0.02 ? lerpColor(m) : C.text }}>{fmtFn(Math.round(v))}</span>
        <span style={{ fontSize: 22, color: C.muted }}>{unit}</span>
        <span style={{ marginLeft: 'auto', fontSize: 19, color: C.faint, opacity: m, textDecoration: 'line-through', textDecorationColor: 'rgba(255,255,255,0.25)' }}>{fmtFn(Math.round(a))}</span>
      </div>
    </div>
  );
};
const lerpColor = (m) => `rgb(${Math.round(lerp(242, 123, m))},${Math.round(lerp(246, 211, m))},${Math.round(lerp(243, 137, m))})`;

export const PlanMock = () => {
  const f = useGF();
  const { fps } = useVideoConfig();
  const selected = MEASURE_CLICKS.filter((c) => f >= c).length;
  const applied = f >= T.applyClick;
  const m = prog(f, T.morphStart, T.morphEnd, OUT);
  const hApply = hoverAmount('apply', f);
  const pressApply = isPress('apply', f);
  const badge = spring({ frame: f - T.badgePop, fps, config: { damping: 8, stiffness: 180, mass: 0.6 } });
  const gr = (i) => spring({ frame: f - (T.pageSwitch + 24) - i * 9, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });

  const vals = CATS.map((c) => ({ label: c.label, it: lerp(c.base.it, c.plan.it, m), ref: lerp(c.base.ref, c.plan.ref, m) }));
  const grow = CATS.map((_, i) => gr(i));
  const R = RESULT_RECT;
  const P = PLAN_CHART_RECT;
  const showPlan = m > 0.5;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stagger start={T.pageSwitch + 2} y={20} scale={1} style={{ position: 'absolute', left: 296, top: 104, width: 680 }}>
        <div style={{ fontFamily: inter, fontSize: 24, color: C.muted, lineHeight: 1.35 }}>Marcá las medidas y mirá cuánto ahorrás.</div>
      </Stagger>
      {[0, 1, 2].map((i) => <Measure key={i} i={i} f={f} />)}

      {/* Apply button */}
      <Stagger start={T.pageSwitch + 26} y={30} scale={0.95} style={{ position: 'absolute', left: APPLY_RECT.x, top: APPLY_RECT.y, width: APPLY_RECT.w, height: APPLY_RECT.h }}>
        <div style={{ position: 'relative', width: APPLY_RECT.w, height: APPLY_RECT.h, transform: `scale(${pressApply ? 0.97 : 1})` }}>
          <div
            style={{
              width: '100%', height: '100%', borderRadius: 22, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              fontFamily: geist, fontWeight: 600, fontSize: 30, color: '#04120a',
              background: applied
                ? 'linear-gradient(135deg,#A2EDAE,#4FBF63)'
                : `linear-gradient(135deg, rgb(${Math.round(lerp(110, 150, hApply))},${Math.round(lerp(200, 232, hApply))},${Math.round(lerp(125, 160, hApply))}), rgb(${Math.round(lerp(46, 70, hApply))},${Math.round(lerp(155, 185, hApply))},${Math.round(lerp(74, 95, hApply))}))`,
              boxShadow: `0 0 ${24 + 50 * hApply + (applied ? 30 : 0)}px rgba(123,211,137,${0.28 + 0.4 * hApply + (applied ? 0.2 : 0)}), inset 0 1px 0 rgba(255,255,255,0.45)`,
            }}
          >
            <Icon name={applied ? 'check' : 'bolt'} size={32} sw={3} />
            {applied ? 'Plan aplicado' : 'Aplicar plan'}
          </div>
          <Burst f={f} t0={T.applyClick} />
        </div>
      </Stagger>
      <div style={{ position: 'absolute', left: 296, top: APPLY_RECT.y + APPLY_RECT.h + 22, fontFamily: inter, fontSize: 22, color: C.muted, ...tnum }}>
        {applied ? `Ahorrás ${fmt(Math.round(SAVING.kWhMes))} kWh por mes` : `${selected} de 3 medidas seleccionadas`}
      </div>

      {/* Results */}
      <Stagger start={T.pageSwitch + 14} y={40} scale={0.95} style={{ position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h }}>
        <Glass glow={m > 0.05} style={{ width: R.w, height: R.h, boxSizing: 'border-box', fontFamily: inter }}>
          <div style={{ position: 'absolute', left: 30, top: 26, fontFamily: geist, fontWeight: 600, fontSize: 28, color: C.text }}>
            {showPlan ? 'Con el plan' : 'Hoy'}
          </div>
          <div
            style={{
              position: 'absolute', right: 28, top: 20, padding: '6px 20px', borderRadius: 999, fontFamily: geist, fontWeight: 700, fontSize: 32,
              background: 'linear-gradient(135deg,#A2EDAE,#4FBF63)', color: '#04120a', ...tnum,
              transform: `scale(${Math.max(0, badge)})`, opacity: Math.min(1, badge * 2), boxShadow: '0 0 40px rgba(123,211,137,0.55)',
            }}
          >
            −{fmt(Math.round(SAVING.pct))} %
          </div>
          <Metric i={0} f={f} m={m} label="Consumo mensual" a={BASE.kWhMes} b={PLAN.kWhMes} fmtFn={fmt} unit="kWh" />
          <Metric i={1} f={f} m={m} label="Costo mensual" a={BASE.costoMes} b={PLAN.costoMes} fmtFn={fmtARS} unit="" />
          <Metric i={2} f={f} m={m} label="Huella de carbono" a={BASE.co2Mes} b={PLAN.co2Mes} fmtFn={fmt} unit="kg CO₂" />
        </Glass>
      </Stagger>

      <Stagger start={T.pageSwitch + 22} y={40} scale={0.95} style={{ position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h }}>
        <Glass style={{ width: P.w, height: P.h, boxSizing: 'border-box', padding: '24px 26px', fontFamily: inter }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 24, color: C.text }}>Consumo por tipo (kWh/mes)</div>
            <div style={{ fontSize: 20, color: showPlan ? C.green : C.muted, fontWeight: 600 }}>{showPlan ? 'Con el plan' : 'Hoy'}</div>
          </div>
          <div style={{ margin: '10px 0 36px' }}><Legend items={LEGEND_STACK} /></div>
          <StackedBars values={vals} grow={grow} plotH={230} barW={58} width={P.w - 52} labelSize={16} />
        </Glass>
      </Stagger>
    </div>
  );
};
