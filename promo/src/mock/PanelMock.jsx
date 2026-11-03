import React from 'react';
import { useGF } from '../core/frame.jsx';
import { Stagger } from '../core/Stagger.jsx';
import { Glass } from '../core/Glass.jsx';
import { T } from '../timeline.js';
import { inter, geist, C } from '../theme.js';
import { BASE, PLAN, SAVING, CATS, fmt, fmtARS } from '../data.js';
import { KPI_RECT, CHART_A, CHART_B } from './layout.js';
import { prog, tnum } from './ui.jsx';
import { StackedBars, Legend, LEGEND_STACK, useGrow } from './Charts.jsx';

// font size that keeps the FINAL value + unit inside the card (stable while counting up)
const fitSize = (finalValue, unit) => Math.min(54, Math.floor((302 - 48 - 22 * 0.52 * unit.length - 14) / (0.6 * finalValue.length)));

const KpiCard = ({ i, label, value, unit, sub, accent, final }) => {
  const r = KPI_RECT(i);
  return (
    <Stagger start={T.kpiStart} i={i} delay={14} y={46} scale={0.9} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h }}>
      <Glass
        glow={accent}
        style={{
          width: r.w, height: r.h, boxSizing: 'border-box', padding: '22px 24px', fontFamily: inter,
          borderColor: accent ? 'rgba(123,211,137,0.35)' : undefined,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, color: accent ? C.green : C.muted }}>{label}</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 10, ...tnum }}>
          <span style={{ fontFamily: geist, fontWeight: 600, fontSize: fitSize(final, unit), color: C.text, letterSpacing: -1, whiteSpace: 'nowrap' }}>{value}</span>
          <span style={{ fontSize: 22, color: C.muted, whiteSpace: 'nowrap' }}>{unit}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 18, color: C.faint, ...tnum }}>{sub}</div>
      </Glass>
    </Stagger>
  );
};

export const PanelMock = () => {
  const f = useGF();
  const cnt = (i) => prog(f, T.countStart + i * 10, T.countEnd + i * 10);
  const grow = useGrow(5, T.barsStart, 9);
  const growB = useGrow(2, T.barsStart + 50, 14);
  const values = CATS.map((c) => c.base);
  const labeled = CATS.map((c, i) => ({ label: c.label, ...values[i] }));

  const barH = 440;
  const maxKg = BASE.co2Mes;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <KpiCard i={0} final={fmt(Math.round(BASE.kWhMes))} label="Consumo mensual" value={fmt(Math.round(BASE.kWhMes * cnt(0)))} unit="kWh" sub={`${fmt(Math.round(BASE.kWhAnio))} kWh por año`} />
      <KpiCard i={1} final={fmtARS(BASE.costoMes)} label="Costo mensual" value={fmtARS(Math.round(BASE.costoMes * cnt(1)))} unit="" sub={`${fmtARS(BASE.costoAnio)} por año`} />
      <KpiCard i={2} final={fmt(Math.round(BASE.co2Mes))} label="Huella de carbono" value={fmt(Math.round(BASE.co2Mes * cnt(2)))} unit="kg CO₂" sub={`${fmt(BASE.co2Anio / 1000, 1)} t CO₂ por año`} />
      <KpiCard i={3} accent final={`${fmt(Math.round(SAVING.pct))}%`} label="Ahorro posible con el plan" value={`${fmt(Math.round(SAVING.pct * cnt(3)))}%`} unit="" sub={`${fmt(Math.round(SAVING.kWhMes))} kWh menos por mes`} />

      <Stagger start={T.kpiStart + 60} y={50} scale={0.96} style={{ position: 'absolute', left: CHART_A.x, top: CHART_A.y, width: CHART_A.w, height: CHART_A.h }}>
        <Glass style={{ width: CHART_A.w, height: CHART_A.h, boxSizing: 'border-box', padding: '28px 30px', fontFamily: inter }}>
          <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 26, color: C.text }}>Consumo por tipo (kWh/mes)</div>
          <div style={{ margin: '14px 0 44px' }}><Legend items={LEGEND_STACK} /></div>
          <StackedBars values={labeled} grow={grow} plotH={barH} barW={88} width={CHART_A.w - 60} />
        </Glass>
      </Stagger>

      <Stagger start={T.kpiStart + 80} y={50} scale={0.96} style={{ position: 'absolute', left: CHART_B.x, top: CHART_B.y, width: CHART_B.w, height: CHART_B.h }}>
        <Glass style={{ width: CHART_B.w, height: CHART_B.h, boxSizing: 'border-box', padding: '28px 30px', fontFamily: inter }}>
          <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 26, color: C.text }}>Hoy vs. con el plan</div>
          <div style={{ marginTop: 6, fontSize: 19, color: C.muted }}>kg CO₂ por mes</div>
          <div style={{ position: 'relative', height: barH, marginTop: 56, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
            {[
              { l: 'Hoy', v: BASE.co2Mes, bg: 'linear-gradient(180deg,#6c7a76,#3b4642)' },
              { l: 'Con el plan', v: PLAN.co2Mes, bg: 'linear-gradient(180deg,#8FE09B,#2E9B4A)' },
            ].map((b, i) => (
              <div key={b.l} style={{ width: 130, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 24, color: C.text, marginBottom: 8, opacity: Math.min(1, growB[i] * 1.4), ...tnum }}>{fmt(Math.round(b.v))} kg</div>
                <div style={{ width: '100%', height: (b.v / maxKg) * barH * 0.88 * growB[i], background: b.bg, borderRadius: '10px 10px 0 0', boxShadow: i ? '0 0 30px rgba(123,211,137,0.25)' : 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, fontSize: 20, color: C.muted }}>
            <span style={{ width: 130, textAlign: 'center' }}>Hoy</span>
            <span style={{ width: 130, textAlign: 'center', color: C.green }}>Con el plan</span>
          </div>
        </Glass>
      </Stagger>
    </div>
  );
};
