import React from 'react';
import { geist, playfair, C } from '../theme.js';

export const OUTRO_LEMA = { a: 'Medí tu consumo, reducí tu ', b: 'huella.' };
export const INTRO_LEMA = { a: 'Eficiencia energética para tu ', b: 'infraestructura IT.' };
export const lemaLen = (l) => l.a.length + l.b.length;

const Caret = ({ size, f }) => (
  <span style={{ position: 'relative', display: 'inline-block', width: 0 }}>
    <span style={{ position: 'absolute', left: 4, top: -size * 0.8, width: 4, height: size * 0.9, background: C.green, opacity: Math.sin(f / 5) > -0.3 ? 1 : 0.15 }} />
  </span>
);

/** Typewriter lema. The untyped rest is rendered invisible so the line never re-centres while typing. */
export const Lema = ({ lema = OUTRO_LEMA, chars, size = 64, f = 0 }) => {
  const LEMA_A = lema.a, LEMA_B = lema.b;
  const na = Math.min(chars, LEMA_A.length);
  const nb = Math.max(0, chars - LEMA_A.length);
  const typing = chars < LEMA_A.length + LEMA_B.length;
  const hid = { visibility: 'hidden' };
  return (
    <div style={{ fontFamily: geist, fontWeight: 500, fontSize: size, color: C.text, letterSpacing: -1, whiteSpace: 'pre', textAlign: 'center' }}>
      {LEMA_A.slice(0, na)}
      {typing && nb === 0 && <Caret size={size} f={f} />}
      <span style={hid}>{LEMA_A.slice(na)}</span>
      <span style={{ fontFamily: playfair, fontStyle: 'italic', fontWeight: 700, color: C.green, fontSize: size * 1.18, letterSpacing: 0 }}>
        {LEMA_B.slice(0, nb)}
        {typing && nb > 0 && <Caret size={size * 1.18} f={f} />}
        <span style={hid}>{LEMA_B.slice(nb)}</span>
      </span>
    </div>
  );
};
