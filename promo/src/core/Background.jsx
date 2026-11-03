import React from 'react';
import { interpolate } from 'remotion';
import { useGF } from './frame.jsx';
import { C } from '../theme.js';
import { WIDTH, HEIGHT } from '../timeline.js';

const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2'/></filter><rect width='256' height='256' filter='url(#n)'/></svg>";
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

const hash = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const Glow = ({ x, y, size, color, alpha }) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color}, transparent)`,
      opacity: alpha,
    }}
  />
);

/**
 * layer="back": near-black base + drifting brand glows + dot grid.
 * layer="front": film grain (tile offset per frame) + vignette over everything.
 */
export const Background = ({ layer = 'back' }) => {
  const f = useGF();
  const boost = interpolate(f, [2200, 2300], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }); // CTA glow lift
  if (layer === 'front') {
    return (
      <>
        <div
          style={{
            position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '256px 256px',
            backgroundPosition: `${Math.floor(hash(f) * 256)}px ${Math.floor(hash(f + 91) * 256)}px`,
            opacity: 0.075, mixBlendMode: 'overlay', pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(0,0,0,0.72) 100%)',
          }}
        />
      </>
    );
  }
  const bloom = interpolate(f, [0, 100], [0, 1], { extrapolateRight: 'clamp' }) * (1 + boost * 0.35);
  const a = f / 200;
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, overflow: 'hidden' }}>
      <Glow x={WIDTH * 0.2 + Math.sin(a) * 160} y={HEIGHT * 0.25 + Math.cos(a * 0.8) * 110} size={1500} color="rgba(46,125,50,0.5)" alpha={0.42 * bloom} />
      <Glow x={WIDTH * 0.82 + Math.cos(a * 0.7) * 140} y={HEIGHT * 0.78 + Math.sin(a * 0.9) * 120} size={1400} color="rgba(123,211,137,0.34)" alpha={0.32 * bloom} />
      <Glow x={WIDTH * 0.62 + Math.sin(a * 1.3 + 2) * 220} y={HEIGHT * 0.2 + Math.cos(a * 1.1) * 90} size={760} color="rgba(243,156,18,0.34)" alpha={0.14 * bloom} />
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.55 * bloom,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1.4px)',
          backgroundSize: '44px 44px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 80%)',
        }}
      />
    </div>
  );
};
