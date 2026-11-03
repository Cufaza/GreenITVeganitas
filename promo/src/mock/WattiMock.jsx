import React from 'react';
import { Img, staticFile, spring, useVideoConfig } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { Stagger } from '../core/Stagger.jsx';
import { Glass } from '../core/Glass.jsx';
import { hoverAmount, isPress } from '../core/cursorModel.js';
import { T } from '../timeline.js';
import { inter, geist, C } from '../theme.js';
import { SALUDO, CHIPS, ANSWER, ANSWER_CHARS } from '../data.js';
import { WATTI_BTN, WATTI_PANEL, CHIP_RECT } from './layout.js';
import { prog, lerp, clamp01 } from './ui.jsx';

const Dots = ({ f }) => (
  <div style={{ display: 'flex', gap: 9, padding: '6px 4px' }}>
    {[0, 1, 2].map((i) => {
      const ph = ((f - T.typingStart) / T.typingCycle) * Math.PI * 2 - i * 0.9;
      const up = Math.max(0, Math.sin(ph));
      return <i key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: C.green, opacity: 0.45 + 0.55 * up, transform: `translateY(${-8 * up}px)`, display: 'block' }} />;
    })}
  </div>
);

const bubble = (extra) => ({
  fontFamily: inter, fontSize: 22, lineHeight: 1.4, padding: '14px 18px', borderRadius: 20, maxWidth: 440, boxSizing: 'border-box', ...extra,
});

const Answer = ({ f }) => {
  const n = Math.min(ANSWER_CHARS, Math.max(0, Math.floor((f - T.answerStart) * T.answerCps)));
  let left = n;
  const typing = n < ANSWER_CHARS;
  return (
    <div style={bubble({ background: 'rgba(255,255,255,0.075)', borderBottomLeftRadius: 6, color: C.text, maxWidth: 480 })}>
      {ANSWER.map((s, i) => {
        const take = Math.max(0, Math.min(s.text.length, left));
        left -= take;
        if (take === 0) return null;
        const txt = s.text.slice(0, take);
        const caret = typing && left === 0 ? <span style={{ display: 'inline-block', width: 3, height: 22, marginLeft: 2, background: C.green, verticalAlign: 'text-bottom' }} /> : null;
        return s.kind === 'li' ? (
          <div key={i} style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 20, color: 'rgba(242,246,243,0.9)' }}>
            <span style={{ color: C.green }}>•</span>
            <span>{txt}{caret}</span>
          </div>
        ) : (
          <div key={i} style={{ marginTop: i ? 10 : 0 }}>{txt}{caret}</div>
        );
      })}
    </div>
  );
};

