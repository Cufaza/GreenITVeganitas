import React from 'react';
import { interpolate } from 'remotion';
import { useGF } from './frame.jsx';
import { cursorPos, clickEvents } from './cursorModel.js';
import { CURSOR_FADE_IN, CURSOR_FADE_OUT } from '../timeline.js';

/** Stylised macOS arrow. Lives in mockup space (inside <Camera>), tip = hotspot. */
export const Cursor = ({ size = 1.25 }) => {
  const f = useGF();
  const { x, y } = cursorPos(f);
  const opacity =
    interpolate(f, CURSOR_FADE_IN, [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    interpolate(f, CURSOR_FADE_OUT, [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (opacity <= 0) return null;

  // click: scale 1 -> .85 held ~6 frames -> 1
  let scale = 1;
  for (const c of clickEvents) {
    scale = Math.min(scale, interpolate(f, [c.f - 2, c.f, c.f + 6, c.f + 12], [1, 0.85, 0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  }

  return (
    <>
      {clickEvents.map((c) => {
        const age = f - c.f;
        if (age < 0 || age > 28) return null;
        const t = age / 28;
        const r = 8 + 52 * (1 - Math.pow(1 - t, 3));
        return (
          <div
            key={c.f}
            style={{
              position: 'absolute', left: c.x - r, top: c.y - r, width: r * 2, height: r * 2, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.85)', boxShadow: '0 0 24px rgba(123,211,137,0.55)',
              opacity: (1 - t) * 0.8, pointerEvents: 'none',
            }}
          />
        );
      })}
      <div style={{ position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none', zIndex: 50 }}>
        <svg
          width={28 * size}
          height={34 * size}
          viewBox="0 0 28 34"
          style={{
            position: 'absolute', left: -3 * size, top: -2 * size, overflow: 'visible',
            transform: `scale(${scale})`, transformOrigin: `${3 * size}px ${2 * size}px`,
            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
          }}
        >
          <path d="M3 2 L3 26 L9.2 20.4 L13.6 30.2 L18 28.2 L13.7 18.8 L22 18.8 Z" fill="#fff" stroke="#0b0f12" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};
