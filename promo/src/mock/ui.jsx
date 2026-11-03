import React from 'react';
import { Easing, interpolate } from 'remotion';

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const OUT = Easing.out(Easing.cubic);
export const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

/** progress 0..1 between two frames */
export const prog = (f, a, b, easing = OUT) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const lerp = (a, b, t) => a + (b - a) * t;

export const tnum = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

const PATHS = {
  panel: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  inventario: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></>,
  plan: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
  calculos: <><rect x="4" y="2" width="16" height="20" rx="2.5" /><path d="M8 6h8" /><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" /></>,
  check: <path d="M5 12.5 10 17.5 19 7" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};
export const Icon = ({ name, size = 26, color = 'currentColor', sw = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {PATHS[name]}
  </svg>
);
