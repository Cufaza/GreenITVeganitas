import React from 'react';
import { Easing, interpolate } from 'remotion';
import { useGF } from './frame.jsx';
import { MOCK } from '../mock/layout.js';
import { WIDTH, HEIGHT } from '../timeline.js';

export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const SMOOTH = Easing.bezier(0.45, 0, 0.2, 1);
export const GLIDE = Easing.inOut(Easing.sin);

const DEFAULT = { x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0, blur: 0 };

/**
 * Pose that makes a mockup-space rect fill the frame (rotations pivot on screen centre,
 * so the rect centre stays centred whatever the tilt).
 */
export const zoomTo = (rect, extra = {}, pad = 0.95) => {
  const s = Math.min(WIDTH / rect.w, HEIGHT / rect.h) * pad;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return { x: -s * (cx - MOCK.w / 2), y: -s * (cy - MOCK.h / 2), s, ...extra };
};

/**
 * keys: [{ f, ...pose, ease? }]. `ease` on a key shapes the segment that ENDS at that key.
 */
export const samplePose = (frame, keys) => {
  const out = {};
  for (const prop of Object.keys(DEFAULT)) {
    const pts = keys.map((k) => ({ f: k.f, v: k[prop] ?? DEFAULT[prop], ease: k.ease }));
    if (frame <= pts[0].f) { out[prop] = pts[0].v; continue; }
    const last = pts[pts.length - 1];
    if (frame >= last.f) { out[prop] = last.v; continue; }
    let i = 0;
    while (frame > pts[i + 1].f) i++;
    out[prop] = interpolate(frame, [pts[i].f, pts[i + 1].f], [pts[i].v, pts[i + 1].v], {
      easing: pts[i + 1].ease || EXPO,
    });
  }
  return out;
};

/**
 * Single 3D wrapper per scene. Keyframes in global frames + always-on hand-held drift.
 */
export const Camera = ({ keys, drift = 1, opacity = 1, children }) => {
  const f = useGF();
  const p = samplePose(f, keys);
  const dx = Math.sin(f / 97) * 7 * drift;
  const dy = Math.cos(f / 83) * 5 * drift;
  const drz = Math.sin(f / 151) * 0.22 * drift;
  const drx = Math.sin(f / 119 + 1) * 0.35 * drift;
  const dry = Math.cos(f / 131) * 0.35 * drift;
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: 2200, perspectiveOrigin: '50% 50%', overflow: 'hidden', opacity }}>
      <div
        style={{
          position: 'absolute',
          left: (WIDTH - MOCK.w) / 2,
          top: (HEIGHT - MOCK.h) / 2,
          width: MOCK.w,
          height: MOCK.h,
          transformOrigin: '50% 50%',
          transform: `rotateX(${p.rx + drx}deg) rotateY(${p.ry + dry}deg) rotateZ(${p.rz + drz}deg) translate3d(${p.x + dx}px, ${p.y + dy}px, ${p.z}px) scale(${p.s})`,
          filter: p.blur > 0.05 ? `blur(${p.blur}px)` : undefined,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};
