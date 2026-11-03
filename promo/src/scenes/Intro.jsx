import React from 'react';
import { Img, staticFile, spring, useVideoConfig } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { Camera, GLIDE } from '../core/Camera.jsx';
import { T } from '../timeline.js';
import { Lema, INTRO_LEMA, lemaLen } from './Lema.jsx';
import { prog, clamp01 } from '../mock/ui.jsx';

const LOGO_W = 920;
const LOGO_H = 230; // viewBox 1040x260 -> exact 4:1, never distorted
export const Intro = () => {
  const f = useGF();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - T.logoStart, fps, config: { damping: 14, stiffness: 70, mass: 1.1 } });
  const blur = Math.max(0, 24 * (1 - Math.min(1, p)));
  const scale = 0.9 + 0.1 * p;
  const exit = prog(f, T.introFadeStart, 200, GLIDE);
  const sweep = prog(f, T.logoSweep, T.logoSweep + 46, GLIDE);
  const chars = Math.floor(Math.max(0, f - T.lemaStart) * (lemaLen(INTRO_LEMA) / (T.lemaEnd - T.lemaStart)));
  const flash = Math.max(0, 1 - Math.abs(f - T.logoHit) / 10); // impact accent

  return (
    <Camera
      drift={1}
      opacity={1 - exit}
      keys={[
        { f: 0, s: 1.0, rx: 5, ry: -4, z: 0 },
        { f: 200, s: 1.1, rx: 0, ry: 0, z: 0, ease: GLIDE },
      ]}
    >
      <div
        style={{
          position: 'absolute', left: (1600 - LOGO_W) / 2, top: 330, width: LOGO_W, height: LOGO_H,
          opacity: clamp01(p * 2.2), transform: `scale(${scale}) translateY(${-14 * exit}px)`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div style={{ position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(123,211,137,0.35), transparent)', opacity: 0.35 + 0.65 * flash }} />
        <Img src={staticFile('logo-greenit-calc-light.svg')} style={{ position: 'absolute', inset: 0, width: LOGO_W, height: LOGO_H }} />
        {/* light sweep, masked by the logo's own alpha */}
        <div
          style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            WebkitMaskImage: `url(${staticFile('logo-greenit-calc-light.svg')})`, maskImage: `url(${staticFile('logo-greenit-calc-light.svg')})`,
            WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            opacity: sweep > 0 && sweep < 1 ? 1 : 0,
          }}
        >
          <div
            style={{
              position: 'absolute', top: -40, bottom: -40, width: 260, left: -300 + sweep * (LOGO_W + 600),
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.95), transparent)', transform: 'skewX(-20deg)',
            }}
          />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1600, top: 640, display: 'flex', justifyContent: 'center', opacity: prog(f, T.lemaStart - 4, T.lemaStart + 4), transform: `translateY(${-10 * exit}px)` }}>
        <Lema lema={INTRO_LEMA} chars={chars} size={54} f={f} />
      </div>
    </Camera>
  );
};
