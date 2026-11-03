import React from 'react';
import { Img, staticFile } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { Camera, GLIDE } from '../core/Camera.jsx';
import { Stagger } from '../core/Stagger.jsx';
import { AppWorld } from './AppWorld.jsx';
import { Lema, OUTRO_LEMA, lemaLen } from './Lema.jsx';
import { REVEAL_KEYS, FEATURE_KEYS, OUTRO_KEYS } from './cameraKeys.js';
import { prog, clamp01 } from '../mock/ui.jsx';
import { T, SCENES } from '../timeline.js';
import { geist, inter, C } from '../theme.js';

/** Scenes fade IN over the 20-frame overlap on top of the previous one (identical pose = no visible seam). */
const fadeIn = (f, from) => prog(f, from, from + 20, GLIDE);

export const Reveal = () => {
  const f = useGF();
  const capIn = prog(f, T.captionIn, T.captionIn + 24);
  const capOut = prog(f, T.captionOut - 20, T.captionOut);
  return (
    <>
      <Camera keys={REVEAL_KEYS} opacity={fadeIn(f, SCENES.reveal.from)}>
        <AppWorld />
      </Camera>
      <div style={{ position: 'absolute', left: 110, top: 96, opacity: capIn * (1 - capOut), transform: `translateY(${(1 - capIn) * 18 - capOut * 10}px)` }}>
        <div style={{ width: 64, height: 4, borderRadius: 2, background: C.green, marginBottom: 20, boxShadow: '0 0 20px rgba(123,211,137,0.7)' }} />
        <div style={{ fontFamily: geist, fontWeight: 500, fontSize: 44, lineHeight: 1.18, color: C.text, width: 560, letterSpacing: -0.5 }}>
          Tu infraestructura IT, medida en minutos.
        </div>
      </div>
    </>
  );
};

export const Feature = () => {
  const f = useGF();
  return (
    <Camera keys={FEATURE_KEYS} opacity={fadeIn(f, SCENES.feature.from)}>
      <AppWorld />
    </Camera>
  );
};

export const Outro = () => {
  const f = useGF();
  const uiFade = 1 - prog(f, 2185, 2275, GLIDE);
  const chars = Math.floor(Math.max(0, f - T.ctaHit) * 1.1);
  const pill = prog(f, T.ctaPill, T.ctaPill + 30);
  const glow = 0.5 + 0.5 * Math.sin(f / 22);
  return (
    <>
      <Camera keys={OUTRO_KEYS} opacity={fadeIn(f, SCENES.outro.from) * clamp01(uiFade)}>
        <AppWorld />
      </Camera>
      <Camera
        drift={1}
        keys={[
          { f: T.ctaHit - 40, s: 1.08, z: 0 },
          { f: T.end, s: 1.0, ease: GLIDE },
        ]}
      >
        <div style={{ position: 'absolute', left: 0, width: 1600, top: 70, display: 'flex', justifyContent: 'center' }}>
          <Stagger start={T.ctaHit} y={30} scale={0.9}>
            <Img src={staticFile('favicon.svg')} style={{ width: 150, height: 150, display: 'block', filter: 'drop-shadow(0 0 40px rgba(123,211,137,0.35))' }} />
          </Stagger>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1600, top: 330, display: 'flex', justifyContent: 'center', opacity: prog(f, T.ctaHit - 2, T.ctaHit + 6) }}>
          <Lema chars={Math.min(lemaLen(OUTRO_LEMA), chars * 2)} size={76} f={f} />
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1600, top: 520, display: 'flex', justifyContent: 'center' }}>
          <Stagger start={T.ctaPill} y={34} scale={0.85} config={{ damping: 10, stiffness: 130, mass: 0.7 }}>
            <div
              style={{
                padding: '26px 64px', borderRadius: 999, fontFamily: geist, fontWeight: 600, fontSize: 40, color: '#04120a',
                background: 'linear-gradient(135deg,#A2EDAE,#4FBF63)',
                boxShadow: `0 0 ${50 + 40 * glow}px rgba(123,211,137,${0.35 + 0.2 * glow}), inset 0 1px 0 rgba(255,255,255,0.5)`,
                opacity: pill > 0 ? 1 : 0,
              }}
            >
              Probá la demo
            </div>
          </Stagger>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1600, top: 680, display: 'flex', justifyContent: 'center' }}>
          <Stagger start={T.ctaUrl} y={20} scale={1}>
            <div style={{ fontFamily: geist, fontWeight: 500, fontSize: 40, color: C.text, letterSpacing: 0.5 }}>greenitveganitas.com.ar</div>
          </Stagger>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1600, top: 880, display: 'flex', justifyContent: 'center' }}>
          <Stagger start={T.ctaFooter} y={16} scale={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontFamily: inter, fontSize: 26, color: C.muted }}>
              <span>Prototipo académico · Equipo 1 Veganitas</span>
              <Img src={staticFile('veganitas-logo.svg')} style={{ width: 180, height: 54, display: 'block' }} />
            </div>
          </Stagger>
        </div>
      </Camera>
    </>
  );
};
