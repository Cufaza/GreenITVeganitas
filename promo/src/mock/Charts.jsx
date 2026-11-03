import React from 'react';
import { spring, useVideoConfig } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { inter, geist, C } from '../theme.js';
import { fmt } from '../data.js';
import { tnum } from './ui.jsx';

const IT = 'linear-gradient(180deg,#8FE09B,#2E9B4A)';
const REF = 'linear-gradient(180deg,#3d7a57,#264e3a)';

export const Legend = ({ items }) => (
  <div style={{ display: 'flex', gap: 22, fontFamily: inter, fontSize: 19, color: C.muted }}>
    {items.map((it) => (
      <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <i style={{ width: 14, height: 14, borderRadius: 4, background: it.bg, display: 'inline-block' }} />
        {it.label}
      </span>
    ))}
  </div>
);
export const LEGEND_STACK = [
  { label: 'Equipos IT', bg: IT },
  { label: 'Refrigeración y pérdidas', bg: REF },
];

/**
 * Stacked bars (IT + refrigeración). `values` = [{label, it, ref}] already tweened;
 * `grow` = per-bar 0..1 entrance. Heights are px inside a fixed plot area.
 */
export const StackedBars = ({ values, grow, plotH = 380, barW = 84, max = 600, width, labelSize = 18 }) => {
  const ticks = [0, 150, 300, 450, 600];
  return (
    <div style={{ position: 'relative', height: plotH + 64, width }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotH }}>
        {ticks.map((t) => (
          <div key={t} style={{ position: 'absolute', left: 0, right: 0, bottom: (t / max) * plotH, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            <span style={{ position: 'absolute', left: 0, top: -24, fontFamily: inter, fontSize: 16, color: C.faint, ...tnum }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 52, right: 0, top: 0, height: plotH, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
        {values.map((v, i) => {
          const g = grow[i];
          const hIt = (v.it / max) * plotH * g;
          const hRef = (v.ref / max) * plotH * g;
          return (
            <div key={v.label} style={{ width: barW, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 6, opacity: Math.min(1, g * 1.4), ...tnum }}>
                {fmt(Math.round((v.it + v.ref) * (g > 0.98 ? 1 : g)))}
              </div>
              {hRef > 0.5 && <div style={{ width: '100%', height: hRef, background: REF, borderRadius: '8px 8px 0 0' }} />}
              <div style={{ width: '100%', height: hIt, background: IT, borderRadius: hRef > 0.5 ? 0 : '8px 8px 0 0', boxShadow: '0 0 28px rgba(123,211,137,0.18)' }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 52, right: 0, top: plotH + 12, display: 'flex', justifyContent: 'space-around' }}>
        {values.map((v) => (
          <div key={v.label} style={{ width: barW + 20, textAlign: 'center', fontFamily: inter, fontSize: labelSize, color: C.muted }}>{v.label}</div>
        ))}
      </div>
    </div>
  );
};

/** Per-bar spring growth hook */
export const useGrow = (count, start, delay = 9) => {
  const f = useGF();
  const { fps } = useVideoConfig();
  return Array.from({ length: count }, (_, i) => spring({ frame: f - start - i * delay, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } }));
};