export const WattiMock = () => {
  const f = useGF();
  const { fps } = useVideoConfig();
  const P = WATTI_PANEL;
  const B = WATTI_BTN;
  const open = spring({ frame: f - T.wattiClick - 2, fps, config: { damping: 12, stiffness: 130, mass: 0.8 } });
  const isOpen = f >= T.wattiClick;
  const hBtn = hoverAmount('watti-btn', f);
  const pressBtn = isPress('watti-btn', f);
  const chipGone = prog(f, T.chipClick + 2, T.chipClick + 14);
  const padB = lerp(204, 24, prog(f, T.chipClick + 6, T.chipClick + 26));
  const userIn = spring({ frame: f - T.chipClick - 8, fps, config: { damping: 13, stiffness: 140, mass: 0.7 } });
  const typingOn = f >= T.typingStart && f < T.answerStart;
  const ansIn = spring({ frame: f - T.answerStart, fps, config: { damping: 15, stiffness: 140, mass: 0.7 } });
  const greetIn = spring({ frame: f - T.wattiClick - 12, fps, config: { damping: 13, stiffness: 140, mass: 0.7 } });
  const pulse = 0.5 + 0.5 * Math.sin(f / 18);

  return (
    <>
      {/* floating button */}
      <Stagger start={560} y={40} scale={0.4} config={{ damping: 9, stiffness: 140, mass: 0.7 }} style={{ position: 'absolute', left: B.x, top: B.y, width: B.w, height: B.h }}>
        <div style={{ position: 'relative', width: B.w, height: B.h, transform: `scale(${(pressBtn ? 0.92 : 1) + 0.06 * hBtn})` }}>
          <div style={{ position: 'absolute', inset: -10 - 8 * pulse, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(123,211,137,${0.22 + 0.2 * hBtn}), transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: `2px solid rgba(123,211,137,${0.5 + 0.4 * hBtn})`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <Img src={staticFile('watti.svg')} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
      </Stagger>

      {isOpen && (
        <div
          style={{
            position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h,
            transformOrigin: `${B.x + B.w / 2 - P.x}px ${B.y + B.h / 2 - P.y}px`, transform: `scale(${lerp(0.5, 1, open)})`, opacity: clamp01(open * 1.6),
          }}
        >
          <Glass radius={26} glow blur={16} style={{ width: P.w, height: P.h, overflow: 'hidden', background: 'rgb(8,13,12)', fontFamily: inter }}>
            {/* header */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 84, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', boxSizing: 'border-box' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(123,211,137,0.6)' }}>
                <Img src={staticFile('watti.svg')} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 26, color: C.text }}>Watti</div>
                <div style={{ fontSize: 18, color: C.muted }}>Tu asistente de energía</div>
              </div>
              <i style={{ marginLeft: 'auto', width: 12, height: 12, borderRadius: '50%', background: C.green, boxShadow: '0 0 14px #7BD389' }} />
            </div>

            {/* messages: bottom-aligned, older content clips off the top like a chat */}
            <div
              style={{
                position: 'absolute', left: 0, right: 0, top: 84, bottom: 0, boxSizing: 'border-box', padding: `20px 24px ${padB}px`,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, overflow: 'hidden',
                WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 36px)', maskImage: 'linear-gradient(180deg, transparent 0, black 36px)',
              }}
            >
              <div style={{ opacity: clamp01(greetIn * 1.5), transform: `translateY(${(1 - greetIn) * 20}px)`, alignSelf: 'flex-start' }}>
                <div style={bubble({ background: 'rgba(255,255,255,0.075)', borderBottomLeftRadius: 6, color: C.text })}>{SALUDO}</div>
              </div>
              {f >= T.chipClick + 8 && (
                <div style={{ alignSelf: 'flex-end', opacity: clamp01(userIn * 1.5), transform: `translateY(${(1 - userIn) * 24}px) scale(${0.9 + 0.1 * userIn})`, transformOrigin: '100% 100%' }}>
                  <div style={bubble({ background: 'linear-gradient(135deg,#2E9B4A,#2E7D32)', borderBottomRightRadius: 6, color: '#fff', fontWeight: 500 })}>
                    {CHIPS[1].texto}
                  </div>
                </div>
              )}
              {typingOn && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={bubble({ background: 'rgba(255,255,255,0.075)', borderBottomLeftRadius: 6 })}><Dots f={f} /></div>
                </div>
              )}
              {f >= T.answerStart && (
                <div style={{ alignSelf: 'flex-start', opacity: clamp01(ansIn * 1.5) }}><Answer f={f} /></div>
              )}
            </div>

            {/* suggestion chips */}
            {chipGone < 1 &&
              CHIPS.map((c, i) => {
                const r = CHIP_RECT(i);
                const id = i === 1 ? 'chip-medida' : null;
                const h = id ? hoverAmount(id, f) : 0;
                const pr = id ? isPress(id, f) : false;
                const inn = spring({ frame: f - T.wattiClick - 22 - i * 7, fps, config: { damping: 13, stiffness: 140, mass: 0.7 } });
                return (
                  <div
                    key={c.id}
                    style={{
                      position: 'absolute', left: r.x - P.x, top: r.y - P.y, width: r.w, height: r.h, boxSizing: 'border-box', borderRadius: 999,
                      display: 'flex', alignItems: 'center', padding: '0 22px', fontFamily: inter, fontSize: 20, fontWeight: 500,
                      color: h > 0 ? '#eafff0' : 'rgba(235,242,237,0.85)',
                      background: `rgba(123,211,137,${0.07 + 0.2 * h})`,
                      border: `1px solid rgba(123,211,137,${0.3 + 0.5 * h})`,
                      boxShadow: h > 0 ? `0 0 ${30 * h}px rgba(123,211,137,0.35)` : 'none',
                      opacity: clamp01(inn * 1.5) * (1 - chipGone),
                      transform: `translateY(${(1 - inn) * 18}px) scale(${pr ? 0.97 : 1})`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.texto}
                  </div>
                );
              })}
          </Glass>
        </div>
      )}
    </>
  );
};
